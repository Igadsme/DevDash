import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiError, json, requireUser } from "@/lib/api";
import { generateGroundedText } from "@/lib/ai/gemini";
import { assertRateLimit } from "@/lib/rate-limit";

const schema = z.object({
  message: z.string().min(1).max(4000),
  conversationId: z.string().optional(),
});

export async function GET() {
  try {
    const user = await requireUser();
    const conversations = await prisma.aIConversation.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      take: 10,
      include: { messages: { orderBy: { createdAt: "asc" }, take: 50 } },
    });
    return json({ conversations });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    assertRateLimit(`ai:${user.id}`, 20, 60_000);
    const body = schema.parse(await request.json());
    const conversation = body.conversationId
      ? await prisma.aIConversation.findFirst({
          where: { id: body.conversationId, userId: user.id },
        })
      : await prisma.aIConversation.create({
          data: { userId: user.id, title: body.message.slice(0, 80) },
        });
    if (!conversation) {
      return json({ error: "Conversation not found" }, 404);
    }
    await prisma.aIMessage.create({
      data: { conversationId: conversation.id, role: "user", content: body.message },
    });
    const result = await generateGroundedText(user.id, body.message, "assistant");
    const assistant = await prisma.aIMessage.create({
      data: {
        conversationId: conversation.id,
        role: "assistant",
        content: result.content,
        sources: result.sources,
      },
    });
    await prisma.aIConversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() },
    });
    return json({
      conversationId: conversation.id,
      message: assistant,
    });
  } catch (error) {
    return apiError(error);
  }
}

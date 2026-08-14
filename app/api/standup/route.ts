import { prisma } from "@/lib/prisma";
import { apiError, json, requireUser } from "@/lib/api";
import { generateStandup } from "@/lib/ai/gemini";
import { z } from "zod";

export async function GET() {
  try {
    const user = await requireUser();
    const items = await prisma.generatedSummary.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    return json({ items });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST() {
  try {
    const user = await requireUser();
    const result = await generateStandup(user.id);
    const saved = await prisma.generatedSummary.create({
      data: {
        userId: user.id,
        type: "standup",
        title: "Daily Standup",
        content: result.content,
        sources: result.sources,
        periodStart: new Date(),
        status: "generated",
      },
    });
    return json(saved);
  } catch (error) {
    return apiError(error);
  }
}

const patchSchema = z.object({
  id: z.string(),
  content: z.string().min(1),
});

export async function PATCH(request: Request) {
  try {
    const user = await requireUser();
    const body = patchSchema.parse(await request.json());
    const updated = await prisma.generatedSummary.updateMany({
      where: { id: body.id, userId: user.id },
      data: { content: body.content, status: "draft" },
    });
    if (!updated.count) return json({ error: "Not found" }, 404);
    return json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}

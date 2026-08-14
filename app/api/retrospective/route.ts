import { prisma } from "@/lib/prisma";
import { apiError, json, requireUser } from "@/lib/api";
import { generateRetrospective } from "@/lib/ai/gemini";
import { daysAgo } from "@/lib/dates";

export async function POST() {
  try {
    const user = await requireUser();
    const result = await generateRetrospective(user.id);
    const saved = await prisma.generatedSummary.create({
      data: {
        userId: user.id,
        type: "retrospective",
        title: "Sprint Retrospective",
        content: result.content,
        sources: result.sources,
        periodStart: daysAgo(14),
        periodEnd: new Date(),
        status: "generated",
      },
    });
    return json(saved);
  } catch (error) {
    return apiError(error);
  }
}

import { prisma } from "@/lib/prisma";
import { apiError, json, requireUser } from "@/lib/api";
import { generateImpact } from "@/lib/ai/gemini";
import { startOfMonth } from "@/lib/dates";

export async function POST() {
  try {
    const user = await requireUser();
    const result = await generateImpact(user.id);
    const saved = await prisma.generatedSummary.create({
      data: {
        userId: user.id,
        type: "impact",
        title: "Engineering Impact Summary",
        content: result.content,
        sources: result.sources,
        periodStart: startOfMonth(),
        periodEnd: new Date(),
        status: "generated",
      },
    });
    return json(saved);
  } catch (error) {
    return apiError(error);
  }
}

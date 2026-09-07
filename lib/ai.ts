import OpenAI from "openai";
import { z } from "zod";

import { summarizeEvents, type ActivityLike } from "@/lib/analytics";

export const aiBriefSchema = z.object({
  completed: z.array(z.string()).max(8),
  reviews: z.array(z.string()).max(8),
  blockers: z.array(z.string()).max(8),
  nextActions: z.array(z.string()).max(8),
  overview: z.string().max(1_500),
});
export type AIBrief = z.infer<typeof aiBriefSchema>;

export function createFallbackBrief(events: ActivityLike[]): AIBrief {
  const summary = summarizeEvents(events);
  return {
    overview: `This period includes ${summary.commits} commits, ${summary.pullRequests} pull-request events, and ${summary.reviewed} completed reviews.`,
    completed: [
      `${summary.commits} commits recorded`,
      `${summary.pullRequests} pull-request events recorded`,
      `${summary.tasksCompleted} tasks completed`,
    ],
    reviews: [`${summary.reviewed} completed reviews recorded`],
    blockers: summary.pipelineFailures
      ? [`${summary.pipelineFailures} failed pipelines need attention`]
      : [],
    nextActions: summary.pipelineFailures
      ? ["Review failed pipeline details"]
      : ["Review current pull requests and task deadlines"],
  };
}

export function redactEventsForAI<
  T extends ActivityLike & { isPrivate?: boolean; description?: string | null },
>(events: T[], excludePrivate: boolean) {
  return events
    .filter((event) => !(excludePrivate && event.isPrivate))
    .map(({ type, occurredAt, title }) => ({
      type,
      occurredAt: occurredAt.toISOString(),
      title: title?.slice(0, 200) ?? "Activity",
    }));
}

export async function generateAIBrief(
  events: ActivityLike[],
  enabled: boolean,
): Promise<{ brief: AIBrief; source: "openai" | "local" }> {
  if (!enabled || !process.env.OPENAI_API_KEY || events.length === 0)
    return { brief: createFallbackBrief(events), source: "local" };
  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: `Return JSON with completed, reviews, blockers, nextActions, and overview. Use only this activity: ${JSON.stringify(redactEventsForAI(events, false))}`,
    });
    return {
      brief: aiBriefSchema.parse(JSON.parse(response.output_text)),
      source: "openai",
    };
  } catch (error) {
    console.error("AI brief generation failed", {
      name: error instanceof Error ? error.name : "UnknownError",
    });
    return { brief: createFallbackBrief(events), source: "local" };
  }
}

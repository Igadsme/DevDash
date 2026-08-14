import { apiError, json, requireUser } from "@/lib/api";
import { computeWeekTimeline } from "@/lib/engines/metrics";
import { generateWeekNarrative } from "@/lib/ai/gemini";
import { startOfWeek } from "@/lib/dates";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(request.url);
    const offset = Number(searchParams.get("week") || 0);
    const start = startOfWeek();
    start.setDate(start.getDate() + offset * 7);
    const week = await computeWeekTimeline(user.id, start);
    let narrative = "";
    let sources: string[] = [];
    if (week.events.length) {
      try {
        const generated = await generateWeekNarrative(user.id);
        narrative = generated.content;
        sources = generated.sources;
      } catch {
        narrative = "";
      }
    }
    return json({ ...week, narrative, sources });
  } catch (error) {
    return apiError(error);
  }
}

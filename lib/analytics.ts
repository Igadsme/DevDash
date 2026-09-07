import { endOfDay, startOfDay, subDays, subMonths } from "date-fns";

export type TimelineRange = "week" | "month";
export type ActivityLike = {
  type: string;
  occurredAt: Date;
  repositoryId?: string | null;
  title?: string;
};
export type FocusWindow = { label: string; start: Date; end: Date };

export function getRangeStart(range: TimelineRange, now = new Date()) {
  return range === "month" ? subMonths(now, 1) : subDays(now, 7);
}
export function parseCustomRange(start: string, end: string) {
  const from = startOfDay(new Date(`${start}T00:00:00`));
  const to = endOfDay(new Date(`${end}T00:00:00`));
  if (
    !Number.isFinite(from.getTime()) ||
    !Number.isFinite(to.getTime()) ||
    from > to
  )
    throw new Error("Invalid date range.");
  return { from, to };
}

export function summarizeEvents(events: ActivityLike[]) {
  const counts = events.reduce<Record<string, number>>(
    (result, event) => ({
      ...result,
      [event.type]: (result[event.type] ?? 0) + 1,
    }),
    {},
  );
  return {
    commits: counts.COMMIT ?? 0,
    pullRequests:
      (counts.PULL_REQUEST_OPENED ?? 0) + (counts.PULL_REQUEST_MERGED ?? 0),
    reviewed: counts.REVIEW_COMPLETED ?? 0,
    pipelineFailures: events.filter(
      (event) =>
        event.type === "PIPELINE_COMPLETED" &&
        event.title?.toLowerCase().includes("failed"),
    ).length,
    tasksCompleted: counts.TASK_COMPLETED ?? 0,
  };
}

export function calculateEstimatedContextSwitches(
  events: ActivityLike[],
  costMinutes: number,
) {
  const ordered = [...events]
    .filter((event) => event.repositoryId)
    .sort((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime());
  const windows: FocusWindow[] = [];
  let switches = 0;
  for (let index = 0; index < ordered.length - 1; index += 1) {
    const current = ordered[index];
    const next = ordered[index + 1];
    if (next.occurredAt <= current.occurredAt) continue;
    windows.push({
      label: current.repositoryId!,
      start: current.occurredAt,
      end: next.occurredAt,
    });
    if (current.repositoryId !== next.repositoryId) switches += 1;
  }
  const strongest =
    windows.sort(
      (a, b) =>
        b.end.getTime() -
        b.start.getTime() -
        (a.end.getTime() - a.start.getTime()),
    )[0] ?? null;
  return {
    switches,
    estimatedMinutesLost: switches * costMinutes,
    strongestWindow: strongest,
    disclaimer:
      "Estimated from adjacent repository events; this is not verified working time.",
  };
}

export function buildNarrativeSummary(events: ActivityLike[]) {
  const summary = summarizeEvents(events);
  return `Recorded ${summary.commits} commits, ${summary.pullRequests} pull-request events, ${summary.reviewed} completed reviews, ${summary.tasksCompleted} completed tasks, and ${summary.pipelineFailures} failed pipelines in this period.`;
}

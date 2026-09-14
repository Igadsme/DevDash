import { subDays, subMonths } from "date-fns";
import type { Event, User } from "@prisma/client";

export type TimelineRange = "week" | "month" | "quarter";

export function getRangeStart(range: TimelineRange) {
  if (range === "quarter") return subDays(new Date(), 90);
  return range === "month" ? subMonths(new Date(), 1) : subDays(new Date(), 7);
}

export function summarizeEvents(events: Event[]) {
  const counts = events.reduce<Record<string, number>>((acc, event) => {
    acc[event.type] = (acc[event.type] ?? 0) + 1;
    return acc;
  }, {});

  return {
    built: (counts.PR_OPENED ?? 0) + (counts.COMMIT ?? 0),
    commits: counts.COMMIT ?? 0,
    reviewed: counts.PR_REVIEWED ?? 0,
    blocked: counts.CI_FAILED ?? 0,
    issues: counts.ISSUE_ASSIGNED ?? 0
  };
}

export function buildNarrativeSummary(events: Event[]) {
  const summary = summarizeEvents(events);

  const pullRequests = events.filter((event) => event.type === "PR_OPENED" || event.type === "PR_MERGED").length;
  return `Over the selected period you recorded ${summary.commits} commits, opened or merged ${pullRequests} pull requests, completed ${summary.reviewed} reviews, and hit ${summary.blocked} CI blockers across ${new Set(events.map((event) => event.repo)).size} repositories.`;
}

export function calculateInterruptCost(
  events: Event[],
  user: Pick<User, "focusMinutes">
) {
  const orderedEvents = [...events]
    .filter((event) =>
      ["COMMIT", "PR_OPENED", "PR_MERGED", "PR_REVIEWED", "CI_FAILED"].includes(event.type)
    )
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  let interruptionCount = 0;
  const windows: Array<{
    label: string;
    repo: string;
    start: Date;
    end: Date;
    interruptionAfter: boolean;
  }> = [];

  for (let index = 0; index < orderedEvents.length; index += 1) {
    const current = orderedEvents[index];
    const next = orderedEvents[index + 1];
    const currentLabel = getContextLabel(current);
    const nextLabel = next ? getContextLabel(next) : null;
    const interruptionAfter = Boolean(nextLabel && nextLabel !== currentLabel);

    if (interruptionAfter) {
      interruptionCount += 1;
    }

    windows.push({
      label: currentLabel,
      repo: current.repo,
      start: current.timestamp,
      end: next?.timestamp ?? current.timestamp,
      interruptionAfter
    });
  }

  return {
    interruptionCount,
    minutesLost: interruptionCount * user.focusMinutes,
    windows
  };
}

function getContextLabel(event: Event) {
  const metadata = event.metadata && typeof event.metadata === "object" ? event.metadata as Record<string, unknown> : {};
  const number = metadata.number;
  return typeof number === "number" ? `${event.repo}#${number}` : `${event.repo}:${event.type}`;
}

export function buildFocusInsights(events: Event[], user: Pick<User, "focusMinutes">) {
  const interruptCost = calculateInterruptCost(events, user);
  const longWindows = interruptCost.windows.filter((window) => {
    const duration = window.end.getTime() - window.start.getTime();
    return duration >= 45 * 60 * 1000;
  });
  const strongestWindow = [...longWindows].sort(
    (a, b) => (b.end.getTime() - b.start.getTime()) - (a.end.getTime() - a.start.getTime())
  )[0];

  return {
    ...interruptCost,
    strongestFocusWindow:
      strongestWindow?.label ?? "Not enough contiguous activity yet",
    insightCards: [
      {
        title: "Interruption Cost",
        body: `Based on ${interruptCost.interruptionCount} detected switches at ${user.focusMinutes} minutes each, you lost ${(
          interruptCost.minutesLost / 60
        ).toFixed(1)} hours this week.`
      },
      {
        title: "Most Stable Context",
        body:
          strongestWindow?.repo
            ? `${strongestWindow.repo} held your longest observed activity stretch. This is an estimate, not confirmed focus time.`
            : "More activity is needed before a clear focus window emerges."
      },
      {
        title: "Review Interruptions",
        body: `${events.filter((event) => event.type === "PR_REVIEWED").length} review events contributed to context switching this period.`
      }
    ]
  };
}

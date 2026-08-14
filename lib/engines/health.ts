import { prisma } from "@/lib/prisma";
import { daysAgo, hourInTz, parseHm, weekdayInTz } from "@/lib/dates";

export type HealthInsight = {
  id: string;
  signal: string;
  value: string;
  valueColor: string;
  headline: string;
  detail: string;
  recommendation: string;
  why: string;
};

export async function computeDevHealth(userId: string): Promise<HealthInsight[]> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { preferences: true },
  });
  if (!user) return [];
  const prefs = user.preferences;
  const tz = user.timezone || "America/New_York";
  const afterMinutes = parseHm(user.afterHoursThreshold || "20:00");
  const since = daysAgo(28);
  const weekSince = daysAgo(7);

  const commits = await prisma.commit.findMany({
    where: { userId, authoredAt: { gte: since } },
    orderBy: { authoredAt: "asc" },
  });
  const weekCommits = commits.filter((c) => c.authoredAt >= weekSince);
  const prs = await prisma.pullRequest.findMany({
    where: { userId, openedAt: { gte: since } },
    include: { reviews: true },
  });
  const meetings = await prisma.calendarEvent.findMany({
    where: { userId, startAt: { gte: weekSince } },
  });

  const insights: HealthInsight[] = [];

  if (prefs?.afterHoursSignal !== false && weekCommits.length > 0) {
    const afterHours = weekCommits.filter((c) => {
      const hour = hourInTz(c.authoredAt, tz);
      return hour * 60 >= afterMinutes || hour < 6;
    });
    const pct = Math.round((afterHours.length / weekCommits.length) * 100);
    const older = commits.filter((c) => c.authoredAt < weekSince);
    const olderAfter = older.filter((c) => {
      const hour = hourInTz(c.authoredAt, tz);
      return hour * 60 >= afterMinutes || hour < 6;
    });
    const avg = older.length ? Math.round((olderAfter.length / older.length) * 100) : pct;
    insights.push({
      id: "after-hours",
      signal: "After-hours activity",
      value: `${pct}%`,
      valueColor: pct > 30 ? "#f59e0b" : "#22c55e",
      headline:
        pct > avg
          ? "You've been shipping later this week."
          : "After-hours activity is in line with your usual pattern.",
      detail: `${pct}% of your commits occurred after ${user.afterHoursThreshold}. ${
        older.length ? `This compares with your recent average of ${avg}%.` : "Not enough prior history for a comparison yet."
      }`,
      recommendation:
        pct > 25
          ? "Consider protecting a morning focus block to front-load deep work."
          : "Your evening load looks sustainable based on current data.",
      why: `DevDash counts commits after your configured after-hours threshold (${user.afterHoursThreshold} ${tz}). This is a work-pattern signal, not a health diagnosis. No one else can see this unless you share it.`,
    });
  }

  if (prefs?.weekendSignal !== false && commits.length > 0) {
    const weekendDays = new Set(
      commits
        .filter((c) => {
          const day = weekdayInTz(c.authoredAt, tz);
          return day === "Sat" || day === "Sun";
        })
        .map((c) => c.authoredAt.toISOString().slice(0, 10)),
    );
    insights.push({
      id: "weekend",
      signal: "Weekend activity",
      value: `${weekendDays.size} day${weekendDays.size === 1 ? "" : "s"}`,
      valueColor: weekendDays.size >= 3 ? "#ef4444" : "#6b7280",
      headline:
        weekendDays.size >= 3
          ? "Your recent work pattern may indicate increased weekend workload."
          : "Weekend activity is limited.",
      detail: `You had engineering activity on ${weekendDays.size} weekend day${weekendDays.size === 1 ? "" : "s"} in the last 4 weeks.`,
      recommendation:
        weekendDays.size >= 3
          ? "This pattern is worth monitoring. Short weekend work often signals unfinished context from the week."
          : "No unusual weekend load from the available activity.",
      why: "Weekend activity is measured from Saturday and Sunday in your local timezone. These are transparent heuristics, not medical claims. Visible only to you by default.",
    });
  }

  if (prefs?.churnSignal !== false) {
    const churny = prs.filter((pr) => pr.reviews.filter((r) => r.state === "CHANGES_REQUESTED").length >= 2).length;
    const rate = prs.length ? Math.round((churny / prs.length) * 100) : 0;
    insights.push({
      id: "churn",
      signal: "PR churn",
      value: rate > 25 ? "Elevated" : rate > 10 ? "Moderate" : "Low",
      valueColor: rate > 25 ? "#f59e0b" : "#22c55e",
      headline:
        rate > 25
          ? "Several PRs needed multiple revision cycles."
          : "PR churn is within a healthy range.",
      detail: prs.length
        ? `About ${rate}% of recent PRs had repeated change requests (${churny} of ${prs.length}).`
        : "Not enough pull request history to estimate churn yet.",
      recommendation:
        rate > 25
          ? "Consider a short design review before larger PRs to reduce rework."
          : "Keep using smaller, reviewable changes.",
      why: "PR churn is estimated from pull requests with 2 or more 'changes requested' review cycles. It is a workflow signal, not a performance score.",
    });
  }

  if (prefs?.meetingsSignal !== false) {
    const meetingMinutes = meetings.reduce(
      (sum, ev) => sum + Math.max(0, (ev.endAt.getTime() - ev.startAt.getTime()) / 60000),
      0,
    );
    const hoursPerDay = meetingMinutes / 60 / 5;
    insights.push({
      id: "meetings",
      signal: "Meeting load",
      value: meetings.length ? `${hoursPerDay.toFixed(1)} hrs/day` : "Not connected",
      valueColor: hoursPerDay > 4 ? "#f59e0b" : "#6b7280",
      headline: meetings.length
        ? hoursPerDay > 4
          ? "Your recent work pattern may indicate high meeting load."
          : "Meeting load looks manageable from calendar data."
        : "Connect Google Calendar to estimate meeting load.",
      detail: meetings.length
        ? `You averaged ${hoursPerDay.toFixed(1)} hours of calendar events per weekday this week. These are derived estimates from event duration only.`
        : "DevDash only reads meeting duration, not titles or attendees, when calendar is connected.",
      recommendation: meetings.length
        ? "Identify recurring meetings that could be async."
        : "Calendar connection is optional and private by default.",
      why: "Meeting load is pulled from your connected calendar. DevDash only uses start/end times. Content is never sent to AI unless you ask.",
    });
  }

  return insights;
}

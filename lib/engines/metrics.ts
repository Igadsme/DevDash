import { prisma } from "@/lib/prisma";
import { daysAgo, endOfWeek, startOfWeek, weekdayShort } from "@/lib/dates";

const THEME_COLORS = ["#4a8fff", "#22c55e", "#f59e0b", "#8b5cf6", "#6b7280"];

function themeFromText(text: string) {
  const t = text.toLowerCase();
  if (/(auth|oauth|jwt|login|session)/.test(t)) return "Authentication";
  if (/(api|endpoint|backend|server)/.test(t)) return "API";
  if (/(ui|dashboard|frontend|css|page)/.test(t)) return "Dashboard";
  if (/(ci|test|pipeline|deploy)/.test(t)) return "Reliability";
  if (/(fix|bug|error)/.test(t)) return "Fixes";
  return "Other";
}

export async function computeMetrics(userId: string, days = 7) {
  const since = daysAgo(days);
  const prevSince = daysAgo(days * 2);
  const prevEnd = since;

  const [commits, prevCommits, prs, prevPrs, reviews, prevReviews, issues, runs] = await Promise.all([
    prisma.commit.count({ where: { userId, authoredAt: { gte: since } } }),
    prisma.commit.count({ where: { userId, authoredAt: { gte: prevSince, lt: prevEnd } } }),
    prisma.pullRequest.findMany({ where: { userId, openedAt: { gte: since } } }),
    prisma.pullRequest.findMany({ where: { userId, openedAt: { gte: prevSince, lt: prevEnd } } }),
    prisma.pullRequestReview.count({ where: { userId, submittedAt: { gte: since } } }),
    prisma.pullRequestReview.count({ where: { userId, submittedAt: { gte: prevSince, lt: prevEnd } } }),
    prisma.issue.findMany({ where: { userId, openedAt: { gte: since } } }),
    prisma.cICDRun.findMany({ where: { userId, startedAt: { gte: since } } }),
  ]);

  const trend = (cur: number, prev: number) => {
    if (!prev) return cur ? 100 : 0;
    return Math.round(((cur - prev) / prev) * 100);
  };

  const merged = prs.filter((p) => p.merged).length;
  const ciSuccess = runs.filter((r) => r.conclusion === "success").length;
  const ciFail = runs.filter((r) => r.conclusion === "failure" || r.conclusion === "failed").length;

  return {
    commits,
    prs: prs.length,
    prsMerged: merged,
    reviews,
    issuesClosed: issues.filter((i) => i.state !== "open").length,
    issuesOpened: issues.filter((i) => i.state === "open").length,
    ciFailures: ciFail,
    ciSuccess,
    ciSuccessRate: runs.length ? Math.round((ciSuccess / runs.length) * 100) : 0,
    commitsTrend: trend(commits, prevCommits),
    prsTrend: trend(prs.length, prevPrs.length),
    reviewsTrend: trend(reviews, prevReviews),
  };
}

export async function computeWeekTimeline(userId: string, weekStart = startOfWeek()) {
  const weekEnd = endOfWeek(weekStart);
  const events = await prisma.activityEvent.findMany({
    where: { userId, timestamp: { gte: weekStart, lte: weekEnd } },
    orderBy: { timestamp: "asc" },
  });

  const days = Array.from({ length: 5 }).map((_, i) => {
    const date = new Date(weekStart);
    date.setDate(date.getDate() + i);
    const dayEvents = events.filter((e) => e.timestamp.toDateString() === date.toDateString());
    const counts = new Map<string, number>();
    for (const ev of dayEvents) counts.set(ev.type, (counts.get(ev.type) || 0) + 1);
    return {
      day: weekdayShort(date),
      date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      events: [...counts.entries()].map(([type, count]) => ({
        type,
        count,
        label: `${count} ${type}${count === 1 ? "" : "s"}`,
      })),
      items: dayEvents.map((e) => ({
        time: `${weekdayShort(e.timestamp)} ${e.timestamp.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`,
        type: e.type,
        label: e.description || e.title,
        repo: e.repository?.split("/").pop() || e.repository || "",
        url: e.url,
      })),
    };
  });

  const themes = new Map<string, number>();
  for (const ev of events) {
    const theme = themeFromText(`${ev.title} ${ev.description || ""} ${ev.repository || ""}`);
    themes.set(theme, (themes.get(theme) || 0) + 1);
  }
  const total = [...themes.values()].reduce((a, b) => a + b, 0) || 1;
  const themeList = [...themes.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([name, count], i) => ({
      name,
      pct: Math.round((count / total) * 100),
      color: THEME_COLORS[i] || "#6b7280",
    }));

  return { weekStart, weekEnd, days, themes: themeList, events };
}

export async function computeAnalytics(userId: string) {
  const metrics = await computeMetrics(userId, 7);
  const month = await computeMetrics(userId, 30);
  const since = daysAgo(7);
  const commits = await prisma.commit.findMany({ where: { userId, authoredAt: { gte: since } } });
  const prs = await prisma.pullRequest.findMany({ where: { userId, openedAt: { gte: since } } });
  const reviews = await prisma.pullRequestReview.findMany({ where: { userId, submittedAt: { gte: since } } });
  const runs = await prisma.cICDRun.findMany({ where: { userId, startedAt: { gte: since } } });

  const byDay = Array.from({ length: 5 }).map((_, i) => {
    const date = startOfWeek();
    date.setDate(date.getDate() + i);
    const key = date.toDateString();
    return {
      day: weekdayShort(date),
      commits: commits.filter((c) => c.authoredAt.toDateString() === key).length,
      prs: prs.filter((p) => p.openedAt.toDateString() === key).length,
      reviews: reviews.filter((r) => r.submittedAt.toDateString() === key).length,
    };
  });

  const ciData = Array.from({ length: 7 }).map((_, i) => {
    const date = daysAgo(6 - i);
    const key = date.toDateString();
    const dayRuns = runs.filter((r) => (r.startedAt || r.createdAt).toDateString() === key);
    return {
      date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      success: dayRuns.filter((r) => r.conclusion === "success").length,
      failed: dayRuns.filter((r) => r.conclusion === "failure" || r.conclusion === "failed").length,
    };
  });

  const merged = prs.filter((p) => p.merged && p.mergedAt);
  const cycleHours = merged.map((p) => (p.mergedAt!.getTime() - p.openedAt.getTime()) / 36e5).sort((a, b) => a - b);
  const p50 = cycleHours[Math.floor(cycleHours.length * 0.5)] || 0;
  const p90 = cycleHours[Math.floor(cycleHours.length * 0.9)] || 0;

  return {
    metrics,
    month,
    byDay,
    ciData,
    cycleTime: [{ week: "This week", p50: Number(p50.toFixed(1)), p90: Number(p90.toFixed(1)) }],
    reviewTime: [
      {
        week: "This week",
        hrs: reviews.length
          ? Number(
              (
                reviews.reduce((s, r) => s + (Date.now() - r.submittedAt.getTime()), 0) /
                reviews.length /
                36e5
              ).toFixed(1),
            )
          : 0,
      },
    ],
  };
}

import { prisma } from "@/lib/prisma";
import { greetingForHour, hourInTz, relativeTime } from "@/lib/dates";
import { getWhatNeedsMe } from "@/lib/engines/actions";
import { computeDevHealth } from "@/lib/engines/health";
import { computeFocus } from "@/lib/engines/focus";
import { computeMetrics, computeWeekTimeline } from "@/lib/engines/metrics";
export async function getDashboard(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { preferences: true, integrations: true },
  });
  if (!user) throw new Error("User not found");

  const github = user.integrations.find((i) => i.provider === "github");
  const [actions, metrics, week, health, focus, recentRepos] = await Promise.all([
    getWhatNeedsMe(userId),
    computeMetrics(userId, 7),
    computeWeekTimeline(userId),
    computeDevHealth(userId),
    computeFocus(userId),
    prisma.repository.findMany({
      where: { userId, selected: true },
      orderBy: { lastActivityAt: "desc" },
      take: 8,
    }),
  ]);

  const existing = await prisma.generatedSummary.findFirst({
    where: { userId, type: "week" },
    orderBy: { createdAt: "desc" },
  });
  const narrative =
    existing?.content ||
    (week.events.length
      ? `This week: ${metrics.commits} commits, ${metrics.prs} PRs, ${metrics.reviews} reviews${
          metrics.ciFailures ? `, ${metrics.ciFailures} CI failures` : ""
        }.${week.themes[0] ? ` Primary theme: ${week.themes[0].name}.` : ""}`
      : "");

  const hour = hourInTz(new Date(), user.timezone);
  const firstName = (user.name || "there").split(" ")[0];

  return {
    user: {
      id: user.id,
      name: user.name,
      firstName,
      email: user.email,
      image: user.image,
      username: user.username,
      avatar: (user.name || user.email || "D").slice(0, 1).toUpperCase(),
      timezone: user.timezone,
      onboardingCompleted: user.onboardingCompleted,
    },
    greeting: `${greetingForHour(hour)}, ${firstName}.`,
    dateLabel: new Date().toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: user.timezone,
    }),
    githubConnected: github?.status === "connected",
    lastSyncAt: github?.lastSyncAt,
    recentRepos: recentRepos.map((repo) => ({
      id: repo.id,
      name: repo.name,
      fullName: repo.fullName,
      language: repo.language,
      url: repo.url,
      lastActivityLabel: repo.lastActivityAt ? relativeTime(repo.lastActivityAt) : "No recent activity",
    })),
    actions: actions.slice(0, 4),
    actionCount: actions.length,
    metrics: {
      ...metrics,
      focusTime: `${Math.floor(focus.totalFocusMin / 60)}h ${focus.totalFocusMin % 60}m`,
      focusTrend: 0,
    },
    week,
    narrative,
    themes: week.themes,
    health: health.slice(0, 3).map((h) => ({
      label: h.signal,
      value: h.value,
      color: h.valueColor,
    })),
    focus: {
      total: `${Math.floor(focus.totalFocusMin / 60)}h ${focus.totalFocusMin % 60}m`,
      longest: `${Math.floor(focus.longestBlockMin / 60)}h ${String(focus.longestBlockMin % 60).padStart(2, "0")}m`,
      meetings: `${Math.floor(focus.meetingMin / 60)}h ${focus.meetingMin % 60}m`,
      interruptions: String(focus.interruptions),
      window: focus.windows[0] ? `${focus.windows[0].day} ${focus.windows[0].window}` : "Not enough data yet",
    },
  };
}

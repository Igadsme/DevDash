import { prisma } from "@/lib/prisma";
import { daysAgo, formatDuration, hourInTz, weekdayInTz } from "@/lib/dates";

export type FocusAnalytics = {
  totalFocusMin: number;
  avgBlockMin: number;
  longestBlockMin: number;
  meetingMin: number;
  interruptions: number;
  hourly: Array<{ hour: string; focus: number; meetings: number; interruptions: number }>;
  windows: Array<{ day: string; window: string; duration: string; strength: number }>;
  interruptionSources: Array<{ source: string; count: number; color: string }>;
  recommendation: string;
  note: string;
};

function hourLabel(hour: number) {
  if (hour === 0) return "12AM";
  if (hour < 12) return `${hour}AM`;
  if (hour === 12) return "12PM";
  return `${hour - 12}PM`;
}

export async function computeFocus(userId: string): Promise<FocusAnalytics> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const tz = user?.timezone || "America/New_York";
  const since = daysAgo(14);
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [events, meetings] = await Promise.all([
    prisma.activityEvent.findMany({
      where: { userId, timestamp: { gte: since } },
      orderBy: { timestamp: "asc" },
    }),
    prisma.calendarEvent.findMany({
      where: { userId, startAt: { gte: since } },
    }),
  ]);

  const coding = events.filter((e) => e.type === "commit" || e.type === "pr");
  const interruptions = events.filter((e) => e.type === "review" || e.type === "ci" || e.type === "issue");

  const blocks: { start: Date; end: Date; minutes: number }[] = [];
  let current: Date | null = null;
  let last: Date | null = null;
  for (const event of coding) {
    if (!current || !last || event.timestamp.getTime() - last.getTime() > 45 * 60000) {
      if (current && last) {
        blocks.push({
          start: current,
          end: last,
          minutes: Math.max(15, (last.getTime() - current.getTime()) / 60000),
        });
      }
      current = event.timestamp;
    }
    last = event.timestamp;
  }
  if (current && last) {
    blocks.push({
      start: current,
      end: last,
      minutes: Math.max(15, (last.getTime() - current.getTime()) / 60000 + 15),
    });
  }

  await prisma.focusSession.deleteMany({ where: { userId, startedAt: { gte: since } } });
  if (blocks.length) {
    await prisma.focusSession.createMany({
      data: blocks.map((b) => ({
        userId,
        startedAt: b.start,
        endedAt: b.end,
        durationMin: Math.round(b.minutes),
        source: "derived",
      })),
    });
  }

  const todayBlocks = blocks.filter((b) => b.start >= todayStart);
  const totalFocusMin = todayBlocks.reduce((s, b) => s + b.minutes, 0) || blocks.slice(-5).reduce((s, b) => s + b.minutes, 0);
  const avgBlockMin = blocks.length ? blocks.reduce((s, b) => s + b.minutes, 0) / blocks.length : 0;
  const longestBlockMin = blocks.reduce((m, b) => Math.max(m, b.minutes), 0);
  const meetingMin = meetings
    .filter((m) => m.startAt >= todayStart)
    .reduce((s, m) => s + (m.endAt.getTime() - m.startAt.getTime()) / 60000, 0);

  const hourlyMap = new Map<number, { focus: number; meetings: number; interruptions: number }>();
  for (let h = 8; h <= 17; h++) hourlyMap.set(h, { focus: 0, meetings: 0, interruptions: 0 });
  for (const event of coding) {
    if (event.timestamp < todayStart && coding.some((c) => c.timestamp >= todayStart)) continue;
    const h = hourInTz(event.timestamp, tz);
    const bucket = hourlyMap.get(h);
    if (bucket) bucket.focus += 0.25;
  }
  for (const event of interruptions) {
    const h = hourInTz(event.timestamp, tz);
    const bucket = hourlyMap.get(h);
    if (bucket) bucket.interruptions += 0.15;
  }
  for (const meeting of meetings) {
    const h = hourInTz(meeting.startAt, tz);
    const bucket = hourlyMap.get(h);
    if (bucket) bucket.meetings += Math.min(1, (meeting.endAt.getTime() - meeting.startAt.getTime()) / 3600000);
  }

  const dayHours = new Map<string, Map<number, number>>();
  for (const block of blocks) {
    const day = weekdayInTz(block.start, tz);
    const hour = hourInTz(block.start, tz);
    if (!dayHours.has(day)) dayHours.set(day, new Map());
    const map = dayHours.get(day)!;
    map.set(hour, (map.get(hour) || 0) + block.minutes);
  }

  const windows = [...dayHours.entries()]
    .map(([day, hours]) => {
      let bestHour = 9;
      let best = 0;
      for (const [hour, minutes] of hours) {
        if (minutes > best) {
          best = minutes;
          bestHour = hour;
        }
      }
      return {
        day,
        window: `${hourLabel(bestHour)} – ${hourLabel((bestHour + 2) % 24)}`,
        duration: formatDuration(Math.min(best, 180)),
        strength: Math.min(1, best / 120),
      };
    })
    .sort((a, b) => b.strength - a.strength)
    .slice(0, 3);

  const sources = [
    { source: "PR reviews", count: interruptions.filter((i) => i.type === "review").length, color: "#22c55e" },
    { source: "Calendar alerts", count: meetings.length, color: "#f59e0b" },
    { source: "CI notifications", count: interruptions.filter((i) => i.type === "ci").length, color: "#6b7280" },
    { source: "Issue mentions", count: interruptions.filter((i) => i.type === "issue").length, color: "#8b5cf6" },
  ];

  const busyHour = [...hourlyMap.entries()].sort((a, b) => b[1].interruptions - a[1].interruptions)[0];
  const recommendation = windows[0]
    ? `Consider protecting ${windows[0].day} ${windows[0].window} for focused work. These are derived estimates from activity timestamps, not precise time tracking.`
    : "Connect GitHub and work as usual — DevDash estimates focus windows from your activity.";

  return {
    totalFocusMin: Math.round(totalFocusMin),
    avgBlockMin: Math.round(avgBlockMin),
    longestBlockMin: Math.round(longestBlockMin),
    meetingMin: Math.round(meetingMin),
    interruptions: interruptions.filter((i) => i.timestamp >= todayStart).length || interruptions.length,
    hourly: [...hourlyMap.entries()].map(([hour, vals]) => ({
      hour: hourLabel(hour),
      focus: Math.min(1, vals.focus),
      meetings: Math.min(1, vals.meetings),
      interruptions: Math.min(1, vals.interruptions),
    })),
    windows,
    interruptionSources: sources,
    recommendation: busyHour
      ? `You experience more interruptions around ${hourLabel(busyHour[0])}. ${recommendation}`
      : recommendation,
    note: "Focus windows are derived estimates from clustered commits and pull request activity.",
  };
}

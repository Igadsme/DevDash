import { subDays, subMonths } from "date-fns";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { generateAIBrief } from "@/lib/ai";
import { getApiUserId, invalidRequest, unauthorized } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/security/rate-limit";

const requestSchema = z.object({
  period: z.enum(["WEEKLY", "MONTHLY"]).default("WEEKLY"),
});

export async function POST(request: NextRequest) {
  const userId = await getApiUserId();
  if (!userId) return unauthorized();
  if (!checkRateLimit(`ai:${userId}`, 3, 60 * 60_000).allowed) {
    return NextResponse.json(
      { error: "AI brief rate limit reached." },
      { status: 429 },
    );
  }
  const form = await request.formData();
  const parsed = requestSchema.safeParse({
    period: form.get("period") ?? "WEEKLY",
  });
  if (!parsed.success) return invalidRequest();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { settings: true },
  });
  if (!user?.settings)
    return NextResponse.json({ error: "Settings not found." }, { status: 409 });
  const endsAt = new Date();
  const startsAt =
    parsed.data.period === "MONTHLY"
      ? subMonths(endsAt, 1)
      : subDays(endsAt, 7);
  const allEvents = await prisma.activityEvent.findMany({
    where: { userId, occurredAt: { gte: startsAt, lte: endsAt } },
    include: { repository: { select: { isPrivate: true } } },
    orderBy: { occurredAt: "desc" },
    take: 1_000,
  });
  const events = user.settings.excludePrivateFromAi
    ? allEvents.filter((event) => !event.repository?.isPrivate)
    : allEvents;
  const generated = await generateAIBrief(events, user.settings.aiEnabled);
  await prisma.aIReport.create({
    data: {
      userId,
      period: parsed.data.period,
      startsAt,
      endsAt,
      content: generated.brief,
      source: generated.source,
      model: generated.source === "openai" ? "gpt-4.1-mini" : null,
      eventCount: events.length,
      redactedCount: allEvents.length - events.length,
    },
  });
  return NextResponse.redirect(
    new URL(`/ai-brief?generated=${generated.source}`, request.url),
    303,
  );
}

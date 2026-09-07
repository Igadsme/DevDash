import { NextResponse } from "next/server";
import { getApiUserId, invalidRequest, unauthorized } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { focusCreateSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const userId = await getApiUserId();
  if (!userId) return unauthorized();
  const parsed = focusCreateSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) return invalidRequest(parsed.error.issues[0]?.message);
  const running = await prisma.focusSession.findFirst({
    where: { userId, status: { in: ["RUNNING", "PAUSED"] } },
  });
  if (running)
    return NextResponse.json(
      { error: "Complete or cancel the current focus session first." },
      { status: 409 },
    );
  const session = await prisma.focusSession.create({
    data: { userId, ...parsed.data, startedAt: new Date() },
  });
  await prisma.activityEvent.create({
    data: {
      userId,
      repositoryId: session.repositoryId,
      providerEventId: `focus-started-${session.id}`,
      type: "FOCUS_STARTED",
      title: "Focus session started",
      occurredAt: session.startedAt,
      metadata: {
        focusSessionId: session.id,
        plannedMinutes: session.plannedMinutes,
      },
    },
  });
  return NextResponse.json(session, { status: 201 });
}

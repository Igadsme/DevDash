import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getApiUserId,
  invalidRequest,
  notFound,
  unauthorized,
} from "@/lib/api";
import { prisma } from "@/lib/prisma";
const actionSchema = z.object({
  action: z.enum(["pause", "resume", "complete", "cancel"]),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const userId = await getApiUserId();
  if (!userId) return unauthorized();
  const { id } = await context.params;
  const parsed = actionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return invalidRequest();
  const session = await prisma.focusSession.findFirst({
    where: { id, userId },
  });
  if (!session) return notFound();
  const now = new Date();
  let data: Record<string, unknown> = {};
  if (parsed.data.action === "pause" && session.status === "RUNNING")
    data = { status: "PAUSED", pausedAt: now };
  else if (
    parsed.data.action === "resume" &&
    session.status === "PAUSED" &&
    session.pausedAt
  )
    data = {
      status: "RUNNING",
      accumulatedPauseSeconds:
        session.accumulatedPauseSeconds +
        Math.floor((now.getTime() - session.pausedAt.getTime()) / 1_000),
      pausedAt: null,
    };
  else if (
    parsed.data.action === "complete" &&
    ["RUNNING", "PAUSED"].includes(session.status)
  )
    data = { status: "COMPLETED", completedAt: now };
  else if (
    parsed.data.action === "cancel" &&
    ["RUNNING", "PAUSED"].includes(session.status)
  )
    data = { status: "CANCELED", canceledAt: now };
  else
    return NextResponse.json(
      { error: "Action is not valid for the current session state." },
      { status: 409 },
    );
  const updated = await prisma.focusSession.update({ where: { id }, data });
  if (updated.status === "COMPLETED")
    await prisma.activityEvent.upsert({
      where: {
        userId_providerEventId: {
          userId,
          providerEventId: `focus-completed-${id}`,
        },
      },
      create: {
        userId,
        repositoryId: updated.repositoryId,
        providerEventId: `focus-completed-${id}`,
        type: "FOCUS_COMPLETED",
        title: "Focus session completed",
        occurredAt: now,
        metadata: {
          focusSessionId: id,
          plannedMinutes: updated.plannedMinutes,
        },
      },
      update: { occurredAt: now },
    });
  return NextResponse.json(updated);
}

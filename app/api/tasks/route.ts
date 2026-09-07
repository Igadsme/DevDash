import { NextResponse } from "next/server";
import { getApiUserId, invalidRequest, unauthorized } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { refreshUserNotifications } from "@/lib/notifications";
import { taskCreateSchema } from "@/lib/validation";

export async function GET() {
  const userId = await getApiUserId();
  if (!userId) return unauthorized();
  return NextResponse.json(
    await prisma.task.findMany({
      where: { userId },
      orderBy: [{ status: "asc" }, { dueAt: "asc" }],
    }),
  );
}
export async function POST(request: Request) {
  const userId = await getApiUserId();
  if (!userId) return unauthorized();
  const parsed = taskCreateSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) return invalidRequest(parsed.error.issues[0]?.message);
  if (parsed.data.pullRequestId && parsed.data.issueId)
    return invalidRequest(
      "Choose either a pull request or an issue, not both.",
    );
  const [repository, pullRequest, issue] = await Promise.all([
    parsed.data.repositoryId
      ? prisma.repository.findFirst({
          where: { id: parsed.data.repositoryId, userId },
          select: { id: true },
        })
      : null,
    parsed.data.pullRequestId
      ? prisma.pullRequest.findFirst({
          where: { id: parsed.data.pullRequestId, userId },
          select: { id: true, repositoryId: true },
        })
      : null,
    parsed.data.issueId
      ? prisma.issue.findFirst({
          where: { id: parsed.data.issueId, userId },
          select: { id: true, repositoryId: true },
        })
      : null,
  ]);
  if (parsed.data.repositoryId && !repository)
    return invalidRequest("Repository was not found.");
  if (parsed.data.pullRequestId && !pullRequest)
    return invalidRequest("Pull request was not found.");
  if (parsed.data.issueId && !issue)
    return invalidRequest("Issue was not found.");
  const relatedRepositoryId = pullRequest?.repositoryId ?? issue?.repositoryId;
  if (
    relatedRepositoryId &&
    parsed.data.repositoryId &&
    relatedRepositoryId !== parsed.data.repositoryId
  )
    return invalidRequest("The related item belongs to another repository.");
  const task = await prisma.task.create({
    data: {
      userId,
      ...parsed.data,
      repositoryId: parsed.data.repositoryId ?? relatedRepositoryId ?? null,
      dueAt: parsed.data.dueAt ? new Date(parsed.data.dueAt) : null,
    },
  });
  await prisma.activityEvent.create({
    data: {
      userId,
      repositoryId: task.repositoryId,
      providerEventId: `task-created-${task.id}`,
      type: "TASK_CREATED",
      title: task.title,
      occurredAt: task.createdAt,
      metadata: { taskId: task.id },
    },
  });
  await refreshUserNotifications(userId).catch(() => undefined);
  return NextResponse.json(task, { status: 201 });
}

import { NextResponse } from "next/server";
import {
  getApiUserId,
  invalidRequest,
  notFound,
  unauthorized,
} from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { refreshUserNotifications } from "@/lib/notifications";
import { taskUpdateSchema } from "@/lib/validation";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const userId = await getApiUserId();
  if (!userId) return unauthorized();
  const { id } = await context.params;
  const parsed = taskUpdateSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) return invalidRequest(parsed.error.issues[0]?.message);
  const existing = await prisma.task.findFirst({ where: { id, userId } });
  if (!existing) return notFound();
  const repositoryId =
    parsed.data.repositoryId === undefined
      ? existing.repositoryId
      : parsed.data.repositoryId;
  const pullRequestId =
    parsed.data.pullRequestId === undefined
      ? existing.pullRequestId
      : parsed.data.pullRequestId;
  const issueId =
    parsed.data.issueId === undefined ? existing.issueId : parsed.data.issueId;
  if (pullRequestId && issueId)
    return invalidRequest(
      "Choose either a pull request or an issue, not both.",
    );
  const [repository, pullRequest, issue] = await Promise.all([
    repositoryId
      ? prisma.repository.findFirst({
          where: { id: repositoryId, userId },
          select: { id: true },
        })
      : null,
    pullRequestId
      ? prisma.pullRequest.findFirst({
          where: { id: pullRequestId, userId },
          select: { id: true, repositoryId: true },
        })
      : null,
    issueId
      ? prisma.issue.findFirst({
          where: { id: issueId, userId },
          select: { id: true, repositoryId: true },
        })
      : null,
  ]);
  if (repositoryId && !repository)
    return invalidRequest("Repository was not found.");
  if (pullRequestId && !pullRequest)
    return invalidRequest("Pull request was not found.");
  if (issueId && !issue) return invalidRequest("Issue was not found.");
  const relatedRepositoryId = pullRequest?.repositoryId ?? issue?.repositoryId;
  if (
    relatedRepositoryId &&
    repositoryId &&
    relatedRepositoryId !== repositoryId
  )
    return invalidRequest("The related item belongs to another repository.");
  const task = await prisma.task.update({
    where: { id },
    data: {
      ...parsed.data,
      repositoryId: repositoryId ?? relatedRepositoryId ?? null,
      dueAt:
        parsed.data.dueAt === undefined
          ? undefined
          : parsed.data.dueAt
            ? new Date(parsed.data.dueAt)
            : null,
      completedAt:
        parsed.data.status === "COMPLETED"
          ? new Date()
          : parsed.data.status
            ? null
            : undefined,
    },
  });
  if (parsed.data.status === "COMPLETED")
    await prisma.activityEvent.upsert({
      where: {
        userId_providerEventId: {
          userId,
          providerEventId: `task-completed-${id}`,
        },
      },
      create: {
        userId,
        repositoryId: task.repositoryId,
        providerEventId: `task-completed-${id}`,
        type: "TASK_COMPLETED",
        title: task.title,
        occurredAt: task.completedAt ?? new Date(),
        metadata: { taskId: id },
      },
      update: { occurredAt: task.completedAt ?? new Date(), title: task.title },
    });
  await refreshUserNotifications(userId).catch(() => undefined);
  return NextResponse.json(task);
}
export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const userId = await getApiUserId();
  if (!userId) return unauthorized();
  const { id } = await context.params;
  const result = await prisma.task.deleteMany({ where: { id, userId } });
  if (!result.count) return notFound();
  return new NextResponse(null, { status: 204 });
}

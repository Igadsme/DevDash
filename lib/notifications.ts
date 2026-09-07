import { prisma } from "@/lib/prisma";

const STALE_PR_DAYS = 7;

/** Reconciles stored notifications from normalized records without reviving read/dismissed alerts. */
export async function refreshUserNotifications(userId: string) {
  const settings = await prisma.userSettings.findUnique({ where: { userId } });
  const now = new Date();
  const soon = new Date(now.getTime() + 24 * 60 * 60 * 1_000);
  const staleBefore = new Date(
    now.getTime() - STALE_PR_DAYS * 24 * 60 * 60 * 1_000,
  );
  const [reviews, pipelines, stalePullRequests, tasks] = await Promise.all([
    settings?.notifyReviews === false
      ? []
      : prisma.review.findMany({
          where: { userId, state: "PENDING" },
          include: {
            pullRequest: { include: { repository: true } },
          },
          take: 100,
        }),
    settings?.notifyPipelines === false
      ? []
      : prisma.pipelineRun.findMany({
          where: { userId, status: "FAILED" },
          include: { repository: true },
          orderBy: { completedAt: "desc" },
          take: 100,
        }),
    settings?.notifyReviews === false
      ? []
      : prisma.pullRequest.findMany({
          where: {
            userId,
            state: "OPEN",
            providerUpdatedAt: { lt: staleBefore },
          },
          include: { repository: true },
          take: 100,
        }),
    settings?.notifyTasks === false
      ? []
      : prisma.task.findMany({
          where: {
            userId,
            status: { not: "COMPLETED" },
            dueAt: { gte: now, lte: soon },
          },
          take: 100,
        }),
  ]);

  const writes = [
    ...reviews.map((review) => ({
      type: "REVIEW_REQUESTED" as const,
      title: `Review requested: ${review.pullRequest.title}`,
      body: `${review.reviewerLogin} was requested on ${review.pullRequest.repository.fullName} #${review.pullRequest.number}.`,
      href: review.pullRequest.url,
      sourceKey: `review-requested-${review.id}`,
    })),
    ...pipelines.map((pipeline) => ({
      type: "PIPELINE_FAILED" as const,
      title: `${pipeline.name} failed`,
      body: `${pipeline.repository.fullName}${pipeline.branch ? ` on ${pipeline.branch}` : ""} needs attention.`,
      href: pipeline.url,
      sourceKey: `pipeline-failed-${pipeline.id}`,
    })),
    ...stalePullRequests.map((pullRequest) => ({
      type: "PULL_REQUEST_STALE" as const,
      title: `Stale pull request: ${pullRequest.title}`,
      body: `${pullRequest.repository.fullName} #${pullRequest.number} has had no update for at least ${STALE_PR_DAYS} days.`,
      href: pullRequest.url,
      sourceKey: `pull-request-stale-${pullRequest.id}`,
    })),
    ...tasks.map((task) => ({
      type: "TASK_DUE" as const,
      title: `Task due soon: ${task.title}`,
      body: `Due ${task.dueAt?.toLocaleString() ?? "soon"}.`,
      href: "/tasks",
      sourceKey: `task-due-${task.id}-${task.dueAt?.toISOString()}`,
    })),
  ];

  await prisma.$transaction(
    writes.map((notification) =>
      prisma.notification.upsert({
        where: {
          userId_sourceKey: { userId, sourceKey: notification.sourceKey },
        },
        create: { userId, ...notification },
        update: {
          title: notification.title,
          body: notification.body,
          href: notification.href,
        },
      }),
    ),
  );
  return writes.length;
}

export async function refreshAllNotifications() {
  const users = await prisma.user.findMany({ select: { id: true } });
  const results = await Promise.allSettled(
    users.map((user) => refreshUserNotifications(user.id)),
  );
  return {
    users: users.length,
    refreshed: results.filter((result) => result.status === "fulfilled").length,
  };
}

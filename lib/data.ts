import { subDays } from "date-fns";
import { redirect } from "next/navigation";

import {
  buildNarrativeSummary,
  calculateEstimatedContextSwitches,
  getRangeStart,
  type TimelineRange,
} from "@/lib/analytics";
import { getAuthSession } from "@/lib/auth";
import {
  hasAuthSecret,
  hasCredentialEncryptionConfig,
  hasGitHubAppConfig,
  hasGitHubOAuthConfig,
  hasOpenAIConfig,
} from "@/lib/config";
import { aiBriefSchema, createFallbackBrief } from "@/lib/ai";
import { prisma } from "@/lib/prisma";
import { calculateDeveloperHealth } from "@/lib/scoring/health";

export async function requireUser() {
  const session = await getAuthSession();
  if (!session?.user?.id) redirect("/signin");
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { settings: true },
  });
  if (!user) redirect("/signin");
  const settings =
    user.settings ??
    (await prisma.userSettings.create({ data: { userId: user.id } }));
  return { ...user, settings };
}

export async function getDashboardData() {
  const user = await requireUser();
  const since = subDays(new Date(), 7);
  const staleBefore = subDays(new Date(), 7);
  const [
    connections,
    repositoryCount,
    openPullRequests,
    stalePullRequests,
    failingPipelines,
    recentCommits,
    tasks,
    events,
    latestSync,
    latestReport,
  ] = await Promise.all([
    prisma.providerConnection.findMany({
      where: { userId: user.id },
      select: { id: true, provider: true, displayName: true, status: true },
    }),
    prisma.repository.count({ where: { userId: user.id } }),
    prisma.pullRequest.count({ where: { userId: user.id, state: "OPEN" } }),
    prisma.pullRequest.count({
      where: {
        userId: user.id,
        state: "OPEN",
        providerUpdatedAt: { lt: staleBefore },
      },
    }),
    prisma.pipelineRun.count({ where: { userId: user.id, status: "FAILED" } }),
    prisma.commit.findMany({
      where: { userId: user.id },
      include: { repository: { select: { fullName: true } } },
      orderBy: { committedAt: "desc" },
      take: 8,
    }),
    prisma.task.findMany({
      where: { userId: user.id, status: { not: "COMPLETED" } },
      orderBy: [{ dueAt: "asc" }, { priority: "desc" }],
      take: 6,
    }),
    prisma.activityEvent.findMany({
      where: { userId: user.id, occurredAt: { gte: since } },
      include: { repository: { select: { isPrivate: true } } },
      orderBy: { occurredAt: "desc" },
      take: 500,
    }),
    prisma.syncJob.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.aIReport.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    }),
  ]);
  const identities = [
    user.githubLogin,
    ...connections.map((connection) => connection.displayName),
  ].filter((value): value is string => Boolean(value));
  const [pendingReviews, assignedIssues] = identities.length
    ? await Promise.all([
        prisma.review.count({
          where: {
            userId: user.id,
            state: "PENDING",
            reviewerLogin: { in: identities, mode: "insensitive" },
          },
        }),
        prisma.issue.count({
          where: {
            userId: user.id,
            state: "OPEN",
            assignees: { hasSome: identities },
          },
        }),
      ])
    : [0, 0];
  const aiEvents = user.settings.excludePrivateFromAi
    ? events.filter((event) => !event.repository?.isPrivate)
    : events;
  const storedBrief = latestReport
    ? aiBriefSchema.safeParse(latestReport.content)
    : null;
  const brief = storedBrief?.success
    ? {
        brief: storedBrief.data,
        source:
          latestReport?.source === "openai"
            ? ("openai" as const)
            : ("local" as const),
      }
    : { brief: createFallbackBrief(aiEvents), source: "local" as const };
  const completedFocusMinutes = await prisma.focusSession.aggregate({
    where: {
      userId: user.id,
      status: "COMPLETED",
      completedAt: { gte: since },
    },
    _sum: { plannedMinutes: true },
  });
  const context = calculateEstimatedContextSwitches(
    events,
    user.settings.interruptionCostMinutes,
  );
  const health = calculateDeveloperHealth({
    mergedPullRequests: events.filter(
      (event) => event.type === "PULL_REQUEST_MERGED",
    ).length,
    medianLeadTimeHours: null,
    completedReviews: events.filter(
      (event) => event.type === "REVIEW_COMPLETED",
    ).length,
    medianReviewTurnaroundHours: null,
    successfulPipelines: events.filter(
      (event) =>
        event.type === "PIPELINE_COMPLETED" &&
        !event.title.toLowerCase().includes("fail"),
    ).length,
    failedPipelines: failingPipelines,
    openPullRequests,
    stalePullRequests,
    completedFocusMinutes: completedFocusMinutes._sum.plannedMinutes ?? 0,
    contextSwitchEstimate: context.switches,
  });
  return {
    user,
    connections,
    counts: {
      repositories: repositoryCount,
      openPullRequests,
      pendingReviews,
      assignedIssues,
      failingPipelines,
    },
    recentCommits,
    tasks,
    events,
    latestSync,
    latestSyncIsStale: latestSync
      ? Date.now() - latestSync.updatedAt.getTime() > 2 * 60 * 60 * 1_000
      : false,
    brief,
    context,
    health,
  };
}

export async function getTimelineData(range: TimelineRange) {
  const user = await requireUser();
  const events = await prisma.activityEvent.findMany({
    where: { userId: user.id, occurredAt: { gte: getRangeStart(range) } },
    include: { repository: { select: { fullName: true } } },
    orderBy: { occurredAt: "desc" },
    take: 100,
  });
  return { user, events, summary: buildNarrativeSummary(events) };
}

export async function getFocusData() {
  const user = await requireUser();
  const since = getRangeStart("week");
  const [events, sessions, repositories, tasks] = await Promise.all([
    prisma.activityEvent.findMany({
      where: { userId: user.id, occurredAt: { gte: since } },
      orderBy: { occurredAt: "asc" },
      take: 500,
    }),
    prisma.focusSession.findMany({
      where: { userId: user.id },
      include: { repository: true, task: true },
      orderBy: { startedAt: "desc" },
      take: 25,
    }),
    prisma.repository.findMany({
      where: { userId: user.id },
      orderBy: { name: "asc" },
      take: 100,
    }),
    prisma.task.findMany({
      where: { userId: user.id, status: { not: "COMPLETED" } },
      orderBy: { title: "asc" },
      take: 100,
    }),
  ]);
  return {
    user,
    sessions,
    repositories,
    tasks,
    estimate: calculateEstimatedContextSwitches(
      events,
      user.settings.interruptionCostMinutes,
    ),
  };
}

export async function getRepositoriesData() {
  const user = await requireUser();
  const [repositories, workspaces, commits] = await Promise.all([
    prisma.repository.findMany({
      where: { userId: user.id },
      include: {
        _count: {
          select: { pullRequests: true, issues: true, pipelineRuns: true },
        },
      },
      orderBy: { pushedAt: "desc" },
      take: 100,
    }),
    prisma.workspace.findMany({
      where: { userId: user.id },
      include: { _count: { select: { repositories: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.commit.findMany({
      where: { userId: user.id },
      include: { repository: true },
      orderBy: { committedAt: "desc" },
      take: 30,
    }),
  ]);
  return { user, repositories, workspaces, commits };
}

export async function getIntegrationData() {
  const session = await getAuthSession();
  const user = session?.user?.id
    ? await prisma.user.findUnique({ where: { id: session.user.id } })
    : null;
  const connections = user
    ? await prisma.providerConnection.findMany({
        where: { userId: user.id },
        include: {
          syncStates: { orderBy: { updatedAt: "desc" }, take: 1 },
          syncJobs: { orderBy: { createdAt: "desc" }, take: 1 },
          _count: { select: { repositories: true, workspaces: true } },
        },
        orderBy: { provider: "asc" },
      })
    : [];
  return {
    user,
    connections,
    githubConfigured: hasGitHubOAuthConfig(),
    githubAppConfigured: hasGitHubAppConfig(),
    encryptionConfigured: hasCredentialEncryptionConfig(),
    openAiConfigured: hasOpenAIConfig(),
    authConfigured: hasAuthSecret(),
  };
}

import { prisma } from "@/lib/prisma";
import { safeDecrypt } from "@/lib/crypto";
import { getAdapter } from "@/lib/integrations";
import type { NormalizedEvent, NormalizedRepo } from "@/lib/integrations/types";

export async function persistRepositories(userId: string, integrationId: string, repos: NormalizedRepo[]) {
  for (const repo of repos) {
    await prisma.repository.upsert({
      where: {
        userId_provider_externalId: {
          userId,
          provider: repo.provider,
          externalId: repo.externalId,
        },
      },
      create: {
        userId,
        integrationId,
        provider: repo.provider,
        externalId: repo.externalId,
        name: repo.name,
        fullName: repo.fullName,
        url: repo.url,
        private: repo.private ?? false,
        defaultBranch: repo.defaultBranch,
        language: repo.language,
        lastActivityAt: repo.lastActivityAt,
        selected: true,
      },
      update: {
        name: repo.name,
        fullName: repo.fullName,
        url: repo.url,
        private: repo.private ?? false,
        defaultBranch: repo.defaultBranch,
        language: repo.language,
        lastActivityAt: repo.lastActivityAt,
      },
    });
  }
}

export async function persistEvents(userId: string, events: NormalizedEvent[]) {
  const repos = await prisma.repository.findMany({ where: { userId } });
  const repoByName = new Map(repos.map((r) => [r.fullName, r]));

  for (const event of events) {
    const repo = event.repository ? repoByName.get(event.repository) : null;
    await prisma.activityEvent.upsert({
      where: {
        userId_provider_type_externalId: {
          userId,
          provider: event.provider,
          type: event.type,
          externalId: event.externalId,
        },
      },
      create: {
        userId,
        provider: event.provider,
        type: event.type,
        repository: event.repository,
        repositoryId: repo?.id,
        title: event.title,
        description: event.description,
        url: event.url,
        timestamp: event.timestamp,
        metadata: event.metadata as object | undefined,
        externalId: event.externalId,
      },
      update: {
        title: event.title,
        description: event.description,
        url: event.url,
        timestamp: event.timestamp,
        metadata: event.metadata as object | undefined,
        repositoryId: repo?.id,
      },
    });

    if (event.type === "commit") {
      await prisma.commit.upsert({
        where: { userId_provider_sha: { userId, provider: event.provider, sha: event.externalId } },
        create: {
          userId,
          repositoryId: repo?.id,
          provider: event.provider,
          sha: event.externalId,
          message: event.title,
          url: event.url,
          authoredAt: event.timestamp,
        },
        update: { message: event.title, url: event.url, authoredAt: event.timestamp },
      });
    }

    if (event.type === "pr") {
      const meta = (event.metadata || {}) as Record<string, unknown>;
      await prisma.pullRequest.upsert({
        where: { userId_provider_externalId: { userId, provider: event.provider, externalId: event.externalId } },
        create: {
          userId,
          repositoryId: repo?.id,
          provider: event.provider,
          externalId: event.externalId,
          number: Number(meta.number || 0),
          title: String(meta.title || event.description || event.title),
          state: String(meta.state || "open"),
          url: event.url,
          authorLogin: meta.author ? String(meta.author) : null,
          isAuthor: Boolean(meta.isAuthor),
          draft: Boolean(meta.draft),
          merged: Boolean(meta.merged),
          mergedAt: meta.mergedAt ? new Date(String(meta.mergedAt)) : null,
          openedAt: meta.openedAt ? new Date(String(meta.openedAt)) : event.timestamp,
          updatedAtSrc: event.timestamp,
          reviewState: meta.reviewRequested ? "review_requested" : null,
        },
        update: {
          title: String(meta.title || event.description || event.title),
          state: String(meta.state || "open"),
          merged: Boolean(meta.merged),
          mergedAt: meta.mergedAt ? new Date(String(meta.mergedAt)) : null,
          updatedAtSrc: event.timestamp,
          reviewState: meta.reviewRequested ? "review_requested" : undefined,
        },
      });
    }

    if (event.type === "review") {
      const meta = (event.metadata || {}) as Record<string, unknown>;
      const pr = await prisma.pullRequest.findFirst({
        where: { userId, number: Number(meta.number || 0), repositoryId: repo?.id || undefined },
      });
      if (pr) {
        await prisma.pullRequestReview.upsert({
          where: { userId_provider_externalId: { userId, provider: event.provider, externalId: event.externalId } },
          create: {
            userId,
            pullRequestId: pr.id,
            provider: event.provider,
            externalId: event.externalId,
            state: String(meta.state || "COMMENTED"),
            submittedAt: event.timestamp,
            url: event.url,
          },
          update: { state: String(meta.state || "COMMENTED"), submittedAt: event.timestamp },
        });
      }
    }

    if (event.type === "issue") {
      const meta = (event.metadata || {}) as Record<string, unknown>;
      await prisma.issue.upsert({
        where: { userId_provider_externalId: { userId, provider: event.provider, externalId: event.externalId } },
        create: {
          userId,
          repositoryId: repo?.id,
          provider: event.provider,
          externalId: event.externalId,
          number: Number(meta.number || 0),
          title: String(meta.title || event.description || event.title),
          state: String(meta.state || "open"),
          url: event.url,
          isAuthor: Boolean(meta.isAuthor),
          isAssigned: Boolean(meta.isAssigned),
          labels: meta.labels as object | undefined,
          milestoneDue: meta.milestoneDue ? new Date(String(meta.milestoneDue)) : null,
          openedAt: meta.openedAt ? new Date(String(meta.openedAt)) : event.timestamp,
          closedAt: meta.closedAt ? new Date(String(meta.closedAt)) : null,
        },
        update: {
          title: String(meta.title || event.description || event.title),
          state: String(meta.state || "open"),
          isAssigned: Boolean(meta.isAssigned),
          closedAt: meta.closedAt ? new Date(String(meta.closedAt)) : null,
        },
      });
    }

    if (event.type === "ci") {
      const meta = (event.metadata || {}) as Record<string, unknown>;
      const started = meta.startedAt ? new Date(String(meta.startedAt)) : event.timestamp;
      const completed = meta.completedAt ? new Date(String(meta.completedAt)) : null;
      await prisma.cICDRun.upsert({
        where: { userId_provider_externalId: { userId, provider: event.provider, externalId: event.externalId } },
        create: {
          userId,
          repositoryId: repo?.id,
          provider: event.provider === "github" ? "github_actions" : event.provider,
          externalId: event.externalId,
          name: String(meta.name || event.title),
          status: String(meta.status || "completed"),
          conclusion: meta.conclusion ? String(meta.conclusion) : null,
          branch: meta.branch ? String(meta.branch) : null,
          url: event.url,
          startedAt: started,
          completedAt: completed,
          durationMs: completed && started ? completed.getTime() - started.getTime() : null,
        },
        update: {
          status: String(meta.status || "completed"),
          conclusion: meta.conclusion ? String(meta.conclusion) : null,
          completedAt: completed,
        },
      });
    }
  }
}

export async function syncIntegration(userId: string, provider: string) {
  const integration = await prisma.integration.findUnique({
    where: { userId_provider: { userId, provider } },
  });
  if (!integration || integration.status === "disconnected") {
    throw new Error(`${provider} is not connected.`);
  }
  const token = safeDecrypt(integration.accessToken);
  if (!token) {
    throw new Error(`${provider} token is missing or invalid. Reconnect the integration.`);
  }

  const adapter = getAdapter(provider);
  if (!adapter) {
    throw new Error(`No adapter for ${provider}`);
  }

  await prisma.integration.update({
    where: { id: integration.id },
    data: { status: "syncing", lastError: null },
  });

  try {
    const repos = await adapter.listRepositories({
      userId,
      accessToken: token,
      handle: integration.handle,
    });
    await persistRepositories(userId, integration.id, repos);

    const stored = await prisma.repository.findMany({
      where: { userId, provider, selected: true },
      orderBy: { lastActivityAt: "desc" },
      take: 25,
    });
    const selectedRepos = stored.map((r) => ({
      provider: r.provider,
      externalId: r.externalId,
      name: r.name,
      fullName: r.fullName,
      url: r.url || undefined,
    }));

    const events = await adapter.listEvents(
      {
        userId,
        accessToken: token,
        handle: integration.handle,
        since: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      },
      selectedRepos,
    );
    await persistEvents(userId, events);

    if (provider === "github") {
      await prisma.integration.upsert({
        where: { userId_provider: { userId, provider: "github_actions" } },
        create: { userId, provider: "github_actions", status: "connected", handle: integration.handle, lastSyncAt: new Date() },
        update: { status: "connected", lastSyncAt: new Date(), lastError: null },
      });
    }
    if (provider === "gitlab") {
      await prisma.integration.upsert({
        where: { userId_provider: { userId, provider: "gitlab_ci" } },
        create: { userId, provider: "gitlab_ci", status: "connected", handle: integration.handle, lastSyncAt: new Date() },
        update: { status: "connected", lastSyncAt: new Date(), lastError: null },
      });
    }

    await prisma.integration.update({
      where: { id: integration.id },
      data: { status: "connected", lastSyncAt: new Date(), lastError: null },
    });

    return { repos: repos.length, events: events.length };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sync failed";
    await prisma.integration.update({
      where: { id: integration.id },
      data: { status: "error", lastError: message },
    });
    throw error;
  }
}

export async function syncUser(userId: string) {
  const integrations = await prisma.integration.findMany({
    where: { userId, status: { in: ["connected", "error", "syncing"] } },
  });
  const results = [];
  for (const integration of integrations) {
    if (!getAdapter(integration.provider)) continue;
    try {
      results.push({ provider: integration.provider, ...(await syncIntegration(userId, integration.provider)) });
    } catch (error) {
      results.push({
        provider: integration.provider,
        error: error instanceof Error ? error.message : "Sync failed",
      });
    }
  }
  return results;
}

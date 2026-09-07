import { randomUUID } from "node:crypto";
import type { Provider } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { refreshUserNotifications } from "@/lib/notifications";
import { createSourceControlAdapter } from "@/lib/providers";
import { ProviderHttpError, withRetry } from "@/lib/providers/http";
import {
  decryptCredential,
  encryptCredential,
} from "@/lib/security/credentials";
import { calculateUrgency } from "@/lib/scoring/urgency";
import { createGitHubInstallationToken } from "@/lib/integrations/github-app";
import type { NormalizedCommitChecks } from "@/lib/providers/types";

async function connectionToken(connection: {
  id: string;
  provider: Provider;
  installationId: string | null;
  encryptedCredential: string | null;
  tokenExpiresAt: Date | null;
}) {
  if (connection.provider === "GITHUB") {
    if (!connection.installationId)
      throw new Error("GITHUB_INSTALLATION_MISSING");
    return (await createGitHubInstallationToken(connection.installationId))
      .token;
  }
  if (!connection.encryptedCredential)
    throw new Error("CONNECTION_CREDENTIAL_MISSING");
  const decrypted = decryptCredential(connection.encryptedCredential);
  try {
    const credential = JSON.parse(decrypted) as {
      accessToken?: string;
      refreshToken?: string;
    };
    if (!credential.accessToken)
      throw new Error("CONNECTION_CREDENTIAL_INVALID");
    if (
      credential.refreshToken &&
      connection.tokenExpiresAt &&
      connection.tokenExpiresAt.getTime() <= Date.now() + 60_000 &&
      (connection.provider === "GITLAB" || connection.provider === "BITBUCKET")
    ) {
      const prefix = connection.provider;
      const clientId = process.env[`${prefix}_CLIENT_ID`];
      const clientSecret = process.env[`${prefix}_CLIENT_SECRET`];
      if (!clientId || !clientSecret)
        throw new Error(`${prefix}_REFRESH_CONFIG_MISSING`);
      const endpoint =
        connection.provider === "GITLAB"
          ? "https://gitlab.com/oauth/token"
          : "https://bitbucket.org/site/oauth2/access_token";
      const body = new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: credential.refreshToken,
      });
      if (connection.provider === "GITLAB") {
        body.set("client_id", clientId);
        body.set("client_secret", clientSecret);
      }
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          ...(connection.provider === "BITBUCKET"
            ? {
                Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
              }
            : {}),
        },
        body,
        signal: AbortSignal.timeout(12_000),
      });
      const refreshed = (await response.json()) as {
        access_token?: string;
        refresh_token?: string;
        expires_in?: number;
      };
      if (!response.ok || !refreshed.access_token)
        throw new Error(`${prefix}_TOKEN_REFRESH_FAILED`);
      await prisma.providerConnection.update({
        where: { id: connection.id },
        data: {
          encryptedCredential: encryptCredential(
            JSON.stringify({
              accessToken: refreshed.access_token,
              refreshToken: refreshed.refresh_token ?? credential.refreshToken,
            }),
          ),
          tokenExpiresAt: refreshed.expires_in
            ? new Date(Date.now() + refreshed.expires_in * 1_000)
            : null,
        },
      });
      return refreshed.access_token;
    }
    return credential.accessToken;
  } catch (error) {
    if (error instanceof SyntaxError) return decrypted; // Legacy encrypted token.
    throw error;
  }
}

async function collectPages<T>(
  load: (
    cursor: string | null,
  ) => Promise<{ items: T[]; nextCursor: string | null }>,
  maxPages = 20,
) {
  const items: T[] = [];
  let cursor: string | null = null;
  for (let page = 0; page < maxPages; page += 1) {
    const result = await withRetry(() => load(cursor));
    items.push(...result.items);
    cursor = result.nextCursor;
    if (!cursor) break;
  }
  return { items, cursor };
}

function syncErrorCode(error: unknown) {
  return error instanceof ProviderHttpError
    ? error.code
    : error instanceof Error
      ? error.message.slice(0, 80)
      : "SYNC_RESOURCE_FAILED";
}

async function collectResource<T>(
  label: string,
  errors: string[],
  load: (
    cursor: string | null,
  ) => Promise<{ items: T[]; nextCursor: string | null }>,
) {
  try {
    return await collectPages(load);
  } catch (error) {
    errors.push(`${label}:${syncErrorCode(error)}`);
    return { items: [] as T[], cursor: null };
  }
}

export async function runSyncJob(jobId: string) {
  const job = await prisma.syncJob.findUnique({
    where: { id: jobId },
    include: { providerConnection: true },
  });
  if (!job || job.status !== "QUEUED") return;
  const connection = job.providerConnection;
  await prisma.syncJob.update({
    where: { id: job.id },
    data: {
      status: "RUNNING",
      startedAt: new Date(),
      attempt: { increment: 1 },
      progress: 5,
    },
  });
  try {
    const partialErrors: string[] = [];
    const token = await connectionToken(connection);
    const adapter = createSourceControlAdapter(
      connection.provider as Provider,
      token,
    );
    const previous = await prisma.syncState.findUnique({
      where: {
        userId_providerConnectionId_resource: {
          userId: job.userId,
          providerConnectionId: connection.id,
          resource: "all",
        },
      },
    });
    const since = previous?.watermark ?? new Date(0);
    const fetchedRepositories = await collectPages((cursor) =>
      adapter.listRepositories({ path: "repositories", cursor, since }),
    );
    const settings = await prisma.userSettings.findUnique({
      where: { userId: job.userId },
      select: { privateRepositories: true, smallPrThreshold: true },
    });
    const repositoriesPage = {
      ...fetchedRepositories,
      items: settings?.privateRepositories
        ? fetchedRepositories.items
        : fetchedRepositories.items.filter(
            (repository) => !repository.isPrivate,
          ),
    };
    await prisma.$transaction(async (tx) => {
      for (const repo of repositoriesPage.items) {
        const owner = repo.fullName.split("/")[0] ?? repo.fullName;
        const workspace = await tx.workspace.upsert({
          where: {
            userId_provider_providerId: {
              userId: job.userId,
              provider: connection.provider,
              providerId: repo.workspaceProviderId,
            },
          },
          create: {
            userId: job.userId,
            providerConnectionId: connection.id,
            provider: connection.provider,
            providerId: repo.workspaceProviderId,
            slug: owner.toLowerCase(),
            name: owner,
            kind:
              owner === connection.displayName ? "personal" : "organization",
          },
          update: { name: owner },
        });
        await tx.repository.upsert({
          where: {
            userId_provider_providerId: {
              userId: job.userId,
              provider: connection.provider,
              providerId: repo.providerId,
            },
          },
          create: {
            userId: job.userId,
            providerConnectionId: connection.id,
            workspaceId: workspace.id,
            ...repo,
          },
          update: {
            workspaceId: workspace.id,
            name: repo.name,
            fullName: repo.fullName,
            description: repo.description,
            url: repo.url,
            defaultBranch: repo.defaultBranch,
            language: repo.language,
            isPrivate: repo.isPrivate,
            isFork: repo.isFork,
            isArchived: repo.isArchived,
            pushedAt: repo.pushedAt,
          },
        });
      }
    });
    await prisma.syncJob.update({
      where: { id: job.id },
      data: { progress: 45 },
    });
    const pullPage = {
      items: [] as Awaited<
        ReturnType<typeof adapter.listPullRequests>
      >["items"],
    };
    const pipelinePage = {
      items: [] as Awaited<ReturnType<typeof adapter.listPipelines>>["items"],
    };
    const issuePage = {
      items: [] as Awaited<ReturnType<typeof adapter.listIssues>>["items"],
    };
    const commitPage = {
      items: [] as Awaited<ReturnType<typeof adapter.listCommits>>["items"],
    };
    const reviewPage = {
      items: [] as Awaited<ReturnType<typeof adapter.listReviews>>["items"],
    };
    const checkResults: NormalizedCommitChecks[] = [];
    // Provider PR and pipeline endpoints are repository-scoped. Fetching each
    // repository separately also guarantees correct ownership foreign keys.
    for (const repository of repositoriesPage.items) {
      const path = `${repository.providerId}:${repository.fullName}`;
      const [pulls, pipelines, issues, commits] = await Promise.all([
        collectResource("pull-requests", partialErrors, (cursor) =>
          adapter.listPullRequests({ path, cursor, since }),
        ),
        collectResource("pipelines", partialErrors, (cursor) =>
          adapter.listPipelines({ path, cursor, since }),
        ),
        collectResource("issues", partialErrors, (cursor) =>
          adapter.listIssues({ path, cursor, since }),
        ),
        collectResource("commits", partialErrors, (cursor) =>
          adapter.listCommits({ path, cursor, since }),
        ),
      ]);
      pullPage.items.push(...pulls.items);
      pipelinePage.items.push(...pipelines.items);
      issuePage.items.push(...issues.items);
      commitPage.items.push(...commits.items);
      for (const pull of pulls.items) {
        const reviews = await collectResource(
          "reviews",
          partialErrors,
          (cursor) =>
            adapter.listReviews({
              path: `${repository.providerId}:${repository.fullName}:${pull.providerId}:${pull.number}`,
              cursor,
              since,
            }),
        );
        reviewPage.items.push(...reviews.items);
        if (pull.headSha && adapter.getCommitChecks) {
          try {
            checkResults.push(
              await withRetry(() =>
                adapter.getCommitChecks!({
                  path: `${repository.providerId}:${repository.fullName}:${pull.headSha}`,
                }),
              ),
            );
          } catch (error) {
            partialErrors.push(`checks:${syncErrorCode(error)}`);
          }
        }
      }
    }
    const repos = await prisma.repository.findMany({
      where: { userId: job.userId, providerConnectionId: connection.id },
    });
    const byProviderId = new Map(repos.map((repo) => [repo.providerId, repo]));
    const checksByCommit = new Map(
      checkResults.map((result) => [
        `${result.repositoryProviderId}:${result.sha}`,
        result,
      ]),
    );
    for (const checks of checkResults) {
      const repository = byProviderId.get(checks.repositoryProviderId);
      if (!repository) continue;
      const run = await prisma.pipelineRun.upsert({
        where: {
          userId_repositoryId_providerId: {
            userId: job.userId,
            repositoryId: repository.id,
            providerId: `checks:${checks.sha}`,
          },
        },
        create: {
          userId: job.userId,
          providerConnectionId: connection.id,
          repositoryId: repository.id,
          providerId: `checks:${checks.sha}`,
          name: "Commit checks and statuses",
          url: repository.url,
          status: checks.status,
          commitSha: checks.sha,
        },
        update: { status: checks.status },
      });
      for (const check of checks.jobs) {
        const durationSeconds =
          check.startedAt && check.completedAt
            ? Math.max(
                0,
                Math.round(
                  (check.completedAt.getTime() - check.startedAt.getTime()) /
                    1_000,
                ),
              )
            : null;
        await prisma.pipelineJob.upsert({
          where: {
            userId_pipelineRunId_providerId: {
              userId: job.userId,
              pipelineRunId: run.id,
              providerId: check.providerId,
            },
          },
          create: {
            userId: job.userId,
            pipelineRunId: run.id,
            providerId: check.providerId,
            name: check.name,
            url: check.url,
            status: check.status,
            conclusion: check.conclusion,
            startedAt: check.startedAt,
            completedAt: check.completedAt,
            durationSeconds,
          },
          update: {
            name: check.name,
            url: check.url,
            status: check.status,
            conclusion: check.conclusion,
            startedAt: check.startedAt,
            completedAt: check.completedAt,
            durationSeconds,
          },
        });
      }
    }
    for (const pull of pullPage.items) {
      const repository = byProviderId.get(pull.repositoryProviderId);
      if (!repository) continue;
      const urgency = calculateUrgency({
        ciStatus: (() => {
          const status = pull.headSha
            ? checksByCommit.get(`${pull.repositoryProviderId}:${pull.headSha}`)
                ?.status
            : undefined;
          return status === "QUEUED" ? "RUNNING" : (status ?? "UNKNOWN");
        })(),
        updatedAt: pull.updatedAt,
        isDraft: pull.isDraft,
        hasMergeConflict: pull.mergeConflict ?? false,
        requestedReviewCount: pull.requestedReviewers.length,
        changesRequested: false,
        changedLines: pull.additions + pull.deletions,
        smallPrThreshold: settings?.smallPrThreshold ?? 150,
      });
      const storedPull = await prisma.pullRequest.upsert({
        where: {
          userId_repositoryId_providerId: {
            userId: job.userId,
            repositoryId: repository.id,
            providerId: pull.providerId,
          },
        },
        create: {
          userId: job.userId,
          providerConnectionId: connection.id,
          repositoryId: repository.id,
          ...pull,
          providerCreatedAt: pull.createdAt,
          providerUpdatedAt: pull.updatedAt,
          urgencyScore: urgency.score,
          urgencyReasons: urgency.reasons,
        },
        update: {
          title: pull.title,
          state: pull.state,
          isDraft: pull.isDraft,
          requestedReviewers: pull.requestedReviewers,
          providerUpdatedAt: pull.updatedAt,
          mergedAt: pull.mergedAt,
          closedAt: pull.closedAt,
          urgencyScore: urgency.score,
          urgencyReasons: urgency.reasons,
        },
      });
      const pullEventType =
        pull.state === "MERGED"
          ? "PULL_REQUEST_MERGED"
          : pull.state === "CLOSED"
            ? "PULL_REQUEST_CLOSED"
            : "PULL_REQUEST_UPDATED";
      await prisma.activityEvent.upsert({
        where: {
          userId_providerEventId: {
            userId: job.userId,
            providerEventId: `${connection.provider}:pull:${repository.providerId}:${pull.providerId}`,
          },
        },
        create: {
          userId: job.userId,
          repositoryId: repository.id,
          provider: connection.provider,
          providerEventId: `${connection.provider}:pull:${repository.providerId}:${pull.providerId}`,
          type: pullEventType,
          title: pull.title,
          sourceUrl: pull.url,
          occurredAt: pull.updatedAt,
          metadata: { number: pull.number, state: pull.state },
        },
        update: {
          type: pullEventType,
          title: pull.title,
          occurredAt: pull.updatedAt,
          metadata: { number: pull.number, state: pull.state },
        },
      });
      for (const reviewerLogin of pull.requestedReviewers) {
        await prisma.review.upsert({
          where: {
            userId_pullRequestId_providerId: {
              userId: job.userId,
              pullRequestId: storedPull.id,
              providerId: `requested:${reviewerLogin}`,
            },
          },
          create: {
            userId: job.userId,
            pullRequestId: storedPull.id,
            providerId: `requested:${reviewerLogin}`,
            reviewerLogin,
            state: "PENDING",
            requestedAt: pull.updatedAt,
          },
          update: { state: "PENDING", requestedAt: pull.updatedAt },
        });
      }
    }
    for (const review of reviewPage.items) {
      const repository = byProviderId.get(review.repositoryProviderId);
      if (!repository) continue;
      const pullRequest = await prisma.pullRequest.findFirst({
        where: {
          userId: job.userId,
          repositoryId: repository.id,
          providerId: review.pullRequestProviderId,
        },
        select: { id: true },
      });
      if (!pullRequest) continue;
      await prisma.$transaction([
        prisma.review.deleteMany({
          where: {
            userId: job.userId,
            pullRequestId: pullRequest.id,
            reviewerLogin: review.reviewerLogin,
            state: "PENDING",
            providerId: { startsWith: "requested:" },
          },
        }),
        prisma.review.upsert({
          where: {
            userId_pullRequestId_providerId: {
              userId: job.userId,
              pullRequestId: pullRequest.id,
              providerId: review.providerId,
            },
          },
          create: {
            userId: job.userId,
            pullRequestId: pullRequest.id,
            providerId: review.providerId,
            reviewerLogin: review.reviewerLogin,
            state: review.state,
            body: review.body,
            requestedAt: review.requestedAt,
            submittedAt: review.submittedAt,
          },
          update: {
            state: review.state,
            body: review.body,
            submittedAt: review.submittedAt,
          },
        }),
        prisma.activityEvent.upsert({
          where: {
            userId_providerEventId: {
              userId: job.userId,
              providerEventId: `${connection.provider}:review:${review.providerId}`,
            },
          },
          create: {
            userId: job.userId,
            repositoryId: repository.id,
            provider: connection.provider,
            providerEventId: `${connection.provider}:review:${review.providerId}`,
            type: "REVIEW_COMPLETED",
            title: `${review.reviewerLogin} ${review.state.toLowerCase().replaceAll("_", " ")}`,
            occurredAt: review.submittedAt ?? new Date(),
            metadata: {
              state: review.state,
              pullRequestProviderId: review.pullRequestProviderId,
            },
          },
          update: {
            title: `${review.reviewerLogin} ${review.state.toLowerCase().replaceAll("_", " ")}`,
            occurredAt: review.submittedAt ?? new Date(),
            metadata: {
              state: review.state,
              pullRequestProviderId: review.pullRequestProviderId,
            },
          },
        }),
      ]);
    }
    for (const issue of issuePage.items) {
      const repository = byProviderId.get(issue.repositoryProviderId);
      if (!repository) continue;
      await prisma.issue.upsert({
        where: {
          userId_repositoryId_providerId: {
            userId: job.userId,
            repositoryId: repository.id,
            providerId: issue.providerId,
          },
        },
        create: {
          userId: job.userId,
          providerConnectionId: connection.id,
          repositoryId: repository.id,
          providerId: issue.providerId,
          number: issue.number,
          title: issue.title,
          body: issue.body,
          url: issue.url,
          state: issue.state,
          authorLogin: issue.authorLogin,
          assignees: issue.assignees,
          labels: issue.labels,
          providerCreatedAt: issue.createdAt,
          providerUpdatedAt: issue.updatedAt,
          closedAt: issue.closedAt,
        },
        update: {
          title: issue.title,
          body: issue.body,
          state: issue.state,
          assignees: issue.assignees,
          labels: issue.labels,
          providerUpdatedAt: issue.updatedAt,
          closedAt: issue.closedAt,
        },
      });
      await prisma.activityEvent.upsert({
        where: {
          userId_providerEventId: {
            userId: job.userId,
            providerEventId: `${connection.provider}:issue:${repository.providerId}:${issue.providerId}`,
          },
        },
        create: {
          userId: job.userId,
          repositoryId: repository.id,
          provider: connection.provider,
          providerEventId: `${connection.provider}:issue:${repository.providerId}:${issue.providerId}`,
          type: issue.state === "CLOSED" ? "ISSUE_CLOSED" : "ISSUE_OPENED",
          title: issue.title,
          sourceUrl: issue.url,
          occurredAt: issue.updatedAt,
          metadata: { issueNumber: issue.number, state: issue.state },
        },
        update: {
          type: issue.state === "CLOSED" ? "ISSUE_CLOSED" : "ISSUE_OPENED",
          title: issue.title,
          occurredAt: issue.updatedAt,
          metadata: { issueNumber: issue.number, state: issue.state },
        },
      });
    }
    for (const commit of commitPage.items) {
      const repository = byProviderId.get(commit.repositoryProviderId);
      if (!repository) continue;
      await prisma.commit.upsert({
        where: {
          userId_repositoryId_sha: {
            userId: job.userId,
            repositoryId: repository.id,
            sha: commit.sha,
          },
        },
        create: {
          userId: job.userId,
          repositoryId: repository.id,
          providerId: commit.providerId,
          sha: commit.sha,
          title: commit.title,
          message: commit.message,
          url: commit.url,
          authorLogin: commit.authorLogin,
          authorName: commit.authorName,
          committedAt: commit.committedAt,
        },
        update: {
          title: commit.title,
          message: commit.message,
          url: commit.url,
          authorLogin: commit.authorLogin,
          authorName: commit.authorName,
          committedAt: commit.committedAt,
        },
      });
      await prisma.activityEvent.upsert({
        where: {
          userId_providerEventId: {
            userId: job.userId,
            providerEventId: `${connection.provider}:commit:${repository.providerId}:${commit.sha}`,
          },
        },
        create: {
          userId: job.userId,
          repositoryId: repository.id,
          provider: connection.provider,
          providerEventId: `${connection.provider}:commit:${repository.providerId}:${commit.sha}`,
          type: "COMMIT",
          title: commit.title,
          description: commit.message,
          sourceUrl: commit.url,
          occurredAt: commit.committedAt,
          metadata: { sha: commit.sha },
        },
        update: {
          title: commit.title,
          description: commit.message,
          occurredAt: commit.committedAt,
        },
      });
    }
    for (const pipeline of pipelinePage.items) {
      const repository = byProviderId.get(pipeline.repositoryProviderId);
      if (!repository) continue;
      const durationSeconds =
        pipeline.startedAt && pipeline.completedAt
          ? Math.max(
              0,
              Math.round(
                (pipeline.completedAt.getTime() -
                  pipeline.startedAt.getTime()) /
                  1_000,
              ),
            )
          : null;
      const storedPipeline = await prisma.pipelineRun.upsert({
        where: {
          userId_repositoryId_providerId: {
            userId: job.userId,
            repositoryId: repository.id,
            providerId: pipeline.providerId,
          },
        },
        create: {
          userId: job.userId,
          providerConnectionId: connection.id,
          repositoryId: repository.id,
          providerId: pipeline.providerId,
          name: pipeline.name,
          url: pipeline.url,
          status: pipeline.status,
          branch: pipeline.branch,
          commitSha: pipeline.commitSha,
          triggeringActor: pipeline.actor,
          startedAt: pipeline.startedAt,
          completedAt: pipeline.completedAt,
          durationSeconds,
        },
        update: {
          status: pipeline.status,
          completedAt: pipeline.completedAt,
          durationSeconds,
        },
      });
      await prisma.activityEvent.upsert({
        where: {
          userId_providerEventId: {
            userId: job.userId,
            providerEventId: `${connection.provider}:pipeline:${repository.providerId}:${pipeline.providerId}`,
          },
        },
        create: {
          userId: job.userId,
          repositoryId: repository.id,
          provider: connection.provider,
          providerEventId: `${connection.provider}:pipeline:${repository.providerId}:${pipeline.providerId}`,
          type:
            pipeline.status === "RUNNING" || pipeline.status === "QUEUED"
              ? "PIPELINE_STARTED"
              : "PIPELINE_COMPLETED",
          title: `${storedPipeline.name}: ${pipeline.status.toLowerCase()}`,
          sourceUrl: pipeline.url,
          occurredAt: pipeline.completedAt ?? pipeline.startedAt ?? new Date(),
          metadata: { status: pipeline.status, commitSha: pipeline.commitSha },
        },
        update: {
          type:
            pipeline.status === "RUNNING" || pipeline.status === "QUEUED"
              ? "PIPELINE_STARTED"
              : "PIPELINE_COMPLETED",
          title: `${storedPipeline.name}: ${pipeline.status.toLowerCase()}`,
          occurredAt: pipeline.completedAt ?? pipeline.startedAt ?? new Date(),
          metadata: { status: pipeline.status, commitSha: pipeline.commitSha },
        },
      });
    }
    const now = new Date();
    await prisma.$transaction([
      prisma.syncState.upsert({
        where: {
          userId_providerConnectionId_resource: {
            userId: job.userId,
            providerConnectionId: connection.id,
            resource: "all",
          },
        },
        create: {
          userId: job.userId,
          providerConnectionId: connection.id,
          resource: "all",
          watermark: now,
          lastAttemptAt: now,
          lastSuccessAt: now,
        },
        update: {
          watermark: now,
          lastAttemptAt: now,
          lastSuccessAt: now,
          lastErrorCode: partialErrors[0] ?? null,
          consecutiveFailures: partialErrors.length ? 1 : 0,
        },
      }),
      prisma.syncJob.update({
        where: { id: job.id },
        data: {
          status: partialErrors.length ? "PARTIAL" : "SUCCEEDED",
          progress: 100,
          completedAt: now,
          stats: {
            repositories: repositoriesPage.items.length,
            pullRequests: pullPage.items.length,
            pipelines: pipelinePage.items.length,
            reviews: reviewPage.items.length,
            issues: issuePage.items.length,
            commits: commitPage.items.length,
            checks: checkResults.reduce(
              (sum, item) => sum + item.jobs.length,
              0,
            ),
            partialErrors,
          },
        },
      }),
      prisma.providerConnection.update({
        where: { id: connection.id },
        data: {
          status: partialErrors.length ? "DEGRADED" : "CONNECTED",
          lastErrorCode: partialErrors[0] ?? null,
          lastErrorAt: partialErrors.length ? now : null,
        },
      }),
      prisma.webhookDelivery.updateMany({
        where: {
          providerConnectionId: connection.id,
          status: "ACCEPTED",
          processedAt: null,
        },
        data: { status: "PROCESSED", processedAt: now },
      }),
    ]);
    await refreshUserNotifications(job.userId).catch(() => undefined);
  } catch (error) {
    const code = syncErrorCode(error);
    const notificationSettings = await prisma.userSettings.findUnique({
      where: { userId: job.userId },
      select: { notifySyncFailures: true },
    });
    const retryAt = new Date(
      Date.now() +
        Math.min(3_600_000, 30_000 * 2 ** job.attempt) +
        Math.floor(Math.random() * 5_000),
    );
    await prisma.$transaction([
      prisma.syncJob.update({
        where: { id: job.id },
        data: {
          status: job.attempt + 1 >= job.maxAttempts ? "FAILED" : "QUEUED",
          nextRetryAt: retryAt,
          errorCode: code,
          errorMessage: "Provider sync failed. Retry is scheduled.",
        },
      }),
      prisma.providerConnection.update({
        where: { id: connection.id },
        data: {
          status: "DEGRADED",
          lastErrorCode: code,
          lastErrorAt: new Date(),
        },
      }),
      ...(notificationSettings?.notifySyncFailures === false
        ? []
        : [
            prisma.notification.upsert({
              where: {
                userId_sourceKey: {
                  userId: job.userId,
                  sourceKey: `sync-failed-${connection.id}`,
                },
              },
              create: {
                userId: job.userId,
                type: "SYNC_FAILED",
                title: `${connection.displayName} sync failed`,
                body: "DevDash kept previously stored data and scheduled a retry.",
                href: "/integrations",
                sourceKey: `sync-failed-${connection.id}`,
              },
              update: {
                readAt: null,
                dismissedAt: null,
                createdAt: new Date(),
              },
            }),
          ]),
    ]);
  }
}

export async function queueScheduledSyncs() {
  const connections = await prisma.providerConnection.findMany({
    where: {
      status: { in: ["CONNECTED", "DEGRADED"] },
      provider: { in: ["GITHUB", "GITLAB", "BITBUCKET"] },
    },
    select: { id: true, userId: true },
  });
  for (const connection of connections) {
    const existing = await prisma.syncJob.findFirst({
      where: {
        providerConnectionId: connection.id,
        status: { in: ["QUEUED", "RUNNING"] },
      },
    });
    if (!existing)
      await prisma.syncJob.create({
        data: {
          userId: connection.userId,
          providerConnectionId: connection.id,
          correlationId: randomUUID(),
        },
      });
  }
}

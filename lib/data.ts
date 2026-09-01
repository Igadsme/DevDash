import { redirect } from "next/navigation";

import { buildFocusInsights, buildNarrativeSummary, getRangeStart, type TimelineRange } from "@/lib/analytics";
import { getAuthSession } from "@/lib/auth";
import { syncGitHubData, type SyncResult } from "@/lib/github";
import { generateWeeklySummary } from "@/lib/openai";
import { prisma } from "@/lib/prisma";
import { hasAuthSecret, hasGitHubOAuthConfig, hasOpenAIConfig } from "@/lib/config";

const syncCache = new Map<string, { expiresAt: number; promise: Promise<SyncResult | null> }>();

async function syncGitHubSafely(userId: string) {
  const cached = syncCache.get(userId);
  const promise = cached && cached.expiresAt > Date.now()
    ? cached.promise
    : syncGitHubData(userId);

  if (!cached || cached.expiresAt <= Date.now()) {
    syncCache.set(userId, { expiresAt: Date.now() + 2 * 60 * 1000, promise });
  }

  try {
    return { sync: await promise, syncError: null as string | null };
  } catch (error) {
    syncCache.delete(userId);
    console.error("GitHub sync failed.", error);
    return {
      sync: null,
      syncError: "GitHub could not be refreshed. Previously synced data is still available."
    };
  }
}

export async function requireUser() {
  const session = await getAuthSession();

  if (!session?.user?.id) {
    redirect("/signin");
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.user.id
    }
  });

  if (!user) {
    redirect("/signin");
  }

  return user;
}

export async function getDashboardData() {
  const user = await requireUser();
  const { sync, syncError } = await syncGitHubSafely(user.id);
  const since = getRangeStart("week");
  const events = await prisma.event.findMany({
    where: {
      userId: user.id,
      timestamp: {
        gte: since
      }
    },
    orderBy: {
      timestamp: "desc"
    }
  });
  const weeklySummary = await generateWeeklySummary(events, user);
  const focus = buildFocusInsights(events, user);

  return {
    user,
    sync,
    syncError,
    events,
    weeklySummary,
    focus
  };
}

export async function getTimelineData(range: TimelineRange) {
  const user = await requireUser();
  const { sync, syncError } = await syncGitHubSafely(user.id);

  const events = await prisma.event.findMany({
    where: {
      userId: user.id,
      timestamp: {
        gte: getRangeStart(range)
      }
    },
    orderBy: {
      timestamp: "desc"
    }
  });

  return {
    user,
    sync,
    events,
    syncError,
    summary: buildNarrativeSummary(events)
  };
}

export async function getFocusData() {
  const user = await requireUser();
  const { sync, syncError } = await syncGitHubSafely(user.id);

  const events = await prisma.event.findMany({
    where: {
      userId: user.id,
      timestamp: {
        gte: getRangeStart("week")
      }
    },
    orderBy: {
      timestamp: "desc"
    }
  });

  return {
    user,
    sync,
    syncError,
    focus: buildFocusInsights(events, user)
  };
}

export async function getRepositoriesData() {
  const user = await requireUser();
  const { sync, syncError } = await syncGitHubSafely(user.id);

  return { user, sync, syncError };
}

export async function getIntegrationData() {
  const session = await getAuthSession();
  const user = session?.user?.id
    ? await prisma.user.findUnique({
        where: {
          id: session.user.id
        }
      })
    : null;
  const githubAccount = user
    ? await prisma.account.findFirst({
        where: {
          userId: user.id,
          provider: "github"
        }
      })
    : null;

  return {
    user,
    githubConnected: Boolean(githubAccount?.access_token),
    githubConfigured: hasGitHubOAuthConfig(),
    openAiConfigured: hasOpenAIConfig(),
    authConfigured: hasAuthSecret()
  };
}

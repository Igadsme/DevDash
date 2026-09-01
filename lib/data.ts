import { redirect } from "next/navigation";

import { buildFocusInsights, buildNarrativeSummary, getRangeStart, type TimelineRange } from "@/lib/analytics";
import { getAuthSession } from "@/lib/auth";
import { syncGitHubData } from "@/lib/github";
import { generateWeeklySummary } from "@/lib/openai";
import { prisma } from "@/lib/prisma";
import { hasAuthSecret, hasGitHubOAuthConfig, hasOpenAIConfig } from "@/lib/config";

async function syncGitHubSafely(userId: string) {
  try {
    return { sync: await syncGitHubData(userId), syncError: null as string | null };
  } catch (error) {
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
    redirect("/integrations");
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.user.id
    }
  });

  if (!user) {
    redirect("/integrations");
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
  const { syncError } = await syncGitHubSafely(user.id);

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
    events,
    syncError,
    summary: buildNarrativeSummary(events)
  };
}

export async function getFocusData() {
  const user = await requireUser();
  const { syncError } = await syncGitHubSafely(user.id);

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
    syncError,
    focus: buildFocusInsights(events, user)
  };
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

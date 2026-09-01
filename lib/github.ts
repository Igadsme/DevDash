import { subDays } from "date-fns";
import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

const GITHUB_API = "https://api.github.com";

type GitHubSearchResponse<T> = {
  items: T[];
};

type GitHubIssueItem = {
  id: number;
  number: number;
  title: string;
  html_url: string;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  repository_url: string;
  draft?: boolean;
  pull_request?: {
    url: string;
    html_url: string;
    merged_at?: string | null;
  };
  user?: {
    login: string;
  };
};

type GitHubReview = {
  id: number;
  submitted_at: string | null;
  state: string;
  user?: {
    login: string;
  };
  html_url?: string;
};

type GitHubPull = {
  id: number;
  number: number;
  title: string;
  html_url: string;
  additions: number;
  deletions: number;
  changed_files: number;
  draft: boolean;
  created_at: string;
  updated_at: string;
  merged_at: string | null;
  review_comments: number;
  requested_reviewers: Array<{ login: string }>;
  head: {
    sha: string;
  };
  user?: {
    login: string;
  };
};

type GitHubCombinedStatus = {
  state: string;
};

type GitHubUser = {
  login: string;
};

export type ActionItem = {
  id: string;
  kind: "review" | "blocked_pr" | "failing_ci" | "issue";
  repo: string;
  title: string;
  url: string;
  updatedAt: Date;
  urgencyScore: number;
  urgencyReason: string;
  blockedDevelopers: number;
  isSmallPr: boolean;
};

type SyncResult = {
  username: string;
  actionItems: ActionItem[];
};

function getRepoName(repositoryUrl: string) {
  return repositoryUrl.replace(`${GITHUB_API}/repos/`, "");
}

async function githubFetch<T>(accessToken: string, path: string) {
  const response = await fetch(`${GITHUB_API}${path}`, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${accessToken}`,
      "X-GitHub-Api-Version": "2022-11-28"
    },
    next: {
      revalidate: 0
    }
  });

  if (!response.ok) {
    throw new Error(`GitHub request failed (${response.status}) for ${path}`);
  }

  return (await response.json()) as T;
}

async function getGitHubAccount(userId: string) {
  return prisma.account.findFirst({
    where: {
      userId,
      provider: "github"
    }
  });
}

function calculateUrgencyScore(input: {
  isCiFailing: boolean;
  updatedAt: Date;
  blockedDevelopers: number;
  isSmallPr: boolean;
}) {
  let score = 0;
  const reasons: string[] = [];

  if (input.isCiFailing) {
    score += 3;
    reasons.push("CI is failing");
  }

  if (Date.now() - input.updatedAt.getTime() > 24 * 60 * 60 * 1000) {
    score += 2;
    reasons.push("stale for 24h+");
  }

  if (input.blockedDevelopers > 0) {
    score += input.blockedDevelopers;
    reasons.push(`${input.blockedDevelopers} developer(s) waiting`);
  }

  if (input.isSmallPr) {
    score += 1;
    reasons.push("small PR, quick win");
  }

  return {
    urgencyScore: score,
    urgencyReason: reasons.join(" • ") || "Normal priority"
  };
}

async function upsertEvents(userId: string, events: Array<{
  sourceId: string;
  type: string;
  timestamp: Date;
  repo: string;
  metadata: Prisma.InputJsonValue;
}>) {
  if (events.length === 0) {
    return;
  }

  await prisma.$transaction(
    events.map((event) =>
      prisma.event.upsert({
        where: {
          userId_sourceId: {
            userId,
            sourceId: event.sourceId
          }
        },
        update: {
          timestamp: event.timestamp,
          metadata: event.metadata,
          repo: event.repo,
          type: event.type
        },
        create: {
          userId,
          ...event
        }
      })
    )
  );
}

export async function syncGitHubData(userId: string): Promise<SyncResult | null> {
  const account = await getGitHubAccount(userId);

  if (!account?.access_token || !account.providerAccountId) {
    return null;
  }

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { smallPrThreshold: true }
  });
  const githubUser = await githubFetch<GitHubUser>(account.access_token, "/user");
  const username = githubUser.login;
  const sevenDaysAgo = subDays(new Date(), 7).toISOString().slice(0, 10);

  const [authoredPrs, reviewRequests, reviewedPrs, assignedIssues] = await Promise.all([
    githubFetch<GitHubSearchResponse<GitHubIssueItem>>(
      account.access_token,
      `/search/issues?q=is:pr+author:${username}+updated:>=${sevenDaysAgo}&sort=updated&order=desc&per_page=20`
    ),
    githubFetch<GitHubSearchResponse<GitHubIssueItem>>(
      account.access_token,
      `/search/issues?q=is:pr+state:open+review-requested:${username}&sort=updated&order=desc&per_page=20`
    ),
    githubFetch<GitHubSearchResponse<GitHubIssueItem>>(
      account.access_token,
      `/search/issues?q=is:pr+reviewed-by:${username}+updated:>=${sevenDaysAgo}&sort=updated&order=desc&per_page=20`
    ),
    githubFetch<GitHubSearchResponse<GitHubIssueItem>>(
      account.access_token,
      `/search/issues?q=is:issue+state:open+assignee:${username}&sort=updated&order=desc&per_page=20`
    )
  ]);

  const authoredDetails = await Promise.all(
    authoredPrs.items.map(async (item) => {
      const repo = getRepoName(item.repository_url);
      const pull = await githubFetch<GitHubPull>(
        account.access_token!,
        `/repos/${repo}/pulls/${item.number}`
      );
      const status = await githubFetch<GitHubCombinedStatus>(
        account.access_token!,
        `/repos/${repo}/commits/${pull.head.sha}/status`
      );

      return {
        repo,
        item,
        pull,
        status
      };
    })
  );

  const reviewDetails = await Promise.all(
    reviewedPrs.items.map(async (item) => {
      const repo = getRepoName(item.repository_url);
      const reviews = await githubFetch<GitHubReview[]>(
        account.access_token!,
        `/repos/${repo}/pulls/${item.number}/reviews`
      );

      return { repo, item, reviews };
    })
  );

  const actionItems: ActionItem[] = [];
  const normalizedEvents: Array<{
    sourceId: string;
    type: string;
    timestamp: Date;
    repo: string;
    metadata: Prisma.InputJsonValue;
  }> = [];

  for (const detail of authoredDetails) {
    const isCiFailing = detail.status.state === "failure";
    const changedLines = detail.pull.additions + detail.pull.deletions;
    const isSmallPr = changedLines <= user.smallPrThreshold;
    const blockedDevelopers = detail.pull.requested_reviewers.length;
    const updatedAt = new Date(detail.pull.updated_at);
    const urgency = calculateUrgencyScore({
      isCiFailing,
      updatedAt,
      blockedDevelopers,
      isSmallPr
    });

    normalizedEvents.push({
      sourceId: `pr-opened-${detail.pull.id}`,
      type: "PR_OPENED",
      timestamp: new Date(detail.pull.created_at),
      repo: detail.repo,
      metadata: {
        number: detail.pull.number,
        title: detail.pull.title,
        url: detail.pull.html_url,
        additions: detail.pull.additions,
        deletions: detail.pull.deletions,
        changedFiles: detail.pull.changed_files
      } as Prisma.InputJsonValue
    });

    if (detail.pull.merged_at) {
      normalizedEvents.push({
        sourceId: `pr-merged-${detail.pull.id}`,
        type: "PR_MERGED",
        timestamp: new Date(detail.pull.merged_at),
        repo: detail.repo,
        metadata: {
          number: detail.pull.number,
          title: detail.pull.title,
          url: detail.pull.html_url
        } as Prisma.InputJsonValue
      });
    }

    if (isCiFailing) {
      normalizedEvents.push({
        sourceId: `ci-failed-${detail.pull.id}-${detail.pull.head.sha}`,
        type: "CI_FAILED",
        timestamp: updatedAt,
        repo: detail.repo,
        metadata: {
          number: detail.pull.number,
          title: detail.pull.title,
          url: detail.pull.html_url
        } as Prisma.InputJsonValue
      });

      actionItems.push({
        id: `failing-ci-${detail.pull.id}`,
        kind: "failing_ci",
        repo: detail.repo,
        title: detail.pull.title,
        url: detail.pull.html_url,
        updatedAt,
        blockedDevelopers,
        isSmallPr,
        ...urgency
      });
    }

    if (blockedDevelopers > 0 || detail.pull.draft) {
      actionItems.push({
        id: `blocked-pr-${detail.pull.id}`,
        kind: "blocked_pr",
        repo: detail.repo,
        title: detail.pull.title,
        url: detail.pull.html_url,
        updatedAt,
        blockedDevelopers,
        isSmallPr,
        ...urgency
      });
    }
  }

  for (const item of reviewRequests.items) {
    const repo = getRepoName(item.repository_url);
    const pull = await githubFetch<GitHubPull>(account.access_token!, `/repos/${repo}/pulls/${item.number}`);
    const isSmallPr = pull.additions + pull.deletions <= user.smallPrThreshold;
    const urgency = calculateUrgencyScore({
      isCiFailing: false,
      updatedAt: new Date(pull.updated_at),
      blockedDevelopers: 1,
      isSmallPr
    });

    actionItems.push({
      id: `review-${item.id}`,
      kind: "review",
      repo,
      title: item.title,
      url: item.html_url,
      updatedAt: new Date(pull.updated_at),
      blockedDevelopers: 1,
      isSmallPr,
      ...urgency
    });
  }

  for (const detail of reviewDetails) {
    const latestReview = detail.reviews
      .filter((review) => review.user?.login === username && review.submitted_at)
      .sort((a, b) => new Date(b.submitted_at!).getTime() - new Date(a.submitted_at!).getTime())[0];

    if (!latestReview?.submitted_at) {
      continue;
    }

    normalizedEvents.push({
      sourceId: `pr-reviewed-${latestReview.id}`,
      type: "PR_REVIEWED",
      timestamp: new Date(latestReview.submitted_at),
      repo: detail.repo,
      metadata: {
        number: detail.item.number,
        title: detail.item.title,
        url: detail.item.html_url,
        reviewState: latestReview.state
      } as Prisma.InputJsonValue
    });
  }

  for (const issue of assignedIssues.items) {
    const repo = getRepoName(issue.repository_url);
    const updatedAt = new Date(issue.updated_at);
    const urgency = calculateUrgencyScore({
      isCiFailing: false,
      updatedAt,
      blockedDevelopers: 1,
      isSmallPr: false
    });

    normalizedEvents.push({
      sourceId: `issue-assigned-${issue.id}`,
      type: "ISSUE_ASSIGNED",
      timestamp: new Date(issue.created_at),
      repo,
      metadata: {
        number: issue.number,
        title: issue.title,
        url: issue.html_url
      } as Prisma.InputJsonValue
    });

    actionItems.push({
      id: `issue-${issue.id}`,
      kind: "issue",
      repo,
      title: issue.title,
      url: issue.html_url,
      updatedAt,
      blockedDevelopers: 1,
      isSmallPr: false,
      ...urgency
    });
  }

  await upsertEvents(userId, normalizedEvents);

  return {
    username,
    actionItems: actionItems.sort((a, b) => b.urgencyScore - a.urgencyScore)
  };
}

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

type GitHubRepository = {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  private: boolean;
  fork: boolean;
  archived: boolean;
  language: string | null;
  default_branch: string;
  updated_at: string;
  pushed_at: string | null;
  owner: {
    login: string;
    type: string;
    avatar_url: string;
  };
};

type GitHubCommit = {
  sha: string;
  html_url: string;
  author?: { login: string } | null;
  commit: {
    message: string;
    author: { name: string; date: string } | null;
    committer: { date: string } | null;
  };
};

export type RepositorySummary = {
  id: number;
  name: string;
  fullName: string;
  url: string;
  description: string | null;
  private: boolean;
  fork: boolean;
  archived: boolean;
  language: string | null;
  defaultBranch: string;
  updatedAt: Date;
  pushedAt: Date | null;
  workspace: string;
};

export type WorkspaceSummary = {
  login: string;
  kind: "personal" | "organization";
  repositoryCount: number;
};

export type CommitSummary = {
  sha: string;
  shortSha: string;
  title: string;
  url: string;
  repo: string;
  timestamp: Date;
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

export type SyncResult = {
  username: string;
  actionItems: ActionItem[];
  repositories: RepositorySummary[];
  workspaces: WorkspaceSummary[];
  recentCommits: CommitSummary[];
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
    cache: "no-store"
  });

  if (response.status === 409) {
    return [] as T;
  }

  if (!response.ok) {
    const requestId = response.headers.get("x-github-request-id");
    throw new Error(`GitHub request failed (${response.status}) for ${path}${requestId ? ` [${requestId}]` : ""}`);
  }

  return (await response.json()) as T;
}

async function fetchAllPages<T>(accessToken: string, path: string, maxPages = 10) {
  const results: T[] = [];

  for (let page = 1; page <= maxPages; page += 1) {
    const separator = path.includes("?") ? "&" : "?";
    const items = await githubFetch<T[]>(accessToken, `${path}${separator}per_page=100&page=${page}`);
    results.push(...items);

    if (items.length < 100) {
      break;
    }
  }

  return results;
}

async function mapInBatches<T, R>(items: T[], batchSize: number, mapper: (item: T) => Promise<R>) {
  const results: R[] = [];

  for (let index = 0; index < items.length; index += batchSize) {
    results.push(...await Promise.all(items.slice(index, index + batchSize).map(mapper)));
  }

  return results;
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
  const thirtyDaysAgo = subDays(new Date(), 30);

  const githubRepositories = await fetchAllPages<GitHubRepository>(
    account.access_token,
    "/user/repos?visibility=all&affiliation=owner,collaborator,organization_member&sort=pushed&direction=desc",
    20
  );

  const repositories: RepositorySummary[] = githubRepositories.map((repo) => ({
    id: repo.id,
    name: repo.name,
    fullName: repo.full_name,
    url: repo.html_url,
    description: repo.description,
    private: repo.private,
    fork: repo.fork,
    archived: repo.archived,
    language: repo.language,
    defaultBranch: repo.default_branch,
    updatedAt: new Date(repo.updated_at),
    pushedAt: repo.pushed_at ? new Date(repo.pushed_at) : null,
    workspace: repo.owner.login
  }));

  const workspaceCounts = new Map<string, number>();
  const workspaceKinds = new Map<string, WorkspaceSummary["kind"]>();
  workspaceCounts.set(username, 0);
  workspaceKinds.set(username, "personal");
  for (const repo of githubRepositories) {
    workspaceCounts.set(repo.owner.login, (workspaceCounts.get(repo.owner.login) ?? 0) + 1);
    workspaceKinds.set(repo.owner.login, repo.owner.type === "Organization" ? "organization" : "personal");
  }
  const workspaces: WorkspaceSummary[] = [...workspaceCounts.entries()]
    .map(([login, repositoryCount]) => ({
      login,
      kind: workspaceKinds.get(login) ?? "personal",
      repositoryCount
    }))
    .sort((a, b) => Number(a.kind === "organization") - Number(b.kind === "organization") || a.login.localeCompare(b.login));

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

  const repositoriesWithRecentPushes = githubRepositories.filter((repo) => {
    return !repo.archived && repo.pushed_at && new Date(repo.pushed_at) >= thirtyDaysAgo;
  });
  const commitGroups = await mapInBatches(repositoriesWithRecentPushes, 6, async (repo) => {
    const repoPath = repo.full_name.split("/").map(encodeURIComponent).join("/");
    const query = new URLSearchParams({
      author: username,
      since: thirtyDaysAgo.toISOString(),
      per_page: "100"
    });

    try {
      const commits = await githubFetch<GitHubCommit[]>(account.access_token!, `/repos/${repoPath}/commits?${query}`);
      return commits.map((commit): CommitSummary | null => {
        const date = commit.commit.author?.date ?? commit.commit.committer?.date;
        if (!date) return null;
        return {
          sha: commit.sha,
          shortSha: commit.sha.slice(0, 7),
          title: commit.commit.message.split("\n")[0] || "Commit",
          url: commit.html_url,
          repo: repo.full_name,
          timestamp: new Date(date)
        };
      }).filter((commit): commit is CommitSummary => Boolean(commit));
    } catch (error) {
      console.warn(`Could not read commits for ${repo.full_name}.`, error);
      return [];
    }
  });
  const recentCommits = commitGroups.flat().sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  for (const commit of recentCommits) {
    normalizedEvents.push({
      sourceId: `commit-${commit.sha}`,
      type: "COMMIT",
      timestamp: commit.timestamp,
      repo: commit.repo,
      metadata: {
        sha: commit.sha,
        title: commit.title,
        url: commit.url
      } as Prisma.InputJsonValue
    });
  }

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
    actionItems: actionItems.sort((a, b) => b.urgencyScore - a.urgencyScore),
    repositories,
    workspaces,
    recentCommits
  };
}

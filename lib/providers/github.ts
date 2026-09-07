import type { Provider } from "@prisma/client";
import { requestJson, type ProviderFetch } from "@/lib/providers/http";
import type {
  NormalizedPipeline,
  NormalizedIssue,
  NormalizedCommit,
  NormalizedCommitChecks,
  NormalizedReview,
  NormalizedPullRequest,
  NormalizedRepository,
  ProviderPage,
  ProviderRequest,
  SourceControlAdapter,
} from "@/lib/providers/types";

type GitHubRepository = {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  default_branch: string;
  language: string | null;
  private: boolean;
  fork: boolean;
  archived: boolean;
  pushed_at: string | null;
  owner: { id: number };
};
type GitHubPull = {
  id: number;
  number: number;
  title: string;
  html_url: string;
  state: "open" | "closed";
  draft: boolean;
  merged_at: string | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
  additions?: number;
  deletions?: number;
  changed_files?: number;
  mergeable?: boolean | null;
  mergeable_state?: string;
  user: { login: string };
  head: { ref: string; sha: string };
  base: { ref: string };
  requested_reviewers?: Array<{ login: string }>;
};
type GitHubRun = {
  id: number;
  name: string;
  html_url: string;
  status: string;
  conclusion: string | null;
  head_branch: string | null;
  head_sha: string;
  actor?: { login: string };
  run_started_at: string | null;
  updated_at: string;
  repository: { id: number };
};
type GitHubIssue = {
  id: number;
  number: number;
  title: string;
  body: string | null;
  html_url: string;
  state: "open" | "closed";
  user: { login: string } | null;
  assignees?: Array<{ login: string }>;
  labels?: Array<string | { name?: string }>;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  pull_request?: unknown;
};
type GitHubCommit = {
  sha: string;
  html_url: string;
  commit: { message: string; author: { name: string; date: string } | null };
  author: { login: string } | null;
};
type GitHubReview = {
  id: number;
  user: { login: string };
  state: string;
  body: string | null;
  submitted_at: string | null;
};
type GitHubCombinedStatus = {
  statuses: Array<{
    id: number;
    context: string;
    state: string;
    target_url: string | null;
    description: string | null;
    created_at: string;
    updated_at: string;
  }>;
};
type GitHubCheckRuns = {
  check_runs: Array<{
    id: number;
    name: string;
    html_url: string | null;
    status: string;
    conclusion: string | null;
    started_at: string | null;
    completed_at: string | null;
  }>;
};

function nextLink(header: string | null) {
  const match = header
    ?.split(",")
    .find((part) => part.includes('rel="next"'))
    ?.match(/<([^>]+)>/);
  return match?.[1] ?? null;
}

function githubRateLimit(response: Response) {
  const remaining = Number(response.headers.get("x-ratelimit-remaining"));
  const reset = Number(response.headers.get("x-ratelimit-reset"));
  return {
    remaining: Number.isFinite(remaining) ? remaining : null,
    resetAt: Number.isFinite(reset) ? new Date(reset * 1_000) : null,
  };
}

export function mapGitHubRepository(
  item: GitHubRepository,
): NormalizedRepository {
  return {
    providerId: String(item.id),
    provider: "GITHUB" as Provider,
    workspaceProviderId: String(item.owner.id),
    name: item.name,
    fullName: item.full_name,
    description: item.description,
    url: item.html_url,
    defaultBranch: item.default_branch,
    language: item.language,
    isPrivate: item.private,
    isFork: item.fork,
    isArchived: item.archived,
    pushedAt: item.pushed_at ? new Date(item.pushed_at) : null,
  };
}

export function mapGitHubPullRequest(
  item: GitHubPull,
  repositoryProviderId = "",
): NormalizedPullRequest {
  return {
    providerId: String(item.id),
    repositoryProviderId,
    number: item.number,
    title: item.title,
    url: item.html_url,
    state: item.merged_at
      ? "MERGED"
      : item.state === "open"
        ? "OPEN"
        : "CLOSED",
    isDraft: item.draft,
    authorLogin: item.user.login,
    headBranch: item.head.ref,
    baseBranch: item.base.ref,
    headSha: item.head.sha,
    additions: item.additions ?? 0,
    deletions: item.deletions ?? 0,
    changedFiles: item.changed_files ?? 0,
    mergeable: item.mergeable ?? null,
    mergeConflict: item.mergeable_state === "dirty",
    requestedReviewers: (item.requested_reviewers ?? []).map(
      (reviewer) => reviewer.login,
    ),
    createdAt: new Date(item.created_at),
    updatedAt: new Date(item.updated_at),
    mergedAt: item.merged_at ? new Date(item.merged_at) : null,
    closedAt: item.closed_at ? new Date(item.closed_at) : null,
  };
}

export function mapGitHubPipeline(item: GitHubRun): NormalizedPipeline {
  const status =
    item.status === "queued"
      ? "QUEUED"
      : item.status === "in_progress"
        ? "RUNNING"
        : item.conclusion === "success"
          ? "SUCCESS"
          : item.conclusion === "failure" || item.conclusion === "timed_out"
            ? "FAILED"
            : item.conclusion === "cancelled"
              ? "CANCELED"
              : item.conclusion === "skipped"
                ? "SKIPPED"
                : "UNKNOWN";
  return {
    providerId: String(item.id),
    repositoryProviderId: String(item.repository.id),
    name: item.name,
    url: item.html_url,
    status,
    branch: item.head_branch,
    commitSha: item.head_sha,
    actor: item.actor?.login ?? null,
    startedAt: item.run_started_at ? new Date(item.run_started_at) : null,
    completedAt: item.status === "completed" ? new Date(item.updated_at) : null,
  };
}

function mapGitHubIssue(
  item: GitHubIssue,
  repositoryProviderId: string,
): NormalizedIssue {
  return {
    providerId: String(item.id),
    repositoryProviderId,
    number: item.number,
    title: item.title,
    body: item.body,
    url: item.html_url,
    state: item.state === "open" ? "OPEN" : "CLOSED",
    authorLogin: item.user?.login ?? null,
    assignees: (item.assignees ?? []).map((value) => value.login),
    labels: (item.labels ?? [])
      .map((value) => (typeof value === "string" ? value : (value.name ?? "")))
      .filter(Boolean),
    createdAt: new Date(item.created_at),
    updatedAt: new Date(item.updated_at),
    closedAt: item.closed_at ? new Date(item.closed_at) : null,
  };
}

function mapGitHubCommit(
  item: GitHubCommit,
  repositoryProviderId: string,
): NormalizedCommit {
  const [title, ...rest] = item.commit.message.split("\n");
  return {
    providerId: item.sha,
    repositoryProviderId,
    sha: item.sha,
    title: title || item.sha.slice(0, 7),
    message: rest.join("\n") || null,
    url: item.html_url,
    authorLogin: item.author?.login ?? null,
    authorName: item.commit.author?.name ?? null,
    committedAt: new Date(item.commit.author?.date ?? 0),
  };
}

function mapGitHubReview(
  item: GitHubReview,
  repositoryProviderId: string,
  pullRequestProviderId: string,
): NormalizedReview {
  const states: Record<string, NormalizedReview["state"]> = {
    APPROVED: "APPROVED",
    CHANGES_REQUESTED: "CHANGES_REQUESTED",
    COMMENTED: "COMMENTED",
    DISMISSED: "DISMISSED",
    PENDING: "PENDING",
  };
  return {
    providerId: String(item.id),
    repositoryProviderId,
    pullRequestProviderId,
    reviewerLogin: item.user.login,
    state: states[item.state] ?? "COMMENTED",
    body: item.body,
    requestedAt: null,
    submittedAt: item.submitted_at ? new Date(item.submitted_at) : null,
  };
}

export class GitHubAdapter implements SourceControlAdapter {
  readonly provider = "GITHUB" as Provider;
  constructor(
    private readonly token: string,
    private readonly fetcher: ProviderFetch = fetch,
  ) {}
  private headers() {
    return {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${this.token}`,
      "X-GitHub-Api-Version": "2022-11-28",
    };
  }
  async listRepositories(
    request: ProviderRequest,
  ): Promise<ProviderPage<NormalizedRepository>> {
    const url =
      request.cursor ??
      `https://api.github.com/installation/repositories?per_page=100`;
    const { response, data } = await requestJson<{
      repositories: GitHubRepository[];
    }>(this.fetcher, url, { headers: this.headers() });
    return {
      items: data.repositories.map(mapGitHubRepository),
      nextCursor: nextLink(response.headers.get("link")),
      rateLimit: githubRateLimit(response),
    };
  }
  async listPullRequests(
    request: ProviderRequest,
  ): Promise<ProviderPage<NormalizedPullRequest>> {
    const [repositoryProviderId, fullName] = request.path.split(":", 2);
    if (!repositoryProviderId || !fullName)
      throw new Error("GitHub repository context is required.");
    const url =
      request.cursor ??
      `https://api.github.com/repos/${encodeURIComponent(fullName.split("/")[0] ?? "")}/${encodeURIComponent(fullName.split("/")[1] ?? "")}/pulls?state=all&sort=updated&direction=desc&per_page=100`;
    const { response, data } = await requestJson<GitHubPull[]>(
      this.fetcher,
      url,
      { headers: this.headers() },
    );
    return {
      items: data
        .filter(
          (item) =>
            !request.since || new Date(item.updated_at) >= request.since,
        )
        .map((item) => mapGitHubPullRequest(item, repositoryProviderId)),
      nextCursor: nextLink(response.headers.get("link")),
      rateLimit: githubRateLimit(response),
    };
  }
  async listPipelines(
    request: ProviderRequest,
  ): Promise<ProviderPage<NormalizedPipeline>> {
    const [repositoryProviderId, fullName] = request.path.split(":", 2);
    if (!repositoryProviderId || !fullName)
      throw new Error("GitHub repository context is required.");
    const url =
      request.cursor ??
      `https://api.github.com/repos/${encodeURIComponent(fullName.split("/")[0] ?? "")}/${encodeURIComponent(fullName.split("/")[1] ?? "")}/actions/runs?per_page=100`;
    const { response, data } = await requestJson<{
      workflow_runs: GitHubRun[];
    }>(this.fetcher, url, { headers: this.headers() });
    for (const item of data.workflow_runs)
      item.repository = { id: Number(repositoryProviderId) };
    return {
      items: (data.workflow_runs ?? []).map(mapGitHubPipeline),
      nextCursor: nextLink(response.headers.get("link")),
      rateLimit: githubRateLimit(response),
    };
  }
  async listIssues(
    request: ProviderRequest,
  ): Promise<ProviderPage<NormalizedIssue>> {
    const [repositoryProviderId, fullName] = request.path.split(":", 2);
    if (!repositoryProviderId || !fullName)
      throw new Error("GitHub repository context is required.");
    const [owner, repo] = fullName.split("/");
    const url =
      request.cursor ??
      `https://api.github.com/repos/${encodeURIComponent(owner ?? "")}/${encodeURIComponent(repo ?? "")}/issues?state=all&since=${encodeURIComponent((request.since ?? new Date(0)).toISOString())}&per_page=100`;
    const { response, data } = await requestJson<GitHubIssue[]>(
      this.fetcher,
      url,
      { headers: this.headers() },
    );
    return {
      items: data
        .filter((item) => !item.pull_request)
        .map((item) => mapGitHubIssue(item, repositoryProviderId)),
      nextCursor: nextLink(response.headers.get("link")),
      rateLimit: githubRateLimit(response),
    };
  }
  async listCommits(
    request: ProviderRequest,
  ): Promise<ProviderPage<NormalizedCommit>> {
    const [repositoryProviderId, fullName] = request.path.split(":", 2);
    if (!repositoryProviderId || !fullName)
      throw new Error("GitHub repository context is required.");
    const [owner, repo] = fullName.split("/");
    const url =
      request.cursor ??
      `https://api.github.com/repos/${encodeURIComponent(owner ?? "")}/${encodeURIComponent(repo ?? "")}/commits?since=${encodeURIComponent((request.since ?? new Date(0)).toISOString())}&per_page=100`;
    const { response, data } = await requestJson<GitHubCommit[]>(
      this.fetcher,
      url,
      { headers: this.headers() },
    );
    return {
      items: data.map((item) => mapGitHubCommit(item, repositoryProviderId)),
      nextCursor: nextLink(response.headers.get("link")),
      rateLimit: githubRateLimit(response),
    };
  }
  async listReviews(
    request: ProviderRequest,
  ): Promise<ProviderPage<NormalizedReview>> {
    const [repositoryProviderId, fullName, pullRequestProviderId, number] =
      request.path.split(":", 4);
    if (!repositoryProviderId || !fullName || !pullRequestProviderId || !number)
      throw new Error("GitHub pull-request context is required.");
    const [owner, repo] = fullName.split("/");
    const url =
      request.cursor ??
      `https://api.github.com/repos/${encodeURIComponent(owner ?? "")}/${encodeURIComponent(repo ?? "")}/pulls/${encodeURIComponent(number)}/reviews?per_page=100`;
    const { response, data } = await requestJson<GitHubReview[]>(
      this.fetcher,
      url,
      { headers: this.headers() },
    );
    return {
      items: data.map((item) =>
        mapGitHubReview(item, repositoryProviderId, pullRequestProviderId),
      ),
      nextCursor: nextLink(response.headers.get("link")),
      rateLimit: githubRateLimit(response),
    };
  }
  async getCommitChecks(
    request: ProviderRequest,
  ): Promise<NormalizedCommitChecks> {
    const [repositoryProviderId, fullName, sha] = request.path.split(":", 3);
    if (!repositoryProviderId || !fullName || !sha)
      throw new Error("GitHub commit context is required.");
    const [owner, repo] = fullName.split("/");
    const prefix = `https://api.github.com/repos/${encodeURIComponent(owner ?? "")}/${encodeURIComponent(repo ?? "")}/commits/${encodeURIComponent(sha)}`;
    const [statuses, checks] = await Promise.all([
      requestJson<GitHubCombinedStatus>(this.fetcher, `${prefix}/status`, {
        headers: this.headers(),
      }),
      requestJson<GitHubCheckRuns>(
        this.fetcher,
        `${prefix}/check-runs?per_page=100`,
        { headers: this.headers() },
      ),
    ]);
    const mapStatus = (
      status: string,
      conclusion?: string | null,
    ): NormalizedCommitChecks["jobs"][number]["status"] => {
      if (status === "queued" || status === "pending") return "QUEUED";
      if (status === "in_progress") return "RUNNING";
      if (conclusion === "success" || status === "success") return "SUCCESS";
      if (conclusion === "cancelled") return "CANCELED";
      if (conclusion === "skipped") return "SKIPPED";
      if (
        conclusion === "failure" ||
        conclusion === "timed_out" ||
        status === "failure" ||
        status === "error"
      )
        return "FAILED";
      return "UNKNOWN";
    };
    const jobs: NormalizedCommitChecks["jobs"] = [
      ...statuses.data.statuses.map((item) => ({
        providerId: `status-${item.id}`,
        name: item.context,
        url: item.target_url,
        status: mapStatus(item.state),
        conclusion: item.description,
        startedAt: new Date(item.created_at),
        completedAt: ["success", "failure", "error"].includes(item.state)
          ? new Date(item.updated_at)
          : null,
      })),
      ...checks.data.check_runs.map((item) => ({
        providerId: `check-${item.id}`,
        name: item.name,
        url: item.html_url,
        status: mapStatus(item.status, item.conclusion),
        conclusion: item.conclusion,
        startedAt: item.started_at ? new Date(item.started_at) : null,
        completedAt: item.completed_at ? new Date(item.completed_at) : null,
      })),
    ];
    const states = jobs.map((job) => job.status);
    const status: NormalizedCommitChecks["status"] = states.includes("FAILED")
      ? "FAILED"
      : states.includes("RUNNING")
        ? "RUNNING"
        : states.includes("QUEUED")
          ? "QUEUED"
          : states.length > 0 &&
              states.every(
                (value) => value === "SUCCESS" || value === "SKIPPED",
              )
            ? "SUCCESS"
            : "UNKNOWN";
    return { repositoryProviderId, sha, status, jobs };
  }
}

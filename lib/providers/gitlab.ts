import type { Provider } from "@prisma/client";
import { requestJson, type ProviderFetch } from "@/lib/providers/http";
import type {
  NormalizedPipeline,
  NormalizedIssue,
  NormalizedCommit,
  NormalizedReview,
  ProviderPage,
  NormalizedPullRequest,
  NormalizedRepository,
  ProviderRequest,
  SourceControlAdapter,
} from "@/lib/providers/types";

type GitLabProject = {
  id: number;
  name: string;
  path_with_namespace: string;
  description: string | null;
  web_url: string;
  default_branch: string | null;
  visibility: string;
  archived: boolean;
  forked_from_project?: unknown;
  last_activity_at: string;
  namespace: { id: number };
};
type GitLabMergeRequest = {
  id: number;
  iid: number;
  project_id: number;
  title: string;
  web_url: string;
  state: string;
  draft: boolean;
  author: { username: string };
  source_branch: string;
  target_branch: string;
  sha: string;
  created_at: string;
  updated_at: string;
  merged_at: string | null;
  closed_at: string | null;
  reviewers?: Array<{ username: string }>;
};
type GitLabPipeline = {
  id: number;
  project_id: number;
  name?: string;
  web_url: string;
  status: string;
  ref: string;
  sha: string;
  created_at: string;
  updated_at: string;
  user?: { username: string };
};
type GitLabIssue = {
  id: number;
  iid: number;
  project_id: number;
  title: string;
  description: string | null;
  web_url: string;
  state: string;
  author?: { username: string };
  assignees?: Array<{ username: string }>;
  labels?: string[];
  created_at: string;
  updated_at: string;
  closed_at: string | null;
};
type GitLabCommit = {
  id: string;
  short_id: string;
  title: string;
  message: string;
  web_url: string;
  author_name: string;
  authored_date: string;
};
type GitLabApprovals = {
  approved_by?: Array<{ user: { id: number; username: string } }>;
};
const emptyRateLimit = { remaining: null, resetAt: null };

export function mapGitLabProject(item: GitLabProject): NormalizedRepository {
  return {
    providerId: String(item.id),
    provider: "GITLAB" as Provider,
    workspaceProviderId: String(item.namespace.id),
    name: item.name,
    fullName: item.path_with_namespace,
    description: item.description,
    url: item.web_url,
    defaultBranch: item.default_branch ?? "main",
    language: null,
    isPrivate: item.visibility === "private",
    isFork: Boolean(item.forked_from_project),
    isArchived: item.archived,
    pushedAt: new Date(item.last_activity_at),
  };
}
export function mapGitLabMergeRequest(
  item: GitLabMergeRequest,
): NormalizedPullRequest {
  return {
    providerId: String(item.id),
    repositoryProviderId: String(item.project_id),
    number: item.iid,
    title: item.title,
    url: item.web_url,
    state:
      item.state === "merged"
        ? "MERGED"
        : item.state === "opened"
          ? "OPEN"
          : "CLOSED",
    isDraft: item.draft,
    authorLogin: item.author.username,
    headBranch: item.source_branch,
    baseBranch: item.target_branch,
    headSha: item.sha,
    additions: 0,
    deletions: 0,
    changedFiles: 0,
    mergeable: null,
    mergeConflict: null,
    requestedReviewers: (item.reviewers ?? []).map(
      (reviewer) => reviewer.username,
    ),
    createdAt: new Date(item.created_at),
    updatedAt: new Date(item.updated_at),
    mergedAt: item.merged_at ? new Date(item.merged_at) : null,
    closedAt: item.closed_at ? new Date(item.closed_at) : null,
  };
}
export function mapGitLabPipeline(item: GitLabPipeline): NormalizedPipeline {
  const states: Record<string, NormalizedPipeline["status"]> = {
    pending: "QUEUED",
    running: "RUNNING",
    success: "SUCCESS",
    failed: "FAILED",
    canceled: "CANCELED",
    skipped: "SKIPPED",
  };
  return {
    providerId: String(item.id),
    repositoryProviderId: String(item.project_id),
    name: item.name ?? `Pipeline #${item.id}`,
    url: item.web_url,
    status: states[item.status] ?? "UNKNOWN",
    branch: item.ref,
    commitSha: item.sha,
    actor: item.user?.username ?? null,
    startedAt: new Date(item.created_at),
    completedAt: ["success", "failed", "canceled", "skipped"].includes(
      item.status,
    )
      ? new Date(item.updated_at)
      : null,
  };
}

export class GitLabAdapter implements SourceControlAdapter {
  readonly provider = "GITLAB" as Provider;
  constructor(
    private readonly token: string,
    private readonly fetcher: ProviderFetch = fetch,
    private readonly baseUrl = "https://gitlab.com/api/v4",
  ) {}
  private headers() {
    return { Authorization: `Bearer ${this.token}` };
  }
  private async page<T>(path: string, cursor: string | null | undefined) {
    const url =
      cursor ??
      `${this.baseUrl}${path}${path.includes("?") ? "&" : "?"}per_page=100`;
    const { response, data } = await requestJson<T[]>(this.fetcher, url, {
      headers: this.headers(),
    });
    const nextPage = response.headers.get("x-next-page");
    return {
      data,
      nextCursor: nextPage
        ? `${this.baseUrl}${path}${path.includes("?") ? "&" : "?"}per_page=100&page=${nextPage}`
        : null,
    };
  }
  async listRepositories(request: ProviderRequest) {
    const page = await this.page<GitLabProject>(
      "/projects?membership=true&order_by=last_activity_at",
      request.cursor,
    );
    return {
      items: page.data.map(mapGitLabProject),
      nextCursor: page.nextCursor,
      rateLimit: emptyRateLimit,
    };
  }
  async listPullRequests(request: ProviderRequest) {
    const [projectId] = request.path.split(":", 1);
    if (!projectId) throw new Error("GitLab project context is required.");
    const page = await this.page<GitLabMergeRequest>(
      `/projects/${encodeURIComponent(projectId)}/merge_requests?scope=all&updated_after=${(request.since ?? new Date(0)).toISOString()}`,
      request.cursor,
    );
    return {
      items: page.data.map(mapGitLabMergeRequest),
      nextCursor: page.nextCursor,
      rateLimit: emptyRateLimit,
    };
  }
  async listPipelines(request: ProviderRequest) {
    const [projectId] = request.path.split(":", 1);
    if (!projectId) throw new Error("GitLab project context is required.");
    const page = await this.page<GitLabPipeline>(
      `/projects/${encodeURIComponent(projectId)}/pipelines?updated_after=${(request.since ?? new Date(0)).toISOString()}`,
      request.cursor,
    );
    return {
      items: page.data.map((item) =>
        mapGitLabPipeline({ ...item, project_id: Number(projectId) }),
      ),
      nextCursor: page.nextCursor,
      rateLimit: emptyRateLimit,
    };
  }
  async listIssues(
    request: ProviderRequest,
  ): Promise<ProviderPage<NormalizedIssue>> {
    const [projectId] = request.path.split(":", 1);
    if (!projectId) throw new Error("GitLab project context is required.");
    const page = await this.page<GitLabIssue>(
      `/projects/${encodeURIComponent(projectId)}/issues?scope=all&updated_after=${(request.since ?? new Date(0)).toISOString()}`,
      request.cursor,
    );
    return {
      items: page.data.map((item) => ({
        providerId: String(item.id),
        repositoryProviderId: String(item.project_id || projectId),
        number: item.iid,
        title: item.title,
        body: item.description,
        url: item.web_url,
        state: item.state === "opened" ? "OPEN" : "CLOSED",
        authorLogin: item.author?.username ?? null,
        assignees: (item.assignees ?? []).map((value) => value.username),
        labels: item.labels ?? [],
        createdAt: new Date(item.created_at),
        updatedAt: new Date(item.updated_at),
        closedAt: item.closed_at ? new Date(item.closed_at) : null,
      })),
      nextCursor: page.nextCursor,
      rateLimit: emptyRateLimit,
    };
  }
  async listCommits(
    request: ProviderRequest,
  ): Promise<ProviderPage<NormalizedCommit>> {
    const [projectId] = request.path.split(":", 1);
    if (!projectId) throw new Error("GitLab project context is required.");
    const page = await this.page<GitLabCommit>(
      `/projects/${encodeURIComponent(projectId)}/repository/commits?since=${encodeURIComponent((request.since ?? new Date(0)).toISOString())}`,
      request.cursor,
    );
    return {
      items: page.data.map((item) => ({
        providerId: item.id,
        repositoryProviderId: projectId,
        sha: item.id,
        title: item.title || item.short_id,
        message: item.message,
        url: item.web_url,
        authorLogin: null,
        authorName: item.author_name,
        committedAt: new Date(item.authored_date),
      })),
      nextCursor: page.nextCursor,
      rateLimit: emptyRateLimit,
    };
  }
  async listReviews(
    request: ProviderRequest,
  ): Promise<ProviderPage<NormalizedReview>> {
    const [projectId, , pullRequestProviderId, number] = request.path.split(
      ":",
      4,
    );
    if (!projectId || !pullRequestProviderId || !number)
      throw new Error("GitLab merge-request context is required.");
    const { data } = await requestJson<GitLabApprovals>(
      this.fetcher,
      `${this.baseUrl}/projects/${encodeURIComponent(projectId)}/merge_requests/${encodeURIComponent(number)}/approvals`,
      { headers: this.headers() },
    );
    return {
      items: (data.approved_by ?? []).map(({ user }) => ({
        providerId: `approval-${pullRequestProviderId}-${user.id}`,
        repositoryProviderId: projectId,
        pullRequestProviderId,
        reviewerLogin: user.username,
        state: "APPROVED",
        body: null,
        requestedAt: null,
        submittedAt: null,
      })),
      nextCursor: null,
      rateLimit: emptyRateLimit,
    };
  }
}

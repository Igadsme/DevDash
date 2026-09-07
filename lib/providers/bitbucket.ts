import type { Provider } from "@prisma/client";
import { requestJson, type ProviderFetch } from "@/lib/providers/http";
import type {
  NormalizedPipeline,
  NormalizedIssue,
  NormalizedCommit,
  NormalizedReview,
  NormalizedPullRequest,
  NormalizedRepository,
  ProviderPage,
  ProviderRequest,
  SourceControlAdapter,
} from "@/lib/providers/types";

type Page<T> = { values: T[]; next?: string };
type BitbucketRepository = {
  uuid: string;
  name: string;
  full_name: string;
  description?: string;
  links: { html: { href: string } };
  mainbranch?: { name: string };
  language?: string;
  is_private: boolean;
  parent?: unknown;
  updated_on: string;
  workspace: { uuid: string };
};
type BitbucketPull = {
  id: number;
  title: string;
  links: { html: { href: string } };
  state: string;
  author: { display_name: string };
  source: {
    branch: { name: string };
    commit: { hash: string };
    repository: { uuid: string };
  };
  destination: { branch: { name: string } };
  created_on: string;
  updated_on: string;
  closed_on?: string;
  reviewers?: Array<{ display_name: string }>;
};
type BitbucketPipeline = {
  uuid: string;
  build_number: number;
  repository: { uuid: string };
  target?: { ref_name?: string; commit?: { hash: string } };
  state: { name: string; result?: { name: string } };
  creator?: { display_name: string };
  created_on: string;
  completed_on?: string;
  links: { html: { href: string } };
};
type BitbucketIssue = {
  id: number;
  title: string;
  content?: { raw?: string };
  links: { html: { href: string } };
  state: string;
  reporter?: { display_name: string };
  assignee?: { display_name: string };
  kind?: string;
  created_on: string;
  updated_on: string;
};
type BitbucketCommit = {
  hash: string;
  message: string;
  links: { html: { href: string } };
  author?: { raw?: string; user?: { display_name: string; nickname?: string } };
  date: string;
};
type BitbucketActivity = {
  approval?: { user: { uuid: string; display_name: string }; date?: string };
};
const emptyRateLimit = { remaining: null, resetAt: null };

export function mapBitbucketRepository(
  item: BitbucketRepository,
): NormalizedRepository {
  return {
    providerId: item.uuid,
    provider: "BITBUCKET" as Provider,
    workspaceProviderId: item.workspace.uuid,
    name: item.name,
    fullName: item.full_name,
    description: item.description ?? null,
    url: item.links.html.href,
    defaultBranch: item.mainbranch?.name ?? "main",
    language: item.language ?? null,
    isPrivate: item.is_private,
    isFork: Boolean(item.parent),
    isArchived: false,
    pushedAt: new Date(item.updated_on),
  };
}
export function mapBitbucketPullRequest(
  item: BitbucketPull,
): NormalizedPullRequest {
  return {
    providerId: String(item.id),
    repositoryProviderId: item.source.repository.uuid,
    number: item.id,
    title: item.title,
    url: item.links.html.href,
    state:
      item.state === "MERGED"
        ? "MERGED"
        : item.state === "OPEN"
          ? "OPEN"
          : "CLOSED",
    isDraft: false,
    authorLogin: item.author.display_name,
    headBranch: item.source.branch.name,
    baseBranch: item.destination.branch.name,
    headSha: item.source.commit.hash,
    additions: 0,
    deletions: 0,
    changedFiles: 0,
    mergeable: null,
    mergeConflict: null,
    requestedReviewers: (item.reviewers ?? []).map(
      (reviewer) => reviewer.display_name,
    ),
    createdAt: new Date(item.created_on),
    updatedAt: new Date(item.updated_on),
    mergedAt:
      item.state === "MERGED" && item.closed_on
        ? new Date(item.closed_on)
        : null,
    closedAt: item.closed_on ? new Date(item.closed_on) : null,
  };
}
export function mapBitbucketPipeline(
  item: BitbucketPipeline,
): NormalizedPipeline {
  const result = item.state.result?.name;
  const status =
    item.state.name === "PENDING"
      ? "QUEUED"
      : item.state.name === "IN_PROGRESS"
        ? "RUNNING"
        : result === "SUCCESSFUL"
          ? "SUCCESS"
          : result === "FAILED" || result === "ERROR"
            ? "FAILED"
            : result === "STOPPED"
              ? "CANCELED"
              : "UNKNOWN";
  return {
    providerId: item.uuid,
    repositoryProviderId: item.repository.uuid,
    name: `Pipeline #${item.build_number}`,
    url: item.links.html.href,
    status,
    branch: item.target?.ref_name ?? null,
    commitSha: item.target?.commit?.hash ?? null,
    actor: item.creator?.display_name ?? null,
    startedAt: new Date(item.created_on),
    completedAt: item.completed_on ? new Date(item.completed_on) : null,
  };
}

export class BitbucketAdapter implements SourceControlAdapter {
  readonly provider = "BITBUCKET" as Provider;
  constructor(
    private readonly token: string,
    private readonly fetcher: ProviderFetch = fetch,
    private readonly baseUrl = "https://api.bitbucket.org/2.0",
  ) {}
  private headers() {
    return { Authorization: `Bearer ${this.token}` };
  }
  private async page<T>(
    path: string,
    cursor?: string | null,
  ): Promise<ProviderPage<T>> {
    const { data } = await requestJson<Page<T>>(
      this.fetcher,
      cursor ??
        `${this.baseUrl}${path}${path.includes("?") ? "&" : "?"}pagelen=100`,
      { headers: this.headers() },
    );
    return {
      items: data.values,
      nextCursor: data.next ?? null,
      rateLimit: emptyRateLimit,
    };
  }
  async listRepositories(request: ProviderRequest) {
    const page = await this.page<BitbucketRepository>(
      "/repositories?role=member",
      request.cursor,
    );
    return { ...page, items: page.items.map(mapBitbucketRepository) };
  }
  async listPullRequests(request: ProviderRequest) {
    const [, fullName] = request.path.split(":", 2);
    if (!fullName) throw new Error("Bitbucket repository context is required.");
    const page = await this.page<BitbucketPull>(
      `/repositories/${fullName}/pullrequests?state=OPEN`,
      request.cursor,
    );
    return { ...page, items: page.items.map(mapBitbucketPullRequest) };
  }
  async listPipelines(request: ProviderRequest) {
    const [repositoryProviderId, fullName] = request.path.split(":", 2);
    if (!repositoryProviderId || !fullName)
      throw new Error("Bitbucket repository context is required.");
    const page = await this.page<BitbucketPipeline>(
      `/repositories/${fullName}/pipelines/`,
      request.cursor,
    );
    return {
      ...page,
      items: page.items.map((item) =>
        mapBitbucketPipeline({
          ...item,
          repository: { uuid: repositoryProviderId },
        }),
      ),
    };
  }
  async listIssues(
    request: ProviderRequest,
  ): Promise<ProviderPage<NormalizedIssue>> {
    const [repositoryProviderId, fullName] = request.path.split(":", 2);
    if (!repositoryProviderId || !fullName)
      throw new Error("Bitbucket repository context is required.");
    const page = await this.page<BitbucketIssue>(
      `/repositories/${fullName}/issues?sort=-updated_on`,
      request.cursor,
    );
    return {
      ...page,
      items: page.items
        .filter(
          (item) =>
            !request.since || new Date(item.updated_on) >= request.since,
        )
        .map((item) => ({
          providerId: String(item.id),
          repositoryProviderId,
          number: item.id,
          title: item.title,
          body: item.content?.raw ?? null,
          url: item.links.html.href,
          state: ["new", "open", "on hold"].includes(item.state.toLowerCase())
            ? "OPEN"
            : "CLOSED",
          authorLogin: item.reporter?.display_name ?? null,
          assignees: item.assignee ? [item.assignee.display_name] : [],
          labels: item.kind ? [item.kind] : [],
          createdAt: new Date(item.created_on),
          updatedAt: new Date(item.updated_on),
          closedAt: [
            "resolved",
            "closed",
            "invalid",
            "duplicate",
            "wontfix",
          ].includes(item.state.toLowerCase())
            ? new Date(item.updated_on)
            : null,
        })),
    };
  }
  async listCommits(
    request: ProviderRequest,
  ): Promise<ProviderPage<NormalizedCommit>> {
    const [repositoryProviderId, fullName] = request.path.split(":", 2);
    if (!repositoryProviderId || !fullName)
      throw new Error("Bitbucket repository context is required.");
    const page = await this.page<BitbucketCommit>(
      `/repositories/${fullName}/commits`,
      request.cursor,
    );
    return {
      ...page,
      items: page.items
        .filter(
          (item) => !request.since || new Date(item.date) >= request.since,
        )
        .map((item) => {
          const [title, ...body] = item.message.split("\n");
          return {
            providerId: item.hash,
            repositoryProviderId,
            sha: item.hash,
            title: title || item.hash.slice(0, 7),
            message: body.join("\n") || null,
            url: item.links.html.href,
            authorLogin: item.author?.user?.nickname ?? null,
            authorName:
              item.author?.user?.display_name ?? item.author?.raw ?? null,
            committedAt: new Date(item.date),
          };
        }),
    };
  }
  async listReviews(
    request: ProviderRequest,
  ): Promise<ProviderPage<NormalizedReview>> {
    const [repositoryProviderId, fullName, pullRequestProviderId, number] =
      request.path.split(":", 4);
    if (!repositoryProviderId || !fullName || !pullRequestProviderId || !number)
      throw new Error("Bitbucket pull-request context is required.");
    const page = await this.page<BitbucketActivity>(
      `/repositories/${fullName}/pullrequests/${encodeURIComponent(number)}/activity`,
      request.cursor,
    );
    return {
      ...page,
      items: page.items
        .filter((item) => item.approval)
        .map((item) => ({
          providerId: `approval-${pullRequestProviderId}-${item.approval!.user.uuid}`,
          repositoryProviderId,
          pullRequestProviderId,
          reviewerLogin: item.approval!.user.display_name,
          state: "APPROVED",
          body: null,
          requestedAt: null,
          submittedAt: item.approval!.date
            ? new Date(item.approval!.date)
            : null,
        })),
    };
  }
}

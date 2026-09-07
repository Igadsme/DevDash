import type { Provider } from "@prisma/client";

export type ProviderRequest = {
  path: string;
  cursor?: string | null;
  since?: Date | null;
};

export type ProviderPage<T> = {
  items: T[];
  nextCursor: string | null;
  rateLimit: { remaining: number | null; resetAt: Date | null };
};

export type NormalizedRepository = {
  providerId: string;
  provider: Provider;
  workspaceProviderId: string;
  name: string;
  fullName: string;
  description: string | null;
  url: string;
  defaultBranch: string;
  language: string | null;
  isPrivate: boolean;
  isFork: boolean;
  isArchived: boolean;
  pushedAt: Date | null;
};

export type NormalizedPullRequest = {
  providerId: string;
  repositoryProviderId: string;
  number: number;
  title: string;
  url: string;
  state: "OPEN" | "CLOSED" | "MERGED";
  isDraft: boolean;
  authorLogin: string;
  headBranch: string;
  baseBranch: string;
  headSha: string | null;
  additions: number;
  deletions: number;
  changedFiles: number;
  mergeable: boolean | null;
  mergeConflict: boolean | null;
  requestedReviewers: string[];
  createdAt: Date;
  updatedAt: Date;
  mergedAt: Date | null;
  closedAt: Date | null;
};

export type NormalizedPipeline = {
  providerId: string;
  repositoryProviderId: string;
  name: string;
  url: string;
  status:
    | "QUEUED"
    | "RUNNING"
    | "SUCCESS"
    | "FAILED"
    | "CANCELED"
    | "SKIPPED"
    | "UNKNOWN";
  branch: string | null;
  commitSha: string | null;
  actor: string | null;
  startedAt: Date | null;
  completedAt: Date | null;
};

export type NormalizedIssue = {
  providerId: string;
  repositoryProviderId: string;
  number: number;
  title: string;
  body: string | null;
  url: string;
  state: "OPEN" | "CLOSED";
  authorLogin: string | null;
  assignees: string[];
  labels: string[];
  createdAt: Date;
  updatedAt: Date;
  closedAt: Date | null;
};

export type NormalizedCommit = {
  providerId: string;
  repositoryProviderId: string;
  sha: string;
  title: string;
  message: string | null;
  url: string;
  authorLogin: string | null;
  authorName: string | null;
  committedAt: Date;
};

export type NormalizedReview = {
  providerId: string;
  repositoryProviderId: string;
  pullRequestProviderId: string;
  reviewerLogin: string;
  state:
    "PENDING" | "APPROVED" | "CHANGES_REQUESTED" | "COMMENTED" | "DISMISSED";
  body: string | null;
  requestedAt: Date | null;
  submittedAt: Date | null;
};

export type NormalizedCommitChecks = {
  repositoryProviderId: string;
  sha: string;
  status: "QUEUED" | "RUNNING" | "SUCCESS" | "FAILED" | "UNKNOWN";
  jobs: Array<{
    providerId: string;
    name: string;
    url: string | null;
    status:
      | "QUEUED"
      | "RUNNING"
      | "SUCCESS"
      | "FAILED"
      | "CANCELED"
      | "SKIPPED"
      | "UNKNOWN";
    conclusion: string | null;
    startedAt: Date | null;
    completedAt: Date | null;
  }>;
};

export interface SourceControlAdapter {
  readonly provider: Provider;
  listRepositories(
    request: ProviderRequest,
  ): Promise<ProviderPage<NormalizedRepository>>;
  listPullRequests(
    request: ProviderRequest,
  ): Promise<ProviderPage<NormalizedPullRequest>>;
  listPipelines(
    request: ProviderRequest,
  ): Promise<ProviderPage<NormalizedPipeline>>;
  listIssues(request: ProviderRequest): Promise<ProviderPage<NormalizedIssue>>;
  listCommits(
    request: ProviderRequest,
  ): Promise<ProviderPage<NormalizedCommit>>;
  listReviews(
    request: ProviderRequest,
  ): Promise<ProviderPage<NormalizedReview>>;
  getCommitChecks?(request: ProviderRequest): Promise<NormalizedCommitChecks>;
}

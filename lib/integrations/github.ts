import type { AdapterContext, NormalizedEvent, NormalizedRepo, SourceControlAdapter } from "./types";

const GITHUB_API = "https://api.github.com";

async function githubFetch<T>(token: string, path: string): Promise<T> {
  const res = await fetch(`${GITHUB_API}${path}`, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "DevDash",
    },
  });
  if (res.status === 401 || res.status === 403) {
    const body = await res.text();
    if (res.status === 401) {
      throw new Error("GitHub access was revoked. Please reconnect GitHub.");
    }
    if (body.includes("rate limit")) {
      throw new Error("GitHub rate limit reached. Try again later.");
    }
    throw new Error("GitHub denied this request. Check repository permissions.");
  }
  if (!res.ok) {
    throw new Error(`GitHub API error (${res.status})`);
  }
  return res.json() as Promise<T>;
}

async function paginate<T>(token: string, path: string, maxPages = 3): Promise<T[]> {
  const items: T[] = [];
  for (let page = 1; page <= maxPages; page++) {
    const sep = path.includes("?") ? "&" : "?";
    const chunk = await githubFetch<T[]>(token, `${path}${sep}per_page=50&page=${page}`);
    items.push(...chunk);
    if (chunk.length < 50) break;
  }
  return items;
}

type GhRepo = {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  private: boolean;
  default_branch: string;
  language: string | null;
  pushed_at: string;
};

type GhCommit = {
  sha: string;
  html_url: string;
  commit: { message: string; author: { date: string } | null; committer: { date: string } | null };
};

type GhPull = {
  id: number;
  number: number;
  title: string;
  html_url: string;
  state: string;
  draft: boolean;
  merged_at: string | null;
  created_at: string;
  updated_at: string;
  user: { login: string } | null;
  requested_reviewers?: { login: string }[];
};

type GhIssue = {
  id: number;
  number: number;
  title: string;
  html_url: string;
  state: string;
  created_at: string;
  closed_at: string | null;
  pull_request?: unknown;
  user: { login: string } | null;
  assignee: { login: string } | null;
  assignees?: { login: string }[];
  milestone?: { due_on: string | null } | null;
  labels?: { name: string }[];
};

type GhRun = {
  id: number;
  name: string;
  html_url: string;
  status: string;
  conclusion: string | null;
  head_branch: string;
  created_at: string;
  updated_at: string;
  run_started_at?: string;
};

type GhRelease = {
  id: number;
  name: string | null;
  tag_name: string;
  html_url: string;
  published_at: string | null;
  created_at: string;
};

type GhReview = {
  id: number;
  state: string;
  html_url: string;
  submitted_at: string | null;
  user: { login: string } | null;
};

export class GitHubAdapter implements SourceControlAdapter {
  provider = "github" as const;

  async listRepositories(ctx: AdapterContext): Promise<NormalizedRepo[]> {
    const repos = await paginate<GhRepo>(ctx.accessToken, "/user/repos?sort=updated&affiliation=owner,collaborator,organization_member");
    return repos.map((repo) => ({
      provider: "github",
      externalId: String(repo.id),
      name: repo.name,
      fullName: repo.full_name,
      url: repo.html_url,
      private: repo.private,
      defaultBranch: repo.default_branch,
      language: repo.language,
      lastActivityAt: repo.pushed_at ? new Date(repo.pushed_at) : null,
    }));
  }

  async listEvents(ctx: AdapterContext, repos: NormalizedRepo[]): Promise<NormalizedEvent[]> {
    const login = ctx.handle?.replace(/^@/, "") || "";
    const since = ctx.since || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const sinceIso = since.toISOString();
    const selected = repos.slice(0, 20);
    const events: NormalizedEvent[] = [];

    for (const repo of selected) {
      const [owner, name] = repo.fullName.split("/");
      if (!owner || !name) continue;

      try {
        const commits = await githubFetch<GhCommit[]>(
          ctx.accessToken,
          `/repos/${owner}/${name}/commits?author=${encodeURIComponent(login)}&since=${sinceIso}&per_page=40`,
        );
        for (const commit of commits) {
          events.push({
            provider: "github",
            type: "commit",
            repository: repo.fullName,
            title: commit.commit.message.split("\n")[0],
            description: commit.sha.slice(0, 7),
            url: commit.html_url,
            timestamp: new Date(commit.commit.author?.date || commit.commit.committer?.date || Date.now()),
            externalId: commit.sha,
            metadata: { sha: commit.sha },
          });
        }
      } catch {
        // Skip repos the token cannot read.
      }

      try {
        const pulls = await githubFetch<GhPull[]>(
          ctx.accessToken,
          `/repos/${owner}/${name}/pulls?state=all&sort=updated&per_page=30`,
        );
        for (const pr of pulls) {
          const isMine = pr.user?.login === login;
          const requested = pr.requested_reviewers?.some((r) => r.login === login);
          if (!isMine && !requested && new Date(pr.updated_at) < since) continue;
          events.push({
            provider: "github",
            type: "pr",
            repository: repo.fullName,
            title: `${pr.merged_at ? "Merged" : pr.state === "open" ? "Opened" : "Closed"} PR #${pr.number}`,
            description: pr.title,
            url: pr.html_url,
            timestamp: new Date(pr.updated_at || pr.created_at),
            externalId: String(pr.id),
            metadata: {
              number: pr.number,
              state: pr.state,
              merged: Boolean(pr.merged_at),
              draft: pr.draft,
              author: pr.user?.login,
              isAuthor: isMine,
              reviewRequested: requested,
              openedAt: pr.created_at,
              mergedAt: pr.merged_at,
              title: pr.title,
            },
          });

          if (isMine || requested) {
            try {
              const reviews = await githubFetch<GhReview[]>(
                ctx.accessToken,
                `/repos/${owner}/${name}/pulls/${pr.number}/reviews`,
              );
              for (const review of reviews.filter((r) => r.user?.login === login && r.submitted_at)) {
                events.push({
                  provider: "github",
                  type: "review",
                  repository: repo.fullName,
                  title: `Reviewed PR #${pr.number}`,
                  description: pr.title,
                  url: review.html_url,
                  timestamp: new Date(review.submitted_at as string),
                  externalId: String(review.id),
                  metadata: { state: review.state, number: pr.number },
                });
              }
            } catch {
              // ignore review fetch failures
            }
          }
        }
      } catch {
        // ignore
      }

      try {
        const issues = await githubFetch<GhIssue[]>(
          ctx.accessToken,
          `/repos/${owner}/${name}/issues?state=all&since=${sinceIso}&per_page=30`,
        );
        for (const issue of issues) {
          if (issue.pull_request) continue;
          const assigned = issue.assignees?.some((a) => a.login === login) || issue.assignee?.login === login;
          const isAuthor = issue.user?.login === login;
          if (!assigned && !isAuthor) continue;
          events.push({
            provider: "github",
            type: "issue",
            repository: repo.fullName,
            title: `${issue.state === "open" ? "Opened" : "Closed"} issue #${issue.number}`,
            description: issue.title,
            url: issue.html_url,
            timestamp: new Date(issue.closed_at || issue.created_at),
            externalId: String(issue.id),
            metadata: {
              number: issue.number,
              state: issue.state,
              isAssigned: assigned,
              isAuthor,
              milestoneDue: issue.milestone?.due_on,
              labels: issue.labels?.map((l) => l.name) || [],
              openedAt: issue.created_at,
              closedAt: issue.closed_at,
              title: issue.title,
            },
          });
        }
      } catch {
        // ignore
      }

      try {
        const runs = await githubFetch<{ workflow_runs: GhRun[] }>(
          ctx.accessToken,
          `/repos/${owner}/${name}/actions/runs?per_page=20`,
        );
        for (const run of runs.workflow_runs || []) {
          if (new Date(run.created_at) < since) continue;
          events.push({
            provider: "github",
            type: "ci",
            repository: repo.fullName,
            title: `CI ${run.conclusion === "failure" ? "failed" : run.conclusion === "success" ? "passed" : run.status}`,
            description: `${run.name} · ${run.head_branch}`,
            url: run.html_url,
            timestamp: new Date(run.updated_at || run.created_at),
            externalId: String(run.id),
            metadata: {
              name: run.name,
              status: run.status,
              conclusion: run.conclusion,
              branch: run.head_branch,
              startedAt: run.run_started_at || run.created_at,
              completedAt: run.updated_at,
            },
          });
        }
      } catch {
        // ignore
      }

      try {
        const releases = await githubFetch<GhRelease[]>(
          ctx.accessToken,
          `/repos/${owner}/${name}/releases?per_page=10`,
        );
        for (const release of releases) {
          const when = new Date(release.published_at || release.created_at);
          if (when < since) continue;
          events.push({
            provider: "github",
            type: "release",
            repository: repo.fullName,
            title: `Released ${release.name || release.tag_name}`,
            description: release.tag_name,
            url: release.html_url,
            timestamp: when,
            externalId: String(release.id),
          });
        }
      } catch {
        // ignore
      }
    }

    return events;
  }
}

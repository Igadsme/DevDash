import type { AdapterContext, NormalizedEvent, NormalizedRepo, SourceControlAdapter } from "./types";

async function gitlabFetch<T>(token: string, path: string): Promise<T> {
  const res = await fetch(`https://gitlab.com/api/v4${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "User-Agent": "DevDash",
    },
  });
  if (res.status === 401) throw new Error("GitLab access was revoked. Please reconnect GitLab.");
  if (!res.ok) throw new Error(`GitLab API error (${res.status})`);
  return res.json() as Promise<T>;
}

type GlProject = {
  id: number;
  name: string;
  path_with_namespace: string;
  web_url: string;
  visibility: string;
  default_branch: string | null;
  last_activity_at: string;
};

type GlCommit = {
  id: string;
  title: string;
  web_url: string;
  created_at: string;
};

type GlMr = {
  id: number;
  iid: number;
  title: string;
  state: string;
  web_url: string;
  updated_at: string;
  created_at: string;
  merged_at: string | null;
  author: { username: string };
};

type GlIssue = {
  id: number;
  iid: number;
  title: string;
  state: string;
  web_url: string;
  created_at: string;
  closed_at: string | null;
  assignees: { username: string }[];
  author: { username: string };
};

type GlPipeline = {
  id: number;
  status: string;
  ref: string;
  web_url: string;
  updated_at: string;
  created_at: string;
};

export class GitLabAdapter implements SourceControlAdapter {
  provider = "gitlab" as const;

  async listRepositories(ctx: AdapterContext): Promise<NormalizedRepo[]> {
    const projects = await gitlabFetch<GlProject[]>(
      ctx.accessToken,
      "/projects?membership=true&simple=true&order_by=last_activity_at&per_page=50",
    );
    return projects.map((p) => ({
      provider: "gitlab",
      externalId: String(p.id),
      name: p.name,
      fullName: p.path_with_namespace,
      url: p.web_url,
      private: p.visibility !== "public",
      defaultBranch: p.default_branch || "main",
      lastActivityAt: p.last_activity_at ? new Date(p.last_activity_at) : null,
    }));
  }

  async listEvents(ctx: AdapterContext, repos: NormalizedRepo[]): Promise<NormalizedEvent[]> {
    const login = ctx.handle?.replace(/^@/, "") || "";
    const since = ctx.since || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const events: NormalizedEvent[] = [];

    for (const repo of repos.slice(0, 15)) {
      try {
        const commits = await gitlabFetch<GlCommit[]>(
          ctx.accessToken,
          `/projects/${encodeURIComponent(repo.externalId)}/repository/commits?since=${since.toISOString()}&per_page=40`,
        );
        for (const commit of commits) {
          events.push({
            provider: "gitlab",
            type: "commit",
            repository: repo.fullName,
            title: commit.title,
            description: commit.id.slice(0, 8),
            url: commit.web_url,
            timestamp: new Date(commit.created_at),
            externalId: commit.id,
          });
        }
      } catch {
        // skip
      }

      try {
        const mrs = await gitlabFetch<GlMr[]>(
          ctx.accessToken,
          `/projects/${encodeURIComponent(repo.externalId)}/merge_requests?updated_after=${since.toISOString()}&per_page=30`,
        );
        for (const mr of mrs) {
          events.push({
            provider: "gitlab",
            type: "pr",
            repository: repo.fullName,
            title: `${mr.merged_at ? "Merged" : "Opened"} MR !${mr.iid}`,
            description: mr.title,
            url: mr.web_url,
            timestamp: new Date(mr.updated_at),
            externalId: String(mr.id),
            metadata: {
              number: mr.iid,
              state: mr.state,
              merged: Boolean(mr.merged_at),
              isAuthor: mr.author?.username === login,
              title: mr.title,
              openedAt: mr.created_at,
            },
          });
        }
      } catch {
        // skip
      }

      try {
        const issues = await gitlabFetch<GlIssue[]>(
          ctx.accessToken,
          `/projects/${encodeURIComponent(repo.externalId)}/issues?updated_after=${since.toISOString()}&per_page=30`,
        );
        for (const issue of issues) {
          const assigned = issue.assignees?.some((a) => a.username === login);
          events.push({
            provider: "gitlab",
            type: "issue",
            repository: repo.fullName,
            title: `${issue.state === "opened" ? "Opened" : "Closed"} issue #${issue.iid}`,
            description: issue.title,
            url: issue.web_url,
            timestamp: new Date(issue.closed_at || issue.created_at),
            externalId: String(issue.id),
            metadata: {
              number: issue.iid,
              state: issue.state === "opened" ? "open" : issue.state,
              isAssigned: assigned,
              isAuthor: issue.author?.username === login,
              title: issue.title,
            },
          });
        }
      } catch {
        // skip
      }

      try {
        const pipelines = await gitlabFetch<GlPipeline[]>(
          ctx.accessToken,
          `/projects/${encodeURIComponent(repo.externalId)}/pipelines?per_page=20`,
        );
        for (const pipe of pipelines) {
          if (new Date(pipe.created_at) < since) continue;
          events.push({
            provider: "gitlab",
            type: "ci",
            repository: repo.fullName,
            title: `CI ${pipe.status}`,
            description: pipe.ref,
            url: pipe.web_url,
            timestamp: new Date(pipe.updated_at),
            externalId: String(pipe.id),
            metadata: { status: pipe.status, conclusion: pipe.status, branch: pipe.ref },
          });
        }
      } catch {
        // skip
      }
    }

    return events;
  }
}

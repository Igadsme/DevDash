import type { AdapterContext, NormalizedEvent, NormalizedRepo, SourceControlAdapter } from "./types";

async function bitbucketFetch<T>(token: string, path: string): Promise<T> {
  const res = await fetch(`https://api.bitbucket.org/2.0${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "User-Agent": "DevDash",
    },
  });
  if (res.status === 401) throw new Error("Bitbucket access was revoked. Please reconnect Bitbucket.");
  if (!res.ok) throw new Error(`Bitbucket API error (${res.status})`);
  return res.json() as Promise<T>;
}

type BbPage<T> = { values: T[] };

type BbRepo = {
  uuid: string;
  name: string;
  full_name: string;
  is_private: boolean;
  links: { html: { href: string } };
  mainbranch?: { name: string };
  updated_on: string;
};

type BbCommit = {
  hash: string;
  message: string;
  date: string;
  links: { html: { href: string } };
};

type BbPr = {
  id: number;
  title: string;
  state: string;
  updated_on: string;
  created_on: string;
  links: { html: { href: string } };
};

export class BitbucketAdapter implements SourceControlAdapter {
  provider = "bitbucket" as const;

  async listRepositories(ctx: AdapterContext): Promise<NormalizedRepo[]> {
    const data = await bitbucketFetch<BbPage<BbRepo>>(ctx.accessToken, "/repositories?role=member&pagelen=50");
    return (data.values || []).map((repo) => ({
      provider: "bitbucket",
      externalId: repo.uuid,
      name: repo.name,
      fullName: repo.full_name,
      url: repo.links.html.href,
      private: repo.is_private,
      defaultBranch: repo.mainbranch?.name || "main",
      lastActivityAt: repo.updated_on ? new Date(repo.updated_on) : null,
    }));
  }

  async listEvents(ctx: AdapterContext, repos: NormalizedRepo[]): Promise<NormalizedEvent[]> {
    const since = ctx.since || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const events: NormalizedEvent[] = [];

    for (const repo of repos.slice(0, 15)) {
      try {
        const commits = await bitbucketFetch<BbPage<BbCommit>>(
          ctx.accessToken,
          `/repositories/${repo.fullName}/commits?pagelen=30`,
        );
        for (const commit of commits.values || []) {
          const when = new Date(commit.date);
          if (when < since) continue;
          events.push({
            provider: "bitbucket",
            type: "commit",
            repository: repo.fullName,
            title: commit.message.split("\n")[0],
            description: commit.hash.slice(0, 7),
            url: commit.links.html.href,
            timestamp: when,
            externalId: commit.hash,
          });
        }
      } catch {
        // skip
      }

      try {
        const prs = await bitbucketFetch<BbPage<BbPr>>(
          ctx.accessToken,
          `/repositories/${repo.fullName}/pullrequests?state=ALL&pagelen=30`,
        );
        for (const pr of prs.values || []) {
          const when = new Date(pr.updated_on);
          if (when < since) continue;
          events.push({
            provider: "bitbucket",
            type: "pr",
            repository: repo.fullName,
            title: `${pr.state === "MERGED" ? "Merged" : "Opened"} PR #${pr.id}`,
            description: pr.title,
            url: pr.links.html.href,
            timestamp: when,
            externalId: String(pr.id),
            metadata: { number: pr.id, state: pr.state.toLowerCase(), title: pr.title, openedAt: pr.created_on },
          });
        }
      } catch {
        // skip
      }
    }

    return events;
  }
}

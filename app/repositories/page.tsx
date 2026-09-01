import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Building2, FolderGit2, GitCommitHorizontal, LockKeyhole, UserRound } from "lucide-react";

import { EmptyState, Panel, SectionHeader } from "@/components/cards";
import { SiteShell } from "@/components/site-shell";
import { getRepositoriesData } from "@/lib/data";

export default async function RepositoriesPage() {
  const data = await getRepositoriesData();
  const repositories = data.sync?.repositories ?? [];
  const workspaces = data.sync?.workspaces ?? [];
  const commits = data.sync?.recentCommits ?? [];

  return (
    <SiteShell user={data.user} workspaceName={data.sync?.username}>
      <div className="space-y-6">
        {data.syncError ? <div className="rounded-lg border border-amber/50 bg-amber/10 px-4 py-3 text-[12px] text-inkText">{data.syncError}</div> : null}

        <Panel>
          <SectionHeader title="GitHub workspaces" description="Personal and organization owners represented by repositories your GitHub account can access." />
          {workspaces.length ? <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{workspaces.map((workspace) => {
            const Icon = workspace.kind === "organization" ? Building2 : UserRound;
            return <div key={workspace.login} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-4"><span className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal/15 text-teal"><Icon size={19} /></span><div><p className="font-semibold text-white">{workspace.login}</p><p className="mt-1 text-xs capitalize text-slate-500">{workspace.kind} · {workspace.repositoryCount} {workspace.repositoryCount === 1 ? "repository" : "repositories"}</p></div></div>;
          })}</div> : <EmptyState title="No workspaces found" body="Connect GitHub to discover personal and organization repositories available to your account." link={{ href: "/integrations", label: "Connect GitHub" }} />}
        </Panel>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_.9fr]">
          <Panel>
            <SectionHeader title="Repositories" description={`${repositories.length} accessible repositories, ordered by recent activity.`} />
            {repositories.length ? <div className="space-y-2">{repositories.map((repo) => <Link key={repo.id} href={repo.url} target="_blank" className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-4 transition hover:border-accent/40"><FolderGit2 size={18} className="mt-0.5 shrink-0 text-accent" /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="truncate text-sm font-semibold text-white">{repo.fullName}</p>{repo.private ? <span className="inline-flex items-center gap-1 rounded-full bg-amber/10 px-2 py-0.5 text-[10px] text-amber"><LockKeyhole size={10} />Private</span> : <span className="rounded-full bg-teal/10 px-2 py-0.5 text-[10px] text-teal">Public</span>}</div><p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-400">{repo.description || "No description provided."}</p><p className="mt-2 text-[11px] text-slate-500">{repo.language || "Unspecified language"} · {repo.pushedAt ? `pushed ${formatDistanceToNow(repo.pushedAt)} ago` : "no pushes yet"}</p></div></Link>)}</div> : <EmptyState title="No repositories available" body="GitHub returned no repositories for this account. Check the OAuth app permissions and organization access." link={{ href: "/integrations", label: "Check connection" }} />}
          </Panel>

          <Panel>
            <SectionHeader title="Recent commits" description="Commits authored by your GitHub identity in repositories active during the last 30 days." />
            {commits.length ? <div className="space-y-2">{commits.map((commit) => <Link key={`${commit.repo}-${commit.sha}`} href={commit.url} target="_blank" className="flex gap-3 rounded-xl border border-white/10 bg-white/5 p-4 transition hover:border-accent/40"><GitCommitHorizontal size={18} className="mt-0.5 shrink-0 text-teal" /><div className="min-w-0"><p className="line-clamp-2 text-sm font-medium text-white">{commit.title}</p><p className="mt-1 truncate text-xs text-slate-500">{commit.repo} · {commit.shortSha}</p><p className="mt-2 text-[11px] text-slate-500">{formatDistanceToNow(commit.timestamp)} ago</p></div></Link>)}</div> : <EmptyState title="No recent commits found" body="DevDash did not find authored commits in repositories pushed during the last 30 days." />}
          </Panel>
        </div>
      </div>
    </SiteShell>
  );
}

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

import { EmptyState, Panel, SectionHeader } from "@/components/cards";
import { CopyButton } from "@/components/copy-button";
import { SiteShell } from "@/components/site-shell";
import { getDashboardData } from "@/lib/data";
import { formatHours } from "@/lib/utils";

const actionLabels = {
  review: "PR to review",
  blocked_pr: "Blocked PR",
  failing_ci: "Failing CI",
  issue: "Assigned issue"
} as const;

export default async function DashboardPage() {
  const data = await getDashboardData();

  return (
    <SiteShell user={data.user} workspaceName={data.sync?.username}>
      {data.syncError ? <div className="mb-5 rounded-lg border border-amber/50 bg-amber/10 px-4 py-3 text-[12px] text-inkText">{data.syncError}</div> : null}
      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <Panel>
          <SectionHeader
            title="What Needs Me"
            description="Ranked by delivery risk, staleness, blockers, and quick wins."
          />
          {data.sync?.actionItems.length ? (
            <div className="space-y-4">
              {data.sync.actionItems.map((item) => (
                <Link
                  key={item.id}
                  href={item.url}
                  target="_blank"
                  className="block rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-accent/40"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-accentSoft px-2 py-1 text-xs font-medium text-accent">
                          {actionLabels[item.kind]}
                        </span>
                        <span className="text-xs text-slate-500">{item.repo}</span>
                      </div>
                      <h3 className="mt-3 text-lg font-medium text-white">{item.title}</h3>
                      <p className="mt-2 text-sm text-slate-400">{item.urgencyReason}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-2xl font-semibold text-white">{item.urgencyScore}</p>
                      <p className="text-xs text-slate-500">
                        Updated {formatDistanceToNow(item.updatedAt)} ago
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No urgent action items yet"
              body="Connect GitHub and sync recent activity to populate the ranked attention list."
              link={{ href: "/integrations", label: "Open integrations" }}
            />
          )}
        </Panel>

        <div className="space-y-6">
          <Panel>
            <SectionHeader
              title="Week in Code"
              description="AI summary grounded in your last 7 days of GitHub events."
              action={<CopyButton value={data.weeklySummary} />}
            />
            <p className="text-sm leading-7 text-slate-300">{data.weeklySummary}</p>
          </Panel>

          <Panel>
            <SectionHeader
              title="Interrupt Cost"
              description="Estimated from context switches across pull requests and reviews."
            />
            <p className="text-4xl font-semibold text-white">
              {formatHours(data.focus.minutesLost)}
            </p>
            <p className="mt-3 text-sm text-slate-400">
              You lost {formatHours(data.focus.minutesLost)} to context switching this week
              across {data.focus.interruptionCount} detected interruptions.
            </p>
          </Panel>
        </div>
      </div>
      <Panel className="mt-6">
        <SectionHeader title="Recent commits" description="Your latest authored commits across accessible repositories." action={<Link href="/repositories" className="text-sm font-semibold text-accent">View all repositories</Link>} />
        {data.sync?.recentCommits.length ? <div className="divide-y divide-white/10">{data.sync.recentCommits.slice(0, 8).map((commit) => <Link key={`${commit.repo}-${commit.sha}`} href={commit.url} target="_blank" className="flex flex-col gap-1 py-3 transition hover:text-accent sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><p className="truncate text-sm font-medium text-white">{commit.title}</p><p className="mt-1 text-xs text-slate-500">{commit.repo} · {commit.shortSha}</p></div><span className="shrink-0 text-xs text-slate-500">{formatDistanceToNow(commit.timestamp)} ago</span></Link>)}</div> : <EmptyState title="No recent commits found" body="Once GitHub is connected, your authored commits from recently active repositories appear here." link={{ href: "/integrations", label: "Check GitHub connection" }} />}
      </Panel>
    </SiteShell>
  );
}

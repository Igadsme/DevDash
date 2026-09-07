import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

import { EmptyState, Panel, SectionHeader } from "@/components/cards";
import { SiteShell } from "@/components/site-shell";
import { getDashboardData } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const data = await getDashboardData();
  const weekCounts = {
    commits: data.events.filter((event) => event.type === "COMMIT").length,
    reviews: data.events.filter((event) => event.type === "REVIEW_COMPLETED")
      .length,
    merged: data.events.filter((event) => event.type === "PULL_REQUEST_MERGED")
      .length,
    focus: data.events.filter((event) => event.type === "FOCUS_COMPLETED")
      .length,
  };
  const metrics = [
    ["Repositories", data.counts.repositories, "/repositories"],
    ["Open PRs", data.counts.openPullRequests, "/pull-requests"],
    [
      "Reviews waiting",
      data.counts.pendingReviews,
      "/pull-requests?view=review",
    ],
    [
      "Failing pipelines",
      data.counts.failingPipelines,
      "/pipelines?status=FAILED",
    ],
    [
      "Assigned issues",
      data.counts.assignedIssues,
      "/timeline?type=ISSUE_OPENED",
    ],
  ] as const;
  return (
    <SiteShell user={data.user}>
      <div className="space-y-6">
        <section aria-labelledby="overview-heading">
          <p className="font-mono text-[10px] uppercase tracking-[.18em] text-teal">
            Your workspace
          </p>
          <h1
            id="overview-heading"
            className="mt-2 text-3xl font-extrabold tracking-tight"
          >
            Overview
          </h1>
          <p className="mt-2 text-sm text-muted">
            Stored activity and current work across your connected providers.
          </p>
        </section>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {metrics.map(([label, value, href]) => (
            <Link
              href={href}
              key={label}
              className="rounded-xl border border-border bg-card p-5 shadow-sm transition hover:border-teal/50"
            >
              <p className="text-xs font-semibold text-muted">{label}</p>
              <p className="mt-2 text-3xl font-extrabold">{value}</p>
            </Link>
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Panel>
            <SectionHeader
              title="Connected providers"
              description="Current stored integration state."
            />
            {data.connections.length ? (
              <div className="grid gap-2 sm:grid-cols-2">
                {data.connections.map((connection) => (
                  <Link
                    key={connection.id}
                    href="/integrations"
                    className="flex items-center justify-between rounded-lg border border-border p-3 text-xs"
                  >
                    <span className="font-bold">
                      {connection.provider} · {connection.displayName}
                    </span>
                    <span>{connection.status.toLowerCase()}</span>
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No providers connected"
                body="Connect a source-control provider to populate this workspace."
                link={{ href: "/integrations", label: "Connect provider" }}
              />
            )}
          </Panel>
          <Panel>
            <SectionHeader
              title="Week in Code"
              description="A factual count of normalized activity in the last seven days."
            />
            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {Object.entries(weekCounts).map(([label, value]) => (
                <div key={label} className="rounded-lg bg-mutedBg p-3">
                  <dt className="text-xs capitalize text-muted">{label}</dt>
                  <dd className="mt-1 text-2xl font-extrabold">{value}</dd>
                </div>
              ))}
            </dl>
          </Panel>
        </div>
        <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
          <Panel>
            <SectionHeader
              title="Recent commits"
              description="Latest stored commits; page rendering never triggers a provider crawl."
              action={
                <Link
                  href="/repositories"
                  className="text-xs font-bold text-teal"
                >
                  View repositories
                </Link>
              }
            />
            {data.recentCommits.length ? (
              <div className="divide-y divide-border">
                {data.recentCommits.map((commit) => (
                  <a
                    key={commit.id}
                    href={commit.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between gap-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        {commit.title}
                      </p>
                      <p className="mt-1 truncate text-xs text-muted">
                        {commit.repository.fullName} · {commit.sha.slice(0, 7)}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-muted">
                      {formatDistanceToNow(commit.committedAt)} ago
                    </span>
                  </a>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No commits synced"
                body="Install a source-control integration, then run Sync now."
                link={{ href: "/integrations", label: "Open integrations" }}
              />
            )}
          </Panel>
          <div className="space-y-6">
            <Panel>
              <SectionHeader
                title="Weekly brief"
                description={
                  data.brief.source === "openai"
                    ? "Generated by OpenAI from stored activity."
                    : "Deterministic local fallback."
                }
              />
              <p className="text-sm leading-7 text-muted">
                {data.brief.brief.overview}
              </p>
              <Link
                href="/ai-brief"
                className="mt-4 inline-flex text-xs font-bold text-teal"
              >
                Open AI Brief
              </Link>
            </Panel>
            <Panel>
              <SectionHeader
                title="Developer health"
                description="Transparent operational signal—not a productivity grade."
              />
              <p className="text-4xl font-extrabold">
                {data.health.score ?? "—"}
              </p>
              <p className="mt-2 text-sm text-muted">
                {data.health.explanation}
              </p>
              <Link
                href="/developer-health"
                className="mt-4 inline-flex text-xs font-bold text-teal"
              >
                View methodology
              </Link>
            </Panel>
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Panel>
            <SectionHeader
              title="Current tasks"
              description="Your highest-priority unfinished work and upcoming deadlines."
            />
            {data.tasks.length ? (
              <div className="space-y-2">
                {data.tasks.map((task) => (
                  <Link
                    key={task.id}
                    href="/tasks"
                    className="block rounded-lg border border-border p-3"
                  >
                    <p className="text-sm font-semibold">{task.title}</p>
                    <p className="mt-1 text-xs text-muted">
                      {task.priority.toLowerCase()} priority
                      {task.dueAt
                        ? ` · due ${task.dueAt.toLocaleDateString()}`
                        : ""}
                    </p>
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No active tasks"
                body="Create a task to plan your next action."
                link={{ href: "/tasks", label: "Create task" }}
              />
            )}
          </Panel>
          <Panel>
            <SectionHeader
              title="Sync status"
              description="Provider refreshes run outside page rendering."
            />
            {data.latestSync ? (
              <div className="rounded-lg border border-border p-4">
                <p className="text-sm font-bold">
                  {data.latestSync.status.toLowerCase().replaceAll("_", " ")}
                </p>
                <p className="mt-1 text-xs text-muted">
                  Updated {formatDistanceToNow(data.latestSync.updatedAt)} ago ·{" "}
                  {data.latestSync.progress}%
                </p>
                {data.latestSyncIsStale ? (
                  <p className="mt-2 text-xs font-bold text-amber">
                    Stored data may be stale; queue a new sync from
                    Integrations.
                  </p>
                ) : null}
                {data.latestSync.errorCode ? (
                  <p className="mt-2 text-xs font-bold text-red-500">
                    Last error: {data.latestSync.errorCode}
                  </p>
                ) : null}
              </div>
            ) : (
              <EmptyState
                title="No sync has run"
                body="Connect a provider and start the first incremental synchronization."
                link={{ href: "/integrations", label: "Connect provider" }}
              />
            )}
          </Panel>
        </div>
      </div>
    </SiteShell>
  );
}

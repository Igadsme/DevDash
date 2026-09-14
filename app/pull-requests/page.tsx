import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { GitPullRequest, Search } from "lucide-react";

import { EmptyState, Panel, SectionHeader } from "@/components/cards";
import { SiteShell } from "@/components/site-shell";
import { getPullRequestsData } from "@/lib/data";
import { collectPullRequestSignals, filterPullRequestSignals } from "@/lib/github";

export default async function PullRequestsPage({
  searchParams
}: {
  searchParams?: Promise<{ q?: string; status?: string }>;
}) {
  const params = await searchParams;
  const query = params?.q?.trim().toLowerCase() ?? "";
  const status = params?.status === "attention" ? "attention" : "all";
  const data = await getPullRequestsData();
  const pullRequests = filterPullRequestSignals(collectPullRequestSignals(data.sync?.actionItems ?? []), { query, status });

  return (
    <SiteShell user={data.user} workspaceName={data.sync?.username}>
      <div className="space-y-6">
        {data.syncError ? <div className="rounded-lg border border-amber/50 bg-amber/10 px-4 py-3 text-[12px]">{data.syncError}</div> : null}
        <Panel>
          <SectionHeader title="Pull requests" description="Open work and review signals from your connected GitHub account." action={<span className="font-mono text-[10px] uppercase tracking-[.14em] text-muted">{pullRequests.length} shown</span>} />
          <form className="mb-5 flex flex-col gap-2 sm:flex-row" role="search">
            <label className="flex min-w-0 flex-1 items-center gap-2 rounded-md border border-border bg-canvas px-3 text-muted">
              <Search size={15} aria-hidden="true" />
              <input name="q" defaultValue={params?.q ?? ""} placeholder="Search title or repository" className="h-9 min-w-0 flex-1 bg-transparent text-[12px] text-inkText outline-none placeholder:text-muted" />
            </label>
            <select name="status" defaultValue={status} className="h-9 rounded-md border border-border bg-canvas px-3 text-[12px] text-inkText outline-none">
              <option value="all">All signals</option>
              <option value="attention">Needs attention</option>
            </select>
            <button className="rounded-md bg-navy px-4 py-2 text-[11px] font-bold text-amber" type="submit">Filter</button>
          </form>
          {pullRequests.length ? <div className="grid gap-3 lg:grid-cols-2">{pullRequests.map((item) => (
            <Link key={item.id} href={item.url} target="_blank" className="rounded-lg border border-border bg-canvas/60 p-4 transition hover:border-teal/60">
              <div className="flex items-start gap-3">
                <GitPullRequest size={18} className="mt-0.5 shrink-0 text-teal" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-amber/10 px-2 py-1 font-mono text-[10px] uppercase tracking-wide text-amber">{item.kind.replace("_", " ")}</span>
                    <span className="text-[11px] text-muted">{item.repo}</span>
                  </div>
                  <h3 className="mt-2 text-[13px] font-bold">{item.title}</h3>
                  <p className="mt-2 text-[11px] leading-5 text-muted">{item.urgencyReason}</p>
                  <p className="mt-3 text-[10px] text-muted">Updated {formatDistanceToNow(item.updatedAt)} ago · score {item.urgencyScore}</p>
                </div>
              </div>
            </Link>
          ))}</div> : <EmptyState title={data.sync ? "No matching pull requests" : "GitHub is not connected"} body={data.sync ? "Try a broader search or check all signals." : "Connect GitHub to load pull requests and review requests."} link={{ href: "/integrations", label: "Open integrations" }} />}
        </Panel>
      </div>
    </SiteShell>
  );
}

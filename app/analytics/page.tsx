import Link from "next/link";
import { format, subDays } from "date-fns";

import { EmptyState, Panel, SectionHeader } from "@/components/cards";
import { SiteShell } from "@/components/site-shell";
import { getAnalyticsData } from "@/lib/data";
import { summarizeEvents, type TimelineRange } from "@/lib/analytics";

export default async function AnalyticsPage({
  searchParams
}: {
  searchParams?: Promise<{ range?: string }>;
}) {
  const params = await searchParams;
  const range: TimelineRange = params?.range === "month" ? "month" : params?.range === "quarter" ? "quarter" : "week";
  const data = await getAnalyticsData(range);
  const summary = summarizeEvents(data.events);
  const byType = data.events.reduce<Record<string, number>>((counts, event) => {
    counts[event.type] = (counts[event.type] ?? 0) + 1;
    return counts;
  }, {});
  const byRepo = data.events.reduce<Record<string, number>>((counts, event) => {
    counts[event.repo] = (counts[event.repo] ?? 0) + 1;
    return counts;
  }, {});
  const repoRows = Object.entries(byRepo).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const chartStart = range === "quarter" ? subDays(new Date(), 89) : range === "month" ? subDays(new Date(), 29) : subDays(new Date(), 6);
  const days = Array.from({ length: range === "quarter" ? 13 : range === "month" ? 30 : 7 }, (_, index) => {
    const date = new Date(chartStart);
    date.setDate(chartStart.getDate() + (range === "quarter" ? index * 7 : index));
    return { date, count: data.events.filter((event) => format(event.timestamp, "yyyy-MM-dd") === format(date, "yyyy-MM-dd")).length };
  });
  const maxDay = Math.max(...days.map((day) => day.count), 1);

  return (
    <SiteShell user={data.user} workspaceName={data.sync?.username}>
      <div className="space-y-6">
        {data.syncError ? <div className="rounded-lg border border-amber/50 bg-amber/10 px-4 py-3 text-[12px]">{data.syncError}</div> : null}
        <Panel>
          <SectionHeader title="Analytics" description="Counts derived from normalized GitHub events; no activity is inferred." action={<div className="flex gap-2 text-[11px]"><Link href="/analytics?range=week" className={`rounded-full px-3 py-2 ${range === "week" ? "bg-amber text-navy" : "border border-border text-muted"}`}>7 days</Link><Link href="/analytics?range=month" className={`rounded-full px-3 py-2 ${range === "month" ? "bg-amber text-navy" : "border border-border text-muted"}`}>30 days</Link><Link href="/analytics?range=quarter" className={`rounded-full px-3 py-2 ${range === "quarter" ? "bg-amber text-navy" : "border border-border text-muted"}`}>90 days</Link></div>} />
          {data.events.length ? <><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{[["Commits", summary.commits], ["Shipping", summary.built], ["Reviewed", summary.reviewed], ["CI failures", summary.blocked], ["Issues assigned", summary.issues]].map(([label, value]) => <div key={label} className="rounded-lg border border-border bg-canvas/60 p-4"><p className="text-[11px] text-muted">{label}</p><p className="metric-number mt-2 text-3xl font-extrabold">{value}</p></div>)}</div>
            <div className="mt-6" aria-labelledby="activity-chart-title">
              <h3 id="activity-chart-title" className="text-[12px] font-bold">Activity by day</h3>
              <div className="mt-4 flex h-36 items-end gap-1 border-b border-border px-1" role="img" aria-label={`Activity chart showing ${data.events.length} events over ${range === "month" ? "30" : "7"} days`}>
                {days.map((day) => <div key={day.date.toISOString()} className="group flex h-full flex-1 flex-col items-center justify-end gap-1"><span className="sr-only">{format(day.date, "MMM d")}: {day.count} events</span><div className="w-full max-w-6 rounded-t bg-teal transition group-hover:bg-amber" style={{ height: `${Math.max((day.count / maxDay) * 100, day.count ? 8 : 2)}%` }} title={`${format(day.date, "MMM d")}: ${day.count} events`} /><span className="text-[9px] text-muted">{format(day.date, range === "month" ? "d" : "EEE")}</span></div>)}
              </div>
              <p className="mt-2 text-[10px] text-muted">Text alternative: each bar is labeled for screen readers with its date and event count.</p>
            </div>
          </> : <EmptyState title="No events in this range" body="Connect GitHub and sync activity to start building analytics." link={{ href: "/integrations", label: "Connect GitHub" }} />}
        </Panel>
        {data.events.length ? <div className="grid gap-6 lg:grid-cols-2">
          <Panel><SectionHeader title="Event mix" description="Event types recorded in the selected range." /><div className="space-y-3">{Object.entries(byType).sort((a, b) => b[1] - a[1]).map(([type, count]) => <div key={type} className="flex items-center justify-between border-b border-border pb-3 text-[12px]"><span>{type.replaceAll("_", " ")}</span><span className="font-mono text-teal">{count}</span></div>)}</div></Panel>
          <Panel><SectionHeader title="Repositories" description="Where recorded activity happened." /><div className="space-y-3">{repoRows.map(([repo, count]) => <div key={repo} className="flex items-center justify-between border-b border-border pb-3 text-[12px]"><span className="truncate pr-4">{repo}</span><span className="font-mono text-amber">{count}</span></div>)}</div></Panel>
        </div> : null}
      </div>
    </SiteShell>
  );
}

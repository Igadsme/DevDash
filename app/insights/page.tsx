import { Sparkles } from "lucide-react";

import { EmptyState, Panel, SectionHeader } from "@/components/cards";
import { CopyButton } from "@/components/copy-button";
import { SiteShell } from "@/components/site-shell";
import { getInsightsData } from "@/lib/data";

export default async function InsightsPage() {
  const data = await getInsightsData();

  return (
    <SiteShell user={data.user} workspaceName={data.sync?.username}>
      <div className="space-y-6">
        {data.syncError ? <div className="rounded-lg border border-amber/50 bg-amber/10 px-4 py-3 text-[12px]">{data.syncError}</div> : null}
        <div className="grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
          <Panel>
            <SectionHeader title="AI insights" description="A grounded summary of your last seven days of synced events." action={<CopyButton value={data.summary} />} />
            {data.events.length ? <p className="text-[14px] leading-7 text-inkText">{data.summary}</p> : <EmptyState title="Not enough activity yet" body="Connect GitHub and sync a few events before generating an insight." link={{ href: "/integrations", label: "Open integrations" }} />}
            {data.user.aiEnabled ? null : <p className="mt-4 rounded-md border border-border bg-mutedBg px-3 py-2 text-[11px] text-muted">AI is disabled in Settings. This summary uses the local event-based fallback.</p>}
          </Panel>
          <Panel>
            <SectionHeader title="Signal quality" description="How much source data supports this readout." />
            <div className="flex items-center gap-4"><span className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal/15 text-teal"><Sparkles size={21} aria-hidden="true" /></span><div><p className="text-2xl font-extrabold">{data.events.length}</p><p className="text-[11px] text-muted">events in the last 7 days</p></div></div>
            <p className="mt-5 text-[12px] leading-6 text-muted">Insights only use normalized commits, pull requests, reviews, CI failures, and assigned issues stored for your account.</p>
          </Panel>
        </div>
        <Panel>
          <SectionHeader title="Focus signals" description="Transparent patterns calculated from event timestamps and your configured focus interval." />
          {data.events.length ? <div className="grid gap-4 md:grid-cols-3">{data.focus.insightCards.map((card) => <article key={card.title} className="rounded-lg border border-border bg-canvas/60 p-4"><h3 className="text-[12px] font-bold">{card.title}</h3><p className="mt-2 text-[12px] leading-6 text-muted">{card.body}</p></article>)}</div> : <EmptyState title="No focus signals yet" body="Focus patterns appear after GitHub activity has been synced." link={{ href: "/integrations", label: "Connect GitHub" }} />}
        </Panel>
      </div>
    </SiteShell>
  );
}

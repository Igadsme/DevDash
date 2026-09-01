import { format } from "date-fns";

import { EmptyState, Panel, SectionHeader } from "@/components/cards";
import { SiteShell } from "@/components/site-shell";
import { getFocusData } from "@/lib/data";
import { formatHours } from "@/lib/utils";

export default async function FocusPage() {
  const data = await getFocusData();

  return (
    <SiteShell>
      <div className="space-y-6">
        {data.syncError ? <div className="rounded-lg border border-amber/50 bg-amber/10 px-4 py-3 text-[12px] text-inkText">{data.syncError}</div> : null}
        <Panel>
          <SectionHeader
            title="Focus Windows"
            description="Detected stretches of work on the same repo or pull request context."
          />
          {data.focus.windows.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {data.focus.windows.map((window, index) => (
              <div key={`${window.label}-${index}`} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm font-medium text-white">{window.label}</p>
                <p className="mt-2 text-xs text-slate-500">{window.repo}</p>
                <p className="mt-3 text-sm text-slate-300">
                  {format(window.start, "EEE h:mm a")} to {format(window.end, "EEE h:mm a")}
                </p>
                <p className="mt-2 text-xs text-slate-400">
                  {window.interruptionAfter ? "Interrupted by a context switch" : "Closed without a switch"}
                </p>
              </div>
            ))}
          </div> : <EmptyState title="No focus windows yet" body="Focus patterns appear after GitHub activity has been synced." link={{ href: "/integrations", label: "Connect GitHub" }} />}
        </Panel>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
          <Panel>
            <SectionHeader
              title="Interruption Patterns"
              description="A developer-centric estimate of switch cost, not a surveillance metric."
            />
            <p className="text-4xl font-semibold text-white">{formatHours(data.focus.minutesLost)}</p>
            <p className="mt-3 text-sm text-slate-400">
              {data.focus.interruptionCount} switches were detected from recent event sequencing,
              using {data.user.focusMinutes} minutes per interruption.
            </p>
            <p className="mt-6 text-sm text-slate-300">
              Strongest focus window: {data.focus.strongestFocusWindow}
            </p>
          </Panel>

          <Panel>
            <SectionHeader
              title="Insight Cards"
              description="Readable patterns instead of noisy charts."
            />
            <div className="space-y-4">
              {data.focus.insightCards.map((card) => (
                <div key={card.title} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <h3 className="text-base font-medium text-white">{card.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{card.body}</p>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </SiteShell>
  );
}

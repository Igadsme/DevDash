import Link from "next/link";
import { format } from "date-fns";

import { EmptyState, Panel, SectionHeader } from "@/components/cards";
import { SiteShell } from "@/components/site-shell";
import { getTimelineData } from "@/lib/data";

export default async function TimelinePage({
  searchParams
}: {
  searchParams?: Promise<{ range?: string }>;
}) {
  const params = await searchParams;
  const range = params?.range === "month" ? "month" : "week";
  const data = await getTimelineData(range);

  return (
    <SiteShell>
      <div className="space-y-6">
        {data.syncError ? <div className="rounded-lg border border-amber/50 bg-amber/10 px-4 py-3 text-[12px] text-inkText">{data.syncError}</div> : null}
        <Panel>
          <SectionHeader
            title="Narrative Summary"
            description="A compact readout of the selected activity range."
            action={
              <div className="flex gap-2 text-sm">
                <Link
                  href="/timeline?range=week"
                  className={`rounded-full px-3 py-2 ${range === "week" ? "bg-accent text-ink" : "border border-white/10 text-slate-300"}`}
                >
                  Week
                </Link>
                <Link
                  href="/timeline?range=month"
                  className={`rounded-full px-3 py-2 ${range === "month" ? "bg-accent text-ink" : "border border-white/10 text-slate-300"}`}
                >
                  Month
                </Link>
              </div>
            }
          />
          <p className="text-sm leading-7 text-slate-300">{data.summary}</p>
        </Panel>

        <Panel>
          <SectionHeader
            title="Event Feed"
            description="Normalized GitHub activity stored as timeline events."
          />
          {data.events.length ? <div className="space-y-4">
            {data.events.map((event) => {
              const metadata = event.metadata as Record<string, unknown>;
              const url = typeof metadata.url === "string" ? metadata.url : null;

              return (
                <div
                  key={event.id}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4"
                >
                  <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-sm font-medium text-white">{event.type}</p>
                      <p className="text-sm text-slate-400">{event.repo}</p>
                      <p className="mt-2 text-sm text-slate-300">
                        {typeof metadata.title === "string" ? metadata.title : "GitHub activity"}
                      </p>
                      {url ? (
                        <Link
                          href={url}
                          target="_blank"
                          className="mt-2 inline-flex text-sm text-accent"
                        >
                          Open on GitHub
                        </Link>
                      ) : null}
                    </div>
                    <p className="text-xs text-slate-500">
                      {format(event.timestamp, "MMM d, yyyy 'at' h:mm a")}
                    </p>
                  </div>
                </div>
              );
            })}
          </div> : <EmptyState title="No activity yet" body="Connect GitHub and sync your account to populate the timeline." link={{ href: "/integrations", label: "Open integrations" }} />}
        </Panel>
      </div>
    </SiteShell>
  );
}

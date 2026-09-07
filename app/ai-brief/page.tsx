import { CopyButton } from "@/components/copy-button";
import { Panel, SectionHeader } from "@/components/cards";
import { SiteShell } from "@/components/site-shell";
import { getDashboardData } from "@/lib/data";
export const dynamic = "force-dynamic";
export default async function AIBriefPage() {
  const data = await getDashboardData();
  const text = [
    data.brief.brief.overview,
    ...data.brief.brief.completed,
    ...data.brief.brief.reviews,
    ...data.brief.brief.blockers,
    ...data.brief.brief.nextActions,
  ].join("\n");
  const sections = [
    ["Work completed", data.brief.brief.completed],
    ["Reviews", data.brief.brief.reviews],
    ["Active blockers", data.brief.brief.blockers],
    ["Recommended next actions", data.brief.brief.nextActions],
  ] as const;
  return (
    <SiteShell user={data.user}>
      <Panel>
        <SectionHeader
          title="AI Brief"
          description={`Source: ${data.brief.source === "openai" ? "OpenAI structured response" : "deterministic local generation"}. Private repository handling follows your settings.`}
          action={
            <div className="flex gap-2">
              <form action="/api/ai/brief" method="post">
                <input type="hidden" name="period" value="WEEKLY" />
                <button className="rounded-md bg-teal px-3 py-2 text-xs font-bold text-navy">
                  Regenerate
                </button>
              </form>
              <CopyButton value={text} />
            </div>
          }
        />
        <p className="rounded-xl border border-border p-4 text-sm leading-7">
          {data.brief.brief.overview}
        </p>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {sections.map(([title, items]) => (
            <section
              key={title}
              className="rounded-xl border border-border p-4"
            >
              <h2 className="text-sm font-bold">{title}</h2>
              {items.length ? (
                <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted">
                  {items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-muted">
                  Nothing recorded for this section.
                </p>
              )}
            </section>
          ))}
        </div>
        <p className="mt-5 text-xs leading-5 text-muted">
          When enabled, DevDash sends only normalized event type, occurrence
          time, and a title capped at 200 characters. Tokens, source bodies,
          provider responses, and credentials are never included.
        </p>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {data.connections.some(
            (item) => item.provider === "SLACK" && item.status === "CONNECTED",
          ) ? (
            <form
              action="/api/exports/slack"
              method="post"
              className="rounded-xl border border-border p-4"
            >
              <label className="text-xs font-bold">
                Slack channel ID
                <input
                  required
                  name="destinationId"
                  placeholder="C0123456789"
                  className="mt-1 w-full rounded-md border border-border bg-transparent px-3 py-2"
                />
              </label>
              <button className="mt-3 rounded-md bg-teal px-3 py-2 text-xs font-bold text-navy">
                Export to Slack
              </button>
            </form>
          ) : null}
          {data.connections.some(
            (item) => item.provider === "NOTION" && item.status === "CONNECTED",
          ) ? (
            <form
              action="/api/exports/notion"
              method="post"
              className="rounded-xl border border-border p-4"
            >
              <label className="text-xs font-bold">
                Notion parent page ID
                <input
                  required
                  name="destinationId"
                  className="mt-1 w-full rounded-md border border-border bg-transparent px-3 py-2"
                />
              </label>
              <button className="mt-3 rounded-md bg-teal px-3 py-2 text-xs font-bold text-navy">
                Export to Notion
              </button>
            </form>
          ) : null}
        </div>
      </Panel>
    </SiteShell>
  );
}

import { Panel, SectionHeader } from "@/components/cards";
import { SiteShell } from "@/components/site-shell";
import { getDashboardData } from "@/lib/data";
export const dynamic = "force-dynamic";
export default async function DeveloperHealthPage() {
  const data = await getDashboardData();
  return (
    <SiteShell user={data.user}>
      <Panel>
        <SectionHeader
          title="Developer Health"
          description="A transparent operational model with limitations—not a performance score."
        />
        <div className="rounded-xl border border-border p-5">
          <p className="text-xs uppercase tracking-wider text-muted">
            Current signal
          </p>
          <p className="mt-2 text-5xl font-extrabold">
            {data.health.score ?? "—"}
          </p>
          <p className="mt-2 text-sm text-muted">
            Confidence: {data.health.confidence}. {data.health.explanation}
          </p>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {data.health.components.map((component) => (
            <article
              key={component.key}
              className="rounded-xl border border-border p-4"
            >
              <div className="flex justify-between">
                <h2 className="text-sm font-bold">{component.label}</h2>
                <span className="text-sm font-extrabold">
                  {component.score}/100 · {component.weight * 100}%
                </span>
              </div>
              <p className="mt-2 text-xs leading-5 text-muted">
                {component.explanation}
              </p>
            </article>
          ))}
        </div>
        <div className="mt-6 rounded-xl bg-mutedBg p-4 text-sm leading-6 text-muted">
          <strong className="text-inkText">Methodology:</strong> delivery flow
          25%, review responsiveness 20%, CI stability 25%, work-in-progress
          15%, and recorded focus/context-switch signals 15%. Raw commit count
          is excluded. Missing evidence uses a neutral component value, and
          fewer than three observations returns insufficient data.
        </div>
      </Panel>
    </SiteShell>
  );
}

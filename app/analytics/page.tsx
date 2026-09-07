import { subDays } from "date-fns";
import { Panel, SectionHeader } from "@/components/cards";
import { SiteShell } from "@/components/site-shell";
import { requireUser } from "@/lib/data";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";
export default async function AnalyticsPage() {
  const user = await requireUser();
  const since = subDays(new Date(), 30);
  const [events, pipelines] = await Promise.all([
    prisma.activityEvent.findMany({
      where: { userId: user.id, occurredAt: { gte: since } },
      include: { repository: true },
    }),
    prisma.pipelineRun.findMany({
      where: {
        userId: user.id,
        createdAt: { gte: since },
        status: { in: ["SUCCESS", "FAILED", "CANCELED"] },
      },
    }),
  ]);
  const counts = new Map<string, number>();
  for (const event of events)
    counts.set(event.type, (counts.get(event.type) ?? 0) + 1);
  const successRate = pipelines.length
    ? Math.round(
        (pipelines.filter((item) => item.status === "SUCCESS").length /
          pipelines.length) *
          100,
      )
    : null;
  const metrics = [
    ["Commits", counts.get("COMMIT") ?? 0],
    ["PRs opened", counts.get("PULL_REQUEST_OPENED") ?? 0],
    ["PRs merged", counts.get("PULL_REQUEST_MERGED") ?? 0],
    ["Reviews completed", counts.get("REVIEW_COMPLETED") ?? 0],
    ["Issues completed", counts.get("ISSUE_CLOSED") ?? 0],
    ["Pipeline success", successRate === null ? "—" : `${successRate}%`],
  ];
  return (
    <SiteShell user={user}>
      <div className="space-y-6">
        <Panel>
          <SectionHeader
            title="Analytics"
            description="Evidence-based operational trends for the last 30 days; metrics are not productivity judgments."
          />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {metrics.map(([label, value]) => (
              <div key={label} className="rounded-xl border border-border p-4">
                <p className="text-xs text-muted">{label}</p>
                <p className="mt-2 text-3xl font-extrabold">{value}</p>
              </div>
            ))}
          </div>
        </Panel>
        <Panel>
          <SectionHeader
            title="Repository activity distribution"
            description="Share of normalized events by repository."
          />
          {[
            ...new Map(
              events
                .filter((event) => event.repository)
                .map((event) => [
                  event.repository!.fullName,
                  events.filter(
                    (candidate) =>
                      candidate.repository?.fullName ===
                      event.repository!.fullName,
                  ).length,
                ]),
            ).entries(),
          ]
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([name, count]) => (
              <div key={name} className="mb-3">
                <div className="flex justify-between text-xs">
                  <span>{name}</span>
                  <span>{count}</span>
                </div>
                <div className="mt-1 h-2 rounded bg-mutedBg">
                  <div
                    className="h-full rounded bg-teal"
                    style={{
                      width: `${events.length ? Math.max(3, (count / events.length) * 100) : 0}%`,
                    }}
                  />
                </div>
              </div>
            ))}
        </Panel>
      </div>
    </SiteShell>
  );
}

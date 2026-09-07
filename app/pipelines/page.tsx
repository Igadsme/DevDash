import { formatDistanceToNow } from "date-fns";
import { EmptyState, Panel, SectionHeader } from "@/components/cards";
import { SiteShell } from "@/components/site-shell";
import { requireUser } from "@/lib/data";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";
export default async function PipelinesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const user = await requireUser();
  const { status } = await searchParams;
  const allowed = [
    "QUEUED",
    "RUNNING",
    "SUCCESS",
    "FAILED",
    "CANCELED",
    "SKIPPED",
    "UNKNOWN",
  ] as const;
  const selected = allowed.find((item) => item === status);
  const runs = await prisma.pipelineRun.findMany({
    where: { userId: user.id, ...(selected ? { status: selected } : {}) },
    include: {
      repository: true,
      providerConnection: { select: { provider: true } },
      jobs: true,
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return (
    <SiteShell user={user}>
      <Panel>
        <SectionHeader
          title="Pipelines"
          description="GitHub Actions/checks, GitLab CI, and Bitbucket Pipelines. DevDash is read-only."
          action={
            <form>
              <select
                name="status"
                defaultValue={selected ?? ""}
                className="rounded-md border border-border bg-card px-3 py-2 text-xs"
              >
                <option value="">All statuses</option>
                {allowed.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
              <button className="ml-2 rounded-md bg-teal px-3 py-2 text-xs font-bold text-navy">
                Filter
              </button>
            </form>
          }
        />
        {runs.length ? (
          <div className="space-y-3">
            {runs.map((run) => (
              <a
                key={run.id}
                href={run.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-xl border border-border p-4 hover:border-teal/50"
              >
                <div className="flex justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase text-teal">
                      {run.providerConnection.provider} ·{" "}
                      {run.repository.fullName}
                    </p>
                    <h2 className="mt-1 text-sm font-bold">{run.name}</h2>
                    <p className="mt-2 text-xs text-muted">
                      {run.branch ?? "Branch unavailable"} ·{" "}
                      {run.commitSha?.slice(0, 7) ?? "commit unavailable"} ·{" "}
                      {run.triggeringActor ?? "actor unavailable"}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      {run.durationSeconds
                        ? `${run.durationSeconds}s`
                        : "Duration unavailable"}{" "}
                      · {formatDistanceToNow(run.createdAt)} ago ·{" "}
                      {run.jobs.filter((job) => job.status === "FAILED").length}{" "}
                      failed jobs
                    </p>
                  </div>
                  <span className="h-fit rounded-full bg-mutedBg px-3 py-1 text-xs font-bold">
                    {run.status.toLowerCase()}
                  </span>
                </div>
              </a>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No pipeline runs"
            body="Workflow runs, checks, and provider pipelines appear after synchronization."
          />
        )}
      </Panel>
    </SiteShell>
  );
}

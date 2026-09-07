import { formatDistanceToNow } from "date-fns";
import type { Prisma } from "@prisma/client";
import { EmptyState, Panel, SectionHeader } from "@/components/cards";
import { SiteShell } from "@/components/site-shell";
import { requireUser } from "@/lib/data";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";
export default async function PullRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{
    provider?: string;
    repository?: string;
    view?: string;
    state?: string;
    draft?: string;
    size?: string;
    page?: string;
  }>;
}) {
  const user = await requireUser();
  const filters = await searchParams;
  const page = Math.max(1, Number.parseInt(filters.page ?? "1", 10) || 1);
  const pageSize = 30;
  const [repositories, connections, settings] = await Promise.all([
    prisma.repository.findMany({
      where: { userId: user.id },
      select: { id: true, fullName: true },
    }),
    prisma.providerConnection.findMany({
      where: { userId: user.id },
      select: { displayName: true },
    }),
    prisma.userSettings.findUnique({ where: { userId: user.id } }),
  ]);
  const identities = [
    user.githubLogin,
    ...connections.map((item) => item.displayName),
  ].filter((value): value is string => Boolean(value));
  const allowedStates = ["OPEN", "CLOSED", "MERGED"] as const;
  const selectedState = allowedStates.find((item) => item === filters.state);
  const threshold = settings?.smallPrThreshold ?? 150;
  const where: Prisma.PullRequestWhereInput = {
    userId: user.id,
    ...(filters.repository ? { repositoryId: filters.repository } : {}),
    ...(selectedState ? { state: selectedState } : {}),
    ...(filters.draft === "yes"
      ? { isDraft: true }
      : filters.draft === "no"
        ? { isDraft: false }
        : {}),
    ...(filters.size === "small"
      ? { additions: { lte: threshold } }
      : filters.size === "large"
        ? { additions: { gt: threshold } }
        : {}),
    ...(filters.view === "authored" && identities.length
      ? { authorLogin: { in: identities, mode: "insensitive" } }
      : filters.view === "review" && identities.length
        ? { requestedReviewers: { hasSome: identities } }
        : filters.view === "changes"
          ? { reviews: { some: { state: "CHANGES_REQUESTED" } } }
          : filters.view === "waiting"
            ? { requestedReviewers: { isEmpty: false }, state: "OPEN" }
            : {}),
    ...(filters.provider &&
    ["GITHUB", "GITLAB", "BITBUCKET"].includes(filters.provider)
      ? {
          providerConnection: {
            provider: filters.provider as "GITHUB" | "GITLAB" | "BITBUCKET",
          },
        }
      : {}),
  };
  const [pullRequests, total] = await Promise.all([
    prisma.pullRequest.findMany({
      where,
      include: {
        repository: true,
        reviews: true,
        providerConnection: { select: { provider: true } },
      },
      orderBy: [{ urgencyScore: "desc" }, { providerUpdatedAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.pullRequest.count({ where }),
  ]);
  const pipelineRuns = await prisma.pipelineRun.findMany({
    where: {
      userId: user.id,
      commitSha: {
        in: pullRequests
          .map((pullRequest) => pullRequest.headSha)
          .filter((sha): sha is string => Boolean(sha)),
      },
    },
    select: { commitSha: true, status: true, name: true },
    orderBy: { createdAt: "desc" },
  });
  const pipelineBySha = new Map(
    pipelineRuns.map((pipeline) => [pipeline.commitSha, pipeline]),
  );
  const filterQuery = new URLSearchParams(
    Object.entries(filters).flatMap(([key, value]) =>
      value && key !== "page" ? [[key, value]] : [],
    ),
  );
  return (
    <SiteShell user={user}>
      <Panel>
        <SectionHeader
          title="Pull Requests"
          description="Authored work, review requests, CI context, size, age, and transparent urgency."
          action={
            <form className="flex max-w-3xl flex-wrap justify-end gap-2">
              <select
                name="view"
                defaultValue={filters.view ?? ""}
                className="rounded-md border border-border bg-card px-2 py-2 text-xs"
              >
                <option value="">All work</option>
                <option value="authored">Authored by me</option>
                <option value="review">My review requests</option>
                <option value="waiting">Waiting for review</option>
                <option value="changes">Changes requested</option>
              </select>
              <select
                name="state"
                defaultValue={filters.state ?? ""}
                className="rounded-md border border-border bg-card px-2 py-2 text-xs"
              >
                <option value="">All states</option>
                {allowedStates.map((state) => (
                  <option key={state}>{state}</option>
                ))}
              </select>
              <select
                name="draft"
                defaultValue={filters.draft ?? ""}
                className="rounded-md border border-border bg-card px-2 py-2 text-xs"
              >
                <option value="">Draft or ready</option>
                <option value="yes">Draft only</option>
                <option value="no">Ready only</option>
              </select>
              <select
                name="size"
                defaultValue={filters.size ?? ""}
                className="rounded-md border border-border bg-card px-2 py-2 text-xs"
              >
                <option value="">All sizes</option>
                <option value="small">Up to {threshold} added lines</option>
                <option value="large">Over {threshold} added lines</option>
              </select>
              <select
                name="provider"
                defaultValue={filters.provider ?? ""}
                className="rounded-md border border-border bg-card px-2 py-2 text-xs"
              >
                <option value="">All providers</option>
                <option>GITHUB</option>
                <option>GITLAB</option>
                <option>BITBUCKET</option>
              </select>
              <select
                name="repository"
                defaultValue={filters.repository ?? ""}
                className="max-w-48 rounded-md border border-border bg-card px-2 py-2 text-xs"
              >
                <option value="">All repositories</option>
                {repositories.map((repo) => (
                  <option key={repo.id} value={repo.id}>
                    {repo.fullName}
                  </option>
                ))}
              </select>
              <button className="rounded-md bg-teal px-3 py-2 text-xs font-bold text-navy">
                Filter
              </button>
            </form>
          }
        />
        {pullRequests.length ? (
          <div className="space-y-3">
            {pullRequests.map((pull) => (
              <a
                key={pull.id}
                href={pull.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-xl border border-border p-4 hover:border-teal/50"
              >
                <div className="flex justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase text-teal">
                      {pull.providerConnection.provider} ·{" "}
                      {pull.repository.fullName} #{pull.number}
                    </p>
                    <h2 className="mt-1 text-sm font-bold">{pull.title}</h2>
                    <p className="mt-2 text-xs text-muted">
                      {pull.state.toLowerCase()} {pull.isDraft ? "· draft" : ""}{" "}
                      · {pull.additions + pull.deletions} changed lines ·
                      updated {formatDistanceToNow(pull.providerUpdatedAt)} ago
                    </p>
                    <p className="mt-2 text-xs text-muted">
                      Reviewers requested:{" "}
                      {pull.requestedReviewers.length
                        ? pull.requestedReviewers.join(", ")
                        : "none"}{" "}
                      · Reviews: {pull.reviews.length}
                    </p>
                    {pull.headSha ? (
                      <p className="mt-2 text-xs text-muted">
                        CI:{" "}
                        {pipelineBySha.get(pull.headSha)?.name ??
                          "No matching run"}
                        {pipelineBySha.get(pull.headSha)
                          ? ` · ${pipelineBySha.get(pull.headSha)?.status.toLowerCase()}`
                          : ""}
                      </p>
                    ) : null}
                    {pull.urgencyReasons.length ? (
                      <p className="mt-2 text-xs">
                        Urgency factors: {pull.urgencyReasons.join(" · ")}
                      </p>
                    ) : null}
                    {pull.mergeConflict ? (
                      <p className="mt-2 text-xs font-bold text-red-500">
                        Merge conflict detected
                      </p>
                    ) : null}
                  </div>
                  <span
                    className="h-fit rounded-md bg-mutedBg px-3 py-2 text-lg font-extrabold"
                    title="Transparent urgency score"
                  >
                    {pull.urgencyScore}
                  </span>
                </div>
              </a>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No pull requests synced"
            body="Pull and merge requests from installed providers appear here after synchronization."
            link={{ href: "/integrations", label: "Open integrations" }}
          />
        )}
        {total > pageSize ? (
          <nav
            aria-label="Pull request pages"
            className="mt-5 flex items-center justify-between border-t border-border pt-4 text-xs"
          >
            <span>
              Page {page} of {Math.ceil(total / pageSize)} · {total} results
            </span>
            <div className="flex gap-2">
              {page > 1 ? (
                <a
                  href={`?${filterQuery.toString()}&page=${page - 1}`}
                  className="rounded-md border border-border px-3 py-2 font-bold"
                >
                  Previous
                </a>
              ) : null}
              {page * pageSize < total ? (
                <a
                  href={`?${filterQuery.toString()}&page=${page + 1}`}
                  className="rounded-md border border-border px-3 py-2 font-bold"
                >
                  Next
                </a>
              ) : null}
            </div>
          </nav>
        ) : null}
      </Panel>
    </SiteShell>
  );
}

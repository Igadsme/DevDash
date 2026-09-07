import { formatDistanceToNow } from "date-fns";
import { EmptyState, Panel, SectionHeader } from "@/components/cards";
import { SiteShell } from "@/components/site-shell";
import { getRepositoriesData } from "@/lib/data";
export const dynamic = "force-dynamic";

export default async function RepositoriesPage() {
  const data = await getRepositoriesData();
  return (
    <SiteShell user={data.user}>
      <div className="space-y-6">
        <Panel>
          <SectionHeader
            title="Workspaces"
            description="Personal accounts, organizations, groups, and Bitbucket workspaces."
          />
          {data.workspaces.length ? (
            <div className="grid gap-3 md:grid-cols-3">
              {data.workspaces.map((workspace) => (
                <div
                  key={workspace.id}
                  className="rounded-xl border border-border p-4"
                >
                  <p className="text-sm font-bold">{workspace.name}</p>
                  <p className="mt-1 text-xs text-muted">
                    {workspace.provider.toLowerCase()} ·{" "}
                    {workspace._count.repositories} repositories
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No workspaces synced"
              body="Install a provider integration to discover workspaces."
              link={{ href: "/integrations", label: "Open integrations" }}
            />
          )}
        </Panel>
        <Panel>
          <SectionHeader
            title="Repositories"
            description="Read-only repository metadata from installed providers."
          />
          {data.repositories.length ? (
            <div className="grid gap-3 lg:grid-cols-2">
              {data.repositories.map((repository) => (
                <a
                  key={repository.id}
                  href={repository.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl border border-border p-4 transition hover:border-teal/50"
                >
                  <div className="flex justify-between gap-3">
                    <p className="truncate text-sm font-bold">
                      {repository.fullName}
                    </p>
                    <span className="text-[10px] uppercase text-muted">
                      {repository.provider}
                    </span>
                  </div>
                  <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted">
                    {repository.description || "No description provided."}
                  </p>
                  <p className="mt-3 text-[11px] text-muted">
                    {repository.isPrivate ? "Private" : "Public"} ·{" "}
                    {repository.language ?? "Language unknown"}
                    {repository.pushedAt
                      ? ` · pushed ${formatDistanceToNow(repository.pushedAt)} ago`
                      : ""}
                  </p>
                  <p className="mt-2 text-[11px] text-muted">
                    {repository._count.pullRequests} PRs ·{" "}
                    {repository._count.issues} issues ·{" "}
                    {repository._count.pipelineRuns} pipelines
                  </p>
                </a>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No repositories synced"
              body="Connect a GitHub App, GitLab, or Bitbucket integration and run Sync now."
              link={{ href: "/integrations", label: "Connect provider" }}
            />
          )}
        </Panel>
      </div>
    </SiteShell>
  );
}

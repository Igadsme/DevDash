import { revalidatePath } from "next/cache";
import { formatDistanceToNow } from "date-fns";
import { Panel, SectionHeader } from "@/components/cards";
import { SignInButton } from "@/components/sign-in-button";
import { SiteShell } from "@/components/site-shell";
import { getIntegrationData, requireUser } from "@/lib/data";
import { disconnectProvider } from "@/lib/integrations/disconnect";
export const dynamic = "force-dynamic";

const providers = [
  {
    id: "GITHUB",
    label: "GitHub App",
    detail:
      "Read-only installation tokens for repositories, pull requests, issues, checks, statuses, and Actions.",
  },
  {
    id: "GITLAB",
    label: "GitLab",
    detail:
      "OAuth connection for projects, merge requests, issues, commits, pipelines, and jobs.",
  },
  {
    id: "BITBUCKET",
    label: "Bitbucket",
    detail:
      "OAuth connection for workspaces, repositories, pull requests, issues, and Pipelines.",
  },
  {
    id: "SLACK",
    label: "Slack",
    detail: "Export a weekly brief to a channel you select.",
  },
  {
    id: "NOTION",
    label: "Notion",
    detail:
      "Create a structured weekly engineering report in an authorized page.",
  },
] as const;

export default async function IntegrationsPage() {
  const data = await getIntegrationData();
  async function disconnect(formData: FormData) {
    "use server";
    const user = await requireUser();
    const id = String(formData.get("id") ?? "");
    await disconnectProvider(user.id, id);
    revalidatePath("/integrations");
  }
  return (
    <SiteShell user={data.user}>
      <div className="space-y-6">
        <Panel>
          <SectionHeader
            title="Identity authentication"
            description="GitHub sign-in requests only read:user and user:email. Repository access is a separate installation."
            action={
              !data.user ? (
                <SignInButton
                  callbackUrl="/integrations"
                  label="Sign in with GitHub"
                  disabled={!data.githubConfigured || !data.authConfigured}
                />
              ) : (
                <span className="rounded-full bg-teal/10 px-3 py-1 text-xs font-bold text-teal">
                  Signed in
                </span>
              )
            }
          />
          {!data.githubConfigured || !data.authConfigured ? (
            <p className="rounded-lg border border-amber/40 bg-amber/10 p-4 text-sm">
              Identity OAuth requires GITHUB_ID, GITHUB_SECRET, and
              NEXTAUTH_SECRET.
            </p>
          ) : null}
        </Panel>
        <div className="grid gap-4 lg:grid-cols-2">
          {providers.map((provider) => {
            const connection = data.connections.find(
              (item) => item.provider === provider.id,
            );
            const configured =
              provider.id === "GITHUB"
                ? data.githubAppConfigured
                : data.encryptionConfigured &&
                  Boolean(
                    process.env[`${provider.id}_CLIENT_ID`] &&
                    process.env[`${provider.id}_CLIENT_SECRET`],
                  );
            const latestState = connection?.syncStates[0];
            const latestJob = connection?.syncJobs[0];
            return (
              <Panel key={provider.id}>
                <SectionHeader
                  title={provider.label}
                  description={provider.detail}
                />
                <p className="text-sm font-bold">
                  {connection
                    ? connection.status.toLowerCase()
                    : configured
                      ? "Ready to connect"
                      : "Configuration required"}
                </p>
                {connection?.lastErrorCode ? (
                  <p className="mt-2 text-xs text-red-500">
                    Last error: {connection.lastErrorCode}
                  </p>
                ) : null}
                {connection &&
                ["GITHUB", "GITLAB", "BITBUCKET"].includes(provider.id) ? (
                  <dl className="mt-4 grid grid-cols-2 gap-3 rounded-lg bg-mutedBg p-3 text-xs">
                    <div>
                      <dt className="text-muted">Last successful sync</dt>
                      <dd className="mt-1 font-bold">
                        {latestState?.lastSuccessAt
                          ? `${formatDistanceToNow(latestState.lastSuccessAt)} ago`
                          : "Not yet synced"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted">Latest job</dt>
                      <dd className="mt-1 font-bold">
                        {latestJob
                          ? `${latestJob.status.toLowerCase()} · ${latestJob.progress}%`
                          : "No jobs queued"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted">Repositories</dt>
                      <dd className="mt-1 font-bold">
                        {connection._count.repositories}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted">Workspaces</dt>
                      <dd className="mt-1 font-bold">
                        {connection._count.workspaces}
                      </dd>
                    </div>
                  </dl>
                ) : null}
                <div className="mt-4 flex gap-2">
                  {connection ? (
                    <>
                      <form action={disconnect}>
                        <input type="hidden" name="id" value={connection.id} />
                        <button className="rounded-md border border-red-400/40 px-3 py-2 text-xs font-bold text-red-500">
                          Disconnect
                        </button>
                      </form>
                      {["GITHUB", "GITLAB", "BITBUCKET"].includes(
                        provider.id,
                      ) ? (
                        <form action="/api/sync" method="post">
                          <input
                            type="hidden"
                            name="connectionId"
                            value={connection.id}
                          />
                          <button className="rounded-md bg-teal px-3 py-2 text-xs font-bold text-navy">
                            Sync now
                          </button>
                        </form>
                      ) : null}
                    </>
                  ) : configured && data.user ? (
                    <a
                      href={`/api/integrations/${provider.id.toLowerCase()}/start`}
                      className="rounded-md bg-teal px-3 py-2 text-xs font-bold text-navy"
                    >
                      Connect {provider.label}
                    </a>
                  ) : (
                    <a
                      href="/settings"
                      className="rounded-md border border-border px-3 py-2 text-xs font-bold"
                    >
                      View setup requirements
                    </a>
                  )}
                </div>
              </Panel>
            );
          })}
        </div>
        <Panel>
          <SectionHeader
            title="Security boundary"
            description="Provider tokens never reach client components."
          />
          <p className="text-sm leading-7 text-muted">
            Long-lived credentials are encrypted with AES-256-GCM. GitHub App
            installation tokens are short-lived. Disconnecting removes the
            provider connection and all provider-owned normalized records
            through cascades.
          </p>
        </Panel>
      </div>
    </SiteShell>
  );
}

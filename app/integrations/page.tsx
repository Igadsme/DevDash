import { Panel, SectionHeader } from "@/components/cards";
import { SignInButton, SignOutButton } from "@/components/sign-in-button";
import { SiteShell } from "@/components/site-shell";
import { getIntegrationData } from "@/lib/data";

export default async function IntegrationsPage() {
  const data = await getIntegrationData();

  return (
    <SiteShell user={data.user}>
      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <Panel>
          <SectionHeader
            title="GitHub Connection"
            description="Server-side only, read-oriented integration for developer workflows."
            action={data.githubConnected ? <SignOutButton /> : <SignInButton callbackUrl="/integrations" label="Connect GitHub" disabled={!data.githubConfigured || !data.authConfigured} />}
          />
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm text-slate-400">Connection status</p>
            <p className="mt-2 text-2xl font-semibold text-white">
              {data.githubConnected ? "Connected" : data.githubConfigured ? "Ready to connect" : "Setup required"}
            </p>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              DevDash fetches repositories, recent commits, pull requests, review requests,
              assigned issues, and CI status on the server, then normalizes activity into private records for your dashboard.
            </p>
          </div>
          {!data.githubConfigured ? (
            <div className="mt-4 rounded-lg border border-amber/50 bg-amber/10 p-4 text-[12px] leading-5 text-inkText">
              Add <span className="font-mono">GITHUB_ID</span> and <span className="font-mono">GITHUB_SECRET</span> to <span className="font-mono">.env</span>, then restart the app to enable GitHub sign-in.
            </div>
          ) : null}
        </Panel>

        <Panel>
          <SectionHeader
            title="Data Access"
            description="What DevDash does and does not do."
          />
          <div className="space-y-4 text-sm leading-7 text-slate-300">
            <p>Everything is private by default. No org-wide dashboards, no surveillance views, and no automatic sharing.</p>
            <p>No client-side GitHub calls are made. Access tokens are only used on the server to fetch the activity needed for your dashboard.</p>
            <p>No time tracking, notifications, webhooks, or background monitoring are enabled in this MVP.</p>
          </div>
          <div className="mt-5 grid gap-2 text-[11px] sm:grid-cols-3">
            <span className={`rounded-md border p-2 ${data.authConfigured ? "border-teal/40 bg-teal/10" : "border-red-400/40 bg-red-400/10"}`}>Session security: {data.authConfigured ? "ready" : "missing"}</span>
            <span className={`rounded-md border p-2 ${data.githubConfigured ? "border-teal/40 bg-teal/10" : "border-amber/40 bg-amber/10"}`}>GitHub OAuth: {data.githubConfigured ? "ready" : "missing"}</span>
            <span className={`rounded-md border p-2 ${data.openAiConfigured ? "border-teal/40 bg-teal/10" : "border-border bg-mutedBg"}`}>AI summaries: {data.openAiConfigured ? "ready" : "local fallback"}</span>
          </div>
        </Panel>
      </div>
    </SiteShell>
  );
}

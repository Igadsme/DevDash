import { Panel, SectionHeader } from "@/components/cards";
import { SiteShell } from "@/components/site-shell";
import { requireUser } from "@/lib/data";
export const dynamic = "force-dynamic";
export default async function PrivacyPage() {
  const user = await requireUser();
  return (
    <SiteShell user={user}>
      <div className="space-y-6">
        <Panel>
          <SectionHeader
            title="Privacy & Data Management"
            description="Your records are scoped to your account and provider credentials remain server-side."
          />
          <div className="space-y-3 text-sm leading-7 text-muted">
            <p>
              AI is opt-in and currently{" "}
              <strong className="text-inkText">
                {user.settings.aiEnabled ? "enabled" : "disabled"}
              </strong>
              . Private repositories are{" "}
              <strong className="text-inkText">
                {user.settings.excludePrivateFromAi ? "excluded" : "included"}
              </strong>{" "}
              from AI processing.
            </p>
            <p>
              Retention is set to {user.settings.retentionDays} days. Cleanup
              removes expired activity and export records while preserving
              authentication and current settings.
            </p>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <a
              href="/api/account/export"
              className="rounded-md bg-teal px-4 py-2 text-sm font-bold text-navy"
            >
              Export my data
            </a>
            <a
              href="/settings"
              className="rounded-md border border-border px-4 py-2 text-sm font-bold"
            >
              Change privacy settings
            </a>
          </div>
        </Panel>
        <Panel>
          <SectionHeader
            title="Delete account"
            description="Permanently deletes your user and all associated records through database cascades."
          />
          <form
            action="/api/account"
            method="post"
            className="flex flex-col gap-3 sm:flex-row sm:items-end"
          >
            <label className="text-xs font-bold">
              Type DELETE to confirm
              <input
                name="confirmation"
                pattern="DELETE"
                required
                className="mt-1 w-full rounded-md border border-red-400/40 bg-transparent px-3 py-2 text-sm"
              />
            </label>
            <button className="rounded-md bg-red-600 px-4 py-2 text-sm font-bold text-white">
              Delete my account
            </button>
          </form>
        </Panel>
      </div>
    </SiteShell>
  );
}

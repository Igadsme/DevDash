import { revalidatePath } from "next/cache";
import { Panel, SectionHeader } from "@/components/cards";
import { SiteShell } from "@/components/site-shell";
import { requireUser } from "@/lib/data";
import { prisma } from "@/lib/prisma";
import { settingsSchema } from "@/lib/validation";
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await requireUser();
  async function save(formData: FormData) {
    "use server";
    const current = await requireUser();
    const parsed = settingsSchema.safeParse({
      theme: formData.get("theme"),
      aiEnabled: formData.get("aiEnabled") === "on",
      excludePrivateFromAi: formData.get("excludePrivateFromAi") === "on",
      privateRepositories: formData.get("privateRepositories") === "on",
      smallPrThreshold: Number(formData.get("smallPrThreshold")),
      interruptionCostMinutes: Number(formData.get("interruptionCostMinutes")),
      timezone: formData.get("timezone"),
      retentionDays: Number(formData.get("retentionDays")),
      notifyReviews: formData.get("notifyReviews") === "on",
      notifyPipelines: formData.get("notifyPipelines") === "on",
      notifyTasks: formData.get("notifyTasks") === "on",
      notifySyncFailures: formData.get("notifySyncFailures") === "on",
    });
    if (!parsed.success)
      throw new Error(parsed.error.issues[0]?.message ?? "Invalid settings.");
    await prisma.userSettings.upsert({
      where: { userId: current.id },
      create: { userId: current.id, ...parsed.data },
      update: parsed.data,
    });
    revalidatePath("/settings");
    revalidatePath("/dashboard");
  }
  const checkbox = "h-5 w-5 accent-teal";
  return (
    <SiteShell user={user}>
      <Panel className="max-w-4xl">
        <SectionHeader
          title="Settings"
          description="Every control below is persisted and used by the application."
        />
        <form action={save} className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-xs font-bold">
              Theme
              <select
                name="theme"
                defaultValue={user.settings.theme}
                className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm"
              >
                <option value="system">System</option>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </label>
            <label className="text-xs font-bold">
              Timezone
              <input
                name="timezone"
                defaultValue={user.settings.timezone}
                className="mt-1 w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm"
              />
            </label>
            <label className="text-xs font-bold">
              Small PR threshold
              <input
                type="number"
                min={10}
                max={2000}
                name="smallPrThreshold"
                defaultValue={user.settings.smallPrThreshold}
                className="mt-1 w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm"
              />
            </label>
            <label className="text-xs font-bold">
              Estimated interruption cost (minutes)
              <input
                type="number"
                min={5}
                max={60}
                name="interruptionCostMinutes"
                defaultValue={user.settings.interruptionCostMinutes}
                className="mt-1 w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm"
              />
            </label>
            <label className="text-xs font-bold">
              Data retention (days)
              <input
                type="number"
                min={7}
                max={3650}
                name="retentionDays"
                defaultValue={user.settings.retentionDays}
                className="mt-1 w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm"
              />
            </label>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {[
              ["aiEnabled", "Enable AI processing", user.settings.aiEnabled],
              [
                "excludePrivateFromAi",
                "Exclude private repositories from AI",
                user.settings.excludePrivateFromAi,
              ],
              [
                "privateRepositories",
                "Sync private repositories",
                user.settings.privateRepositories,
              ],
              [
                "notifyReviews",
                "Review notifications",
                user.settings.notifyReviews,
              ],
              [
                "notifyPipelines",
                "Pipeline notifications",
                user.settings.notifyPipelines,
              ],
              [
                "notifyTasks",
                "Task deadline notifications",
                user.settings.notifyTasks,
              ],
              [
                "notifySyncFailures",
                "Sync failure notifications",
                user.settings.notifySyncFailures,
              ],
            ].map(([name, label, checked]) => (
              <label
                key={String(name)}
                className="flex items-center justify-between rounded-xl border border-border p-4 text-sm font-semibold"
              >
                <span>{String(label)}</span>
                <input
                  type="checkbox"
                  name={String(name)}
                  defaultChecked={Boolean(checked)}
                  className={checkbox}
                />
              </label>
            ))}
          </div>
          <button className="rounded-md bg-teal px-4 py-2 text-sm font-bold text-navy">
            Save settings
          </button>
        </form>
      </Panel>
    </SiteShell>
  );
}

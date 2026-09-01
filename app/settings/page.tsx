import { revalidatePath } from "next/cache";

import { Button } from "@/components/button";
import { Panel, SectionHeader } from "@/components/cards";
import { SiteShell } from "@/components/site-shell";
import { requireUser } from "@/lib/data";
import { prisma } from "@/lib/prisma";
import { parseBoundedInteger } from "@/lib/utils";

export default async function SettingsPage() {
  const user = await requireUser();

  async function updateSettings(formData: FormData) {
    "use server";

    const currentUser = await requireUser();

    await prisma.user.update({
      where: {
        id: currentUser.id
      },
      data: {
        privateByDefault: formData.get("privateByDefault") === "on",
        aiEnabled: formData.get("aiEnabled") === "on",
        focusMinutes: parseBoundedInteger(formData.get("focusMinutes"), currentUser.focusMinutes, 5, 60),
        smallPrThreshold: parseBoundedInteger(formData.get("smallPrThreshold"), currentUser.smallPrThreshold, 10, 1000)
      }
    });

    revalidatePath("/settings");
    revalidatePath("/dashboard");
    revalidatePath("/focus");
  }

  return (
    <SiteShell user={user}>
      <Panel className="max-w-3xl">
        <SectionHeader
          title="Settings"
          description="Privacy toggles, ranking preferences, and AI controls."
        />
        <form action={updateSettings} className="space-y-6">
          <label className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4">
            <div>
              <p className="font-medium text-white">Private by default</p>
              <p className="text-sm text-slate-400">Keep data visible only to the signed-in developer.</p>
            </div>
            <input
              type="checkbox"
              name="privateByDefault"
              defaultChecked={user.privateByDefault}
              className="h-5 w-5 rounded border-white/20 bg-transparent"
            />
          </label>

          <label className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4">
            <div>
              <p className="font-medium text-white">Enable AI summaries</p>
              <p className="text-sm text-slate-400">Use the OpenAI API for grounded weekly narrative summaries.</p>
            </div>
            <input
              type="checkbox"
              name="aiEnabled"
              defaultChecked={user.aiEnabled}
              className="h-5 w-5 rounded border-white/20 bg-transparent"
            />
          </label>

          <label className="block rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="font-medium text-white">Interruption cost per switch</p>
            <p className="mb-3 text-sm text-slate-400">Used to estimate how expensive each context switch is.</p>
            <input
              type="number"
              min={5}
              max={60}
              name="focusMinutes"
              defaultValue={user.focusMinutes}
              className="w-full rounded-xl border border-white/10 bg-panel px-3 py-2 text-white outline-none"
            />
          </label>

          <label className="block rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="font-medium text-white">Small PR threshold</p>
            <p className="mb-3 text-sm text-slate-400">PRs under this changed-line count get a quick-win urgency bonus.</p>
            <input
              type="number"
              min={10}
              max={1000}
              name="smallPrThreshold"
              defaultValue={user.smallPrThreshold}
              className="w-full rounded-xl border border-white/10 bg-panel px-3 py-2 text-white outline-none"
            />
          </label>

          <Button type="submit" className="bg-accent text-ink hover:bg-accent">
            Save settings
          </Button>
        </form>
      </Panel>
    </SiteShell>
  );
}

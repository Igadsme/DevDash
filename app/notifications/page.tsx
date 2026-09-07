import { revalidatePath } from "next/cache";
import { EmptyState, Panel, SectionHeader } from "@/components/cards";
import { SiteShell } from "@/components/site-shell";
import { requireUser } from "@/lib/data";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";
export default async function NotificationsPage() {
  const user = await requireUser();
  const notifications = await prisma.notification.findMany({
    where: { userId: user.id, dismissedAt: null },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  async function mutate(formData: FormData) {
    "use server";
    const current = await requireUser();
    const action = formData.get("action");
    const id = String(formData.get("id") ?? "");
    if (action === "read-all")
      await prisma.notification.updateMany({
        where: { userId: current.id, readAt: null },
        data: { readAt: new Date() },
      });
    else if (action === "read")
      await prisma.notification.updateMany({
        where: { userId: current.id, id },
        data: { readAt: new Date() },
      });
    else if (action === "dismiss")
      await prisma.notification.updateMany({
        where: { userId: current.id, id },
        data: { dismissedAt: new Date() },
      });
    revalidatePath("/notifications");
  }
  return (
    <SiteShell user={user}>
      <Panel>
        <SectionHeader
          title="Notifications"
          description="Stored alerts generated from review requests, pipelines, deadlines, syncs, and exports."
          action={
            notifications.some((item) => !item.readAt) ? (
              <form action={mutate}>
                <button
                  name="action"
                  value="read-all"
                  className="rounded-md border border-border px-3 py-2 text-xs font-bold"
                >
                  Mark all read
                </button>
              </form>
            ) : null
          }
        />
        {notifications.length ? (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <article
                key={notification.id}
                className={`rounded-xl border p-4 ${notification.readAt ? "border-border" : "border-teal/50 bg-teal/5"}`}
              >
                <p className="text-[10px] font-bold uppercase text-teal">
                  {notification.type.toLowerCase().replaceAll("_", " ")}
                </p>
                <h2 className="mt-1 text-sm font-bold">{notification.title}</h2>
                <p className="mt-2 text-sm text-muted">{notification.body}</p>
                <div className="mt-3 flex gap-2">
                  {notification.href ? (
                    <a
                      href={notification.href}
                      className="rounded-md bg-teal px-3 py-2 text-xs font-bold text-navy"
                    >
                      Open
                    </a>
                  ) : null}
                  {!notification.readAt ? (
                    <form action={mutate}>
                      <input type="hidden" name="id" value={notification.id} />
                      <button
                        name="action"
                        value="read"
                        className="rounded-md border border-border px-3 py-2 text-xs font-bold"
                      >
                        Mark read
                      </button>
                    </form>
                  ) : null}
                  <form action={mutate}>
                    <input type="hidden" name="id" value={notification.id} />
                    <button
                      name="action"
                      value="dismiss"
                      className="rounded-md border border-border px-3 py-2 text-xs font-bold"
                    >
                      Dismiss
                    </button>
                  </form>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No notifications"
            body="You are caught up. New alerts are created only from real stored records."
          />
        )}
      </Panel>
    </SiteShell>
  );
}

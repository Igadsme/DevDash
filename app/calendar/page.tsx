import { addDays, endOfMonth, startOfMonth } from "date-fns";
import { EmptyState, Panel, SectionHeader } from "@/components/cards";
import { SiteShell } from "@/components/site-shell";
import { requireUser } from "@/lib/data";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";
export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; repository?: string; type?: string }>;
}) {
  const user = await requireUser();
  const { view = "agenda", repository, type } = await searchParams;
  const now = new Date();
  const from = view === "month" ? startOfMonth(now) : now;
  const to =
    view === "month" ? endOfMonth(now) : addDays(now, view === "week" ? 7 : 30);
  const [calendarEvents, tasks, focus, providerEvents, repositories] =
    await Promise.all([
      prisma.calendarEvent.findMany({
        where: {
          userId: user.id,
          startsAt: { gte: from, lte: to },
          ...(repository ? { repositoryId: repository } : {}),
        },
        orderBy: { startsAt: "asc" },
      }),
      prisma.task.findMany({
        where: {
          userId: user.id,
          dueAt: { gte: from, lte: to },
          ...(repository ? { repositoryId: repository } : {}),
        },
        orderBy: { dueAt: "asc" },
      }),
      prisma.focusSession.findMany({
        where: {
          userId: user.id,
          startedAt: { gte: from, lte: to },
          ...(repository ? { repositoryId: repository } : {}),
        },
        orderBy: { startedAt: "asc" },
      }),
      prisma.activityEvent.findMany({
        where: {
          userId: user.id,
          occurredAt: { gte: from, lte: to },
          provider: { not: null },
          ...(repository ? { repositoryId: repository } : {}),
        },
        orderBy: { occurredAt: "asc" },
        take: 500,
      }),
      prisma.repository.findMany({
        where: { userId: user.id },
        select: { id: true, fullName: true },
        orderBy: { fullName: "asc" },
      }),
    ]);
  const items = [
    ...(type === "TASK_DUE" || type === "FOCUS_SESSION"
      ? []
      : calendarEvents
          .filter((event) => !type || event.type === type)
          .map((event) => ({
            id: `event-${event.id}`,
            title: event.title,
            at: event.startsAt,
            type: event.type.toLowerCase().replaceAll("_", " "),
            href: event.sourceUrl,
          }))),
    ...(type && type !== "TASK_DUE"
      ? []
      : tasks.map((task) => ({
          id: `task-${task.id}`,
          title: task.title,
          at: task.dueAt!,
          type: "task due",
          href: "/tasks",
        }))),
    ...(type && type !== "FOCUS_SESSION"
      ? []
      : focus.map((session) => ({
          id: `focus-${session.id}`,
          title: `${session.plannedMinutes}-minute focus session`,
          at: session.startedAt,
          type: "focus session",
          href: "/focus",
        }))),
    ...(type && type !== "PROVIDER_EVENT"
      ? []
      : providerEvents.map((event) => ({
          id: `provider-${event.id}`,
          title: event.title,
          at: event.occurredAt,
          type: event.type.toLowerCase().replaceAll("_", " "),
          href: event.sourceUrl,
        }))),
  ].sort((a, b) => a.at.getTime() - b.at.getTime());
  return (
    <SiteShell user={user}>
      <Panel>
        <SectionHeader
          title="Calendar"
          description={`Timezone: ${user.settings.timezone}. Task deadlines, focus sessions, and stored provider events.`}
          action={
            <form className="flex flex-wrap justify-end gap-2">
              <select
                name="repository"
                defaultValue={repository ?? ""}
                className="rounded-md border border-border bg-card px-3 py-2 text-xs"
              >
                <option value="">All repositories</option>
                {repositories.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.fullName}
                  </option>
                ))}
              </select>
              <select
                name="type"
                defaultValue={type ?? ""}
                className="rounded-md border border-border bg-card px-3 py-2 text-xs"
              >
                <option value="">All event types</option>
                <option value="TASK_DUE">Task deadlines</option>
                <option value="FOCUS_SESSION">Focus sessions</option>
                <option value="REVIEW_DEADLINE">Review deadlines</option>
                <option value="PROVIDER_EVENT">Provider events</option>
                <option value="PERSONAL">Personal events</option>
              </select>
              {["agenda", "week", "month"].map((value) => (
                <button
                  key={value}
                  name="view"
                  value={value}
                  className={`rounded-md px-3 py-2 text-xs font-bold ${view === value ? "bg-teal text-navy" : "border border-border"}`}
                >
                  {value}
                </button>
              ))}
            </form>
          }
        />
        {items.length ? (
          <div className="space-y-3">
            {items.map((item) => (
              <article
                key={item.id}
                className="flex justify-between gap-4 rounded-xl border border-border p-4"
              >
                <div>
                  <p className="text-xs font-bold text-teal">{item.type}</p>
                  {item.href ? (
                    <a
                      href={item.href}
                      target={
                        item.href.startsWith("http") ? "_blank" : undefined
                      }
                      rel={
                        item.href.startsWith("http")
                          ? "noopener noreferrer"
                          : undefined
                      }
                      className="mt-1 block text-sm font-bold hover:text-teal"
                    >
                      {item.title}
                    </a>
                  ) : (
                    <h2 className="mt-1 text-sm font-bold">{item.title}</h2>
                  )}
                </div>
                <time className="text-right text-xs text-muted">
                  {new Intl.DateTimeFormat("en-US", {
                    dateStyle: "medium",
                    timeStyle: "short",
                    timeZone: user.settings.timezone,
                  }).format(item.at)}
                </time>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No calendar items"
            body="Task deadlines, focus sessions, and provider events in this range will appear here."
            link={{ href: "/tasks", label: "Create a task" }}
          />
        )}
      </Panel>
    </SiteShell>
  );
}

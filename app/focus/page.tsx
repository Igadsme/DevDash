import { formatDistanceToNow } from "date-fns";
import { EmptyState, Panel, SectionHeader } from "@/components/cards";
import { FocusTimer } from "@/components/focus-timer";
import { SiteShell } from "@/components/site-shell";
import { getFocusData } from "@/lib/data";
export const dynamic = "force-dynamic";
export default async function FocusPage() {
  const data = await getFocusData();
  const active =
    data.sessions.find(
      (session) => session.status === "RUNNING" || session.status === "PAUSED",
    ) ?? null;
  return (
    <SiteShell user={data.user}>
      <div className="space-y-6">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[.18em] text-teal">
            Deep work
          </p>
          <h1 className="mt-2 text-3xl font-extrabold">Focus</h1>
          <p className="mt-2 text-sm text-muted">
            A persistent Pomodoro timer plus clearly labeled activity-based
            estimates.
          </p>
        </div>
        <FocusTimer
          initialSession={active}
          repositories={data.repositories}
          tasks={data.tasks}
        />
        <div className="grid gap-6 lg:grid-cols-2">
          <Panel>
            <SectionHeader
              title="Estimated context switches"
              description="Adjacent provider events do not prove working time."
            />
            <p className="text-4xl font-extrabold">{data.estimate.switches}</p>
            <p className="mt-2 text-sm text-muted">
              Estimated cost: {data.estimate.estimatedMinutesLost} minutes.{" "}
              {data.estimate.disclaimer}
            </p>
            {data.estimate.strongestWindow ? (
              <p className="mt-3 text-sm">
                Longest observed interval:{" "}
                {Math.round(
                  (data.estimate.strongestWindow.end.getTime() -
                    data.estimate.strongestWindow.start.getTime()) /
                    60_000,
                )}{" "}
                minutes.
              </p>
            ) : null}
          </Panel>
          <Panel>
            <SectionHeader
              title="Session history"
              description="Completed, canceled, and paused sessions."
            />
            {data.sessions.length ? (
              <div className="space-y-2">
                {data.sessions.slice(0, 10).map((session) => (
                  <div
                    key={session.id}
                    className="rounded-lg border border-border p-3"
                  >
                    <p className="text-sm font-bold">
                      {session.plannedMinutes} minutes ·{" "}
                      {session.status.toLowerCase()}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      Started {formatDistanceToNow(session.startedAt)} ago
                      {session.repository
                        ? ` · ${session.repository.fullName}`
                        : ""}
                      {session.task ? ` · ${session.task.title}` : ""}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No focus sessions"
                body="Start a timer to create your first persisted focus session."
              />
            )}
          </Panel>
        </div>
      </div>
    </SiteShell>
  );
}

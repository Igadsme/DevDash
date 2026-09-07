"use client";

import { useEffect, useState } from "react";
import type { FocusSession, Repository, Task } from "@prisma/client";
import { focusSecondsRemaining } from "@/lib/focus";

export function FocusTimer({
  initialSession,
  repositories,
  tasks,
}: {
  initialSession: FocusSession | null;
  repositories: Pick<Repository, "id" | "fullName">[];
  tasks: Pick<Task, "id" | "title">[];
}) {
  const [session, setSession] = useState(initialSession);
  const [remaining, setRemaining] = useState(() =>
    focusSecondsRemaining(initialSession),
  );
  const [error, setError] = useState("");
  useEffect(() => {
    const interval = window.setInterval(
      () => setRemaining(focusSecondsRemaining(session)),
      1_000,
    );
    return () => window.clearInterval(interval);
  }, [session]);
  async function start(formData: FormData) {
    setError("");
    const response = await fetch("/api/focus", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        plannedMinutes: Number(formData.get("plannedMinutes")),
        repositoryId: formData.get("repositoryId") || null,
        taskId: formData.get("taskId") || null,
      }),
    });
    const body = await response.json();
    if (!response.ok) return setError(body.error);
    setSession({
      ...body,
      startedAt: new Date(body.startedAt),
      pausedAt: null,
      completedAt: null,
      canceledAt: null,
    });
    setRemaining(body.plannedMinutes * 60);
  }
  async function act(action: "pause" | "resume" | "complete" | "cancel") {
    if (!session) return;
    const response = await fetch(`/api/focus/${session.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const body = await response.json();
    if (!response.ok) return setError(body.error);
    setSession(
      ["complete", "cancel"].includes(action)
        ? null
        : {
            ...body,
            startedAt: new Date(body.startedAt),
            pausedAt: body.pausedAt ? new Date(body.pausedAt) : null,
          },
    );
  }
  const minutes = Math.floor(remaining / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (remaining % 60).toString().padStart(2, "0");
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div
        aria-live="polite"
        className="text-center font-mono text-6xl font-extrabold"
      >
        {minutes}:{seconds}
      </div>
      {session ? (
        <div className="mt-6 flex justify-center gap-2">
          {session.status === "PAUSED" ? (
            <button
              onClick={() => void act("resume")}
              className="rounded-md bg-teal px-4 py-2 text-sm font-bold text-navy"
            >
              Resume
            </button>
          ) : (
            <button
              onClick={() => void act("pause")}
              className="rounded-md border border-border px-4 py-2 text-sm font-bold"
            >
              Pause
            </button>
          )}
          <button
            onClick={() => void act("complete")}
            className="rounded-md border border-border px-4 py-2 text-sm font-bold"
          >
            Complete
          </button>
          <button
            onClick={() => void act("cancel")}
            className="rounded-md border border-red-400/40 px-4 py-2 text-sm font-bold text-red-500"
          >
            Cancel
          </button>
        </div>
      ) : (
        <form
          action={start}
          className="mx-auto mt-6 grid max-w-xl gap-3 sm:grid-cols-2"
        >
          <label className="text-xs font-bold">
            Minutes
            <input
              type="number"
              name="plannedMinutes"
              min={5}
              max={180}
              defaultValue={25}
              className="mt-1 w-full rounded-md border border-border bg-transparent px-3 py-2"
            />
          </label>
          <label className="text-xs font-bold">
            Repository
            <select
              name="repositoryId"
              className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2"
            >
              <option value="">None</option>
              {repositories.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.fullName}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-bold sm:col-span-2">
            Task
            <select
              name="taskId"
              className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2"
            >
              <option value="">None</option>
              {tasks.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title}
                </option>
              ))}
            </select>
          </label>
          <button className="rounded-md bg-teal px-4 py-2 text-sm font-bold text-navy sm:col-span-2">
            Start focus session
          </button>
        </form>
      )}
      {error ? (
        <p role="alert" className="mt-4 text-center text-sm text-red-500">
          {error}
        </p>
      ) : null}
    </div>
  );
}

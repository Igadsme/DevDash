"use client";

import type { Repository, Task } from "@prisma/client";
import { useMemo, useState, useTransition } from "react";

type RelatedItem = {
  id: string;
  repositoryId: string;
  number: number;
  title: string;
  url: string;
  repository: { fullName: string };
};

type TaskPatch = Partial<
  Pick<
    Task,
    | "title"
    | "description"
    | "priority"
    | "status"
    | "repositoryId"
    | "pullRequestId"
    | "issueId"
    | "tags"
  >
> & { dueAt?: string | null };

function parseRelated(value: FormDataEntryValue | null) {
  const [kind, id] = String(value ?? "").split(":");
  return {
    pullRequestId: kind === "pr" && id ? id : null,
    issueId: kind === "issue" && id ? id : null,
  };
}

function localDateTime(value: Date | string | null) {
  if (!value) return "";
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function hydrateTask(task: Task): Task {
  return {
    ...task,
    dueAt: task.dueAt ? new Date(task.dueAt) : null,
    completedAt: task.completedAt ? new Date(task.completedAt) : null,
    createdAt: new Date(task.createdAt),
    updatedAt: new Date(task.updatedAt),
  };
}

export function TaskManager({
  initialTasks,
  repositories,
  pullRequests,
  issues,
}: {
  initialTasks: Task[];
  repositories: Pick<Repository, "id" | "fullName">[];
  pullRequests: RelatedItem[];
  issues: RelatedItem[];
}) {
  const [tasks, setTasks] = useState(initialTasks);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("OPEN");
  const [priority, setPriority] = useState("ALL");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const repositoryNames = useMemo(
    () =>
      new Map(
        repositories.map((repository) => [repository.id, repository.fullName]),
      ),
    [repositories],
  );
  const relatedItems = useMemo(
    () =>
      new Map<string, RelatedItem & { kind: "PR" | "Issue" }>([
        ...pullRequests.map(
          (item) => [item.id, { ...item, kind: "PR" }] as const,
        ),
        ...issues.map((item) => [item.id, { ...item, kind: "Issue" }] as const),
      ]),
    [pullRequests, issues],
  );
  const visible = useMemo(
    () =>
      tasks.filter(
        (task) =>
          task.title.toLowerCase().includes(query.toLowerCase()) &&
          (status === "ALL" ||
            (status === "OPEN"
              ? task.status !== "COMPLETED"
              : task.status === status)) &&
          (priority === "ALL" || task.priority === priority),
      ),
    [tasks, query, status, priority],
  );

  async function createTask(formData: FormData) {
    setError("");
    const related = parseRelated(formData.get("related"));
    const optimistic: Task = {
      id: `temp-${Date.now()}`,
      userId: "",
      title: String(formData.get("title")),
      description: String(formData.get("description") || "") || null,
      priority: String(formData.get("priority")) as Task["priority"],
      status: "TODO",
      dueAt: formData.get("dueAt")
        ? new Date(String(formData.get("dueAt")))
        : null,
      repositoryId: String(formData.get("repositoryId") || "") || null,
      ...related,
      tags: String(formData.get("tags") || "")
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      completedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const previous = tasks;
    setTasks((items) => [optimistic, ...items]);
    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: optimistic.title,
          description: optimistic.description ?? undefined,
          priority: optimistic.priority,
          dueAt: optimistic.dueAt?.toISOString() ?? null,
          repositoryId: optimistic.repositoryId,
          pullRequestId: optimistic.pullRequestId,
          issueId: optimistic.issueId,
          tags: optimistic.tags,
        }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error);
      const created = hydrateTask(body as Task);
      setTasks((items) =>
        items.map((item) => (item.id === optimistic.id ? created : item)),
      );
    } catch (caught) {
      setTasks(previous);
      setError(
        caught instanceof Error ? caught.message : "Task creation failed.",
      );
    }
  }

  async function update(id: string, patch: TaskPatch) {
    setError("");
    const previous = tasks;
    setTasks((items) =>
      items.map((item) =>
        item.id === id
          ? {
              ...item,
              ...patch,
              dueAt:
                patch.dueAt === undefined
                  ? item.dueAt
                  : patch.dueAt
                    ? new Date(patch.dueAt)
                    : null,
            }
          : item,
      ),
    );
    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(patch),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error);
      const saved = hydrateTask(body as Task);
      setTasks((items) => items.map((item) => (item.id === id ? saved : item)));
      setEditingId(null);
    } catch (caught) {
      setTasks(previous);
      setError(
        caught instanceof Error ? caught.message : "Task update failed.",
      );
    }
  }

  function saveEdit(task: Task, formData: FormData) {
    const related = parseRelated(formData.get("related"));
    return update(task.id, {
      title: String(formData.get("title")),
      description: String(formData.get("description") || "") || null,
      priority: String(formData.get("priority")) as Task["priority"],
      status: String(formData.get("status")) as Task["status"],
      dueAt: formData.get("dueAt")
        ? new Date(String(formData.get("dueAt"))).toISOString()
        : null,
      repositoryId: String(formData.get("repositoryId") || "") || null,
      ...related,
      tags: String(formData.get("tags") || "")
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    });
  }

  async function remove(id: string) {
    if (!window.confirm("Delete this task? This cannot be undone.")) return;
    setError("");
    const previous = tasks;
    setTasks((items) => items.filter((item) => item.id !== id));
    try {
      const response = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Task deletion failed.");
    } catch (caught) {
      setTasks(previous);
      setError(
        caught instanceof Error ? caught.message : "Task deletion failed.",
      );
    }
  }

  const fields = (defaults?: Task) => (
    <>
      <label className="text-xs font-bold">
        Title
        <input
          required
          name="title"
          maxLength={160}
          defaultValue={defaults?.title}
          className="mt-1 w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm"
        />
      </label>
      <label className="text-xs font-bold">
        Priority
        <select
          name="priority"
          defaultValue={defaults?.priority ?? "MEDIUM"}
          className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm"
        >
          {(["LOW", "MEDIUM", "HIGH", "URGENT"] as const).map((value) => (
            <option key={value}>{value}</option>
          ))}
        </select>
      </label>
      {defaults ? (
        <label className="text-xs font-bold">
          Status
          <select
            name="status"
            defaultValue={defaults.status}
            className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm"
          >
            {(["TODO", "IN_PROGRESS", "BLOCKED", "COMPLETED"] as const).map(
              (value) => (
                <option key={value}>{value}</option>
              ),
            )}
          </select>
        </label>
      ) : null}
      <label className="text-xs font-bold">
        Due date
        <input
          type="datetime-local"
          name="dueAt"
          defaultValue={localDateTime(defaults?.dueAt ?? null)}
          className="mt-1 w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm"
        />
      </label>
      <label className="text-xs font-bold">
        Repository
        <select
          name="repositoryId"
          defaultValue={defaults?.repositoryId ?? ""}
          className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm"
        >
          <option value="">None</option>
          {repositories.map((repo) => (
            <option key={repo.id} value={repo.id}>
              {repo.fullName}
            </option>
          ))}
        </select>
      </label>
      <label className="text-xs font-bold">
        Related PR or issue
        <select
          name="related"
          defaultValue={
            defaults?.pullRequestId
              ? `pr:${defaults.pullRequestId}`
              : defaults?.issueId
                ? `issue:${defaults.issueId}`
                : ""
          }
          className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm"
        >
          <option value="">None</option>
          <optgroup label="Pull requests">
            {pullRequests.map((item) => (
              <option key={item.id} value={`pr:${item.id}`}>
                {item.repository.fullName} #{item.number} — {item.title}
              </option>
            ))}
          </optgroup>
          <optgroup label="Issues">
            {issues.map((item) => (
              <option key={item.id} value={`issue:${item.id}`}>
                {item.repository.fullName} #{item.number} — {item.title}
              </option>
            ))}
          </optgroup>
        </select>
      </label>
      <label className="text-xs font-bold md:col-span-2">
        Description
        <textarea
          name="description"
          maxLength={4000}
          defaultValue={defaults?.description ?? ""}
          className="mt-1 min-h-20 w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm"
        />
      </label>
      <label className="text-xs font-bold">
        Tags, comma separated
        <input
          name="tags"
          defaultValue={defaults?.tags.join(", ")}
          className="mt-1 w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm"
        />
      </label>
    </>
  );

  return (
    <div className="space-y-6">
      <form
        action={(data) => startTransition(() => void createTask(data))}
        className="grid gap-3 rounded-xl border border-border bg-card p-4 md:grid-cols-2"
      >
        {fields()}
        <button
          disabled={pending}
          className="self-end rounded-md bg-teal px-4 py-2 text-sm font-bold text-navy disabled:opacity-50"
        >
          {pending ? "Creating…" : "Create task"}
        </button>
      </form>
      {error ? (
        <p
          role="alert"
          className="rounded-md border border-red-400/40 bg-red-400/10 p-3 text-sm"
        >
          {error}
        </p>
      ) : null}
      <div className="grid gap-3 md:grid-cols-3">
        <input
          aria-label="Search tasks"
          placeholder="Search tasks…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="rounded-md border border-border bg-card px-3 py-2 text-sm"
        />
        <select
          aria-label="Filter by status"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="rounded-md border border-border bg-card px-3 py-2 text-sm"
        >
          <option value="OPEN">Open tasks</option>
          <option value="ALL">All statuses</option>
          <option value="TODO">To do</option>
          <option value="IN_PROGRESS">In progress</option>
          <option value="BLOCKED">Blocked</option>
          <option value="COMPLETED">Completed</option>
        </select>
        <select
          aria-label="Filter by priority"
          value={priority}
          onChange={(event) => setPriority(event.target.value)}
          className="rounded-md border border-border bg-card px-3 py-2 text-sm"
        >
          <option value="ALL">All priorities</option>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
          <option value="URGENT">Urgent</option>
        </select>
      </div>
      <p className="text-xs text-muted" aria-live="polite">
        Showing {visible.length} of {tasks.length} tasks.
      </p>
      <div className="space-y-3">
        {visible.map((task) =>
          editingId === task.id ? (
            <form
              key={task.id}
              action={(data) =>
                startTransition(() => void saveEdit(task, data))
              }
              className="grid gap-3 rounded-xl border border-teal/50 bg-card p-4 md:grid-cols-2"
            >
              {fields(task)}
              <div className="flex gap-2 self-end">
                <button
                  disabled={pending}
                  className="rounded-md bg-teal px-4 py-2 text-xs font-bold text-navy"
                >
                  Save changes
                </button>
                <button
                  type="button"
                  onClick={() => setEditingId(null)}
                  className="rounded-md border border-border px-4 py-2 text-xs font-bold"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <article
              key={task.id}
              className="rounded-xl border border-border bg-card p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-sm font-bold">{task.title}</h2>
                  <p className="mt-1 text-xs text-muted">
                    {task.priority.toLowerCase()} priority ·{" "}
                    {task.status.toLowerCase().replaceAll("_", " ")}
                    {task.dueAt
                      ? ` · due ${new Date(task.dueAt).toLocaleString()}`
                      : ""}
                    {task.repositoryId
                      ? ` · ${repositoryNames.get(task.repositoryId) ?? "repository"}`
                      : ""}
                  </p>
                  {task.description ? (
                    <p className="mt-2 text-sm text-muted">
                      {task.description}
                    </p>
                  ) : null}
                  {task.tags.length ? (
                    <p className="mt-2 text-xs text-teal">
                      {task.tags.map((tag) => `#${tag}`).join(" ")}
                    </p>
                  ) : null}
                  {task.pullRequestId || task.issueId ? (
                    <a
                      href={
                        relatedItems.get(
                          task.pullRequestId ?? task.issueId ?? "",
                        )?.url
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex text-xs font-bold text-teal"
                    >
                      {(() => {
                        const related = relatedItems.get(
                          task.pullRequestId ?? task.issueId ?? "",
                        );
                        return related
                          ? `${related.kind} #${related.number}: ${related.title}`
                          : "Related provider item";
                      })()}
                    </a>
                  ) : null}
                </div>
                <div className="flex gap-2">
                  <button
                    disabled={task.id.startsWith("temp-")}
                    onClick={() => setEditingId(task.id)}
                    className="rounded-md border border-border px-3 py-2 text-xs font-bold disabled:opacity-50"
                  >
                    Edit
                  </button>
                  <button
                    disabled={task.id.startsWith("temp-")}
                    onClick={() =>
                      void update(task.id, {
                        status:
                          task.status === "COMPLETED" ? "TODO" : "COMPLETED",
                      })
                    }
                    className="rounded-md border border-border px-3 py-2 text-xs font-bold disabled:opacity-50"
                  >
                    {task.status === "COMPLETED" ? "Reopen" : "Complete"}
                  </button>
                  <button
                    disabled={task.id.startsWith("temp-")}
                    onClick={() => void remove(task.id)}
                    className="rounded-md border border-red-400/40 px-3 py-2 text-xs font-bold text-red-500 disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </article>
          ),
        )}
        {!visible.length ? (
          <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted">
            No tasks match these filters.
          </p>
        ) : null}
      </div>
    </div>
  );
}

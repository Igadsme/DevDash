import type { ActivityEventType, Provider } from "@prisma/client";
import { format } from "date-fns";
import Link from "next/link";

import { EmptyState, Panel, SectionHeader } from "@/components/cards";
import { SiteShell } from "@/components/site-shell";
import {
  buildNarrativeSummary,
  getRangeStart,
  parseCustomRange,
} from "@/lib/analytics";
import { requireUser } from "@/lib/data";
import { prisma } from "@/lib/prisma";

const labels: Record<string, string> = {
  COMMIT: "Commit",
  PULL_REQUEST_OPENED: "Pull request opened",
  PULL_REQUEST_UPDATED: "Pull request updated",
  PULL_REQUEST_MERGED: "Pull request merged",
  PULL_REQUEST_CLOSED: "Pull request closed",
  REVIEW_REQUESTED: "Review requested",
  REVIEW_COMPLETED: "Review completed",
  ISSUE_OPENED: "Issue opened",
  ISSUE_CLOSED: "Issue closed",
  PIPELINE_STARTED: "Pipeline started",
  PIPELINE_COMPLETED: "Pipeline completed",
  TASK_CREATED: "Task created",
  TASK_COMPLETED: "Task completed",
  FOCUS_STARTED: "Focus session started",
  FOCUS_COMPLETED: "Focus session completed",
  CALENDAR_EVENT: "Calendar event",
};
const eventTypes = Object.keys(labels) as ActivityEventType[];
const providers: Provider[] = ["GITHUB", "GITLAB", "BITBUCKET"];
export const dynamic = "force-dynamic";

type Params = {
  range?: string;
  start?: string;
  end?: string;
  provider?: string;
  repository?: string;
  type?: string;
  q?: string;
  page?: string;
};

export default async function TimelinePage({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  let from = getRangeStart(params.range === "month" ? "month" : "week");
  let to = new Date();
  if (params.range === "custom" && params.start && params.end) {
    try {
      ({ from, to } = parseCustomRange(params.start, params.end));
    } catch {
      /* Keep safe default range. */
    }
  }
  const provider = providers.find((value) => value === params.provider);
  const eventType = eventTypes.find((value) => value === params.type);
  const where = {
    userId: user.id,
    occurredAt: { gte: from, lte: to },
    ...(provider ? { provider } : {}),
    ...(params.repository ? { repositoryId: params.repository } : {}),
    ...(eventType ? { type: eventType } : {}),
    ...(params.q?.trim()
      ? {
          OR: [
            {
              title: {
                contains: params.q.trim(),
                mode: "insensitive" as const,
              },
            },
            {
              description: {
                contains: params.q.trim(),
                mode: "insensitive" as const,
              },
            },
          ],
        }
      : {}),
  };
  const [events, total, repositories] = await Promise.all([
    prisma.activityEvent.findMany({
      where,
      include: { repository: { select: { fullName: true } } },
      orderBy: { occurredAt: "desc" },
      skip: (page - 1) * 50,
      take: 50,
    }),
    prisma.activityEvent.count({ where }),
    prisma.repository.findMany({
      where: { userId: user.id },
      select: { id: true, fullName: true },
      orderBy: { fullName: "asc" },
    }),
  ]);
  const pages = Math.max(1, Math.ceil(total / 50));
  const pageHref = (target: number) => {
    const query = new URLSearchParams(
      Object.entries(params).filter(([, value]) => Boolean(value)) as Array<
        [string, string]
      >,
    );
    query.set("page", String(target));
    return `/timeline?${query}`;
  };
  return (
    <SiteShell user={user}>
      <Panel>
        <SectionHeader
          title="Activity Timeline"
          description={buildNarrativeSummary(events)}
        />
        <form className="mb-5 grid gap-2 md:grid-cols-4 xl:grid-cols-7">
          <select
            name="range"
            defaultValue={params.range ?? "week"}
            className="rounded-md border border-border bg-card px-2 py-2 text-xs"
          >
            <option value="week">Week</option>
            <option value="month">Month</option>
            <option value="custom">Custom</option>
          </select>
          <input
            type="date"
            name="start"
            defaultValue={params.start}
            aria-label="Start date"
            className="rounded-md border border-border bg-card px-2 py-2 text-xs"
          />
          <input
            type="date"
            name="end"
            defaultValue={params.end}
            aria-label="End date"
            className="rounded-md border border-border bg-card px-2 py-2 text-xs"
          />
          <select
            name="provider"
            defaultValue={params.provider ?? ""}
            className="rounded-md border border-border bg-card px-2 py-2 text-xs"
          >
            <option value="">All providers</option>
            {providers.map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
          <select
            name="repository"
            defaultValue={params.repository ?? ""}
            className="rounded-md border border-border bg-card px-2 py-2 text-xs"
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
            defaultValue={params.type ?? ""}
            className="rounded-md border border-border bg-card px-2 py-2 text-xs"
          >
            <option value="">All event types</option>
            {eventTypes.map((value) => (
              <option key={value} value={value}>
                {labels[value]}
              </option>
            ))}
          </select>
          <div className="flex">
            <input
              name="q"
              defaultValue={params.q}
              placeholder="Search activity"
              className="min-w-0 flex-1 rounded-l-md border border-border bg-card px-2 py-2 text-xs"
            />
            <button className="rounded-r-md bg-teal px-3 text-xs font-bold text-navy">
              Filter
            </button>
          </div>
        </form>
        {events.length ? (
          <div className="space-y-3">
            {events.map((event) => (
              <article
                key={event.id}
                className="rounded-xl border border-border bg-mutedBg/40 p-4"
              >
                <div className="flex justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold text-teal">
                      {labels[event.type] ??
                        event.type.toLowerCase().replaceAll("_", " ")}
                    </p>
                    <h2 className="mt-1 text-sm font-semibold">
                      {event.title}
                    </h2>
                    <p className="mt-1 text-xs text-muted">
                      {event.repository?.fullName ?? "Personal workspace"}
                    </p>
                    {event.sourceUrl ? (
                      <a
                        href={event.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex text-xs font-bold text-teal"
                      >
                        Open source event
                      </a>
                    ) : null}
                  </div>
                  <time className="shrink-0 text-xs text-muted">
                    {format(event.occurredAt, "MMM d, h:mm a")}
                  </time>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No activity in this range"
            body="Try a broader date range or remove filters."
          />
        )}
        <nav
          aria-label="Timeline pagination"
          className="mt-5 flex items-center justify-between text-xs"
        >
          <span>
            Page {page} of {pages} · {total} events
          </span>
          <div className="flex gap-2">
            {page > 1 ? (
              <Link
                href={pageHref(page - 1)}
                className="rounded-md border border-border px-3 py-2"
              >
                Previous
              </Link>
            ) : null}
            {page < pages ? (
              <Link
                href={pageHref(page + 1)}
                className="rounded-md border border-border px-3 py-2"
              >
                Next
              </Link>
            ) : null}
          </div>
        </nav>
      </Panel>
    </SiteShell>
  );
}

import { NextRequest, NextResponse } from "next/server";

import { getApiUserId, unauthorized } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/security/rate-limit";

export async function GET(request: NextRequest) {
  const userId = await getApiUserId();
  if (!userId) return unauthorized();
  if (!checkRateLimit(`search:${userId}`, 60, 60_000).allowed) {
    return NextResponse.json(
      { error: "Search rate limit reached." },
      { status: 429 },
    );
  }
  const query =
    request.nextUrl.searchParams.get("q")?.trim().slice(0, 100) ?? "";
  if (query.length < 2) return NextResponse.json({ results: [] });
  const contains = { contains: query, mode: "insensitive" as const };
  const [repositories, pulls, issues, commits, tasks, events] =
    await Promise.all([
      prisma.repository.findMany({
        where: { userId, OR: [{ name: contains }, { fullName: contains }] },
        select: { id: true, fullName: true },
        take: 5,
      }),
      prisma.pullRequest.findMany({
        where: { userId, title: contains },
        select: { id: true, title: true, number: true },
        take: 5,
      }),
      prisma.issue.findMany({
        where: { userId, title: contains },
        select: { id: true, title: true, number: true },
        take: 5,
      }),
      prisma.commit.findMany({
        where: {
          userId,
          OR: [{ title: contains }, { message: contains }, { sha: contains }],
        },
        select: { id: true, title: true, sha: true },
        take: 5,
      }),
      prisma.task.findMany({
        where: { userId, OR: [{ title: contains }, { description: contains }] },
        select: { id: true, title: true },
        take: 5,
      }),
      prisma.activityEvent.findMany({
        where: { userId, OR: [{ title: contains }, { description: contains }] },
        select: { id: true, title: true },
        take: 5,
      }),
    ]);
  const results = [
    ...repositories.map((item) => ({
      id: `repository:${item.id}`,
      label: item.fullName,
      group: "Repository",
      href: "/repositories",
    })),
    ...pulls.map((item) => ({
      id: `pull:${item.id}`,
      label: `#${item.number} ${item.title}`,
      group: "Pull request",
      href: "/pull-requests",
    })),
    ...issues.map((item) => ({
      id: `issue:${item.id}`,
      label: `#${item.number} ${item.title}`,
      group: "Issue",
      href: "/timeline",
    })),
    ...commits.map((item) => ({
      id: `commit:${item.id}`,
      label: `${item.sha.slice(0, 7)} ${item.title}`,
      group: "Commit",
      href: "/timeline",
    })),
    ...tasks.map((item) => ({
      id: `task:${item.id}`,
      label: item.title,
      group: "Task",
      href: "/tasks",
    })),
    ...events.map((item) => ({
      id: `event:${item.id}`,
      label: item.title,
      group: "Activity",
      href: "/timeline",
    })),
  ].slice(0, 20);
  return NextResponse.json(
    { results },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}

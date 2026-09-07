import { NextResponse } from "next/server";
import { getApiUserId, unauthorized } from "@/lib/api";
import { prisma } from "@/lib/prisma";
export async function GET() {
  const userId = await getApiUserId();
  if (!userId) return unauthorized();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      settings: true,
      providerConnections: {
        select: {
          provider: true,
          displayName: true,
          status: true,
          createdAt: true,
        },
      },
      workspaces: true,
      repositories: true,
      pullRequests: true,
      reviews: true,
      issues: true,
      commits: true,
      pipelineRuns: { include: { jobs: true } },
      activityEvents: true,
      tasks: true,
      focusSessions: true,
      calendarEvents: true,
      notifications: true,
      aiReports: true,
      exports: true,
    },
  });
  const response = NextResponse.json({
    exportedAt: new Date().toISOString(),
    user,
  });
  response.headers.set(
    "content-disposition",
    `attachment; filename="devdash-export-${new Date().toISOString().slice(0, 10)}.json"`,
  );
  return response;
}

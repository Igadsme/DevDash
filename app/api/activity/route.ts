import { prisma } from "@/lib/prisma";
import { apiError, json, requireUser } from "@/lib/api";
import { relativeTime } from "@/lib/dates";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const events = await prisma.activityEvent.findMany({
      where: {
        userId: user.id,
        ...(type && type !== "all" ? { type } : {}),
      },
      orderBy: { timestamp: "desc" },
      take: 80,
    });
    return json({
      items: events.map((e) => ({
        id: e.id,
        time: relativeTime(e.timestamp),
        timestamp: e.timestamp,
        type: e.type,
        title: e.title,
        sub: e.description,
        repo: e.repository?.split("/").pop() || e.repository,
        url: e.url,
        status:
          e.type === "ci"
            ? ((e.metadata as { conclusion?: string } | null)?.conclusion === "failure" ? "failed" : "passed")
            : e.type === "pr"
              ? ((e.metadata as { merged?: boolean; state?: string } | null)?.merged ? "merged" : (e.metadata as { state?: string } | null)?.state || "open")
              : "pushed",
      })),
    });
  } catch (error) {
    return apiError(error);
  }
}

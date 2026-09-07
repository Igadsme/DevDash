import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { queueScheduledSyncs, runSyncJob } from "@/lib/sync/engine";
import { cleanupExpiredData } from "@/lib/retention";
import { refreshAllNotifications } from "@/lib/notifications";
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const cleanup = await cleanupExpiredData();
  await queueScheduledSyncs();
  const jobs = await prisma.syncJob.findMany({
    where: {
      status: "QUEUED",
      OR: [{ nextRetryAt: null }, { nextRetryAt: { lte: new Date() } }],
    },
    orderBy: { scheduledAt: "asc" },
    take: 3,
  });
  await Promise.allSettled(jobs.map((job) => runSyncJob(job.id)));
  const notifications = await refreshAllNotifications();
  return NextResponse.json({ processed: jobs.length, cleanup, notifications });
}

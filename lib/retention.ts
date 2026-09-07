import { prisma } from "@/lib/prisma";
import { retentionCutoff } from "@/lib/retention-policy";

export async function cleanupExpiredData(now = new Date()) {
  const settings = await prisma.userSettings.findMany({
    select: { userId: true, retentionDays: true },
  });
  let deleted = 0;
  for (const setting of settings) {
    const cutoff = retentionCutoff(setting.retentionDays, now);
    const results = await prisma.$transaction([
      prisma.activityEvent.deleteMany({
        where: { userId: setting.userId, occurredAt: { lt: cutoff } },
      }),
      prisma.commit.deleteMany({
        where: { userId: setting.userId, committedAt: { lt: cutoff } },
      }),
      prisma.focusSession.deleteMany({
        where: {
          userId: setting.userId,
          startedAt: { lt: cutoff },
          status: { in: ["COMPLETED", "CANCELED"] },
        },
      }),
      prisma.notification.deleteMany({
        where: {
          userId: setting.userId,
          createdAt: { lt: cutoff },
          OR: [{ dismissedAt: { not: null } }, { readAt: { not: null } }],
        },
      }),
      prisma.syncJob.deleteMany({
        where: {
          userId: setting.userId,
          createdAt: { lt: cutoff },
          status: { in: ["SUCCEEDED", "FAILED", "CANCELED", "PARTIAL"] },
        },
      }),
      prisma.aIReport.deleteMany({
        where: { userId: setting.userId, createdAt: { lt: cutoff } },
      }),
      prisma.exportRecord.deleteMany({
        where: { userId: setting.userId, createdAt: { lt: cutoff } },
      }),
      prisma.webhookDelivery.deleteMany({
        where: { userId: setting.userId, receivedAt: { lt: cutoff } },
      }),
    ]);
    deleted += results.reduce((sum, result) => sum + result.count, 0);
  }
  return { users: settings.length, deleted };
}

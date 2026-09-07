import { prisma } from "../lib/prisma";

async function main() {
  const user = await prisma.user.upsert({
    where: { email: "demo@devdash.local" },
    create: { email: "demo@devdash.local", name: "Demo Developer" },
    update: { name: "Demo Developer" },
  });
  await prisma.userSettings.upsert({
    where: { userId: user.id },
    create: { userId: user.id },
    update: {},
  });
  await prisma.task.upsert({
    where: { id: "demo-task-review" },
    create: {
      id: "demo-task-review",
      userId: user.id,
      title: "Review the provider integration",
      description: "Deterministic local seed fixture.",
      priority: "HIGH",
      tags: ["demo", "review"],
    },
    update: { userId: user.id },
  });
  await prisma.notification.upsert({
    where: { userId_sourceKey: { userId: user.id, sourceKey: "demo-welcome" } },
    create: {
      userId: user.id,
      type: "EXPORT_COMPLETED",
      title: "Demo workspace ready",
      body: "This notification was created by the reproducible seed script.",
      sourceKey: "demo-welcome",
    },
    update: {},
  });
  console.log("Seeded deterministic demo records for demo@devdash.local.");
}

main().finally(() => prisma.$disconnect());

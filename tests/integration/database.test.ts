import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const run = process.env.RUN_DB_TESTS === "1";
let prisma: (typeof import("@/lib/prisma"))["prisma"];
const emailPrefix = `integration-${randomUUID()}`;
let firstUserId = "";
let secondUserId = "";

describe.skipIf(!run)("PostgreSQL ownership and transactions", () => {
  beforeAll(async () => {
    ({ prisma } = await import("@/lib/prisma"));
    const [first, second] = await Promise.all([
      prisma.user.create({ data: { email: `${emailPrefix}-1@devdash.test` } }),
      prisma.user.create({ data: { email: `${emailPrefix}-2@devdash.test` } }),
    ]);
    firstUserId = first.id;
    secondUserId = second.id;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email: { startsWith: emailPrefix } },
    });
    await prisma.$disconnect();
  });

  it("keeps task and notification queries inside their owner boundary", async () => {
    const task = await prisma.task.create({
      data: { userId: firstUserId, title: "Private task", tags: [] },
    });
    await prisma.notification.create({
      data: {
        userId: firstUserId,
        type: "TASK_DUE",
        title: "Due soon",
        body: "A task is due.",
        sourceKey: `task-${task.id}`,
      },
    });
    expect(
      await prisma.task.count({ where: { id: task.id, userId: firstUserId } }),
    ).toBe(1);
    expect(
      await prisma.task.count({ where: { id: task.id, userId: secondUserId } }),
    ).toBe(0);
    expect(
      await prisma.notification.count({ where: { userId: secondUserId } }),
    ).toBe(0);
  });

  it("rolls back all writes when a transaction fails", async () => {
    const sourceKey = `rollback-${randomUUID()}`;
    await expect(
      prisma.$transaction(async (tx) => {
        await tx.notification.create({
          data: {
            userId: firstUserId,
            type: "SYNC_FAILED",
            title: "Transient",
            body: "Should roll back",
            sourceKey,
          },
        });
        throw new Error("force rollback");
      }),
    ).rejects.toThrow("force rollback");
    expect(
      await prisma.notification.count({
        where: { userId: firstUserId, sourceKey },
      }),
    ).toBe(0);
  });

  it("rejects duplicate webhook delivery identifiers and cascades user deletion", async () => {
    const deliveryId = randomUUID();
    await prisma.webhookDelivery.create({
      data: {
        userId: firstUserId,
        provider: "GITHUB",
        deliveryId,
        eventName: "push",
        signatureDigest: "digest",
        status: "ACCEPTED",
      },
    });
    await expect(
      prisma.webhookDelivery.create({
        data: {
          userId: firstUserId,
          provider: "GITHUB",
          deliveryId,
          eventName: "push",
          signatureDigest: "digest",
          status: "ACCEPTED",
        },
      }),
    ).rejects.toMatchObject({ code: "P2002" });
    await prisma.user.delete({ where: { id: firstUserId } });
    expect(await prisma.webhookDelivery.count({ where: { deliveryId } })).toBe(
      0,
    );
    firstUserId = "";
  });
});

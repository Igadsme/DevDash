import { createHash, randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { constantTimeEqual } from "@/lib/security/constant-time";
import { checkRateLimit } from "@/lib/security/rate-limit";

export async function POST(request: NextRequest) {
  const client =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!checkRateLimit(`gitlab-webhook:${client}`, 120, 60_000).allowed)
    return NextResponse.json(
      { error: "Webhook rate limit reached." },
      { status: 429 },
    );
  const secret = process.env.GITLAB_WEBHOOK_SECRET?.trim() ?? null;
  const supplied = request.headers.get("x-gitlab-token");
  const deliveryId = request.headers.get("x-gitlab-event-uuid")?.trim();
  const eventName = request.headers.get("x-gitlab-event")?.trim();
  const body = await request.text();
  if (!deliveryId || !eventName || !constantTimeEqual(supplied, secret))
    return NextResponse.json({ error: "Invalid webhook." }, { status: 401 });
  let projectId: string | null = null;
  try {
    const payload = JSON.parse(body) as {
      project?: { id?: number };
      project_id?: number;
    };
    projectId = String(payload.project?.id ?? payload.project_id ?? "") || null;
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }
  const repositories = projectId
    ? await prisma.repository.findMany({
        where: { provider: "GITLAB", providerId: projectId },
        select: { userId: true, providerConnectionId: true },
      })
    : [];
  try {
    await prisma.$transaction(async (tx) => {
      await tx.webhookDelivery.create({
        data: {
          userId: repositories.length === 1 ? repositories[0]?.userId : null,
          providerConnectionId:
            repositories.length === 1
              ? repositories[0]?.providerConnectionId
              : null,
          provider: "GITLAB",
          deliveryId,
          eventName,
          signatureDigest: createHash("sha256")
            .update(supplied ?? "")
            .digest("hex"),
          status: repositories.length ? "ACCEPTED" : "IGNORED",
          processedAt: repositories.length ? null : new Date(),
        },
      });
      for (const repository of repositories)
        if (
          !(await tx.syncJob.findFirst({
            where: {
              providerConnectionId: repository.providerConnectionId,
              status: { in: ["QUEUED", "RUNNING"] },
            },
          }))
        )
          await tx.syncJob.create({
            data: {
              userId: repository.userId,
              providerConnectionId: repository.providerConnectionId,
              correlationId: randomUUID(),
            },
          });
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    )
      return NextResponse.json({ status: "duplicate" });
    throw error;
  }
  return NextResponse.json({ status: "accepted" }, { status: 202 });
}

import { createHash, randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { verifyHmacSha256 } from "@/lib/security/webhooks";

export async function POST(request: NextRequest) {
  const client =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!checkRateLimit(`bitbucket-webhook:${client}`, 120, 60_000).allowed)
    return NextResponse.json(
      { error: "Webhook rate limit reached." },
      { status: 429 },
    );
  const secret = process.env.BITBUCKET_WEBHOOK_SECRET?.trim();
  const signature = request.headers.get("x-hub-signature");
  const deliveryId = request.headers.get("x-request-uuid")?.trim();
  const eventName = request.headers.get("x-event-key")?.trim();
  const body = await request.text();
  if (
    !secret ||
    !signature ||
    !deliveryId ||
    !eventName ||
    !verifyHmacSha256(body, signature, secret)
  )
    return NextResponse.json({ error: "Invalid webhook." }, { status: 401 });
  let repositoryId: string | null = null;
  try {
    const payload = JSON.parse(body) as { repository?: { uuid?: string } };
    repositoryId = payload.repository?.uuid ?? null;
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }
  const repositories = repositoryId
    ? await prisma.repository.findMany({
        where: { provider: "BITBUCKET", providerId: repositoryId },
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
          provider: "BITBUCKET",
          deliveryId,
          eventName,
          signatureDigest: createHash("sha256").update(signature).digest("hex"),
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

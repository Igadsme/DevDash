import { createHash, randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { verifyHmacSha256 } from "@/lib/security/webhooks";
import { checkRateLimit } from "@/lib/security/rate-limit";

type GitHubWebhook = {
  installation?: { id?: number };
};

export async function POST(request: NextRequest) {
  const client =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!checkRateLimit(`github-webhook:${client}`, 120, 60_000).allowed) {
    return NextResponse.json(
      { error: "Webhook rate limit reached." },
      { status: 429 },
    );
  }
  const secret = process.env.GITHUB_WEBHOOK_SECRET?.trim();
  const deliveryId = request.headers.get("x-github-delivery")?.trim();
  const eventName = request.headers.get("x-github-event")?.trim();
  const signature = request.headers.get("x-hub-signature-256");
  const body = await request.text();

  if (
    !secret ||
    !deliveryId ||
    !eventName ||
    !verifyHmacSha256(body, signature, secret)
  ) {
    return NextResponse.json({ error: "Invalid webhook." }, { status: 401 });
  }

  let payload: GitHubWebhook;
  try {
    payload = JSON.parse(body) as GitHubWebhook;
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const installationId = payload.installation?.id
    ? String(payload.installation.id)
    : null;
  const connection = installationId
    ? await prisma.providerConnection.findFirst({
        where: { provider: "GITHUB", installationId },
        select: { id: true, userId: true },
      })
    : null;

  try {
    await prisma.$transaction(async (tx) => {
      await tx.webhookDelivery.create({
        data: {
          provider: "GITHUB",
          deliveryId,
          eventName,
          signatureDigest: createHash("sha256")
            .update(signature ?? "")
            .digest("hex"),
          status: connection ? "ACCEPTED" : "IGNORED",
          processedAt: connection ? null : new Date(),
          providerConnectionId: connection?.id,
          userId: connection?.userId,
        },
      });

      if (connection && eventName !== "ping") {
        const active = await tx.syncJob.findFirst({
          where: {
            providerConnectionId: connection.id,
            status: { in: ["QUEUED", "RUNNING"] },
          },
          select: { id: true },
        });
        if (!active) {
          await tx.syncJob.create({
            data: {
              userId: connection.userId,
              providerConnectionId: connection.id,
              correlationId: randomUUID(),
            },
          });
        }
      }
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json({ status: "duplicate" }, { status: 200 });
    }
    console.error("Webhook persistence failed.", error);
    return NextResponse.json(
      { error: "Webhook unavailable." },
      { status: 503 },
    );
  }

  return NextResponse.json({ status: "accepted" }, { status: 202 });
}

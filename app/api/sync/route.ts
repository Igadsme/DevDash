import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { getApiUserId, unauthorized } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/security/rate-limit";
export async function POST(request: Request) {
  const userId = await getApiUserId();
  if (!userId) return unauthorized();
  const rate = checkRateLimit(`sync:${userId}`, 5, 60_000);
  if (!rate.allowed)
    return NextResponse.json(
      { error: "Sync rate limit reached." },
      { status: 429 },
    );
  const form = await request.formData();
  const connectionId = String(form.get("connectionId") ?? "");
  const connection = await prisma.providerConnection.findFirst({
    where: {
      id: connectionId,
      userId,
      status: { in: ["CONNECTED", "DEGRADED"] },
    },
  });
  if (!connection)
    return NextResponse.json(
      { error: "Connected provider not found." },
      { status: 404 },
    );
  await prisma.syncJob.create({
    data: {
      userId,
      providerConnectionId: connection.id,
      correlationId: randomUUID(),
    },
  });
  return NextResponse.redirect(
    new URL("/integrations?sync=queued", request.url),
    303,
  );
}

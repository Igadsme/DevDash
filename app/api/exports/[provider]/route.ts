import { subDays } from "date-fns";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { createFallbackBrief } from "@/lib/ai";
import { getApiUserId, invalidRequest, unauthorized } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { buildNotionBrief, buildSlackBrief } from "@/lib/exports";
import { decryptCredential } from "@/lib/security/credentials";
import { checkRateLimit } from "@/lib/security/rate-limit";

const exportSchema = z.object({
  destinationId: z.string().trim().min(1).max(200),
});

function token(payload: string) {
  const decrypted = decryptCredential(payload);
  try {
    return (
      (JSON.parse(decrypted) as { accessToken?: string }).accessToken ??
      decrypted
    );
  } catch {
    return decrypted;
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ provider: string }> },
) {
  const userId = await getApiUserId();
  if (!userId) return unauthorized();
  const { provider } = await context.params;
  if (provider !== "slack" && provider !== "notion")
    return NextResponse.json(
      { error: "Unsupported export provider." },
      { status: 404 },
    );
  if (!checkRateLimit(`export:${userId}`, 10, 60 * 60_000).allowed)
    return NextResponse.json(
      { error: "Export rate limit reached." },
      { status: 429 },
    );
  const parsed = exportSchema.safeParse({
    destinationId: (await request.formData()).get("destinationId"),
  });
  if (!parsed.success)
    return invalidRequest("A destination channel or page ID is required.");
  const providerName = provider === "slack" ? "SLACK" : "NOTION";
  const connection = await prisma.providerConnection.findFirst({
    where: { userId, provider: providerName, status: "CONNECTED" },
  });
  if (!connection?.encryptedCredential)
    return NextResponse.json(
      { error: `${providerName} is not connected.` },
      { status: 409 },
    );
  const record = await prisma.exportRecord.create({
    data: {
      userId,
      destination: providerName,
      format: provider === "slack" ? "blocks" : "notion-page",
      status: "RUNNING",
    },
  });
  try {
    const events = await prisma.activityEvent.findMany({
      where: { userId, occurredAt: { gte: subDays(new Date(), 7) } },
      orderBy: { occurredAt: "desc" },
      take: 1_000,
    });
    const brief = createFallbackBrief(events);
    let response: Response;
    if (provider === "slack") {
      response = await fetch("https://slack.com/api/chat.postMessage", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token(connection.encryptedCredential)}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(buildSlackBrief(parsed.data.destinationId, brief)),
        signal: AbortSignal.timeout(12_000),
      });
      const result = (await response.json()) as { ok?: boolean };
      if (!response.ok || !result.ok) throw new Error("SLACK_EXPORT_REJECTED");
    } else {
      response = await fetch("https://api.notion.com/v1/pages", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token(connection.encryptedCredential)}`,
          "Content-Type": "application/json",
          "Notion-Version": "2022-06-28",
        },
        body: JSON.stringify(
          buildNotionBrief(parsed.data.destinationId, brief),
        ),
        signal: AbortSignal.timeout(12_000),
      });
      if (!response.ok) throw new Error("NOTION_EXPORT_REJECTED");
    }
    const completedAt = new Date();
    await prisma.$transaction([
      prisma.exportRecord.update({
        where: { id: record.id },
        data: { status: "COMPLETED", completedAt },
      }),
      prisma.notification.create({
        data: {
          userId,
          type: "EXPORT_COMPLETED",
          title: `${providerName} export completed`,
          body: "Your weekly engineering brief was exported successfully.",
          href: "/ai-brief",
          sourceKey: `export-${record.id}`,
        },
      }),
    ]);
    return NextResponse.redirect(
      new URL(`/ai-brief?exported=${provider}`, request.url),
      303,
    );
  } catch (error) {
    const code =
      error instanceof Error ? error.message.slice(0, 80) : "EXPORT_FAILED";
    await prisma.exportRecord.update({
      where: { id: record.id },
      data: { status: "FAILED", errorCode: code },
    });
    return NextResponse.redirect(
      new URL(`/ai-brief?error=${provider}_export`, request.url),
      303,
    );
  }
}

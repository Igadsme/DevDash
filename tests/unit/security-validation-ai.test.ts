import { describe, expect, it } from "vitest";

import {
  aiBriefSchema,
  createFallbackBrief,
  generateAIBrief,
  redactEventsForAI,
} from "@/lib/ai";
import { isFreshWebhook, verifyHmacSha256 } from "@/lib/security/webhooks";
import { createHmac } from "node:crypto";
import { settingsSchema, taskCreateSchema } from "@/lib/validation";

describe("webhook signatures", () => {
  it("accepts a matching signature and rejects tampering", () => {
    const secret = "a-secure-webhook-secret";
    const body = '{"ok":true}';
    const signature = `sha256=${createHmac("sha256", secret).update(body).digest("hex")}`;
    expect(verifyHmacSha256(body, signature, secret)).toBe(true);
    expect(verifyHmacSha256(`${body}x`, signature, secret)).toBe(false);
    expect(verifyHmacSha256(body, null, secret)).toBe(false);
  });

  it("validates optional provider timestamps", () => {
    const now = Date.parse("2026-01-01T00:00:00Z");
    expect(isFreshWebhook(null, now)).toBe(true);
    expect(isFreshWebhook("2026-01-01T00:01:00Z", now)).toBe(true);
    expect(isFreshWebhook("2025-12-01T00:00:00Z", now)).toBe(false);
    expect(isFreshWebhook("invalid", now)).toBe(false);
  });
});

describe("validation and AI fallback", () => {
  it("rejects unsafe settings and empty tasks", () => {
    expect(
      settingsSchema.safeParse({
        theme: "system",
        aiEnabled: false,
        excludePrivateFromAi: true,
        privateRepositories: false,
        smallPrThreshold: 0,
        interruptionCostMinutes: 1,
        timezone: "",
        retentionDays: 1,
        notifyReviews: true,
        notifyPipelines: true,
        notifyTasks: true,
        notifySyncFailures: true,
      }).success,
    ).toBe(false);
    expect(taskCreateSchema.safeParse({ title: "   " }).success).toBe(false);
  });

  it("creates validated deterministic fallback output", () => {
    const brief = createFallbackBrief([
      { type: "COMMIT", occurredAt: new Date() },
    ]);
    expect(aiBriefSchema.parse(brief)).toEqual(brief);
  });

  it("uses the local fallback when AI is disabled or activity is empty", async () => {
    await expect(
      generateAIBrief([{ type: "COMMIT", occurredAt: new Date() }], false),
    ).resolves.toMatchObject({ source: "local" });
    await expect(generateAIBrief([], true)).resolves.toMatchObject({
      source: "local",
    });
  });

  it("removes private activity before external AI processing", () => {
    const result = redactEventsForAI(
      [
        {
          type: "COMMIT",
          occurredAt: new Date("2026-01-01"),
          isPrivate: true,
          title: "secret",
        },
        {
          type: "COMMIT",
          occurredAt: new Date("2026-01-02"),
          isPrivate: false,
          title: "public",
        },
      ],
      true,
    );
    expect(result).toHaveLength(1);
    expect(result[0]?.title).toBe("public");
  });
});

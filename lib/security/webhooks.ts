import { createHmac, timingSafeEqual } from "node:crypto";

export function verifyHmacSha256(
  payload: string,
  signature: string | null,
  secret: string,
) {
  if (!signature?.startsWith("sha256=") || secret.length < 16) return false;
  const expected = `sha256=${createHmac("sha256", secret).update(payload).digest("hex")}`;
  const suppliedBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  return (
    suppliedBuffer.length === expectedBuffer.length &&
    timingSafeEqual(suppliedBuffer, expectedBuffer)
  );
}

export function isFreshWebhook(
  timestamp: string | null,
  now = Date.now(),
  toleranceMs = 5 * 60_000,
) {
  if (!timestamp) return true;
  const parsed = Date.parse(timestamp);
  return Number.isFinite(parsed) && Math.abs(now - parsed) <= toleranceMs;
}

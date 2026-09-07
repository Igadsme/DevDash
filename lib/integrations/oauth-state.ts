import "server-only";

import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

function secret() {
  const value = process.env.NEXTAUTH_SECRET?.trim();
  if (!value) throw new Error("NEXTAUTH_SECRET is required.");
  return value;
}

export function createOAuthState(userId: string, provider: string) {
  const payload = Buffer.from(
    JSON.stringify({
      userId,
      provider,
      issuedAt: Date.now(),
      nonce: randomBytes(16).toString("hex"),
    }),
  ).toString("base64url");
  const signature = createHmac("sha256", secret())
    .update(payload)
    .digest("base64url");
  return `${payload}.${signature}`;
}

export function verifyOAuthState(state: string, provider: string) {
  const [payload, signature] = state.split(".");
  if (!payload || !signature) return null;
  const expected = createHmac("sha256", secret())
    .update(payload)
    .digest("base64url");
  const left = Buffer.from(signature);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right))
    return null;
  try {
    const value = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as {
      userId?: string;
      provider?: string;
      issuedAt?: number;
    };
    if (
      !value.userId ||
      value.provider !== provider ||
      !value.issuedAt ||
      Date.now() - value.issuedAt > 10 * 60_000 ||
      value.issuedAt > Date.now() + 30_000
    )
      return null;
    return value.userId;
  } catch {
    return null;
  }
}

export function publicAppUrl() {
  const value = process.env.NEXTAUTH_URL?.trim();
  if (!value) throw new Error("NEXTAUTH_URL is required for provider OAuth.");
  return value.replace(/\/$/, "");
}

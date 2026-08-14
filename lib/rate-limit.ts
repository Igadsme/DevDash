type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const existing = buckets.get(key);
  if (!existing || existing.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1 };
  }
  if (existing.count >= limit) {
    return { ok: false, remaining: 0, retryAfterMs: existing.resetAt - now };
  }
  existing.count += 1;
  return { ok: true, remaining: limit - existing.count };
}

export function assertRateLimit(key: string, limit = 60, windowMs = 60_000) {
  const result = rateLimit(key, limit, windowMs);
  if (!result.ok) {
    const err = new Error("Too many requests. Please wait a moment and try again.");
    (err as Error & { status?: number }).status = 429;
    throw err;
  }
}

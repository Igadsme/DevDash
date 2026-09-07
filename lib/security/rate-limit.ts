type Entry = { count: number; resetAt: number };
const buckets = new Map<string, Entry>();
const MAX_BUCKETS = 2_000;

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
  now = Date.now(),
) {
  if (buckets.size >= MAX_BUCKETS) {
    for (const [bucketKey, entry] of buckets)
      if (entry.resetAt <= now) buckets.delete(bucketKey);
    if (buckets.size >= MAX_BUCKETS)
      buckets.delete(buckets.keys().next().value as string);
  }
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetAt: now + windowMs };
  }
  current.count += 1;
  return {
    allowed: current.count <= limit,
    remaining: Math.max(0, limit - current.count),
    resetAt: current.resetAt,
  };
}

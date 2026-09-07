export class ProviderHttpError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: "RATE_LIMITED" | "UNAUTHORIZED" | "UPSTREAM_ERROR",
    readonly retryAt: Date | null = null,
  ) {
    super(message);
    this.name = "ProviderHttpError";
  }
}

export type ProviderFetch = (
  input: string,
  init?: RequestInit,
) => Promise<Response>;

export async function requestJson<T>(
  fetcher: ProviderFetch,
  input: string,
  init: RequestInit,
  timeoutMs = 12_000,
) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetcher(input, {
      ...init,
      signal: controller.signal,
    });
    const reset = response.headers.get("x-ratelimit-reset");
    const retryAt = reset ? new Date(Number(reset) * 1_000) : null;
    if (response.status === 401 || response.status === 403) {
      const limited = response.headers.get("x-ratelimit-remaining") === "0";
      throw new ProviderHttpError(
        limited
          ? "Provider rate limit reached."
          : "Provider authorization failed.",
        response.status,
        limited ? "RATE_LIMITED" : "UNAUTHORIZED",
        retryAt,
      );
    }
    if (response.status === 429)
      throw new ProviderHttpError(
        "Provider rate limit reached.",
        429,
        "RATE_LIMITED",
        retryAt,
      );
    if (!response.ok)
      throw new ProviderHttpError(
        "Provider request failed.",
        response.status,
        "UPSTREAM_ERROR",
      );
    return { response, data: (await response.json()) as T };
  } finally {
    clearTimeout(timeout);
  }
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  attempts = 4,
  random = Math.random,
) {
  let lastError: unknown;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (
        error instanceof ProviderHttpError &&
        ["UNAUTHORIZED", "RATE_LIMITED"].includes(error.code)
      )
        throw error;
      if (attempt === attempts - 1) break;
      const delay =
        Math.min(4_000, 250 * 2 ** attempt) + Math.floor(random() * 100);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw lastError;
}

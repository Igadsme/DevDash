import "server-only";

import {
  createHmac,
  createSign,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";

type Installation = {
  id: number;
  account: { id: number; login?: string; name?: string | null };
  permissions?: Record<string, string>;
};

function required(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

function appJwt(now = Math.floor(Date.now() / 1_000)) {
  const header = Buffer.from(
    JSON.stringify({ alg: "RS256", typ: "JWT" }),
  ).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({
      iat: now - 60,
      exp: now + 9 * 60,
      iss: required("GITHUB_APP_ID"),
    }),
  ).toString("base64url");
  const input = `${header}.${payload}`;
  const signer = createSign("RSA-SHA256");
  signer.update(input);
  signer.end();
  const privateKey = required("GITHUB_APP_PRIVATE_KEY").replace(/\\n/g, "\n");
  return `${input}.${signer.sign(privateKey).toString("base64url")}`;
}

async function githubAppRequest<T>(path: string, init: RequestInit = {}) {
  const response = await fetch(`https://api.github.com${path}`, {
    ...init,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${appJwt()}`,
      "X-GitHub-Api-Version": "2022-11-28",
      ...init.headers,
    },
    signal: AbortSignal.timeout(12_000),
  });
  if (!response.ok) throw new Error(`GITHUB_APP_${response.status}`);
  return (await response.json()) as T;
}

export function createGitHubInstallState(userId: string) {
  const payload = Buffer.from(
    JSON.stringify({
      userId,
      issuedAt: Date.now(),
      nonce: randomBytes(16).toString("hex"),
    }),
  ).toString("base64url");
  const signature = createHmac("sha256", required("NEXTAUTH_SECRET"))
    .update(payload)
    .digest("base64url");
  return `${payload}.${signature}`;
}

export function verifyGitHubInstallState(state: string) {
  const [payload, signature] = state.split(".");
  if (!payload || !signature) return null;
  const expected = createHmac("sha256", required("NEXTAUTH_SECRET"))
    .update(payload)
    .digest("base64url");
  const supplied = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (
    supplied.length !== expectedBuffer.length ||
    !timingSafeEqual(supplied, expectedBuffer)
  ) {
    return null;
  }
  try {
    const value = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as {
      userId?: string;
      issuedAt?: number;
    };
    if (
      !value.userId ||
      !value.issuedAt ||
      Date.now() - value.issuedAt > 10 * 60_000 ||
      value.issuedAt > Date.now() + 30_000
    ) {
      return null;
    }
    return value.userId;
  } catch {
    return null;
  }
}

export function githubInstallUrl(state: string) {
  return `https://github.com/apps/${encodeURIComponent(required("GITHUB_APP_SLUG"))}/installations/new?state=${encodeURIComponent(state)}`;
}

export function getGitHubInstallation(installationId: string) {
  return githubAppRequest<Installation>(`/app/installations/${installationId}`);
}

export async function createGitHubInstallationToken(installationId: string) {
  const value = await githubAppRequest<{ token: string; expires_at: string }>(
    `/app/installations/${installationId}/access_tokens`,
    { method: "POST" },
  );
  return { token: value.token, expiresAt: new Date(value.expires_at) };
}

export async function revokeGitHubInstallation(installationId: string) {
  const response = await fetch(
    `https://api.github.com/app/installations/${installationId}`,
    {
      method: "DELETE",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${appJwt()}`,
        "X-GitHub-Api-Version": "2022-11-28",
      },
      signal: AbortSignal.timeout(12_000),
    },
  );
  if (!response.ok && response.status !== 404)
    throw new Error(`GITHUB_REVOKE_${response.status}`);
}

import "server-only";

import { revokeGitHubInstallation } from "@/lib/integrations/github-app";
import { prisma } from "@/lib/prisma";
import { decryptCredential } from "@/lib/security/credentials";

function accessToken(payload: string) {
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

async function revokeOAuth(provider: string, token: string) {
  const prefix = provider.toUpperCase();
  const clientId = process.env[`${prefix}_CLIENT_ID`] ?? "";
  const clientSecret = process.env[`${prefix}_CLIENT_SECRET`] ?? "";
  if (provider === "GITLAB")
    return fetch("https://gitlab.com/oauth/revoke", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        token,
      }),
      signal: AbortSignal.timeout(12_000),
    });
  if (provider === "SLACK")
    return fetch("https://slack.com/api/auth.revoke", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(12_000),
    });
  if (provider === "NOTION")
    return fetch("https://api.notion.com/v1/oauth/revoke", {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28",
      },
      body: JSON.stringify({ token }),
      signal: AbortSignal.timeout(12_000),
    });
  return null;
}

export async function disconnectProvider(userId: string, connectionId: string) {
  const connection = await prisma.providerConnection.findFirst({
    where: { id: connectionId, userId },
  });
  if (!connection) return false;
  let revokeError: Error | null = null;
  try {
    if (connection.provider === "GITHUB" && connection.installationId)
      await revokeGitHubInstallation(connection.installationId);
    else if (connection.encryptedCredential) {
      const response = await revokeOAuth(
        connection.provider,
        accessToken(connection.encryptedCredential),
      );
      if (response && !response.ok)
        throw new Error(`${connection.provider}_REVOKE_${response.status}`);
    }
  } catch (error) {
    revokeError =
      error instanceof Error ? error : new Error("PROVIDER_REVOKE_FAILED");
  }
  await prisma.providerConnection.delete({ where: { id: connection.id } });
  if (revokeError)
    console.error(
      `Provider-side ${connection.provider} revocation failed after local credential deletion.`,
      revokeError,
    );
  return true;
}

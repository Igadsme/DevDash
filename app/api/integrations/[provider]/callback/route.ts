import { NextRequest, NextResponse } from "next/server";

import { getAuthSession } from "@/lib/auth";
import { publicAppUrl, verifyOAuthState } from "@/lib/integrations/oauth-state";
import { prisma } from "@/lib/prisma";
import { encryptCredential } from "@/lib/security/credentials";

const supported = ["gitlab", "bitbucket", "slack", "notion"] as const;
type Supported = (typeof supported)[number];

type ConnectionToken = {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  accountId: string;
  displayName: string;
  scopes: string[];
};

async function json<T>(url: string, init: RequestInit) {
  const response = await fetch(url, {
    ...init,
    signal: AbortSignal.timeout(12_000),
  });
  const body = (await response.json()) as T & {
    error?: string;
    error_description?: string;
  };
  if (!response.ok || body.error)
    throw new Error("PROVIDER_TOKEN_EXCHANGE_FAILED");
  return body;
}

async function exchange(
  provider: Supported,
  code: string,
): Promise<ConnectionToken> {
  const prefix = provider.toUpperCase();
  const id = process.env[`${prefix}_CLIENT_ID`]!;
  const secret = process.env[`${prefix}_CLIENT_SECRET`]!;
  const callback = `${publicAppUrl()}/api/integrations/${provider}/callback`;
  if (provider === "gitlab") {
    const token = await json<{
      access_token: string;
      refresh_token?: string;
      expires_in?: number;
      scope?: string;
    }>("https://gitlab.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: id,
        client_secret: secret,
        code,
        grant_type: "authorization_code",
        redirect_uri: callback,
      }),
    });
    const user = await json<{ id: number; username: string; name: string }>(
      "https://gitlab.com/api/v4/user",
      { headers: { Authorization: `Bearer ${token.access_token}` } },
    );
    return {
      accessToken: token.access_token,
      refreshToken: token.refresh_token,
      expiresIn: token.expires_in,
      accountId: String(user.id),
      displayName: user.name || user.username,
      scopes: token.scope?.split(" ") ?? ["read_api"],
    };
  }
  if (provider === "bitbucket") {
    const token = await json<{
      access_token: string;
      refresh_token?: string;
      expires_in?: number;
      scopes?: string;
    }>("https://bitbucket.org/site/oauth2/access_token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ grant_type: "authorization_code", code }),
    });
    const user = await json<{ uuid: string; display_name: string }>(
      "https://api.bitbucket.org/2.0/user",
      { headers: { Authorization: `Bearer ${token.access_token}` } },
    );
    return {
      accessToken: token.access_token,
      refreshToken: token.refresh_token,
      expiresIn: token.expires_in,
      accountId: user.uuid,
      displayName: user.display_name,
      scopes: token.scopes?.split(" ") ?? [],
    };
  }
  if (provider === "slack") {
    const token = await json<{
      access_token: string;
      scope?: string;
      team: { id: string; name: string };
    }>("https://slack.com/api/oauth.v2.access", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: id,
        client_secret: secret,
        code,
        redirect_uri: callback,
      }),
    });
    return {
      accessToken: token.access_token,
      accountId: token.team.id,
      displayName: token.team.name,
      scopes: token.scope?.split(",") ?? [],
    };
  }
  const token = await json<{
    access_token: string;
    workspace_id: string;
    workspace_name?: string;
  }>("https://api.notion.com/v1/oauth/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`,
      "Content-Type": "application/json",
      "Notion-Version": "2022-06-28",
    },
    body: JSON.stringify({
      grant_type: "authorization_code",
      code,
      redirect_uri: callback,
    }),
  });
  return {
    accessToken: token.access_token,
    accountId: token.workspace_id,
    displayName: token.workspace_name ?? "Notion workspace",
    scopes: ["content:write"],
  };
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ provider: string }> },
) {
  const { provider: candidate } = await context.params;
  if (!supported.includes(candidate as Supported))
    return NextResponse.json(
      { error: "Unsupported provider." },
      { status: 404 },
    );
  const provider = candidate as Supported;
  const session = await getAuthSession();
  const stateUserId = verifyOAuthState(
    request.nextUrl.searchParams.get("state") ?? "",
    provider,
  );
  const code = request.nextUrl.searchParams.get("code");
  if (!session?.user?.id || session.user.id !== stateUserId || !code)
    return NextResponse.redirect(
      new URL("/integrations?error=invalid_oauth_callback", request.url),
      303,
    );
  try {
    const token = await exchange(provider, code);
    const encryptedCredential = encryptCredential(
      JSON.stringify({
        accessToken: token.accessToken,
        refreshToken: token.refreshToken,
      }),
    );
    const providerName = provider.toUpperCase() as
      "GITLAB" | "BITBUCKET" | "SLACK" | "NOTION";
    await prisma.providerConnection.upsert({
      where: {
        userId_provider_providerAccountId: {
          userId: session.user.id,
          provider: providerName,
          providerAccountId: token.accountId,
        },
      },
      create: {
        userId: session.user.id,
        provider: providerName,
        providerAccountId: token.accountId,
        displayName: token.displayName,
        status: "CONNECTED",
        encryptedCredential,
        tokenExpiresAt: token.expiresIn
          ? new Date(Date.now() + token.expiresIn * 1_000)
          : null,
        scopes: token.scopes,
      },
      update: {
        displayName: token.displayName,
        status: "CONNECTED",
        encryptedCredential,
        tokenExpiresAt: token.expiresIn
          ? new Date(Date.now() + token.expiresIn * 1_000)
          : null,
        scopes: token.scopes,
        lastErrorCode: null,
        disconnectedAt: null,
      },
    });
    return NextResponse.redirect(
      new URL(`/integrations?connected=${provider}`, request.url),
      303,
    );
  } catch (error) {
    console.error(`${provider} OAuth callback failed.`, error);
    return NextResponse.redirect(
      new URL(`/integrations?error=${provider}_oauth`, request.url),
      303,
    );
  }
}

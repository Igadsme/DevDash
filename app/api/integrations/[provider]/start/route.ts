import { NextRequest, NextResponse } from "next/server";

import { getApiUserId, unauthorized } from "@/lib/api";
import { createOAuthState, publicAppUrl } from "@/lib/integrations/oauth-state";

const supported = ["gitlab", "bitbucket", "slack", "notion"] as const;
type Supported = (typeof supported)[number];

function configured(provider: Supported) {
  const prefix = provider.toUpperCase();
  return {
    id: process.env[`${prefix}_CLIENT_ID`]?.trim(),
    secret: process.env[`${prefix}_CLIENT_SECRET`]?.trim(),
  };
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ provider: string }> },
) {
  const { provider: candidate } = await context.params;
  if (!supported.includes(candidate as Supported)) {
    return NextResponse.json(
      { error: "Unsupported provider." },
      { status: 404 },
    );
  }
  const provider = candidate as Supported;
  const userId = await getApiUserId();
  if (!userId) return unauthorized();
  const credentials = configured(provider);
  if (!credentials.id || !credentials.secret) {
    return NextResponse.json(
      { error: `${provider} OAuth is not configured.` },
      { status: 503 },
    );
  }

  const callback = `${publicAppUrl()}/api/integrations/${provider}/callback`;
  const state = createOAuthState(userId, provider);
  const urls: Record<Supported, URL> = {
    gitlab: new URL("https://gitlab.com/oauth/authorize"),
    bitbucket: new URL("https://bitbucket.org/site/oauth2/authorize"),
    slack: new URL("https://slack.com/oauth/v2/authorize"),
    notion: new URL("https://api.notion.com/v1/oauth/authorize"),
  };
  const url = urls[provider];
  url.searchParams.set("client_id", credentials.id);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("state", state);
  if (provider !== "bitbucket") url.searchParams.set("redirect_uri", callback);
  if (provider === "gitlab") url.searchParams.set("scope", "read_api");
  if (provider === "slack")
    url.searchParams.set("scope", "chat:write,channels:read");
  if (provider === "notion") url.searchParams.set("owner", "user");
  return NextResponse.redirect(url, 303);
}

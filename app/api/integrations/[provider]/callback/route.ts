import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { encryptSecret } from "@/lib/crypto";
import { getAppUrl } from "@/lib/api";
import { syncIntegration } from "@/lib/sync/engine";

async function exchange(provider: string, code: string): Promise<{
  access_token?: string;
  refresh_token?: string;
  error?: string;
}> {
  const redirect = `${getAppUrl()}/api/integrations/${provider}/callback`;
  if (provider === "github") {
    const res = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: process.env.GITHUB_ID,
        client_secret: process.env.GITHUB_SECRET,
        code,
        redirect_uri: redirect,
      }),
    });
    return res.json() as Promise<{ access_token?: string; error?: string }>;
  }
  if (provider === "gitlab") {
    const res = await fetch("https://gitlab.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: process.env.GITLAB_ID,
        client_secret: process.env.GITLAB_SECRET,
        code,
        grant_type: "authorization_code",
        redirect_uri: redirect,
      }),
    });
    return res.json() as Promise<{ access_token?: string; refresh_token?: string; error?: string }>;
  }
  if (provider === "bitbucket") {
    const basic = Buffer.from(`${process.env.BITBUCKET_ID}:${process.env.BITBUCKET_SECRET}`).toString("base64");
    const res = await fetch("https://bitbucket.org/site/oauth2/access_token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${basic}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ grant_type: "authorization_code", code, redirect_uri: redirect }),
    });
    return res.json() as Promise<{ access_token?: string; refresh_token?: string; error?: string }>;
  }
  if (provider === "google_calendar") {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        code,
        grant_type: "authorization_code",
        redirect_uri: redirect,
      }),
    });
    return res.json() as Promise<{ access_token?: string; refresh_token?: string; error?: string }>;
  }
  if (provider === "slack") {
    const res = await fetch("https://slack.com/api/oauth.v2.access", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.SLACK_CLIENT_ID || "",
        client_secret: process.env.SLACK_CLIENT_SECRET || "",
        code,
        redirect_uri: redirect,
      }),
    });
    const data = await res.json();
    return { access_token: data.access_token, error: data.error };
  }
  return { error: "unsupported" };
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ provider: string }> },
) {
  const { provider } = await context.params;
  const code = request.nextUrl.searchParams.get("code");
  const cookieStore = await cookies();
  const userId = cookieStore.get(`oauth_${provider}`)?.value;
  cookieStore.delete(`oauth_${provider}`);
  if (!code || !userId) {
    return NextResponse.redirect(`${getAppUrl()}/app/integrations?error=oauth`);
  }
  const token = await exchange(provider, code);
  if (!token.access_token) {
    return NextResponse.redirect(`${getAppUrl()}/app/integrations?error=token`);
  }
  await prisma.integration.upsert({
    where: { userId_provider: { userId, provider } },
    create: {
      userId,
      provider,
      status: "connected",
      accessToken: encryptSecret(token.access_token),
      refreshToken: token.refresh_token ? encryptSecret(token.refresh_token) : null,
    },
    update: {
      status: "connected",
      accessToken: encryptSecret(token.access_token),
      refreshToken: token.refresh_token ? encryptSecret(token.refresh_token) : undefined,
      lastError: null,
    },
  });
  if (["github", "gitlab", "bitbucket"].includes(provider)) {
    void syncIntegration(userId, provider).catch(() => undefined);
  }
  if (provider === "google_calendar") {
    void importCalendar(userId, token.access_token).catch(() => undefined);
  }
  return NextResponse.redirect(`${getAppUrl()}/app/integrations?connected=${provider}`);
}

async function importCalendar(userId: string, accessToken: string) {
  const res = await fetch(
    "https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=50&singleEvents=true&orderBy=startTime&timeMin=" +
      new Date(Date.now() - 7 * 86400000).toISOString(),
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  if (!res.ok) return;
  const data = (await res.json()) as {
    items?: Array<{ id: string; summary?: string; start?: { dateTime?: string; date?: string }; end?: { dateTime?: string; date?: string } }>;
  };
  for (const event of data.items || []) {
    const start = event.start?.dateTime || event.start?.date;
    const end = event.end?.dateTime || event.end?.date;
    if (!start || !end) continue;
    await prisma.calendarEvent.upsert({
      where: { userId_provider_externalId: { userId, provider: "google_calendar", externalId: event.id } },
      create: {
        userId,
        provider: "google_calendar",
        externalId: event.id,
        title: event.summary || "Busy",
        startAt: new Date(start),
        endAt: new Date(end),
        allDay: Boolean(event.start?.date),
      },
      update: {
        title: event.summary || "Busy",
        startAt: new Date(start),
        endAt: new Date(end),
      },
    });
  }
}

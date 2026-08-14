import { INTEGRATION_CATALOG, type ProviderId } from "@/lib/integrations/types";
import { getAppUrl } from "@/lib/api";

export function oauthStartUrl(provider: ProviderId, state: string) {
  const redirect = `${getAppUrl()}/api/integrations/${provider}/callback`;
  if (provider === "github") {
    const id = process.env.GITHUB_ID;
    if (!id) return null;
    const params = new URLSearchParams({
      client_id: id,
      redirect_uri: redirect,
      scope: "read:user user:email repo",
      state,
    });
    return `https://github.com/login/oauth/authorize?${params}`;
  }
  if (provider === "gitlab") {
    const id = process.env.GITLAB_ID;
    if (!id) return null;
    const params = new URLSearchParams({
      client_id: id,
      redirect_uri: redirect,
      response_type: "code",
      scope: "read_user read_api read_repository",
      state,
    });
    return `https://gitlab.com/oauth/authorize?${params}`;
  }
  if (provider === "bitbucket") {
    const id = process.env.BITBUCKET_ID;
    if (!id) return null;
    const params = new URLSearchParams({
      client_id: id,
      redirect_uri: redirect,
      response_type: "code",
      state,
    });
    return `https://bitbucket.org/site/oauth2/authorize?${params}`;
  }
  if (provider === "google_calendar") {
    const id = process.env.GOOGLE_CLIENT_ID;
    if (!id) return null;
    const params = new URLSearchParams({
      client_id: id,
      redirect_uri: redirect,
      response_type: "code",
      scope: "https://www.googleapis.com/auth/calendar.readonly",
      access_type: "offline",
      prompt: "consent",
      state,
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  }
  if (provider === "slack") {
    const id = process.env.SLACK_CLIENT_ID;
    if (!id) return null;
    const params = new URLSearchParams({
      client_id: id,
      redirect_uri: redirect,
      scope: "users:read",
      state,
    });
    return `https://slack.com/oauth/v2/authorize?${params}`;
  }
  return null;
}

export function catalogItem(provider: string) {
  return INTEGRATION_CATALOG.find((i) => i.id === provider);
}

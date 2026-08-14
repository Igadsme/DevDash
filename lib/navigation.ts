export const PAGE_ROUTES: Record<string, string> = {
  landing: "/",
  pricing: "/pricing",
  signin: "/signin",
  signup: "/signup",
  connect: "/onboarding",
  overview: "/app/overview",
  "what-needs-me": "/app/what-needs-me",
  activity: "/app/activity",
  "week-in-code": "/app/week-in-code",
  focus: "/app/focus",
  "dev-health": "/app/dev-health",
  analytics: "/app/analytics",
  "ai-assistant": "/app/ai-assistant",
  reports: "/app/reports",
  "app-integrations": "/app/integrations",
  settings: "/app/settings",
  privacy: "/privacy",
  terms: "/terms",
};

export const ROUTE_PAGES: Record<string, string> = Object.fromEntries(
  Object.entries(PAGE_ROUTES).map(([page, route]) => [route, page]),
);

export function pageFromPath(pathname: string) {
  if (ROUTE_PAGES[pathname]) return ROUTE_PAGES[pathname];
  if (pathname.startsWith("/app/")) {
    const segment = pathname.replace("/app/", "");
    return segment || "overview";
  }
  return "landing";
}

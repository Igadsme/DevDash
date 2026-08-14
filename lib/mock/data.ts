/**
 * Isolated mock/demo fixtures from the original Figma frontend.
 * Production UI reads from Prisma via API routes. Do not import this
 * module from dashboard pages.
 */
export const mockUser = {
  name: "Gad",
  username: "gadm",
  avatar: "G",
  email: "gad@company.io",
};

export const mockMetrics = {
  commits: 27,
  prs: 8,
  reviews: 14,
  focusTime: "4h 21m",
  commitsTrend: +12,
  prsTrend: -2,
  reviewsTrend: +5,
  focusTrend: +18,
};

export const mockWhatNeedsMe = [
  {
    id: 1,
    priority: "critical",
    type: "ci",
    title: "CI pipeline failing",
    repo: "payments-api",
    age: "37 min ago",
    context: "3 jobs failed on main",
    action: "View",
    branch: "main",
  },
  {
    id: 2,
    priority: "high",
    type: "pr",
    title: "PR waiting for your review",
    repo: "auth-service",
    age: "2h ago",
    context: "authentication-refactor · 2 reviewers requested",
    action: "Review",
    prNumber: 382,
  },
  {
    id: 3,
    priority: "high",
    type: "pr",
    title: "Your PR has changes requested",
    repo: "frontend-dashboard",
    age: "3h ago",
    context: "feat/new-metrics-panel · 1 reviewer responded",
    action: "View",
    prNumber: 391,
  },
  {
    id: 4,
    priority: "medium",
    type: "issue",
    title: "Issue approaching deadline",
    repo: "api-docs",
    age: "Due in 2 days",
    context: "#482 — Update API documentation",
    action: "Open",
  },
  {
    id: 5,
    priority: "medium",
    type: "review",
    title: "Stale review — no activity in 48h",
    repo: "infra-terraform",
    age: "2 days ago",
    context: "PR #371 — Add Redis cluster config",
    action: "Review",
  },
  {
    id: 6,
    priority: "low",
    type: "issue",
    title: "Assigned issue — no updates",
    repo: "payments-api",
    age: "5 days ago",
    context: "#467 — Rate limiting edge case",
    action: "Open",
  },
];

export const mockActivity = [
  { id: 1, time: "2:41 PM", type: "pr", title: "Merged PR #382", sub: "authentication-refactor", repo: "auth-service", status: "merged" },
  { id: 2, time: "1:52 PM", type: "review", title: "Review requested", sub: "payments-api #391", repo: "payments-api", status: "pending" },
  { id: 3, time: "12:14 PM", type: "commit", title: "Fix OAuth callback redirect", sub: "a3f91c2", repo: "auth-service", status: "pushed" },
  { id: 4, time: "11:08 AM", type: "ci", title: "CI passed", sub: "frontend-dashboard · build #204", repo: "frontend-dashboard", status: "passed" },
  { id: 5, time: "10:31 AM", type: "commit", title: "Add token refresh logic", sub: "b8e44d1", repo: "auth-service", status: "pushed" },
  { id: 6, time: "9:55 AM", type: "issue", title: "Opened issue #484", sub: "JWT expiry not handled in mobile", repo: "mobile-app", status: "open" },
  { id: 7, time: "9:20 AM", type: "pr", title: "Opened PR #391", sub: "feat/new-metrics-panel", repo: "frontend-dashboard", status: "open" },
  { id: 8, time: "Yesterday, 4:30 PM", type: "ci", title: "CI failed", sub: "payments-api · build #118", repo: "payments-api", status: "failed" },
  { id: 9, time: "Yesterday, 3:12 PM", type: "commit", title: "Fix Stripe webhook signature", sub: "d2c19a0", repo: "payments-api", status: "pushed" },
  { id: 10, time: "Yesterday, 1:45 PM", type: "review", title: "Completed review", sub: "infra-terraform PR #371", repo: "infra-terraform", status: "completed" },
];

export const mockWeekTimeline = [
  {
    day: "Mon",
    date: "Aug 11",
    events: [
      { type: "commit", count: 4, label: "4 commits" },
      { type: "review", count: 2, label: "2 reviews" },
    ],
  },
  {
    day: "Tue",
    date: "Aug 12",
    events: [
      { type: "commit", count: 6, label: "6 commits" },
      { type: "pr", count: 1, label: "1 PR opened" },
      { type: "ci", count: 1, label: "1 CI passed" },
    ],
  },
  {
    day: "Wed",
    date: "Aug 13",
    events: [
      { type: "commit", count: 5, label: "5 commits" },
      { type: "pr", count: 2, label: "2 PRs" },
      { type: "review", count: 3, label: "3 reviews" },
      { type: "ci", count: 2, label: "2 CI runs" },
    ],
  },
  {
    day: "Thu",
    date: "Aug 14",
    events: [
      { type: "commit", count: 8, label: "8 commits" },
      { type: "pr", count: 3, label: "3 PRs" },
    ],
  },
  {
    day: "Fri",
    date: "Aug 15",
    events: [
      { type: "commit", count: 4, label: "4 commits" },
      { type: "review", count: 2, label: "2 reviews" },
      { type: "release", count: 1, label: "1 release" },
    ],
  },
];

export const mockFocusData = [
  { hour: "8AM", focus: 0.3, meetings: 0, interruptions: 0.1 },
  { hour: "9AM", focus: 0.9, meetings: 0, interruptions: 0.1 },
  { hour: "10AM", focus: 1.0, meetings: 0, interruptions: 0.05 },
  { hour: "11AM", focus: 0.8, meetings: 0.5, interruptions: 0.2 },
  { hour: "12PM", focus: 0.2, meetings: 0, interruptions: 0.1 },
  { hour: "1PM", focus: 0.4, meetings: 0, interruptions: 0.4 },
  { hour: "2PM", focus: 0.5, meetings: 0, interruptions: 0.6 },
  { hour: "3PM", focus: 0.3, meetings: 1.0, interruptions: 0.5 },
  { hour: "4PM", focus: 0.6, meetings: 0, interruptions: 0.2 },
  { hour: "5PM", focus: 0.7, meetings: 0, interruptions: 0.1 },
];

export const mockCommitsByDay = [
  { day: "Mon", commits: 4, prs: 0, reviews: 2 },
  { day: "Tue", commits: 6, prs: 1, reviews: 1 },
  { day: "Wed", commits: 5, prs: 2, reviews: 3 },
  { day: "Thu", commits: 8, prs: 3, reviews: 4 },
  { day: "Fri", commits: 4, prs: 2, reviews: 2 },
];

export const mockCIData = [
  { date: "Aug 7", success: 8, failed: 1 },
  { date: "Aug 8", success: 10, failed: 0 },
  { date: "Aug 9", success: 7, failed: 2 },
  { date: "Aug 10", success: 9, failed: 0 },
  { date: "Aug 11", success: 6, failed: 1 },
  { date: "Aug 12", success: 11, failed: 0 },
  { date: "Aug 13", success: 8, failed: 3 },
];

export const mockThemes = [
  { name: "Authentication", pct: 42, color: "#4a8fff" },
  { name: "API", pct: 31, color: "#22c55e" },
  { name: "Dashboard", pct: 19, color: "#f59e0b" },
  { name: "Other", pct: 8, color: "#6b7280" },
];

export const integrations = [
  { id: "github", name: "GitHub", desc: "Source control and pull requests", connected: true, handle: "@gadm", category: "Source Control" },
  { id: "gitlab", name: "GitLab", desc: "Source control and merge requests", connected: false, category: "Source Control" },
  { id: "actions", name: "GitHub Actions", desc: "CI/CD workflows and runs", connected: true, category: "CI/CD" },
  { id: "jenkins", name: "Jenkins", desc: "Build automation server", connected: false, category: "CI/CD" },
  { id: "circleci", name: "CircleCI", desc: "Continuous integration platform", connected: false, category: "CI/CD" },
  { id: "linear", name: "Linear", desc: "Issue tracking and project management", connected: false, category: "Project Management" },
  { id: "jira", name: "Jira", desc: "Issue and project tracking", connected: false, category: "Project Management" },
  { id: "slack", name: "Slack", desc: "Team messaging and notifications", connected: false, category: "Communication" },
  { id: "gcal", name: "Google Calendar", desc: "Calendar events and meeting load", connected: false, category: "Calendar" },
  { id: "teams", name: "Microsoft Teams", desc: "Team collaboration and meetings", connected: false, category: "Communication" },
];

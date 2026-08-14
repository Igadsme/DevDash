export type ProviderId =
  | "github"
  | "gitlab"
  | "bitbucket"
  | "github_actions"
  | "gitlab_ci"
  | "circleci"
  | "jenkins"
  | "slack"
  | "google_calendar"
  | "linear"
  | "jira"
  | "teams";

export type NormalizedEvent = {
  provider: string;
  type:
    | "commit"
    | "pr"
    | "review"
    | "issue"
    | "comment"
    | "branch"
    | "release"
    | "ci"
    | "deployment";
  repository: string | null;
  title: string;
  description?: string | null;
  url?: string | null;
  timestamp: Date;
  externalId: string;
  metadata?: Record<string, unknown>;
};

export type NormalizedRepo = {
  provider: string;
  externalId: string;
  name: string;
  fullName: string;
  url?: string;
  private?: boolean;
  defaultBranch?: string;
  language?: string | null;
  lastActivityAt?: Date | null;
};

export type AdapterContext = {
  userId: string;
  accessToken: string;
  handle?: string | null;
  metadata?: Record<string, unknown> | null;
  since?: Date;
};

export interface SourceControlAdapter {
  provider: ProviderId;
  listRepositories(ctx: AdapterContext): Promise<NormalizedRepo[]>;
  listEvents(ctx: AdapterContext, repos: NormalizedRepo[]): Promise<NormalizedEvent[]>;
}

export const INTEGRATION_CATALOG: Array<{
  id: ProviderId;
  name: string;
  desc: string;
  category: string;
  oauth: boolean;
  env: string[];
}> = [
  { id: "github", name: "GitHub", desc: "Source control and pull requests", category: "Source Control", oauth: true, env: ["GITHUB_ID", "GITHUB_SECRET"] },
  { id: "gitlab", name: "GitLab", desc: "Source control and merge requests", category: "Source Control", oauth: true, env: ["GITLAB_ID", "GITLAB_SECRET"] },
  { id: "bitbucket", name: "Bitbucket", desc: "Source control and pull requests", category: "Source Control", oauth: true, env: ["BITBUCKET_ID", "BITBUCKET_SECRET"] },
  { id: "github_actions", name: "GitHub Actions", desc: "CI/CD workflows and runs", category: "CI/CD", oauth: false, env: [] },
  { id: "gitlab_ci", name: "GitLab CI", desc: "Pipelines from GitLab", category: "CI/CD", oauth: false, env: [] },
  { id: "circleci", name: "CircleCI", desc: "Continuous integration platform", category: "CI/CD", oauth: false, env: ["CIRCLECI_TOKEN"] },
  { id: "jenkins", name: "Jenkins", desc: "Build automation server", category: "CI/CD", oauth: false, env: [] },
  { id: "linear", name: "Linear", desc: "Issue tracking and project management", category: "Project Management", oauth: false, env: [] },
  { id: "jira", name: "Jira", desc: "Issue and project tracking", category: "Project Management", oauth: false, env: [] },
  { id: "slack", name: "Slack", desc: "Team messaging and notifications", category: "Communication", oauth: true, env: ["SLACK_CLIENT_ID", "SLACK_CLIENT_SECRET"] },
  { id: "google_calendar", name: "Google Calendar", desc: "Calendar events and meeting load", category: "Calendar", oauth: true, env: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"] },
  { id: "teams", name: "Microsoft Teams", desc: "Team collaboration and meetings", category: "Communication", oauth: false, env: [] },
];

export function providerConfigured(id: ProviderId) {
  const item = INTEGRATION_CATALOG.find((i) => i.id === id);
  if (!item) return false;
  if (item.env.length === 0) return true;
  return item.env.every((key) => Boolean(process.env[key]));
}

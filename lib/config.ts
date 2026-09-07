import { z } from "zod";

const optionalSecret = z.string().trim().min(1).optional();
const serverEnvironmentSchema = z.object({
  DATABASE_URL: z.string().trim().min(1),
  NEXTAUTH_SECRET: optionalSecret,
  GITHUB_ID: optionalSecret,
  GITHUB_SECRET: optionalSecret,
  GITHUB_APP_ID: optionalSecret,
  GITHUB_APP_SLUG: optionalSecret,
  GITHUB_APP_PRIVATE_KEY: optionalSecret,
  GITHUB_WEBHOOK_SECRET: optionalSecret,
  GITLAB_CLIENT_ID: optionalSecret,
  GITLAB_CLIENT_SECRET: optionalSecret,
  GITLAB_WEBHOOK_SECRET: optionalSecret,
  BITBUCKET_CLIENT_ID: optionalSecret,
  BITBUCKET_CLIENT_SECRET: optionalSecret,
  BITBUCKET_WEBHOOK_SECRET: optionalSecret,
  SLACK_CLIENT_ID: optionalSecret,
  SLACK_CLIENT_SECRET: optionalSecret,
  NOTION_CLIENT_ID: optionalSecret,
  NOTION_CLIENT_SECRET: optionalSecret,
  CREDENTIAL_ENCRYPTION_KEY: optionalSecret,
  OPENAI_API_KEY: optionalSecret,
  CRON_SECRET: optionalSecret,
});

export function getServerEnvironment() {
  return serverEnvironmentSchema.parse(process.env);
}

export function hasGitHubOAuthConfig() {
  return Boolean(
    process.env.GITHUB_ID?.trim() && process.env.GITHUB_SECRET?.trim(),
  );
}

export function hasGitHubAppConfig() {
  return Boolean(
    process.env.GITHUB_APP_ID?.trim() &&
    process.env.GITHUB_APP_SLUG?.trim() &&
    process.env.GITHUB_APP_PRIVATE_KEY?.trim(),
  );
}

export function hasOpenAIConfig() {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

export function hasAuthSecret() {
  return Boolean(process.env.NEXTAUTH_SECRET?.trim());
}

export function hasCredentialEncryptionConfig() {
  return Boolean(process.env.CREDENTIAL_ENCRYPTION_KEY?.trim());
}

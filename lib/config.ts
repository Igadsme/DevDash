export function hasGitHubOAuthConfig() {
  return Boolean(process.env.GITHUB_ID?.trim() && process.env.GITHUB_SECRET?.trim());
}

export function hasOpenAIConfig() {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

export function hasAuthSecret() {
  return Boolean(process.env.NEXTAUTH_SECRET?.trim());
}

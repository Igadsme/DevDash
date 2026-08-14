import { GitHubAdapter } from "./github";
import { GitLabAdapter } from "./gitlab";
import { BitbucketAdapter } from "./bitbucket";
import type { ProviderId, SourceControlAdapter } from "./types";

const adapters: Partial<Record<ProviderId, SourceControlAdapter>> = {
  github: new GitHubAdapter(),
  gitlab: new GitLabAdapter(),
  bitbucket: new BitbucketAdapter(),
};

export function getAdapter(provider: string): SourceControlAdapter | null {
  return adapters[provider as ProviderId] || null;
}

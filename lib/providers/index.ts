import type { Provider } from "@prisma/client";
import { BitbucketAdapter } from "@/lib/providers/bitbucket";
import { GitHubAdapter } from "@/lib/providers/github";
import { GitLabAdapter } from "@/lib/providers/gitlab";
import type { ProviderFetch } from "@/lib/providers/http";
import type { SourceControlAdapter } from "@/lib/providers/types";

export function createSourceControlAdapter(
  provider: Provider,
  token: string,
  fetcher?: ProviderFetch,
): SourceControlAdapter {
  if (provider === "GITHUB") return new GitHubAdapter(token, fetcher);
  if (provider === "GITLAB") return new GitLabAdapter(token, fetcher);
  if (provider === "BITBUCKET") return new BitbucketAdapter(token, fetcher);
  throw new Error(`${provider} is not a source-control provider.`);
}

export type { SourceControlAdapter } from "@/lib/providers/types";

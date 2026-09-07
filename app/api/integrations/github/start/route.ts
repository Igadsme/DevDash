import { NextResponse } from "next/server";

import { getApiUserId, unauthorized } from "@/lib/api";
import { hasGitHubAppConfig } from "@/lib/config";
import {
  createGitHubInstallState,
  githubInstallUrl,
} from "@/lib/integrations/github-app";

export async function GET() {
  const userId = await getApiUserId();
  if (!userId) return unauthorized();
  if (!hasGitHubAppConfig()) {
    return NextResponse.json(
      { error: "GitHub App is not configured." },
      { status: 503 },
    );
  }
  return NextResponse.redirect(
    githubInstallUrl(createGitHubInstallState(userId)),
    303,
  );
}

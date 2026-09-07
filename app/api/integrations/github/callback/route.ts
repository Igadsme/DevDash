import { NextRequest, NextResponse } from "next/server";

import { getAuthSession } from "@/lib/auth";
import {
  getGitHubInstallation,
  verifyGitHubInstallState,
} from "@/lib/integrations/github-app";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await getAuthSession();
  const stateUserId = verifyGitHubInstallState(
    request.nextUrl.searchParams.get("state") ?? "",
  );
  const installationId = request.nextUrl.searchParams.get("installation_id");
  if (
    !session?.user?.id ||
    session.user.id !== stateUserId ||
    !installationId
  ) {
    return NextResponse.redirect(
      new URL("/integrations?error=invalid_github_callback", request.url),
      303,
    );
  }
  try {
    const installation = await getGitHubInstallation(installationId);
    const providerAccountId = String(installation.account.id);
    await prisma.providerConnection.upsert({
      where: {
        userId_provider_providerAccountId: {
          userId: session.user.id,
          provider: "GITHUB",
          providerAccountId,
        },
      },
      create: {
        userId: session.user.id,
        provider: "GITHUB",
        providerAccountId,
        displayName:
          installation.account.login ??
          installation.account.name ??
          "GitHub installation",
        installationId: String(installation.id),
        status: "CONNECTED",
        scopes: Object.keys(installation.permissions ?? {}),
      },
      update: {
        displayName:
          installation.account.login ??
          installation.account.name ??
          "GitHub installation",
        installationId: String(installation.id),
        status: "CONNECTED",
        scopes: Object.keys(installation.permissions ?? {}),
        lastErrorCode: null,
        disconnectedAt: null,
      },
    });
    return NextResponse.redirect(
      new URL("/integrations?connected=github", request.url),
      303,
    );
  } catch (error) {
    console.error("GitHub App callback failed.", error);
    return NextResponse.redirect(
      new URL("/integrations?error=github_app", request.url),
      303,
    );
  }
}

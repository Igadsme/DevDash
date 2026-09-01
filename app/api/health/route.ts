import { NextResponse } from "next/server";

import { hasAuthSecret, hasGitHubOAuthConfig, hasOpenAIConfig } from "@/lib/config";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await prisma.user.count();

    return NextResponse.json({
      status: "ok",
      database: "connected",
      integrations: {
        github: hasGitHubOAuthConfig() ? "configured" : "not_configured",
        openai: hasOpenAIConfig() ? "configured" : "not_configured",
        authSecret: hasAuthSecret() ? "configured" : "not_configured"
      }
    });
  } catch (error) {
    console.error("Health check failed.", error);
    return NextResponse.json(
      { status: "error", database: "unavailable" },
      { status: 503 }
    );
  }
}

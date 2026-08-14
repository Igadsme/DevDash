import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiError, json, requireUser } from "@/lib/api";
import { encryptSecret } from "@/lib/crypto";
import { oauthStartUrl } from "@/lib/integrations/oauth";
import type { ProviderId } from "@/lib/integrations/types";
import { syncIntegration } from "@/lib/sync/engine";

const tokenSchema = z.object({
  token: z.string().min(8).max(200).optional(),
  url: z.string().url().optional(),
  username: z.string().optional(),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ provider: string }> },
) {
  try {
    const user = await requireUser();
    const { provider } = await context.params;
    const id = provider as ProviderId;
    const oauth = oauthStartUrl(id, `${user.id}:${randomBytes(8).toString("hex")}`);
    if (oauth) {
      const cookieStore = await cookies();
      cookieStore.set(`oauth_${id}`, user.id, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 600,
        path: "/",
      });
      return json({ url: oauth });
    }

    const body = await request.json().catch(() => ({}));
    const parsed = tokenSchema.parse(body);
    if (["circleci", "jenkins", "linear", "jira"].includes(id)) {
      if (!parsed.token) {
        return json({ error: "An API token is required to connect this integration." }, 400);
      }
      await prisma.integration.upsert({
        where: { userId_provider: { userId: user.id, provider: id } },
        create: {
          userId: user.id,
          provider: id,
          status: "connected",
          accessToken: encryptSecret(parsed.token),
          metadata: parsed.url ? { url: parsed.url, username: parsed.username } : undefined,
        },
        update: {
          status: "connected",
          accessToken: encryptSecret(parsed.token),
          lastError: null,
        },
      });
      return json({ ok: true });
    }

    if (id === "github_actions" || id === "gitlab_ci") {
      const parent = id === "github_actions" ? "github" : "gitlab";
      const source = await prisma.integration.findUnique({
        where: { userId_provider: { userId: user.id, provider: parent } },
      });
      if (source?.status !== "connected") {
        return json({ error: `Connect ${parent} first.` }, 400);
      }
      await prisma.integration.upsert({
        where: { userId_provider: { userId: user.id, provider: id } },
        create: { userId: user.id, provider: id, status: "connected", handle: source.handle },
        update: { status: "connected" },
      });
      void syncIntegration(user.id, parent).catch(() => undefined);
      return json({ ok: true });
    }

    return json({ error: "This integration is not configured yet. Add the required environment variables." }, 400);
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ provider: string }> },
) {
  try {
    const user = await requireUser();
    const { provider } = await context.params;
    await prisma.integration.updateMany({
      where: { userId: user.id, provider },
      data: { status: "disconnected", accessToken: null, refreshToken: null, lastError: null },
    });
    return json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}

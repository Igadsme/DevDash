import { prisma } from "@/lib/prisma";
import { apiError, json, requireUser } from "@/lib/api";
import { z } from "zod";
import { syncIntegration } from "@/lib/sync/engine";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await requireUser();
    let repos = await prisma.repository.findMany({
      where: { userId: user.id },
      orderBy: { lastActivityAt: "desc" },
    });
    if (!repos.length) {
      const github = await prisma.integration.findUnique({
        where: { userId_provider: { userId: user.id, provider: "github" } },
      });
      if (github?.status === "connected" || github?.status === "syncing" || github?.status === "error") {
        await syncIntegration(user.id, "github").catch(() => undefined);
        repos = await prisma.repository.findMany({
          where: { userId: user.id },
          orderBy: { lastActivityAt: "desc" },
        });
      }
    }
    return json({ repos });
  } catch (error) {
    return apiError(error);
  }
}

const schema = z.object({
  selected: z.array(z.string()),
});

export async function PATCH(request: Request) {
  try {
    const user = await requireUser();
    const body = schema.parse(await request.json());
    await prisma.repository.updateMany({
      where: { userId: user.id },
      data: { selected: false },
    });
    await prisma.repository.updateMany({
      where: { userId: user.id, id: { in: body.selected } },
      data: { selected: true },
    });
    return json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}

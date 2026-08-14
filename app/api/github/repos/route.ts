import { prisma } from "@/lib/prisma";
import { apiError, json, requireUser } from "@/lib/api";
import { z } from "zod";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await requireUser();
    const repos = await prisma.repository.findMany({
      where: { userId: user.id },
      orderBy: { lastActivityAt: "desc" },
    });
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

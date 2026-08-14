import { prisma } from "@/lib/prisma";
import { apiError, json, requireUser } from "@/lib/api";
import { z } from "zod";

export async function GET() {
  try {
    const user = await requireUser();
    const reports = await prisma.sharedReport.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });
    return json({ reports });
  } catch (error) {
    return apiError(error);
  }
}

const schema = z.object({
  summaryId: z.string().optional(),
  visibility: z.enum(["PRIVATE", "SHAREABLE", "AGGREGATED"]).default("SHAREABLE"),
});

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = schema.parse(await request.json());
    const report = await prisma.sharedReport.create({
      data: {
        userId: user.id,
        summaryId: body.summaryId,
        visibility: body.visibility,
      },
    });
    return json(report);
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return json({ error: "Missing id" }, 400);
    await prisma.sharedReport.updateMany({
      where: { id, userId: user.id },
      data: { revoked: true },
    });
    return json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}

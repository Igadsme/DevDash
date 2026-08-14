import { apiError, json, requireUser } from "@/lib/api";
import { computeDevHealth } from "@/lib/engines/health";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await requireUser();
    const insights = await computeDevHealth(user.id);
    return json({ insights });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();
    if (body.signalId) {
      await prisma.dismissedInsight.upsert({
        where: { userId_signalId: { userId: user.id, signalId: String(body.signalId) } },
        create: { userId: user.id, signalId: String(body.signalId) },
        update: {},
      });
    }
    return json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}

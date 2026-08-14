import { prisma } from "@/lib/prisma";
import { apiError, json, requireUser } from "@/lib/api";

export async function GET() {
  try {
    const user = await requireUser();
    const items = await prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    return json({ items, unread: items.filter((i) => !i.read).length });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH() {
  try {
    const user = await requireUser();
    await prisma.notification.updateMany({
      where: { userId: user.id, read: false },
      data: { read: true },
    });
    return json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}

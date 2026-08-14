import { prisma } from "@/lib/prisma";
import { apiError, json, requireUser } from "@/lib/api";
import { INTEGRATION_CATALOG, providerConfigured } from "@/lib/integrations/types";
import { relativeTime } from "@/lib/dates";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await requireUser();
    const connected = await prisma.integration.findMany({ where: { userId: user.id } });
    const byProvider = new Map(connected.map((i) => [i.provider, i]));
    const items = INTEGRATION_CATALOG.map((item) => {
      const rec = byProvider.get(item.id);
      return {
        id: item.id,
        name: item.name,
        desc: item.desc,
        category: item.category,
        connected: rec?.status === "connected" || rec?.status === "syncing",
        status: rec?.status || "disconnected",
        handle: rec?.handle,
        lastSyncAt: rec?.lastSyncAt,
        lastSyncLabel: rec?.lastSyncAt ? relativeTime(rec.lastSyncAt) : "Never",
        lastError: rec?.lastError,
        configured: providerConfigured(item.id),
        oauth: item.oauth,
      };
    });
    return json({ items });
  } catch (error) {
    return apiError(error);
  }
}

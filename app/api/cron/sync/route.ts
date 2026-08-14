import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { json } from "@/lib/api";
import { syncUser } from "@/lib/sync/engine";

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const header = request.headers.get("authorization");
  if (secret && header !== `Bearer ${secret}`) {
    return json({ error: "Unauthorized" }, 401);
  }
  const users = await prisma.user.findMany({
    where: { integrations: { some: { status: { in: ["connected", "error"] } } } },
    select: { id: true },
    take: 50,
  });
  const results = [];
  for (const user of users) {
    try {
      results.push({ userId: user.id, result: await syncUser(user.id) });
    } catch (error) {
      results.push({ userId: user.id, error: error instanceof Error ? error.message : "failed" });
    }
  }
  return json({ ok: true, count: results.length });
}

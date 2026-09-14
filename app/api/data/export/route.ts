import { NextResponse } from "next/server";

import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      events: { orderBy: { timestamp: "desc" } },
      accounts: { select: { provider: true, providerAccountId: true, scope: true } }
    }
  });

  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  const { accounts, events, ...profile } = user;
  return new NextResponse(JSON.stringify({ profile, connectedAccounts: accounts, events }, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": 'attachment; filename="devdash-data.json"',
      "Cache-Control": "no-store"
    }
  });
}

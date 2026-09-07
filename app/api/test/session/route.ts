import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function POST() {
  if (
    process.env.NODE_ENV === "production" ||
    process.env.E2E_TEST_MODE !== "1"
  ) {
    return new NextResponse(null, { status: 404 });
  }
  const user = await prisma.user.upsert({
    where: { email: "e2e@devdash.test" },
    create: { email: "e2e@devdash.test", name: "E2E Developer" },
    update: {},
  });
  await prisma.userSettings.upsert({
    where: { userId: user.id },
    create: { userId: user.id },
    update: {},
  });
  await prisma.$transaction([
    prisma.task.deleteMany({ where: { userId: user.id } }),
    prisma.session.deleteMany({ where: { userId: user.id } }),
  ]);
  const sessionToken = randomUUID();
  await prisma.session.create({
    data: {
      userId: user.id,
      sessionToken,
      expires: new Date(Date.now() + 60 * 60_000),
    },
  });
  const response = NextResponse.json({ status: "ok" });
  response.cookies.set("next-auth.session-token", sessionToken, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60,
  });
  return response;
}

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
  // Each Playwright project requests a session concurrently. A shared fixture
  // user lets one request delete another project's session and makes the suite
  // nondeterministic, so every request gets an isolated account instead.
  const testId = randomUUID();
  const user = await prisma.user.create({
    data: {
      email: `e2e+${testId}@devdash.test`,
      name: "E2E Developer",
      settings: { create: {} },
    },
  });
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

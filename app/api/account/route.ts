import { NextResponse } from "next/server";
import { getApiUserId } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { disconnectProvider } from "@/lib/integrations/disconnect";
export async function POST(request: Request) {
  const userId = await getApiUserId();
  if (!userId) return new Response("Authentication required.", { status: 401 });
  const form = await request.formData();
  if (form.get("confirmation") !== "DELETE")
    return new Response("Confirmation did not match.", { status: 400 });
  const connections = await prisma.providerConnection.findMany({
    where: { userId },
    select: { id: true },
  });
  await Promise.allSettled(
    connections.map((connection) => disconnectProvider(userId, connection.id)),
  );
  await prisma.user.delete({ where: { id: userId } });
  const response = NextResponse.redirect(new URL("/", request.url), 303);
  for (const cookie of request.headers.get("cookie")?.split(";") ?? []) {
    const name = cookie.split("=", 1)[0]?.trim();
    if (name?.includes("next-auth.session-token"))
      response.cookies.delete(name);
  }
  return response;
}

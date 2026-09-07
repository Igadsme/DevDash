import { NextResponse } from "next/server";

import { getAuthSession } from "@/lib/auth";

export async function getApiUserId() {
  const session = await getAuthSession();
  return session?.user?.id ?? null;
}

export function unauthorized() {
  return NextResponse.json(
    { error: "Authentication required." },
    { status: 401 },
  );
}
export function invalidRequest(message = "Invalid request.") {
  return NextResponse.json({ error: message }, { status: 400 });
}
export function notFound() {
  return NextResponse.json({ error: "Record not found." }, { status: 404 });
}

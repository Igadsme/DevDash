import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { auth } from "@/lib/auth";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code = "ERROR",
  ) {
    super(message);
  }
}

export function json<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function apiError(error: unknown) {
  if (error instanceof ApiError) {
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: error.status },
    );
  }
  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: "Invalid request", code: "VALIDATION_ERROR", details: error.flatten() },
      { status: 400 },
    );
  }
  console.error("[api]", error instanceof Error ? error.message : "Unknown error");
  return NextResponse.json(
    { error: "Something went wrong. Please try again.", code: "INTERNAL" },
    { status: 500 },
  );
}

export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new ApiError(401, "You need to sign in to continue.", "UNAUTHENTICATED");
  }
  return session.user;
}

export function getAppUrl() {
  return (
    process.env.AUTH_URL ||
    process.env.NEXTAUTH_URL ||
    (process.env.RENDER_EXTERNAL_URL ? `https://${process.env.RENDER_EXTERNAL_URL}` : "http://localhost:3000")
  );
}

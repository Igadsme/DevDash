import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isApp = pathname.startsWith("/app") || pathname.startsWith("/onboarding");
  if (!isApp) return NextResponse.next();

  const secret = process.env.AUTH_SECRET;
  const secureCookie = req.nextUrl.protocol === "https:";
  const token =
    (await getToken({ req, secret, secureCookie })) ||
    (await getToken({ req, secret, cookieName: "authjs.session-token" })) ||
    (await getToken({ req, secret, cookieName: "__Secure-authjs.session-token", secureCookie: true }));

  if (!token) {
    const url = new URL("/signin", req.nextUrl.origin);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/app/:path*", "/onboarding"],
};

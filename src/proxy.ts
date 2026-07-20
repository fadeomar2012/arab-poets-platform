import { NextResponse, type NextRequest } from "next/server";

const PAYLOAD_LANGUAGE_COOKIE = "payload-lng";
const LANGUAGE_MIGRATION_COOKIE = "arab-poets-admin-language-v031";

/**
 * Payload chooses the Admin UI language from a cookie, then the browser header.
 * Existing development sessions were already pinned to English, so this
 * one-time migration initializes Arabic and then leaves future user choices
 * untouched.
 */
export function proxy(request: NextRequest) {
  if (request.cookies.get(LANGUAGE_MIGRATION_COOKIE)) {
    return NextResponse.next();
  }

  const response = NextResponse.redirect(request.nextUrl);
  response.cookies.set(PAYLOAD_LANGUAGE_COOKIE, "ar", {
    httpOnly: false,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  response.cookies.set(LANGUAGE_MIGRATION_COOKIE, "1", {
    httpOnly: true,
    sameSite: "lax",
    path: "/admin",
    maxAge: 60 * 60 * 24 * 365,
  });
  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};

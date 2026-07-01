import { NextResponse, type NextRequest } from "next/server";

const AUTH_COOKIE_NAME_FRAGMENT = "better-auth";
const LOGIN_PATH = "/login";
const ADMIN_PATH_PREFIX = "/admin";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith(ADMIN_PATH_PREFIX)) {
    return NextResponse.next();
  }

  const hasAuthCookie = request.cookies
    .getAll()
    .some((cookie) => cookie.name.includes(AUTH_COOKIE_NAME_FRAGMENT));

  if (hasAuthCookie) {
    return NextResponse.next();
  }

  const loginUrl = new URL(LOGIN_PATH, request.url);
  loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);

  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/admin/:path*"],
};

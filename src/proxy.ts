import { NextRequest, NextResponse } from "next/server";
import {
  defaultLocale,
  isLocale,
  LOCALE_COOKIE,
  locales,
  negotiateLocale,
} from "@/lib/i18n/locales";

function getPreferredLocale(request: NextRequest) {
  const cookieLocale = request.cookies.get(LOCALE_COOKIE)?.value;
  if (cookieLocale && isLocale(cookieLocale)) return cookieLocale;
  return negotiateLocale(request.headers.get("accept-language"));
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname === "/icon" ||
    pathname.startsWith("/icon/") ||
    pathname === "/apple-icon" ||
    pathname.startsWith("/apple-icon/") ||
    pathname === "/opengraph-image" ||
    pathname.startsWith("/opengraph-image") ||
    pathname === "/twitter-image" ||
    pathname.startsWith("/twitter-image") ||
    pathname === "/manifest.webmanifest" ||
    pathname === "/manifest" ||
    /\.[a-zA-Z0-9]+$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  const pathnameHasLocale = locales.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  );

  if (pathnameHasLocale) {
    const segment = pathname.split("/")[1];
    const response = NextResponse.next();
    if (segment && isLocale(segment)) {
      response.cookies.set(LOCALE_COOKIE, segment, {
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
        sameSite: "lax",
      });
    }
    return response;
  }

  const locale = getPreferredLocale(request) || defaultLocale;
  const url = request.nextUrl.clone();
  url.pathname = pathname === "/" ? `/${locale}` : `/${locale}${pathname}`;
  const response = NextResponse.redirect(url);
  response.cookies.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  return response;
}

export const config = {
  matcher: ["/((?!_next|api|.*\\..*).*)"],
};

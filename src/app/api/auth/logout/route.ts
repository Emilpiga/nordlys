import { NextRequest, NextResponse } from "next/server";
import { buildLogoutUrl, isCustomerAccountConfigured } from "@/lib/customer-account";
import { defaultLocale, isLocale, localePath } from "@/lib/i18n/locales";
import { getSiteUrl } from "@/lib/site-url";

export async function GET(request: NextRequest) {
  const localeParam = request.nextUrl.searchParams.get("locale");
  const locale =
    localeParam && isLocale(localeParam) ? localeParam : defaultLocale;
  const returnTo =
    request.nextUrl.searchParams.get("return_to") ||
    `${getSiteUrl()}${localePath(locale)}`;

  if (!isCustomerAccountConfigured()) {
    return NextResponse.redirect(returnTo);
  }

  try {
    const url = await buildLogoutUrl(returnTo);
    return NextResponse.redirect(url);
  } catch (error) {
    console.error("Logout failed:", error);
    return NextResponse.redirect(returnTo);
  }
}

import { NextRequest, NextResponse } from "next/server";
import {
  buildLoginUrl,
  isCustomerAccountConfigured,
} from "@/lib/customer-account";
import { defaultLocale, isLocale } from "@/lib/i18n/locales";

export async function GET(request: NextRequest) {
  if (!isCustomerAccountConfigured()) {
    return NextResponse.json(
      { error: "Customer Account API is not configured." },
      { status: 503 },
    );
  }

  const returnTo = request.nextUrl.searchParams.get("return_to") || undefined;
  const localeParam = request.nextUrl.searchParams.get("locale");
  const locale =
    localeParam && isLocale(localeParam) ? localeParam : defaultLocale;

  try {
    const url = await buildLoginUrl({ returnTo, locale });
    return NextResponse.redirect(url);
  } catch (error) {
    console.error("Login start failed:", error);
    return NextResponse.json(
      { error: "Could not start customer login." },
      { status: 500 },
    );
  }
}

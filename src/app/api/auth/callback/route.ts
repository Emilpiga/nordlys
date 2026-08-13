import { NextRequest, NextResponse } from "next/server";
import { completeLogin } from "@/lib/customer-account";
import { getSiteUrl } from "@/lib/site-url";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const error = request.nextUrl.searchParams.get("error");

  if (error) {
    console.error("OAuth error:", error);
    return NextResponse.redirect(new URL("/sv/account?error=login", getSiteUrl()));
  }

  if (!code || !state) {
    return NextResponse.redirect(new URL("/sv/account?error=login", getSiteUrl()));
  }

  try {
    const returnTo = await completeLogin({ code, state });
    const target = returnTo.startsWith("http")
      ? returnTo
      : new URL(returnTo, getSiteUrl()).toString();
    return NextResponse.redirect(target);
  } catch (err) {
    console.error("OAuth callback failed:", err);
    return NextResponse.redirect(new URL("/sv/account?error=login", getSiteUrl()));
  }
}

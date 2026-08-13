import { NextResponse } from "next/server";
import {
  clearCustomerTokens,
  readCustomerTokens,
  refreshCustomerTokens,
  writeCustomerTokens,
} from "@/lib/customer-account/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Persist a rotated Customer Account access token.
 * Server Components may refresh for the current render but cannot Set-Cookie;
 * the client calls this once after load when a session exists.
 */
export async function POST() {
  const tokens = await readCustomerTokens();
  if (!tokens?.refreshToken) {
    return NextResponse.json({ ok: false as const, reason: "auth" as const }, { status: 401 });
  }

  // Still fresh — nothing to do.
  if (tokens.expiresAt > Date.now() + 60_000) {
    return NextResponse.json({ ok: true as const, refreshed: false });
  }

  try {
    const next = await refreshCustomerTokens(tokens.refreshToken);
    await writeCustomerTokens(next);
    return NextResponse.json({ ok: true as const, refreshed: true });
  } catch (error) {
    console.error("auth refresh route failed:", error);
    try {
      await clearCustomerTokens();
    } catch {
      /* ignore */
    }
    return NextResponse.json({ ok: false as const, reason: "error" as const }, { status: 401 });
  }
}

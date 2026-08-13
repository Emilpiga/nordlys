import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  VIEWER_COOKIE,
  createViewerId,
  heartbeatPresence,
  isPresenceConfigured,
  isValidProductId,
  isValidViewerId,
} from "@/lib/presence";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PresenceBody = {
  productId?: unknown;
};

export async function POST(request: Request) {
  if (!isPresenceConfigured()) {
    return NextResponse.json(
      { ok: false as const, reason: "not_configured" as const, others: 0 },
      { status: 503 },
    );
  }

  let body: PresenceBody;
  try {
    body = (await request.json()) as PresenceBody;
  } catch {
    return NextResponse.json(
      { ok: false as const, reason: "bad_request" as const },
      { status: 400 },
    );
  }

  const productId =
    typeof body.productId === "string" ? body.productId.trim() : "";
  if (!isValidProductId(productId)) {
    return NextResponse.json(
      { ok: false as const, reason: "bad_product" as const },
      { status: 400 },
    );
  }

  const cookieStore = await cookies();
  const existing = cookieStore.get(VIEWER_COOKIE)?.value;
  const viewerId =
    existing && isValidViewerId(existing) ? existing : createViewerId();

  try {
    const others = await heartbeatPresence(productId, viewerId);
    if (others === null) {
      return NextResponse.json(
        { ok: false as const, reason: "not_configured" as const, others: 0 },
        { status: 503 },
      );
    }

    const response = NextResponse.json({
      ok: true as const,
      others,
    });

    response.cookies.set(VIEWER_COOKIE, viewerId, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 30,
    });

    return response;
  } catch (error) {
    console.error("presence heartbeat failed:", error);
    return NextResponse.json(
      { ok: false as const, reason: "error" as const, others: 0 },
      { status: 500 },
    );
  }
}

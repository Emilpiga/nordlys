import { NextResponse } from "next/server";
import { isValidProductId } from "@/lib/presence";
import { recordView } from "@/lib/product-traction";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type TractionBody = {
  type?: unknown;
  productId?: unknown;
};

/**
 * Lightweight write path for first-party product traction.
 * Views are recorded once per tab session from the client.
 */
export async function POST(request: Request) {
  let body: TractionBody;
  try {
    body = (await request.json()) as TractionBody;
  } catch {
    return NextResponse.json(
      { ok: false as const, reason: "bad_request" as const },
      { status: 400 },
    );
  }

  const type = typeof body.type === "string" ? body.type.trim() : "";
  const productId =
    typeof body.productId === "string" ? body.productId.trim() : "";

  if (!isValidProductId(productId)) {
    return NextResponse.json(
      { ok: false as const, reason: "bad_product" as const },
      { status: 400 },
    );
  }

  if (type !== "view") {
    return NextResponse.json(
      { ok: false as const, reason: "bad_type" as const },
      { status: 400 },
    );
  }

  try {
    await recordView(productId);
    return NextResponse.json({ ok: true as const });
  } catch (error) {
    console.error("traction record failed:", error);
    return NextResponse.json(
      { ok: false as const, reason: "error" as const },
      { status: 500 },
    );
  }
}

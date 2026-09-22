import { NextResponse } from "next/server";
import { syncHistoricalSalesFromShopify } from "@/lib/product-traction-sales-sync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Manually (or via cron) refresh absolute historical sales from Shopify Admin.
 *
 *   POST /api/traction/sync-sales
 *   Authorization: Bearer <REVALIDATE_SECRET>
 */
export async function POST(request: Request) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret) {
    return NextResponse.json(
      { ok: false, error: "REVALIDATE_SECRET is not configured" },
      { status: 503 },
    );
  }

  const auth = request.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  const headerSecret = request.headers.get("x-revalidate-secret") ?? "";
  if (token !== secret && headerSecret !== secret) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await syncHistoricalSalesFromShopify();
    const status = result.ok ? 200 : result.reason === "error" ? 500 : 503;
    return NextResponse.json(result, { status });
  } catch (error) {
    console.error("sync-sales failed:", error);
    return NextResponse.json({ ok: false, error: "error" }, { status: 500 });
  }
}

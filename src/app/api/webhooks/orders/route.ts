import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { isValidProductId } from "@/lib/presence";
import { recordSale } from "@/lib/product-traction";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Shopify Admin webhook for paid orders.
 *
 * Register in Shopify Admin → Settings → Notifications → Webhooks:
 *   Event: Order payment / orders/paid
 *   Format: JSON
 *   URL: https://<your-domain>/api/webhooks/orders
 *   Secret: SHOPIFY_WEBHOOK_SECRET
 */

type ShopifyLineItem = {
  product_id?: number | string | null;
  quantity?: number | null;
};

type ShopifyOrderPayload = {
  created_at?: string | null;
  processed_at?: string | null;
  line_items?: ShopifyLineItem[] | null;
};

function verifyShopifyHmac(rawBody: string, hmacHeader: string, secret: string) {
  const digest = createHmac("sha256", secret).update(rawBody, "utf8").digest("base64");
  const a = Buffer.from(digest);
  const b = Buffer.from(hmacHeader);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function productGidFromLine(item: ShopifyLineItem) {
  if (item.product_id == null) return null;
  const numeric = String(item.product_id).trim();
  if (!/^\d+$/.test(numeric)) return null;
  return `gid://shopify/Product/${numeric}`;
}

export async function POST(request: Request) {
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET?.trim();
  if (!secret) {
    return NextResponse.json(
      { ok: false, error: "SHOPIFY_WEBHOOK_SECRET is not configured" },
      { status: 503 },
    );
  }

  const hmac = request.headers.get("x-shopify-hmac-sha256") ?? "";
  if (!hmac) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const rawBody = await request.text();
  let valid = false;
  try {
    valid = verifyShopifyHmac(rawBody, hmac, secret);
  } catch {
    valid = false;
  }
  if (!valid) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const topic = (request.headers.get("x-shopify-topic") ?? "").toLowerCase();
  if (topic && topic !== "orders/paid" && topic !== "orders/create") {
    return NextResponse.json({ ok: true, ignored: true });
  }

  let payload: ShopifyOrderPayload;
  try {
    payload = JSON.parse(rawBody) as ShopifyOrderPayload;
  } catch {
    return NextResponse.json({ ok: false, error: "bad_json" }, { status: 400 });
  }

  const totals = new Map<string, number>();
  for (const item of payload.line_items ?? []) {
    const productId = productGidFromLine(item);
    const qty = Number(item.quantity ?? 0);
    if (!productId || !isValidProductId(productId) || !Number.isFinite(qty) || qty <= 0) {
      continue;
    }
    totals.set(productId, (totals.get(productId) ?? 0) + qty);
  }

  const soldAt =
    Date.parse(payload.processed_at ?? "") ||
    Date.parse(payload.created_at ?? "") ||
    Date.now();

  try {
    await Promise.all(
      [...totals.entries()].map(([productId, quantity]) =>
        recordSale(productId, quantity, soldAt),
      ),
    );
    return NextResponse.json({ ok: true, products: totals.size });
  } catch (error) {
    console.error("orders webhook traction failed:", error);
    return NextResponse.json({ ok: false, error: "error" }, { status: 500 });
  }
}

"use client";

import type { MetaContentPayload } from "@/lib/meta-pixel";

function adsId() {
  return process.env.NEXT_PUBLIC_GOOGLE_ADS_ID?.trim() || "";
}

function purchaseLabel() {
  return process.env.NEXT_PUBLIC_GOOGLE_ADS_PURCHASE_LABEL?.trim() || "";
}

/** Accepts `AbCdEf` or the full `AW-123/AbCdEf` send_to value. */
function labeledSendTo(label: string) {
  const id = adsId();
  if (!label) return "";
  if (label.startsWith("AW-")) return label;
  if (!id) return "";
  return `${id}/${label}`;
}

function canTrack() {
  return (
    Boolean(adsId()) &&
    typeof window !== "undefined" &&
    typeof window.gtag === "function"
  );
}

function toItems(payload: MetaContentPayload) {
  const count = payload.contentIds.length || 1;
  const quantity =
    count === 1 && typeof payload.numItems === "number"
      ? payload.numItems
      : 1;
  const divisor =
    count === 1 && typeof payload.numItems === "number" && payload.numItems > 0
      ? payload.numItems
      : count;
  const unitPrice =
    typeof payload.value === "number" && !Number.isNaN(payload.value)
      ? payload.value / divisor
      : undefined;

  return payload.contentIds.map((id) => ({
    id,
    item_id: id,
    google_business_vertical: "retail",
    ...(payload.contentName ? { item_name: payload.contentName } : {}),
    ...(unitPrice !== undefined ? { price: unitPrice } : {}),
    quantity,
  }));
}

function eventParams(payload: MetaContentPayload) {
  return {
    send_to: adsId(),
    items: toItems(payload),
    ...(typeof payload.value === "number" && !Number.isNaN(payload.value)
      ? { value: payload.value }
      : {}),
    ...(payload.currency ? { currency: payload.currency } : {}),
  };
}

function emit(event: string, params: Record<string, unknown>) {
  if (!canTrack()) return;
  window.gtag!("event", event, params);
}

/**
 * Funnel events for remarketing / cart data only.
 * Do not fire labeled Google Ads conversions here — those belong to the
 * Shopify Google & YouTube app / checkout pixel (avoids double hits).
 */
export function trackViewItem(payload: MetaContentPayload) {
  emit("view_item", eventParams(payload));
}

export function trackAddToCart(payload: MetaContentPayload) {
  emit("add_to_cart", eventParams(payload));
}

export function trackBeginCheckout(payload: MetaContentPayload) {
  emit("begin_checkout", eventParams(payload));
}

/**
 * Labeled Purchase conversion. Primary source is the Shopify customer-events
 * pixel; this is the backup when the shopper opens `/order/confirmed`.
 * Google Ads dedupes on `transaction_id`.
 */
export function trackPurchase(
  payload: MetaContentPayload & { orderId?: string },
) {
  emit("purchase", {
    ...eventParams(payload),
    ...(payload.orderId ? { transaction_id: payload.orderId } : {}),
  });

  const sendTo = labeledSendTo(purchaseLabel());
  if (!sendTo || !canTrack()) return;
  emit("conversion", {
    send_to: sendTo,
    ...(typeof payload.value === "number" && !Number.isNaN(payload.value)
      ? { value: payload.value }
      : {}),
    ...(payload.currency ? { currency: payload.currency } : {}),
    ...(payload.orderId ? { transaction_id: payload.orderId } : {}),
  });
}

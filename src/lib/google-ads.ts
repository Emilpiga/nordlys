"use client";

import type { MetaContentPayload } from "@/lib/meta-pixel";

function adsId() {
  return process.env.NEXT_PUBLIC_GOOGLE_ADS_ID?.trim() || "";
}

function addToCartLabel() {
  return process.env.NEXT_PUBLIC_GOOGLE_ADS_ADD_TO_CART_LABEL?.trim() || "";
}

function beginCheckoutLabel() {
  return process.env.NEXT_PUBLIC_GOOGLE_ADS_BEGIN_CHECKOUT_LABEL?.trim() || "";
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

function emitLabeledConversion(
  label: string,
  payload: Pick<MetaContentPayload, "value" | "currency"> & {
    transactionId?: string;
  },
) {
  const sendTo = labeledSendTo(label);
  if (!sendTo || !canTrack()) return;
  emit("conversion", {
    send_to: sendTo,
    ...(typeof payload.value === "number" && !Number.isNaN(payload.value)
      ? { value: payload.value }
      : {}),
    ...(payload.currency ? { currency: payload.currency } : {}),
    ...(payload.transactionId ? { transaction_id: payload.transactionId } : {}),
  });
}

export function trackViewItem(payload: MetaContentPayload) {
  emit("view_item", eventParams(payload));
}

export function trackAddToCart(payload: MetaContentPayload) {
  emit("add_to_cart", eventParams(payload));
  emitLabeledConversion(addToCartLabel(), payload);
}

export function trackBeginCheckout(payload: MetaContentPayload) {
  emit("begin_checkout", eventParams(payload));
  emitLabeledConversion(beginCheckoutLabel(), payload);
}

/**
 * Named `purchase` + labeled conversion. Also fired from the Shopify
 * customer-events pixel; Google Ads dedupes on `transaction_id`.
 */
export function trackPurchase(
  payload: MetaContentPayload & { orderId?: string },
) {
  emit("purchase", {
    ...eventParams(payload),
    ...(payload.orderId ? { transaction_id: payload.orderId } : {}),
  });
  emitLabeledConversion(purchaseLabel(), {
    value: payload.value,
    currency: payload.currency,
    transactionId: payload.orderId,
  });
}

"use client";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

export type MetaContentPayload = {
  contentIds: string[];
  contentName?: string;
  contentType?: "product" | "product_group";
  value?: number;
  currency?: string;
  numItems?: number;
};

/** Last segment of a Shopify GID → Meta catalog-friendly id. */
export function metaContentIdFromGid(gid: string) {
  const parts = gid.split("/");
  return parts[parts.length - 1] || gid;
}

function canTrack() {
  return typeof window !== "undefined" && typeof window.fbq === "function";
}

function toFbParams(payload: MetaContentPayload) {
  return {
    content_ids: payload.contentIds,
    content_type: payload.contentType ?? "product",
    ...(payload.contentName ? { content_name: payload.contentName } : {}),
    ...(typeof payload.value === "number" && !Number.isNaN(payload.value)
      ? { value: payload.value }
      : {}),
    ...(payload.currency ? { currency: payload.currency } : {}),
    ...(typeof payload.numItems === "number"
      ? { num_items: payload.numItems }
      : {}),
  };
}

export function trackMetaEvent(
  event: "ViewContent" | "AddToCart" | "InitiateCheckout" | "Purchase",
  payload: MetaContentPayload,
) {
  if (!canTrack()) return;
  window.fbq!("track", event, toFbParams(payload));
}

export function trackViewContent(payload: MetaContentPayload) {
  trackMetaEvent("ViewContent", payload);
}

export function trackAddToCart(payload: MetaContentPayload) {
  trackMetaEvent("AddToCart", payload);
}

export function trackInitiateCheckout(payload: MetaContentPayload) {
  trackMetaEvent("InitiateCheckout", payload);
}

export function trackPurchase(payload: MetaContentPayload & { orderId?: string }) {
  if (!canTrack()) return;
  window.fbq!(
    "track",
    "Purchase",
    {
      ...toFbParams(payload),
      ...(payload.orderId ? { order_id: payload.orderId } : {}),
    },
  );
}

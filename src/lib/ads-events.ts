"use client";

import {
  trackAddToCart as trackGoogleAddToCart,
  trackBeginCheckout as trackGoogleBeginCheckout,
  trackPurchase as trackGooglePurchase,
  trackViewItem as trackGoogleViewItem,
} from "@/lib/google-ads";
import {
  trackAddToCart as trackMetaAddToCart,
  trackInitiateCheckout as trackMetaInitiateCheckout,
  trackPurchase as trackMetaPurchase,
  trackViewContent as trackMetaViewContent,
  type MetaContentPayload,
} from "@/lib/meta-pixel";

export { metaContentIdFromGid } from "@/lib/meta-pixel";
export type { MetaContentPayload };

export function trackViewContent(payload: MetaContentPayload) {
  trackMetaViewContent(payload);
  trackGoogleViewItem(payload);
}

export function trackAddToCart(payload: MetaContentPayload) {
  trackMetaAddToCart(payload);
  trackGoogleAddToCart(payload);
}

export function trackInitiateCheckout(payload: MetaContentPayload) {
  trackMetaInitiateCheckout(payload);
  trackGoogleBeginCheckout(payload);
}

export function trackPurchase(
  payload: MetaContentPayload & { orderId?: string },
) {
  trackMetaPurchase(payload);
  trackGooglePurchase(payload);
}

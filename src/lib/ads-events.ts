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
import {
  trackCheckoutClicked,
  trackOrderConfirmed,
  trackProductAdded,
  trackProductViewed,
} from "@/lib/posthog";

export { metaContentIdFromGid } from "@/lib/meta-pixel";
export type { MetaContentPayload };

export function trackViewContent(payload: MetaContentPayload) {
  trackMetaViewContent(payload);
  trackGoogleViewItem(payload);
  trackProductViewed(payload);
}

export function trackAddToCart(payload: MetaContentPayload) {
  trackMetaAddToCart(payload);
  trackGoogleAddToCart(payload);
  trackProductAdded(payload);
}

export function trackInitiateCheckout(payload: MetaContentPayload) {
  trackMetaInitiateCheckout(payload);
  trackGoogleBeginCheckout(payload);
  trackCheckoutClicked(payload);
}

export function trackPurchase(
  payload: MetaContentPayload & { orderId?: string },
) {
  trackMetaPurchase(payload);
  trackGooglePurchase(payload);
  trackOrderConfirmed(payload);
}

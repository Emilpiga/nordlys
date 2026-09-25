"use client";

import posthog from "posthog-js";
import type { MetaContentPayload } from "@/lib/meta-pixel";

function apiKey() {
  return process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim() || "";
}

function isReady() {
  return Boolean(apiKey()) && typeof window !== "undefined" && posthog.__loaded;
}

/**
 * Without consent PostHog keeps its ids in memory only (no cookies or
 * localStorage) and records no replays — visitors still show up live, in
 * paths and funnels for the current visit. Consent turns on persistence
 * across visits and session replay.
 */
function applyConsent(granted: boolean) {
  if (!posthog.__loaded) return;
  if (granted) {
    posthog.set_config({ persistence: "localStorage+cookie" });
    posthog.startSessionRecording();
  } else {
    posthog.stopSessionRecording();
    posthog.set_config({ persistence: "memory" });
  }
}

/** PostHog only ever writes storage after consent, so its presence means an earlier yes. */
function consentedBefore(key: string) {
  try {
    return window.localStorage.getItem(`ph_${key}_posthog`) !== null;
  } catch {
    return false;
  }
}

export function initPostHog() {
  const key = apiKey();
  if (!key || posthog.__loaded) return;

  posthog.init(key, {
    api_host: "/ingest",
    ui_host: "https://eu.posthog.com",
    defaults: "2026-08-30",
    // Start persistent for returning consenters so the page load doesn't
    // begin under a throwaway id before the CMP answers.
    persistence: consentedBefore(key) ? "localStorage+cookie" : "memory",
    person_profiles: "identified_only",
    disable_session_recording: true,
    session_recording: { maskAllInputs: true },
  });

  if (typeof window.__storeMarketingConsent === "boolean") {
    applyConsent(window.__storeMarketingConsent);
  }
  window.addEventListener("store-consent", (event) => {
    applyConsent(Boolean((event as CustomEvent<boolean>).detail));
  });
}

/**
 * Ids stored on the cart (`_posthog_distinct_id` / `_posthog_session_id`) so
 * the Shopify checkout pixel continues this visitor's journey.
 */
export function getPostHogIds() {
  if (!isReady()) return null;
  return {
    distinctId: posthog.get_distinct_id(),
    sessionId: posthog.get_session_id(),
  };
}

function productProperties(payload: MetaContentPayload) {
  return {
    product_ids: payload.contentIds,
    ...(payload.contentName ? { product_name: payload.contentName } : {}),
    ...(typeof payload.value === "number" && !Number.isNaN(payload.value)
      ? { value: payload.value }
      : {}),
    ...(payload.currency ? { currency: payload.currency } : {}),
    ...(typeof payload.numItems === "number"
      ? { quantity: payload.numItems }
      : {}),
  };
}

function capture(event: string, properties: Record<string, unknown>) {
  if (!isReady()) return;
  posthog.capture(event, properties);
}

export function trackProductViewed(payload: MetaContentPayload) {
  capture("product_viewed", productProperties(payload));
}

export function trackProductAdded(payload: MetaContentPayload) {
  capture("product_added", productProperties(payload));
}

export function trackCheckoutClicked(payload: MetaContentPayload) {
  capture("checkout_clicked", productProperties(payload));
}

export function trackOrderConfirmed(
  payload: MetaContentPayload & { orderId?: string },
) {
  capture("order_confirmed_page", {
    ...productProperties(payload),
    ...(payload.orderId ? { order_id: payload.orderId } : {}),
  });
}

export function trackCartOpened(properties: {
  itemCount: number;
  value?: number;
  currency?: string;
}) {
  capture("cart_opened", {
    item_count: properties.itemCount,
    ...(properties.value !== undefined ? { value: properties.value } : {}),
    ...(properties.currency ? { currency: properties.currency } : {}),
  });
}

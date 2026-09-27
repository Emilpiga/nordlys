"use client";

import Script from "next/script";
import { useEffect } from "react";

type ShopifyConsentConfig = {
  checkoutRootDomain: string;
  storefrontRootDomain: string;
  storefrontAccessToken: string;
};

/** The value last sent to Shopify, so repeat consent signals don't re-post. */
let requested: boolean | null = null;

function syncConsent(config: ShopifyConsentConfig, granted: boolean) {
  const privacy = window.Shopify?.customerPrivacy;
  if (!privacy?.setTrackingConsent || requested === granted) return;

  const want = granted ? "yes" : "no";
  const current = privacy.currentVisitorConsent?.() ?? {};
  if (
    current.marketing === want &&
    current.analytics === want &&
    current.preferences === want
  ) {
    requested = granted;
    return;
  }

  requested = granted;
  privacy.setTrackingConsent(
    {
      marketing: granted,
      analytics: granted,
      preferences: granted,
      headlessStorefront: true,
      ...config,
    },
    (result) => {
      if (result?.error) requested = null;
    },
  );
}

/**
 * Shopify checkout runs its own consent check and never sees the Google CMP
 * on this site, so every EU shopper reached checkout as "no consent" and
 * Shopify held back the Google & YouTube and custom pixels — Purchase never
 * reached Google Ads. This hands the shopper's answer to Shopify's Customer
 * Privacy API, which stores it in `_tracking_consent` on the root domain
 * that checkout shares with the storefront.
 */
export function ShopifyConsentBridge(config: ShopifyConsentConfig) {
  const { checkoutRootDomain, storefrontRootDomain, storefrontAccessToken } =
    config;

  useEffect(() => {
    const onConsent = (event: Event) => {
      syncConsent(
        { checkoutRootDomain, storefrontRootDomain, storefrontAccessToken },
        Boolean((event as CustomEvent<boolean>).detail),
      );
    };
    window.addEventListener("store-consent", onConsent);
    return () => window.removeEventListener("store-consent", onConsent);
  }, [checkoutRootDomain, storefrontRootDomain, storefrontAccessToken]);

  return (
    <Script
      src="https://cdn.shopify.com/shopifycloud/consent-tracking-api/v0.1/consent-tracking-api.js"
      strategy="lazyOnload"
      onReady={() => {
        // The CMP may have answered before the API finished loading.
        if (typeof window.__storeMarketingConsent === "boolean") {
          syncConsent(config, window.__storeMarketingConsent);
        }
      }}
    />
  );
}

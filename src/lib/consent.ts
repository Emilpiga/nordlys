function cleanHost(value: string | undefined) {
  return (
    value
      ?.trim()
      .replace(/^["']|["']$/g, "")
      .replace(/^https?:\/\//, "")
      .split("/")[0]
      .toLowerCase() || ""
  );
}

/**
 * Domains that must share Google click IDs with the storefront tag.
 * Checkout is on a different host than Next.js — without linker domains,
 * Purchase on Shopify thank-you cannot stitch the ad click.
 */
export function getGoogleAdsLinkerDomains() {
  const explicit = process.env.NEXT_PUBLIC_GOOGLE_ADS_LINKER_DOMAINS?.trim();
  if (explicit) {
    return explicit
      .split(",")
      .map((part) => cleanHost(part))
      .filter(Boolean);
  }

  const domains = new Set<string>();
  const checkout =
    cleanHost(process.env.SHOPIFY_CHECKOUT_DOMAIN) ||
    cleanHost(process.env.NEXT_PUBLIC_SHOPIFY_CHECKOUT_DOMAIN);
  if (checkout) domains.add(checkout);

  const store = cleanHost(process.env.SHOPIFY_STORE_DOMAIN);
  if (store) domains.add(store);

  const site = cleanHost(process.env.NEXT_PUBLIC_SITE_URL);
  if (site) {
    domains.add(site);
    const apex = site.replace(/^www\./, "");
    domains.add(apex);
    domains.add(`www.${apex}`);
    domains.add(`checkout.${apex}`);
  }

  return [...domains];
}

/** Marketing / ads env config (Consent Mode + Google CMP handle runtime consent). */
export function getMarketingPixelConfig() {
  return {
    metaPixelId: process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim() || "",
    /** Facebook App ID for og:fb:app_id (not the same as Pixel ID). */
    facebookAppId: process.env.NEXT_PUBLIC_FACEBOOK_APP_ID?.trim() || "",
    googleAdsId: process.env.NEXT_PUBLIC_GOOGLE_ADS_ID?.trim() || "",
    /** AdSense publisher client id (ca-pub-…). */
    adsenseClientId: process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID?.trim() || "",
    googleAdsLinkerDomains: getGoogleAdsLinkerDomains(),
  };
}

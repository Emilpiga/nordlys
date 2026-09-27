/**
 * Cross-domain handoff for headless storefront → Shopify checkout.
 * `window.location.assign` bypasses gtag's automatic <a> linker, so we
 * forward gclid explicitly when present.
 */

function readCookie(name: string) {
  if (typeof document === "undefined") return "";
  const prefix = `${name}=`;
  for (const part of document.cookie.split(";")) {
    const trimmed = part.trim();
    if (trimmed.startsWith(prefix)) {
      return decodeURIComponent(trimmed.slice(prefix.length));
    }
  }
  return "";
}

/** `_gcl_aw` / `_gcl_gb` hold `GCL.<timestamp>.<click id>[.<labels>]`. */
function gclCookie(name: string) {
  const parts = readCookie(name).split(".");
  return parts.length >= 3 && parts[0] === "GCL" ? parts[2] : "";
}

function queryParam(name: string) {
  return new URLSearchParams(window.location.search).get(name)?.trim() || "";
}

export function gclidFromBrowser() {
  if (typeof window === "undefined") return "";
  return queryParam("gclid") || gclCookie("_gcl_aw");
}

/**
 * Google ad click ids to store on the cart, so the checkout pixel still has
 * them after a payment redirect (and the order shows where it came from).
 * Only once the shopper has allowed marketing.
 */
export function adClickIdsFromBrowser() {
  if (typeof window === "undefined" || window.__storeMarketingConsent !== true) {
    return null;
  }
  const ids = {
    gclid: gclidFromBrowser(),
    gbraid: queryParam("gbraid") || gclCookie("_gcl_gb"),
    wbraid: queryParam("wbraid"),
  };
  return ids.gclid || ids.gbraid || ids.wbraid ? ids : null;
}

export function decorateCheckoutUrl(checkoutUrl: string) {
  if (!checkoutUrl || typeof window === "undefined") return checkoutUrl;
  try {
    const url = new URL(checkoutUrl);
    if (!url.searchParams.has("gclid")) {
      const gclid = gclidFromBrowser();
      if (gclid) url.searchParams.set("gclid", gclid);
    }
    return url.toString();
  } catch {
    return checkoutUrl;
  }
}

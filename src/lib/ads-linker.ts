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

/** `_gcl_aw` is `GCL.<timestamp>.<gclid>`. */
export function gclidFromBrowser() {
  if (typeof window === "undefined") return "";
  const fromQuery = new URLSearchParams(window.location.search).get("gclid");
  if (fromQuery?.trim()) return fromQuery.trim();

  const aw = readCookie("_gcl_aw");
  if (!aw) return "";
  const parts = aw.split(".");
  if (parts.length >= 3 && parts[0] === "GCL") {
    return parts.slice(2).join(".");
  }
  return "";
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

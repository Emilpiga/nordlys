type ShopifyImageLoaderProps = {
  src: string;
  width: number;
  quality?: number;
};

const SHOPIFY_HOSTS = new Set([
  "cdn.shopify.com",
  "cdn.shopifycdn.net",
  "burst.shopifycdn.com",
]);

function isShopifyCdn(hostname: string) {
  const host = hostname.toLowerCase();
  return (
    SHOPIFY_HOSTS.has(host) ||
    host.endsWith(".shopify.com") ||
    host.endsWith(".shopifycdn.net")
  );
}

/**
 * Serve Shopify media from their CDN with width/quality params.
 * Avoids Vercel /_next/image (quota 402s) while keeping responsive srcset.
 */
export default function shopifyImageLoader({
  src,
  width,
  quality = 75,
}: ShopifyImageLoaderProps) {
  if (!src || src.startsWith("/") || src.startsWith("data:")) {
    return src;
  }

  try {
    const url = new URL(src);
    if (!isShopifyCdn(url.hostname)) {
      return src;
    }

    url.searchParams.set("width", String(width));
    url.searchParams.set("quality", String(quality));
    return url.toString();
  } catch {
    return src;
  }
}

"use client";

import { useEffect } from "react";
import {
  metaContentIdFromGid,
  trackViewContent,
} from "@/lib/ads-events";
import type { Product } from "@/lib/shopify/types";
import { findVariantByParam } from "@/lib/shopify/variants";

type ProductViewTrackerProps = {
  product: Product;
  variantId?: string;
};

const VIEW_SESSION_PREFIX = "traction:view:";

function recordTractionViewOnce(productId: string) {
  try {
    const key = `${VIEW_SESSION_PREFIX}${productId}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
  } catch {
    // Private mode / blocked storage — still attempt the write once.
  }

  void fetch("/api/traction", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ type: "view", productId }),
    keepalive: true,
  }).catch(() => {
    // Traction is best-effort; ads tracking must not depend on it.
  });
}

/** Fires ViewContent / view_item once when a product page is shown. */
export function ProductViewTracker({
  product,
  variantId,
}: ProductViewTrackerProps) {
  useEffect(() => {
    const variant =
      findVariantByParam(product.variants, variantId) ??
      product.variants.find((item) => item.availableForSale) ??
      product.variants[0];
    const price = variant?.price ?? product.priceRange.minVariantPrice;
    const contentId = metaContentIdFromGid(variant?.id ?? product.id);

    trackViewContent({
      contentIds: [contentId],
      contentName: product.title,
      contentType: "product",
      value: Number(price.amount),
      currency: price.currencyCode,
    });

    recordTractionViewOnce(product.id);
  }, [product, variantId]);

  return null;
}

"use client";

import { useEffect } from "react";
import {
  metaContentIdFromGid,
  trackViewContent,
} from "@/lib/ads-events";
import type { Product } from "@/lib/shopify/types";

type ProductViewTrackerProps = {
  product: Product;
};

/** Fires ViewContent / view_item once when a product page is shown. */
export function ProductViewTracker({ product }: ProductViewTrackerProps) {
  useEffect(() => {
    const variant =
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
  }, [product]);

  return null;
}

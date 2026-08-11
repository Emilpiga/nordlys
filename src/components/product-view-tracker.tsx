"use client";

import { useEffect } from "react";
import {
  metaContentIdFromGid,
  trackViewContent,
} from "@/lib/meta-pixel";
import type { Product } from "@/lib/shopify/types";

type ProductViewTrackerProps = {
  product: Product;
};

/** Fires Meta ViewContent once when a product page is shown (if Pixel is loaded). */
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

"use client";

import { useCallback, useState, type ReactNode } from "react";
import { ProductForm } from "@/components/product-form";
import { ProductGallery } from "@/components/product-gallery";
import type { Product, ProductImage, ProductVariant } from "@/lib/shopify/types";

type ProductPurchaseProps = {
  product: Product;
  gallery: ProductImage[];
  header: ReactNode;
  footer?: ReactNode;
  wishlistSaved?: boolean;
};

export function ProductPurchase({
  product,
  gallery,
  header,
  footer,
  wishlistSaved = false,
}: ProductPurchaseProps) {
  const [activeImageUrl, setActiveImageUrl] = useState<string | null>(null);

  const onVariantChange = useCallback((variant: ProductVariant | null) => {
    setActiveImageUrl(variant?.image?.url ?? null);
  }, []);

  return (
    <section className="mx-auto grid w-full max-w-6xl gap-10 px-5 py-8 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16 lg:py-12 sm:px-8">
      <div className="animate-fade lg:sticky lg:top-28 lg:self-start">
        <ProductGallery
          images={gallery}
          productTitle={product.title}
          activeImageUrl={activeImageUrl}
        />
      </div>

      <div className="animate-rise lg:sticky lg:top-28 lg:self-start lg:py-4">
        {header}
        <div className="mt-10 border-t border-border/70 pt-8">
          <ProductForm
            product={product}
            onVariantChange={onVariantChange}
            wishlistSaved={wishlistSaved}
          />
        </div>
        {footer}
      </div>
    </section>
  );
}

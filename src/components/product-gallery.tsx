"use client";

import Image from "next/image";
import { useState } from "react";
import type { ProductImage } from "@/lib/shopify/types";

type ProductGalleryProps = {
  images: ProductImage[];
  productTitle: string;
};

export function ProductGallery({ images, productTitle }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = images[activeIndex] ?? images[0];

  if (!active) {
    return <div className="aspect-[4/5] bg-mist" />;
  }

  return (
    <div className="space-y-4">
      <div className="relative aspect-[4/5] overflow-hidden bg-[linear-gradient(160deg,#d5e0e4_0%,#e8eef1_48%,#ddd4d0_100%)]">
        <Image
          key={active.url}
          src={active.url}
          alt={active.altText || productTitle}
          fill
          priority
          className="animate-image-in object-contain p-8 sm:p-12"
          sizes="(max-width: 1024px) 100vw, 55vw"
        />
      </div>

      {images.length > 1 ? (
        <div className="grid grid-cols-4 gap-3 sm:grid-cols-5">
          {images.slice(0, 5).map((image, index) => {
            const selected = index === activeIndex;
            return (
              <button
                key={`${image.url}-${index}`}
                type="button"
                onClick={() => setActiveIndex(index)}
                aria-label={`View image ${index + 1}`}
                className={`relative aspect-square overflow-hidden bg-mist transition ${
                  selected
                    ? "ring-1 ring-accent ring-offset-2 ring-offset-background"
                    : "opacity-70 hover:opacity-100"
                }`}
              >
                <Image
                  src={image.url}
                  alt={image.altText || `${productTitle} ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="120px"
                />
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

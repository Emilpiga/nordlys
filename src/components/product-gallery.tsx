"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import type { ProductImage } from "@/lib/shopify/types";

type ProductGalleryProps = {
  images: ProductImage[];
  productTitle: string;
  /** Prefer this image when a variant with its own media is selected. */
  activeImageUrl?: string | null;
};

export function ProductGallery({
  images,
  productTitle,
  activeImageUrl = null,
}: ProductGalleryProps) {
  const galleryImages = useMemo(() => {
    if (!activeImageUrl) return images;
    if (images.some((image) => image.url === activeImageUrl)) return images;
    return [
      {
        url: activeImageUrl,
        altText: productTitle,
        width: 1200,
        height: 1500,
      },
      ...images,
    ];
  }, [activeImageUrl, images, productTitle]);

  const preferredIndex = useMemo(() => {
    if (!activeImageUrl) return 0;
    const index = galleryImages.findIndex((image) => image.url === activeImageUrl);
    return index >= 0 ? index : 0;
  }, [activeImageUrl, galleryImages]);

  const [activeIndex, setActiveIndex] = useState(preferredIndex);

  useEffect(() => {
    setActiveIndex(preferredIndex);
  }, [preferredIndex]);

  const active = galleryImages[activeIndex] ?? galleryImages[0];

  if (!active) {
    return <div className="aspect-[4/5] rounded-2xl bg-mist" />;
  }

  return (
    <div className="space-y-4">
      <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-mist">
        <Image
          key={active.url}
          src={active.url}
          alt={active.altText || productTitle}
          fill
          priority
          className="animate-image-in object-cover"
          sizes="(max-width: 1024px) 100vw, 55vw"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-[rgba(20,28,34,0.06)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-2xl bg-[linear-gradient(180deg,rgba(241,238,232,0.14)_0%,transparent_22%,transparent_72%,rgba(26,24,20,0.08)_100%)]"
        />
      </div>

      {galleryImages.length > 1 ? (
        <div className="grid grid-cols-4 gap-3 sm:grid-cols-5">
          {galleryImages.slice(0, 5).map((image, index) => {
            const selected = index === activeIndex;
            return (
              <button
                key={`${image.url}-${index}`}
                type="button"
                onClick={() => setActiveIndex(index)}
                aria-label={`Visa bild ${index + 1}`}
                className={`relative aspect-square overflow-hidden rounded-lg bg-mist transition ${
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

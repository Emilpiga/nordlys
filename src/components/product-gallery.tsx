"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { useDictionary } from "@/components/dictionary-provider";
import { ProductLightbox } from "@/components/product-lightbox";
import type { ProductImage } from "@/lib/shopify/types";

type ProductGalleryProps = {
  images: ProductImage[];
  productTitle: string;
  /** Prefer this image when a variant with its own media is selected. */
  activeImageUrl?: string | null;
};

function ExpandIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M9.2 4.8H4.8v4.4M14.8 4.8h4.4v4.4M4.8 14.8v4.4h4.4M19.2 14.8v4.4h-4.4"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ProductGallery({
  images,
  productTitle,
  activeImageUrl = null,
}: ProductGalleryProps) {
  const { dict, t } = useDictionary();
  const expandRef = useRef<HTMLButtonElement>(null);

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
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    setActiveIndex(preferredIndex);
  }, [preferredIndex]);

  const active = galleryImages[activeIndex] ?? galleryImages[0];

  if (!active) {
    return <div className="aspect-[4/5] bg-mist" />;
  }

  return (
    <div className="space-y-4">
      <button
        ref={expandRef}
        type="button"
        onClick={() => setLightboxOpen(true)}
        aria-label={dict.products.expandImage}
        className="group relative aspect-[4/5] w-full cursor-zoom-in overflow-hidden bg-mist"
      >
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
          className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-[rgba(20,28,34,0.06)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(241,238,232,0.14)_0%,transparent_22%,transparent_72%,rgba(26,24,20,0.08)_100%)]"
        />
        <span className="pointer-events-none absolute right-3 bottom-3 flex h-9 w-9 items-center justify-center bg-[rgba(20,28,34,0.42)] text-white opacity-90 transition group-hover:bg-[rgba(20,28,34,0.58)] group-hover:opacity-100">
          <ExpandIcon className="h-4 w-4" />
        </span>
      </button>

      {galleryImages.length > 1 ? (
        <div className="grid grid-cols-4 gap-3 sm:grid-cols-5">
          {galleryImages.map((image, index) => {
            const selected = index === activeIndex;
            return (
              <button
                key={`${image.url}-${index}`}
                type="button"
                onClick={() => setActiveIndex(index)}
                aria-label={t(dict.products.thumbnailLabel, { index: index + 1 })}
                aria-current={selected ? "true" : undefined}
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

      <ProductLightbox
        open={lightboxOpen}
        images={galleryImages}
        productTitle={productTitle}
        index={activeIndex}
        onIndexChange={setActiveIndex}
        onClose={() => {
          setLightboxOpen(false);
          expandRef.current?.focus();
        }}
      />
    </div>
  );
}

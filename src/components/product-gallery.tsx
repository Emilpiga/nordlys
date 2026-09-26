"use client";

import Image from "@/components/soft-image";
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

/** Shopify serves one photo under URLs that differ only in `?v=`. */
function samePhoto(a: string, b: string) {
  return a.split("?")[0] === b.split("?")[0];
}

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
    if (images.some((image) => samePhoto(image.url, activeImageUrl))) {
      return images;
    }
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
    const index = galleryImages.findIndex(
      (image) => samePhoto(image.url, activeImageUrl),
    );
    return index >= 0 ? index : 0;
  }, [activeImageUrl, galleryImages]);

  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(preferredIndex);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // The strip is the source of truth: moving it (swipe, thumbnail, colour,
  // lightbox) fires a scroll event, and the scroll sets the active photo.
  function scrollToIndex(index: number) {
    const track = trackRef.current;
    if (!track) return;
    track.scrollTo({ left: index * track.clientWidth, behavior: "instant" });
  }

  useEffect(() => {
    scrollToIndex(preferredIndex);
  }, [preferredIndex]);

  function onTrackScroll() {
    const track = trackRef.current;
    if (!track || track.clientWidth === 0) return;
    const index = Math.round(track.scrollLeft / track.clientWidth);
    if (index !== activeIndex) setActiveIndex(index);
  }

  function selectIndex(index: number) {
    setActiveIndex(index);
    scrollToIndex(index);
  }

  if (galleryImages.length === 0) {
    return <div className="aspect-[4/5] bg-mist" />;
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <div
          ref={trackRef}
          onScroll={onTrackScroll}
          className="flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {galleryImages.map((image, index) => (
            <button
              key={`${image.url}-${index}`}
              ref={index === activeIndex ? expandRef : undefined}
              type="button"
              onClick={() => setLightboxOpen(true)}
              aria-label={dict.products.expandImage}
              tabIndex={index === activeIndex ? 0 : -1}
              className="group relative aspect-[4/5] w-full shrink-0 snap-center cursor-zoom-in overflow-hidden bg-mist"
            >
              <Image
                src={image.url}
                alt={image.altText || `${productTitle} ${index + 1}`}
                fill
                preload={index === 0}
                fetchPriority={index === 0 ? "high" : undefined}
                loading={index <= 1 ? "eager" : undefined}
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
            </button>
          ))}
        </div>
        <span className="pointer-events-none absolute right-3 bottom-3 flex h-9 w-9 items-center justify-center bg-[rgba(20,28,34,0.42)] text-white opacity-90">
          <ExpandIcon className="h-4 w-4" />
        </span>
      </div>

      {galleryImages.length > 1 ? (
        <div className="flex justify-center gap-1.5 lg:hidden">
          {galleryImages.map((image, index) => (
            <button
              key={`${image.url}-dot-${index}`}
              type="button"
              onClick={() => selectIndex(index)}
              aria-label={t(dict.products.thumbnailLabel, { index: index + 1 })}
              aria-current={index === activeIndex ? "true" : undefined}
              className="flex h-6 items-center"
            >
              <span
                className={`block h-1.5 rounded-full transition-all ${
                  index === activeIndex
                    ? "w-4 bg-foreground"
                    : "w-1.5 bg-foreground/25"
                }`}
              />
            </button>
          ))}
        </div>
      ) : null}

      {galleryImages.length > 1 ? (
        <div className="hidden grid-cols-5 gap-3 lg:grid">
          {galleryImages.map((image, index) => {
            const selected = index === activeIndex;
            return (
              <button
                key={`${image.url}-${index}`}
                type="button"
                onClick={() => selectIndex(index)}
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
        onIndexChange={selectIndex}
        onClose={() => {
          setLightboxOpen(false);
          expandRef.current?.focus();
        }}
      />
    </div>
  );
}

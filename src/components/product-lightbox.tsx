"use client";

import Image from "next/image";
import { useEffect, useId, useRef, type TouchEvent } from "react";
import { createPortal } from "react-dom";
import { useDictionary } from "@/components/dictionary-provider";
import type { ProductImage } from "@/lib/shopify/types";

type ProductLightboxProps = {
  open: boolean;
  images: ProductImage[];
  productTitle: string;
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
};

function Chevron({ direction }: { direction: "prev" | "next" }) {
  return (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d={
          direction === "prev"
            ? "M14.5 6.5 8.5 12l6 5.5"
            : "M9.5 6.5 15.5 12l-6 5.5"
        }
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ProductLightbox({
  open,
  images,
  productTitle,
  index,
  onIndexChange,
  onClose,
}: ProductLightboxProps) {
  const { dict, t } = useDictionary();
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const indexRef = useRef(index);
  const touchStartX = useRef<number | null>(null);
  const image = images[index];
  const hasMany = images.length > 1;

  indexRef.current = index;

  useEffect(() => {
    if (!open) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (images.length < 2) return;
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        onIndexChange(
          (indexRef.current - 1 + images.length) % images.length,
        );
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        onIndexChange((indexRef.current + 1) % images.length);
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    closeRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, images.length, onClose, onIndexChange]);

  if (!open || !image) return null;

  function step(delta: number) {
    onIndexChange((index + delta + images.length) % images.length);
  }

  function onTouchStart(event: TouchEvent) {
    touchStartX.current = event.changedTouches[0]?.clientX ?? null;
  }

  function onTouchEnd(event: TouchEvent) {
    if (!hasMany || touchStartX.current == null) return;
    const x = event.changedTouches[0]?.clientX;
    if (x == null) return;
    const dx = x - touchStartX.current;
    touchStartX.current = null;
    if (dx > 48) step(-1);
    if (dx < -48) step(1);
  }

  return createPortal(
    <div className="fixed inset-0 z-[70] flex flex-col">
      <button
        type="button"
        aria-label={dict.products.close}
        className="absolute inset-0 bg-[rgba(20,28,34,0.82)] backdrop-blur-[6px] animate-drawer-backdrop"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 flex h-full min-h-0 flex-col"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div className="flex shrink-0 items-center justify-between px-5 py-4 sm:px-8">
          <p
            id={titleId}
            className="text-[0.68rem] font-medium tracking-[0.16em] uppercase text-white/70"
          >
            {t(dict.products.imageOf, {
              current: index + 1,
              total: images.length,
            })}
          </p>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="text-[0.68rem] font-medium tracking-[0.14em] uppercase text-white/75 transition hover:text-white"
          >
            {dict.products.close}
          </button>
        </div>

        <div
          className="relative flex min-h-0 flex-1 items-center justify-center px-4 pb-4 sm:px-16"
          onClick={onClose}
        >
          {hasMany ? (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                step(-1);
              }}
              aria-label={dict.products.previousImage}
              className="absolute left-3 z-10 hidden h-11 w-11 items-center justify-center text-white/75 transition hover:text-white sm:flex"
            >
              <Chevron direction="prev" />
            </button>
          ) : null}

          <div
            className="relative h-full w-full max-w-5xl"
            onClick={(event) => event.stopPropagation()}
          >
            <Image
              key={image.url}
              src={image.url}
              alt={image.altText || productTitle}
              fill
              priority
              quality={90}
              className="animate-image-in object-contain"
              sizes="100vw"
            />
          </div>

          {hasMany ? (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                step(1);
              }}
              aria-label={dict.products.nextImage}
              className="absolute right-3 z-10 hidden h-11 w-11 items-center justify-center text-white/75 transition hover:text-white sm:flex"
            >
              <Chevron direction="next" />
            </button>
          ) : null}
        </div>

        {hasMany ? (
          <div className="shrink-0 overflow-x-auto px-5 pb-5 sm:px-8">
            <div className="mx-auto flex w-max gap-2">
              {images.map((thumb, thumbIndex) => {
                const selected = thumbIndex === index;
                return (
                  <button
                    key={`${thumb.url}-${thumbIndex}`}
                    type="button"
                    onClick={() => onIndexChange(thumbIndex)}
                    aria-label={t(dict.products.thumbnailLabel, {
                      index: thumbIndex + 1,
                    })}
                    aria-current={selected ? "true" : undefined}
                    className={`relative h-14 w-14 shrink-0 overflow-hidden bg-mist transition ${
                      selected
                        ? "ring-1 ring-white ring-offset-2 ring-offset-[rgba(20,28,34,0.82)]"
                        : "opacity-55 hover:opacity-100"
                    }`}
                  >
                    <Image
                      src={thumb.url}
                      alt={thumb.altText || `${productTitle} ${thumbIndex + 1}`}
                      fill
                      className="object-cover"
                      sizes="56px"
                    />
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}

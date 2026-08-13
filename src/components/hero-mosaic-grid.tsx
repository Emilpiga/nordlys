"use client";

import { useEffect, useRef, useState } from "react";
import { HeroMosaicTile, type HeroMosaicMotion } from "@/components/hero-mosaic-tile";
import {
  HERO_MOSAIC_VISIBLE_COUNT,
  fillMosaicSlots,
  type HeroMosaicImage,
} from "@/lib/home-mosaic";
import type { Product } from "@/lib/shopify/types";

const SWAP_MS = 400;
const TICK_MIN_MS = 4800;
const TICK_SPAN_MS = 2200;

function productKey(image: HeroMosaicImage) {
  return image.product.id;
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function pickIndices(length: number, count: number, exclude: number | null) {
  const pool = Array.from({ length }, (_, i) => i).filter((i) => i !== exclude);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, Math.min(count, pool.length));
}

type HeroMosaicGridProps = {
  images: HeroMosaicImage[];
  onOpenQuickView: (product: Product) => void;
};

function uniqueVisible(items: HeroMosaicImage[]) {
  const seen = new Set<string>();
  return items.filter((image) => {
    if (seen.has(productKey(image))) return false;
    seen.add(productKey(image));
    return true;
  });
}

export function HeroMosaicGrid({ images, onOpenQuickView }: HeroMosaicGridProps) {
  const [slots, setSlots] = useState(() =>
    uniqueVisible(fillMosaicSlots(images, HERO_MOSAIC_VISIBLE_COUNT)),
  );
  const hovered = useRef<number | null>(null);
  const canRotate = images.length > HERO_MOSAIC_VISIBLE_COUNT;

  useEffect(() => {
    if (!canRotate || prefersReducedMotion()) return;

    let timeout = 0;
    let cancelled = false;

    const queue = () => {
      const wait = TICK_MIN_MS + Math.floor(Math.random() * TICK_SPAN_MS);
      timeout = window.setTimeout(tick, wait);
    };

    const tick = () => {
      if (cancelled) return;
      if (document.hidden) {
        queue();
        return;
      }

      const exclude = hovered.current;

      setSlots((current) => {
        const visibleIds = new Set(current.map(productKey));
        const bench = images.filter((image) => !visibleIds.has(productKey(image)));
        if (bench.length === 0) return current;

        for (let i = bench.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [bench[i], bench[j]] = [bench[j], bench[i]];
        }

        const swapCount = Math.min(bench.length, Math.random() < 0.55 ? 1 : 2);
        const indices = pickIndices(current.length, swapCount, exclude);
        if (indices.length === 0) return current;

        const next = [...current];
        indices.forEach((slotIndex, i) => {
          const incoming = bench[i];
          if (!incoming) return;
          next[slotIndex] = incoming;
        });
        return uniqueVisible(next);
      });

      queue();
    };

    queue();
    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [canRotate, images]);

  return (
    <div className="absolute inset-0 grid h-full grid-cols-3 auto-rows-[minmax(0,1fr)] gap-[2px] bg-mist sm:grid-cols-4 md:gap-[3px]">
      {slots.map((image, index) => (
        <HeroMosaicSlot
          key={index}
          image={image}
          index={index}
          onOpenQuickView={onOpenQuickView}
          onHover={(value) => {
            hovered.current = value;
          }}
        />
      ))}
    </div>
  );
}

type HeroMosaicSlotProps = {
  image: HeroMosaicImage;
  index: number;
  onOpenQuickView: (product: Product) => void;
  onHover: (index: number | null) => void;
};

function HeroMosaicSlot({
  image,
  index,
  onOpenQuickView,
  onHover,
}: HeroMosaicSlotProps) {
  const [shown, setShown] = useState(image);
  const [phase, setPhase] = useState<"enter" | "swap">("enter");
  const exiting =
    shown.product.id !== image.product.id || shown.url !== image.url;
  const motion: HeroMosaicMotion = exiting ? "exit" : phase;

  useEffect(() => {
    if (!exiting) return;

    const delay = prefersReducedMotion() ? 0 : SWAP_MS;
    const timeout = window.setTimeout(() => {
      setShown(image);
      setPhase("swap");
    }, delay);

    return () => window.clearTimeout(timeout);
  }, [exiting, image]);

  return (
    <div
      className="relative h-full min-h-0 min-w-0 overflow-hidden"
      onMouseEnter={() => onHover(index)}
      onMouseLeave={() => onHover(null)}
    >
      <HeroMosaicTile
        key={`${shown.product.id}-${shown.url}`}
        product={shown.product}
        imageUrl={shown.url}
        imageAlt={shown.alt}
        index={index}
        motion={motion}
        onOpenQuickView={onOpenQuickView}
      />
    </div>
  );
}

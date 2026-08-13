"use client";

import { useEffect, useState } from "react";
import { useDictionary } from "@/components/dictionary-provider";

const MIN_VIEWERS = 4;
const MAX_VIEWERS = 11;

function seedFromId(id: string) {
  let hash = 2166136261;
  for (let i = 0; i < id.length; i++) {
    hash ^= id.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function initialCount(productId: string) {
  return MIN_VIEWERS + (seedFromId(productId) % (MAX_VIEWERS - MIN_VIEWERS + 1));
}

type ProductViewingActivityProps = {
  productId: string;
};

/** Quiet social-proof line with a product-seeded, slowly drifting viewer count. */
export function ProductViewingActivity({
  productId,
}: ProductViewingActivityProps) {
  const { dict, t } = useDictionary();
  const [count, setCount] = useState(() => initialCount(productId));

  useEffect(() => {
    setCount(initialCount(productId));
  }, [productId]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    let timeout: number;
    const schedule = () => {
      timeout = window.setTimeout(
        () => {
          setCount((current) => {
            const delta = Math.floor(Math.random() * 3) - 1;
            return Math.min(MAX_VIEWERS, Math.max(MIN_VIEWERS, current + delta));
          });
          schedule();
        },
        8000 + Math.random() * 7000,
      );
    };

    schedule();
    return () => window.clearTimeout(timeout);
  }, [productId]);

  const label =
    count === 1
      ? dict.products.viewingOne
      : t(dict.products.viewingMany, { count });

  return (
    <p
      className="flex items-center gap-2.5 text-sm font-light leading-relaxed text-muted"
      role="status"
      aria-live="polite"
    >
      <span className="relative flex h-1.5 w-1.5 shrink-0" aria-hidden>
        <span className="animate-live-ping absolute inset-0 rounded-full bg-glow/55" />
        <span className="relative h-1.5 w-1.5 rounded-full bg-glow" />
      </span>
      {label}
    </p>
  );
}

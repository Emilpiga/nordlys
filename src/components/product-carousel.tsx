"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { ProductCard } from "@/components/product-card";
import type { PopularProduct } from "@/lib/popular-products";

type ProductCarouselProps = {
  products: PopularProduct[];
  prevLabel: string;
  nextLabel: string;
};

export function ProductCarousel({
  products,
  prevLabel,
  nextLabel,
}: ProductCarouselProps) {
  const scrollerRef = useRef<HTMLUListElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const updateEdges = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    setCanPrev(el.scrollLeft > 4);
    setCanNext(maxScroll > 4 && el.scrollLeft < maxScroll - 4);
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    updateEdges();
    const onScroll = () => updateEdges();
    el.addEventListener("scroll", onScroll, { passive: true });

    const resize = new ResizeObserver(() => updateEdges());
    resize.observe(el);

    return () => {
      el.removeEventListener("scroll", onScroll);
      resize.disconnect();
    };
  }, [products, updateEdges]);

  function scrollByPage(direction: -1 | 1) {
    const el = scrollerRef.current;
    if (!el) return;

    const firstCard = el.querySelector<HTMLElement>("[data-carousel-item]");
    const styles = getComputedStyle(el);
    const gap = Number.parseFloat(styles.columnGap || styles.gap || "0") || 0;
    const step = firstCard
      ? firstCard.getBoundingClientRect().width + gap
      : el.clientWidth * 0.8;

    el.scrollBy({ left: direction * step, behavior: "smooth" });
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      scrollByPage(-1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      scrollByPage(1);
    }
  }

  return (
    <div className="relative" onKeyDown={onKeyDown}>
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 flex items-center sm:-left-1 md:-left-2">
        <CarouselButton
          label={prevLabel}
          direction="prev"
          disabled={!canPrev}
          onClick={() => scrollByPage(-1)}
        />
      </div>
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 flex items-center sm:-right-1 md:-right-2">
        <CarouselButton
          label={nextLabel}
          direction="next"
          disabled={!canNext}
          onClick={() => scrollByPage(1)}
        />
      </div>

      <ul
        ref={scrollerRef}
        tabIndex={0}
        aria-roledescription="carousel"
        className="flex snap-x snap-mandatory gap-5 overflow-x-auto overscroll-x-contain scroll-smooth pb-1 [-ms-overflow-style:none] [scrollbar-width:none] lg:gap-7 [&::-webkit-scrollbar]:hidden"
      >
        {products.map((product) => (
          <li
            key={product.id}
            data-carousel-item
            className="w-[min(72vw,17.5rem)] shrink-0 snap-start sm:w-[calc((100%-1.25rem)/2.15)] lg:w-[calc((100%-5.25rem)/4)]"
          >
            <ProductCard
              product={product}
              tractionBadge={product.tractionBadge}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

function CarouselButton({
  label,
  direction,
  disabled,
  onClick,
}: {
  label: string;
  direction: "prev" | "next";
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="pointer-events-auto inline-flex h-10 w-10 items-center justify-center bg-[color-mix(in_oklab,var(--frost)_94%,white)] text-foreground shadow-sm transition hover:text-accent disabled:pointer-events-none disabled:opacity-0 sm:h-11 sm:w-11"
    >
      <ChevronIcon direction={direction} />
    </button>
  );
}

function ChevronIcon({ direction }: { direction: "prev" | "next" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d={direction === "prev" ? "M14.5 5.5 8 12l6.5 6.5" : "M9.5 5.5 16 12l-6.5 6.5"}
      />
    </svg>
  );
}

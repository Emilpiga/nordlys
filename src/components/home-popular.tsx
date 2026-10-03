"use client";

import { useDictionary } from "@/components/dictionary-provider";
import { useHomeGender } from "@/components/home-gender-provider";
import { ProductCarousel } from "@/components/product-carousel";
import { LocaleLink } from "@/components/locale-link";
import type { PopularProduct } from "@/lib/popular-products";
import type { ClothingGender } from "@/lib/shopify/collections";

type HomePopularProps = {
  /** Shown when the chosen side has nothing to show. */
  products: PopularProduct[];
  byGender: Record<ClothingGender, PopularProduct[]>;
};

export function HomePopular({ products: all, byGender }: HomePopularProps) {
  const { dict } = useDictionary();
  const gender = useHomeGender()?.gender ?? "dam";
  const picked = byGender[gender];
  const products = picked.length > 0 ? picked : all;
  if (products.length === 0) return null;

  return (
    <section aria-labelledby="popular-heading" className="border-b border-border/60">
      <div className="mx-auto w-full max-w-6xl px-5 pb-12 pt-8 sm:px-8 sm:pb-16 sm:pt-10">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-x-6 gap-y-3 sm:mb-10">
          <div className="max-w-md">
            <p className="text-[0.68rem] font-medium tracking-[0.2em] uppercase text-glow">
              {dict.home.featuredEyebrow}
            </p>
            <h2
              id="popular-heading"
              className="mt-3 font-display text-[1.65rem] font-medium leading-[1.15] tracking-tight sm:text-[1.9rem]"
            >
              {dict.home.featuredTitle}
            </h2>
          </div>
          <LocaleLink
            href="/products"
            className="text-[0.68rem] font-medium tracking-[0.14em] uppercase text-muted transition hover:text-foreground"
          >
            {dict.home.featuredAll}
          </LocaleLink>
        </div>

        <ProductCarousel
          key={gender}
          products={products}
          prevLabel={dict.home.featuredPrev}
          nextLabel={dict.home.featuredNext}
        />
      </div>
    </section>
  );
}

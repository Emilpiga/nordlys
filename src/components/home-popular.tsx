import { ProductCard } from "@/components/product-card";
import { LocaleLink } from "@/components/locale-link";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { Product } from "@/lib/shopify/types";

type HomePopularProps = {
  dict: Dictionary;
  products: Product[];
};

export function HomePopular({ dict, products }: HomePopularProps) {
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

        <ul className="grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-4 lg:gap-x-7">
          {products.map((product) => (
            <li key={product.id}>
              <ProductCard product={product} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

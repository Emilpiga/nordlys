"use client";

import Image from "next/image";
import { useDictionary } from "@/components/dictionary-provider";
import { LocaleLink } from "@/components/locale-link";
import type { CollectionSummary } from "@/lib/shopify/types";

type HomeCategoryGuideProps = {
  collections: CollectionSummary[];
};

export function HomeCategoryGuide({ collections }: HomeCategoryGuideProps) {
  const { dict } = useDictionary();

  if (collections.length === 0) return null;

  const oddTail =
    collections.length > 1 && collections.length % 2 === 1;

  return (
    <section
      id="categories"
      className="relative flex min-h-[100svh] flex-col scroll-mt-[var(--header-height)] md:flex-row"
    >
      <div className="relative z-10 flex w-full shrink-0 flex-col justify-center border-b border-border/70 bg-frost px-5 py-14 sm:px-8 md:sticky md:top-[var(--header-height)] md:h-[calc(100svh-var(--header-height))] md:w-[var(--rail-width)] md:border-b-0 md:border-r md:self-start">
        <div className="mx-auto w-full max-w-md md:mx-0">
          <p className="text-[0.68rem] font-medium tracking-[0.2em] uppercase text-glow">
            {dict.home.categoryEyebrow}
          </p>
          <h2 className="mt-4 font-display text-[1.85rem] font-medium leading-[1.15] tracking-tight sm:text-[2.15rem]">
            {dict.home.categoryTitle}
          </h2>
          <p className="mt-5 max-w-sm text-base font-light leading-relaxed text-muted">
            {dict.home.categorySub}
          </p>
        </div>
      </div>

      <ul className="grid flex-1 grid-cols-1 gap-[2px] bg-mist sm:grid-cols-2 sm:auto-rows-[minmax(50svh,1fr)] md:min-h-svh md:gap-[3px]">
        {collections.map((collection, index) => {
          const wideTail = oddTail && index === collections.length - 1;

          return (
            <li
              key={collection.id}
              className={`relative min-h-[50svh] ${wideTail ? "sm:col-span-2" : ""}`}
            >
              <LocaleLink
                href={`/products?collection=${encodeURIComponent(collection.handle)}`}
                className="group absolute inset-0 block overflow-hidden"
              >
                {collection.image ? (
                  <Image
                    src={collection.image.url}
                    alt={collection.image.altText || collection.title}
                    fill
                    className="object-cover object-center transition duration-[900ms] ease-out group-hover:scale-[1.04]"
                    sizes={
                      wideTail
                        ? "(max-width: 640px) 100vw, 54vw"
                        : "(max-width: 640px) 100vw, (max-width: 768px) 50vw, 27vw"
                    }
                  />
                ) : (
                  <div className="absolute inset-0 bg-mist" />
                )}

                <div
                  aria-hidden
                  className="absolute inset-0 bg-[linear-gradient(180deg,transparent_42%,rgba(20,18,14,0.58)_100%)]"
                />
                <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
                  <p className="font-display text-2xl font-medium tracking-tight text-white sm:text-3xl">
                    {collection.title}
                  </p>
                  <p className="mt-1 text-[0.72rem] font-medium tracking-[0.14em] uppercase text-white/75">
                    {collection.productCount}{" "}
                    {collection.productCount === 1
                      ? dict.home.productOne
                      : dict.home.productMany}
                  </p>
                </div>
              </LocaleLink>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

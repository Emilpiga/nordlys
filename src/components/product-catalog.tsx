"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useDictionary } from "@/components/dictionary-provider";
import { ProductCard } from "@/components/product-card";
import {
  CatalogPagination,
  CollectionChips,
  FilterButton,
  FilterDrawer,
  FilterPanel,
  SortControl,
} from "@/components/product-filters";
import {
  activeFilterCount,
  catalogPriceBounds,
  emptyFilters,
  isCollectionLanding,
  parseFilters,
  sanitizeFilters,
  serializeFilters,
  type CatalogFilters,
  type CatalogPageInfo,
  type CatalogQuery,
  type PriceBounds,
} from "@/lib/catalog-filters";
import { localePath } from "@/lib/i18n/locales";
import type { CollectionSummary, Product } from "@/lib/shopify/types";

type ProductCatalogProps = {
  title: string;
  description: string;
  products: Product[];
  collections: CollectionSummary[];
  initialQuery: CatalogQuery;
  pageInfo: CatalogPageInfo;
  bounds?: PriceBounds;
};

export function ProductCatalog({
  title,
  description,
  products,
  collections,
  initialQuery,
  pageInfo,
  bounds: boundsProp,
}: ProductCatalogProps) {
  const { dict, t, locale } = useDictionary();
  const copy = dict.products.filters;
  const router = useRouter();
  const pathname = usePathname();
  const bounds = useMemo(
    () => boundsProp ?? catalogPriceBounds(products),
    [boundsProp, products],
  );
  const [filters, setFilters] = useState<CatalogFilters>(() =>
    sanitizeFilters(parseFilters(initialQuery), bounds),
  );
  const [drawerOpen, setDrawerOpen] = useState(false);
  const skipUrl = useRef(true);
  const catalogRef = useRef<HTMLDivElement>(null);
  const current = sanitizeFilters(filters, bounds);
  const activeCount = activeFilterCount(current, bounds);
  const currencyCode =
    products[0]?.priceRange.minVariantPrice.currencyCode ?? "SEK";
  const filterQuery = serializeFilters(current, bounds);
  const countLabel =
    pageInfo.total === 0
      ? t(copy.countMany, { count: 0 })
      : pageInfo.total === 1
        ? copy.countOne
        : t(copy.countMany, { count: pageInfo.total });
  const headerLabel =
    pageInfo.pages > 1
      ? t(copy.range, {
          from: pageInfo.from,
          to: pageInfo.to,
          total: pageInfo.total,
        })
      : countLabel;

  useEffect(() => {
    setFilters(sanitizeFilters(parseFilters(initialQuery), bounds));
  }, [initialQuery, bounds]);

  useEffect(() => {
    if (skipUrl.current) {
      skipUrl.current = false;
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const currentFilter = serializeFilters(
      sanitizeFilters(parseFilters(Object.fromEntries(params)), bounds),
      bounds,
    );
    if (currentFilter === filterQuery) return;

    const next = filterQuery ? `${pathname}?${filterQuery}` : pathname;
    const timer = window.setTimeout(() => {
      router.replace(next, { scroll: false });
    }, 180);

    return () => window.clearTimeout(timer);
  }, [filterQuery, bounds, pathname, router]);

  function changeFilters(next: CatalogFilters) {
    const sanitized = sanitizeFilters(next, bounds);
    if (sanitized.collection && isCollectionLanding(sanitized, bounds)) {
      router.push(
        localePath(
          locale,
          `/collections/${encodeURIComponent(sanitized.collection)}`,
        ),
      );
      return;
    }
    setFilters(next);
  }

  function resetFilters() {
    setFilters(emptyFilters());
  }

  function hrefForPage(page: number) {
    const query = serializeFilters(current, bounds, { page });
    return query ? `${pathname}?${query}` : pathname;
  }

  const panel = (
    <FilterPanel
      collections={collections}
      filters={current}
      bounds={bounds}
      currencyCode={currencyCode}
      showHeading={false}
      onChange={changeFilters}
    />
  );

  return (
    <section
      ref={catalogRef}
      className="relative flex min-h-[calc(100svh-var(--header-height))] flex-col scroll-mt-[var(--header-height)] md:flex-row"
    >
      <aside className="relative z-10 flex w-full shrink-0 flex-col border-b border-border/70 bg-frost px-5 py-10 sm:px-8 md:sticky md:top-[var(--header-height)] md:h-[calc(100svh-var(--header-height))] md:w-[var(--rail-width)] md:self-start md:overflow-y-auto md:border-b-0 md:border-r md:py-12">
        <p className="text-[0.68rem] font-medium tracking-[0.2em] uppercase text-glow">
          {copy.eyebrow}
        </p>
        <h1 className="mt-4 font-display text-[1.85rem] font-medium leading-[1.15] tracking-tight sm:text-[2.15rem] md:text-[2.35rem]">
          {title}
        </h1>
        <p className="mt-5 text-base font-light leading-relaxed text-muted">
          {description}
        </p>
        <p className="mt-3 text-sm font-light tabular-nums text-muted">
          {countLabel}
        </p>

        <div className="mt-8 hidden w-full md:block">{panel}</div>
      </aside>

      <div className="min-w-0 flex-1 px-5 py-8 sm:px-8 md:py-12 lg:px-10">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <p
            className={`text-sm font-light tabular-nums text-muted ${
              pageInfo.pages <= 1 ? "md:sr-only" : ""
            }`}
          >
            {headerLabel}
          </p>
          <div className="flex items-center gap-2">
            <FilterButton
              count={activeCount}
              onClick={() => setDrawerOpen(true)}
            />
            <SortControl
              value={current.sort}
              onChange={(sort) => changeFilters({ ...current, sort })}
            />
          </div>
        </div>

        <div className="mb-6 md:hidden">
          <CollectionChips
            collections={collections}
            value={current.collection}
            allCount={null}
            onChange={(collection) => changeFilters({ ...current, collection })}
          />
        </div>

        {products.length === 0 ? (
          <div className="max-w-md py-10">
            <p className="font-display text-3xl font-medium tracking-tight">
              {copy.emptyTitle}
            </p>
            <p className="mt-3 text-base font-light leading-relaxed text-muted">
              {copy.emptyBody}
            </p>
            <button
              type="button"
              onClick={resetFilters}
              className="btn-primary mt-8"
            >
              {copy.emptyCta}
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-x-5 gap-y-12 lg:grid-cols-4 lg:gap-x-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            <CatalogPagination
              pageInfo={pageInfo}
              hrefForPage={hrefForPage}
              onNavigate={() =>
                catalogRef.current?.scrollIntoView({
                  behavior: "smooth",
                  block: "start",
                })
              }
            />
          </>
        )}
      </div>

      <FilterDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        resultLabel={countLabel}
      >
        <FilterPanel
          collections={collections}
          filters={current}
          bounds={bounds}
          currencyCode={currencyCode}
          showHeading={false}
          onChange={changeFilters}
        />
      </FilterDrawer>
    </section>
  );
}

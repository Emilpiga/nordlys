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
  applyCatalogFilters,
  catalogPriceBounds,
  emptyFilters,
  paginateCatalog,
  parseFilters,
  sanitizeFilters,
  serializeFilters,
  type CatalogFilters,
  type CatalogQuery,
} from "@/lib/catalog-filters";
import type { CollectionSummary, Product } from "@/lib/shopify/types";

type ProductCatalogProps = {
  title: string;
  description: string;
  products: Product[];
  collections: CollectionSummary[];
  initialQuery: CatalogQuery;
};

export function ProductCatalog({
  title,
  description,
  products,
  collections,
  initialQuery,
}: ProductCatalogProps) {
  const { dict, t } = useDictionary();
  const copy = dict.products.filters;
  const router = useRouter();
  const pathname = usePathname();
  const bounds = useMemo(() => catalogPriceBounds(products), [products]);
  const [filters, setFilters] = useState<CatalogFilters>(() =>
    sanitizeFilters(parseFilters(initialQuery), catalogPriceBounds(products)),
  );
  const [drawerOpen, setDrawerOpen] = useState(false);
  const skipUrl = useRef(true);
  const skipScroll = useRef(true);
  const catalogRef = useRef<HTMLDivElement>(null);

  const visible = useMemo(
    () => applyCatalogFilters(products, collections, filters, bounds),
    [products, collections, filters, bounds],
  );
  const paged = useMemo(
    () => paginateCatalog(visible, filters.page),
    [visible, filters.page],
  );
  const current = useMemo(
    () => sanitizeFilters(filters, bounds, paged.pages),
    [filters, bounds, paged.pages],
  );
  const activeCount = activeFilterCount(current, bounds);
  const currencyCode =
    products[0]?.priceRange.minVariantPrice.currencyCode ?? "SEK";
  const countLabel =
    paged.total === 0
      ? t(copy.countMany, { count: 0 })
      : paged.pages > 1
        ? t(copy.range, { from: paged.from, to: paged.to, total: paged.total })
        : paged.total === 1
          ? copy.countOne
          : t(copy.countMany, { count: paged.total });

  useEffect(() => {
    if (current.page !== filters.page) {
      setFilters((prev) => ({ ...prev, page: current.page }));
    }
  }, [current.page, filters.page]);

  useEffect(() => {
    if (skipUrl.current) {
      skipUrl.current = false;
      return;
    }

    const query = serializeFilters(current, bounds, paged.pages);
    const next = query ? `${pathname}?${query}` : pathname;
    const href = `${pathname}${window.location.search}`;
    if (href === next) return;

    const timer = window.setTimeout(() => {
      router.replace(next, { scroll: false });
    }, 180);

    return () => window.clearTimeout(timer);
  }, [current, bounds, paged.pages, pathname, router]);

  useEffect(() => {
    if (skipScroll.current) {
      skipScroll.current = false;
      return;
    }
    catalogRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [current.page]);

  function changeFilters(next: CatalogFilters) {
    setFilters({ ...next, page: 1 });
  }

  function resetFilters() {
    setFilters(emptyFilters());
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

        <div className="mt-8 hidden w-full md:block">{panel}</div>
      </aside>

      <div className="min-w-0 flex-1 px-5 py-8 sm:px-8 md:py-12 lg:px-10">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-light text-muted">{countLabel}</p>
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
            allCount={products.length}
            onChange={(collection) => changeFilters({ ...current, collection })}
          />
        </div>

        {paged.total === 0 ? (
          <div className="max-w-md py-10">
            <p className="font-display text-3xl font-medium tracking-tight">
              {copy.emptyTitle}
            </p>
            <p className="mt-3 text-base font-light leading-relaxed text-muted">
              {copy.emptyBody}
            </p>
            <button type="button" onClick={resetFilters} className="btn-primary mt-8">
              {copy.emptyCta}
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-x-5 gap-y-12 lg:grid-cols-4 lg:gap-x-6">
              {paged.items.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            <CatalogPagination
              page={paged.page}
              pages={paged.pages}
              onChange={(page) => setFilters({ ...current, page })}
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

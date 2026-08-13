"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useDictionary } from "@/components/dictionary-provider";
import { ProductCard } from "@/components/product-card";
import {
  ActiveFilterChips,
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
  products: Product[];
  collections: CollectionSummary[];
  initialQuery: CatalogQuery;
};

export function ProductCatalog({
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
  const current = sanitizeFilters(filters, bounds, paged.pages);
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
      onChange={changeFilters}
    />
  );

  return (
    <div
      ref={catalogRef}
      className="scroll-mt-[calc(var(--header-height)+0.75rem)] lg:flex lg:items-start"
    >
      <aside className="hidden lg:block lg:w-72 lg:shrink-0 lg:self-start lg:border-r lg:border-border/70">
        <div className="sticky top-[var(--header-height)] px-8 py-10">
          {panel}
        </div>
      </aside>

      <div className="min-w-0 flex-1 px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
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

        <div className="mb-6 lg:hidden">
          <CollectionChips
            collections={collections}
            value={current.collection}
            allCount={products.length}
            onChange={(collection) => changeFilters({ ...current, collection })}
          />
        </div>

        <ActiveFilterChips
          collections={collections}
          filters={current}
          bounds={bounds}
          currencyCode={currencyCode}
          onChange={changeFilters}
        />

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
            <div className="grid grid-cols-2 gap-x-5 gap-y-12 md:grid-cols-3 xl:grid-cols-4 xl:gap-x-8">
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
    </div>
  );
}

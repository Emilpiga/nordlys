"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { useDictionary } from "@/components/dictionary-provider";
import {
  activeFilterCount,
  catalogPriceStep,
  paginationItems,
  resolvedPriceRange,
  sanitizeFilters,
  SORT_KEYS,
  type CatalogFilters,
  type PriceBounds,
  type SortKey,
} from "@/lib/catalog-filters";
import { formatMoney } from "@/lib/format";
import type { CollectionSummary } from "@/lib/shopify/types";

const chipActive =
  "border-foreground bg-foreground text-[var(--on-accent)]";
const chipIdle =
  "border-border/80 text-muted hover:border-foreground/50 hover:text-foreground";

function FilterHeading({ children }: { children: string }) {
  return (
    <p className="text-[0.68rem] font-medium tracking-[0.2em] uppercase text-glow">
      {children}
    </p>
  );
}

type FilterPanelProps = {
  collections: CollectionSummary[];
  filters: CatalogFilters;
  bounds: PriceBounds;
  currencyCode: string;
  showHeading?: boolean;
  onChange: (next: CatalogFilters) => void;
};

export function FilterPanel({
  collections,
  filters,
  bounds,
  currencyCode,
  showHeading = true,
  onChange,
}: FilterPanelProps) {
  const { dict } = useDictionary();
  const copy = dict.products.filters;
  const current = sanitizeFilters(filters, bounds);
  const price = resolvedPriceRange(current, bounds);
  const canClear = activeFilterCount(current, bounds) > 0;

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between gap-3">
        {showHeading ? <FilterHeading>{copy.title}</FilterHeading> : (
          <div className="h-px flex-1 bg-border/70" />
        )}
        {canClear ? (
          <button
            type="button"
            onClick={() => onChange({ ...filters, ...emptyKeepSort(filters) })}
            className="shrink-0 text-[0.62rem] font-medium tracking-[0.14em] uppercase text-muted transition hover:text-foreground"
          >
            {copy.clear}
          </button>
        ) : null}
      </div>

      {collections.length > 0 ? (
        <fieldset className="min-w-0">
          <legend className="mb-3">
            <FilterHeading>{copy.category}</FilterHeading>
          </legend>
          <div>
            <CollectionRow
              label={copy.allCategories}
              count={null}
              active={!current.collection}
              onSelect={() => onChange({ ...filters, collection: null })}
            />
            {collections.map((collection) => (
              <CollectionRow
                key={collection.id}
                label={collection.title}
                count={collection.productCount}
                active={current.collection === collection.handle}
                onSelect={() =>
                  onChange({
                    ...filters,
                    collection:
                      filters.collection === collection.handle
                        ? null
                        : collection.handle,
                  })
                }
              />
            ))}
          </div>
        </fieldset>
      ) : null}

      {bounds.max > bounds.min ? (
        <fieldset className="min-w-0">
          <legend className="mb-4">
            <FilterHeading>{copy.price}</FilterHeading>
          </legend>
          <PriceRange
            min={price.min}
            max={price.max}
            bounds={bounds}
            currencyCode={currencyCode}
            onChange={(min, max) =>
              onChange({
                ...filters,
                min: min <= bounds.min ? null : min,
                max: max >= bounds.max ? null : max,
              })
            }
          />
        </fieldset>
      ) : null}

      <fieldset className="min-w-0">
        <legend className="mb-3">
          <FilterHeading>{copy.show}</FilterHeading>
        </legend>
        <div className="grid grid-cols-2 gap-2">
          <ToggleChip
            label={copy.onSale}
            checked={current.sale}
            onToggle={() => onChange({ ...filters, sale: !filters.sale })}
          />
          <ToggleChip
            label={copy.inStock}
            checked={current.stock}
            onToggle={() => onChange({ ...filters, stock: !filters.stock })}
          />
        </div>
      </fieldset>
    </div>
  );
}

function emptyKeepSort(filters: CatalogFilters): CatalogFilters {
  return {
    collection: null,
    min: null,
    max: null,
    sale: false,
    stock: false,
    sort: filters.sort,
    page: 1,
  };
}

function CollectionRow({
  label,
  count,
  active,
  onSelect,
}: {
  label: string;
  count: number | null;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onSelect}
      className="group flex w-full items-baseline gap-3 py-2 text-left transition"
    >
      <span
        aria-hidden
        className={`mt-[0.55em] h-1.5 w-1.5 shrink-0 transition ${
          active ? "bg-glow" : "bg-transparent group-hover:bg-border"
        }`}
      />
      <span
        className={`min-w-0 flex-1 text-[0.95rem] ${
          active ? "font-medium text-foreground" : "font-light text-muted group-hover:text-foreground"
        }`}
      >
        {label}
      </span>
      {count != null ? (
        <span className="tabular-nums text-[0.68rem] text-muted/70">{count}</span>
      ) : null}
    </button>
  );
}

function ToggleChip({
  label,
  checked,
  onToggle,
}: {
  label: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={onToggle}
      className={`border px-3.5 py-2.5 text-center text-[0.68rem] font-medium tracking-[0.14em] uppercase transition ${
        checked ? chipActive : chipIdle
      }`}
    >
      {label}
    </button>
  );
}

function PriceRange({
  min,
  max,
  bounds,
  currencyCode,
  onChange,
}: {
  min: number;
  max: number;
  bounds: PriceBounds;
  currencyCode: string;
  onChange: (min: number, max: number) => void;
}) {
  const { locale } = useDictionary();
  const ready = useRef(false);
  const step = catalogPriceStep(bounds);
  const span = Math.max(1, bounds.max - bounds.min);
  const left = ((min - bounds.min) / span) * 100;
  const right = ((max - bounds.min) / span) * 100;
  const money = (amount: number) =>
    formatMoney({ amount: String(amount), currencyCode }, locale);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      ready.current = true;
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  function commit(nextMin: number, nextMax: number) {
    if (!ready.current) return;
    if (nextMin === min && nextMax === max) return;
    onChange(nextMin, nextMax);
  }

  return (
    <div>
      <div className="relative h-6">
        <div
          aria-hidden
          className="absolute top-1/2 h-px w-full -translate-y-1/2 bg-border"
        />
        <div
          aria-hidden
          className="absolute top-1/2 h-0.5 -translate-y-1/2 bg-glow"
          style={{ left: `${left}%`, width: `${Math.max(0, right - left)}%` }}
        />
        <input
          type="range"
          className="catalog-range"
          min={bounds.min}
          max={bounds.max}
          step={step}
          value={min}
          aria-label={money(min)}
          onChange={(event) => {
            const next = Number(event.target.value);
            commit(Math.min(next, max), max);
          }}
        />
        <input
          type="range"
          className="catalog-range"
          min={bounds.min}
          max={bounds.max}
          step={step}
          value={max}
          aria-label={money(max)}
          style={{ zIndex: 2 }}
          onChange={(event) => {
            const next = Number(event.target.value);
            commit(min, Math.max(next, min));
          }}
        />
      </div>
      <div className="mt-3 flex items-center justify-between text-sm font-light text-muted">
        <span className="tabular-nums">{money(min)}</span>
        <span className="tabular-nums">{money(max)}</span>
      </div>
    </div>
  );
}

export function FilterBar({
  collections,
  filters,
  bounds,
  currencyCode,
  allCount,
  onChange,
}: {
  collections: CollectionSummary[];
  filters: CatalogFilters;
  bounds: PriceBounds;
  currencyCode: string;
  allCount: number;
  onChange: (next: CatalogFilters) => void;
}) {
  const { dict } = useDictionary();
  const copy = dict.products.filters;
  const current = sanitizeFilters(filters, bounds);
  const price = resolvedPriceRange(current, bounds);
  const canClear = activeFilterCount(current, bounds) > 0;

  return (
    <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between lg:gap-8">
      <div className="min-w-0 flex-1 space-y-4">
        <CollectionChips
          collections={collections}
          value={current.collection}
          allCount={allCount}
          onChange={(collection) => onChange({ ...filters, collection })}
        />
        <div className="flex flex-wrap items-end gap-x-8 gap-y-4">
          {bounds.max > bounds.min ? (
            <div className="w-full min-w-[12rem] max-w-xs">
              <FilterHeading>{copy.price}</FilterHeading>
              <div className="mt-3">
                <PriceRange
                  min={price.min}
                  max={price.max}
                  bounds={bounds}
                  currencyCode={currencyCode}
                  onChange={(min, max) =>
                    onChange({
                      ...filters,
                      min: min <= bounds.min ? null : min,
                      max: max >= bounds.max ? null : max,
                    })
                  }
                />
              </div>
            </div>
          ) : null}
          <div>
            <FilterHeading>{copy.show}</FilterHeading>
            <div className="mt-3 flex flex-wrap gap-2">
              <ToggleChip
                label={copy.onSale}
                checked={current.sale}
                onToggle={() => onChange({ ...filters, sale: !filters.sale })}
              />
              <ToggleChip
                label={copy.inStock}
                checked={current.stock}
                onToggle={() => onChange({ ...filters, stock: !filters.stock })}
              />
            </div>
          </div>
        </div>
      </div>
      {canClear ? (
        <button
          type="button"
          onClick={() => onChange({ ...filters, ...emptyKeepSort(filters) })}
          className="shrink-0 self-start text-[0.62rem] font-medium tracking-[0.14em] uppercase text-muted transition hover:text-foreground lg:self-end lg:pb-1"
        >
          {copy.clearAll}
        </button>
      ) : null}
    </div>
  );
}

export function CollectionChips({
  collections,
  value,
  allCount,
  onChange,
}: {
  collections: CollectionSummary[];
  value: string | null;
  allCount: number;
  onChange: (handle: string | null) => void;
}) {
  const { dict } = useDictionary();
  if (collections.length === 0) return null;

  return (
    <nav
      aria-label={dict.products.filters.category}
      className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] sm:flex-wrap sm:overflow-visible [&::-webkit-scrollbar]:hidden"
    >
      <Chip
        active={!value}
        onClick={() => onChange(null)}
        label={dict.products.filters.allCategories}
        count={allCount}
      />
      {collections.map((collection) => (
        <Chip
          key={collection.id}
          active={value === collection.handle}
          onClick={() =>
            onChange(value === collection.handle ? null : collection.handle)
          }
          label={collection.title}
          count={collection.productCount}
        />
      ))}
    </nav>
  );
}

function Chip({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count?: number;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`shrink-0 border px-3.5 py-2 text-[0.68rem] font-medium tracking-[0.14em] uppercase transition ${
        active ? chipActive : chipIdle
      }`}
    >
      {label}
      {typeof count === "number" ? (
        <span className="ml-1.5 tabular-nums opacity-70">{count}</span>
      ) : null}
    </button>
  );
}

export function ActiveFilterChips({
  collections,
  filters,
  bounds,
  currencyCode,
  onChange,
}: {
  collections: CollectionSummary[];
  filters: CatalogFilters;
  bounds: PriceBounds;
  currencyCode: string;
  onChange: (next: CatalogFilters) => void;
}) {
  const { locale, dict, t } = useDictionary();
  const copy = dict.products.filters;
  const current = sanitizeFilters(filters, bounds);
  const price = resolvedPriceRange(current, bounds);
  const chips: { key: string; label: string; clear: () => CatalogFilters }[] = [];

  if (current.collection) {
    const collection = collections.find(
      (item) => item.handle === current.collection,
    );
    chips.push({
      key: "collection",
      label: collection?.title ?? current.collection,
      clear: () => ({ ...filters, collection: null }),
    });
  }

  if (price.min > bounds.min || price.max < bounds.max) {
    chips.push({
      key: "price",
      label: `${formatMoney({ amount: String(price.min), currencyCode }, locale)} – ${formatMoney({ amount: String(price.max), currencyCode }, locale)}`,
      clear: () => ({ ...filters, min: null, max: null }),
    });
  }

  if (current.sale) {
    chips.push({
      key: "sale",
      label: copy.onSale,
      clear: () => ({ ...filters, sale: false }),
    });
  }

  if (current.stock) {
    chips.push({
      key: "stock",
      label: copy.inStock,
      clear: () => ({ ...filters, stock: false }),
    });
  }

  if (chips.length === 0) return null;

  return (
    <div className="mb-8 flex flex-wrap items-center gap-2">
      <span className="sr-only">{copy.active}</span>
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={() => onChange(chip.clear())}
          aria-label={t(copy.remove, { label: chip.label })}
          className={`inline-flex items-center gap-2 border border-border/80 px-3 py-1.5 text-[0.68rem] font-medium tracking-[0.12em] uppercase text-muted transition hover:border-foreground/50 hover:text-foreground ${
            chip.key === "collection" ? "max-md:hidden" : ""
          }`}
        >
          {chip.label}
          <span aria-hidden className="text-sm leading-none">
            ×
          </span>
        </button>
      ))}
    </div>
  );
}

export function SortControl({
  value,
  onChange,
}: {
  value: SortKey;
  onChange: (next: SortKey) => void;
}) {
  const { dict } = useDictionary();
  const copy = dict.products.filters;
  const labels: Record<SortKey, string> = {
    featured: copy.sortFeatured,
    "price-asc": copy.sortPriceAsc,
    "price-desc": copy.sortPriceDesc,
    name: copy.sortName,
  };
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const onPointer = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (target && rootRef.current?.contains(target)) return;
      setOpen(false);
    };

    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onPointer);
    window.addEventListener("touchstart", onPointer);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onPointer);
      window.removeEventListener("touchstart", onPointer);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative min-w-0">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={copy.sort}
        onClick={() => setOpen((current) => !current)}
        className={`inline-flex max-w-full items-center gap-2.5 border bg-[color-mix(in_oklab,var(--frost)_88%,white)] px-3.5 py-2.5 text-left text-sm transition ${
          open
            ? "border-foreground/55"
            : "border-border/80 hover:border-foreground/40"
        }`}
      >
        <span className="hidden text-[0.62rem] font-medium tracking-[0.14em] uppercase text-muted sm:inline">
          {copy.sort}
        </span>
        <span className="min-w-0 truncate text-foreground">{labels[value]}</span>
        <svg
          viewBox="0 0 12 12"
          fill="none"
          aria-hidden="true"
          className={`h-3 w-3 shrink-0 text-muted transition ${open ? "rotate-180" : ""}`}
        >
          <path
            d="M2.5 4.5 6 8l3.5-3.5"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open ? (
        <ul
          id={listId}
          role="listbox"
          aria-label={copy.sort}
          className="absolute right-0 z-20 mt-1.5 min-w-full border border-border/70 bg-[color-mix(in_oklab,var(--frost)_98%,white)] py-1.5 shadow-[0_18px_50px_rgba(20,28,34,0.16)]"
        >
          {SORT_KEYS.map((key) => {
            const selected = key === value;
            return (
              <li key={key} role="option" aria-selected={selected}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(key);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between gap-6 px-3.5 py-2 text-left text-sm whitespace-nowrap transition ${
                    selected
                      ? "bg-[color-mix(in_oklab,var(--mist)_70%,white)] text-foreground"
                      : "text-foreground/85 hover:bg-[color-mix(in_oklab,var(--mist)_40%,white)]"
                  }`}
                >
                  {labels[key]}
                  {selected ? (
                    <span className="h-1.5 w-1.5 shrink-0 bg-foreground" />
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

export function CatalogPagination({
  page,
  pages,
  onChange,
}: {
  page: number;
  pages: number;
  onChange: (page: number) => void;
}) {
  const { dict, t } = useDictionary();
  const copy = dict.products.filters;
  if (pages <= 1) return null;

  const items = paginationItems(page, pages);

  return (
    <nav
      aria-label={t(copy.page, { page, pages })}
      className="mt-16 flex flex-wrap items-center justify-center gap-x-1 gap-y-3 border-t border-border/60 pt-12"
    >
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
        className="px-3 py-2 text-[0.68rem] font-medium tracking-[0.14em] uppercase text-muted transition hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:text-muted"
      >
        {copy.previous}
      </button>

      {items.map((item, index) =>
        item === "gap" ? (
          <span
            key={`gap-${index}`}
            aria-hidden
            className="px-1 text-sm text-muted"
          >
            …
          </span>
        ) : (
          <button
            key={item}
            type="button"
            aria-label={t(copy.goToPage, { page: item })}
            aria-current={item === page ? "page" : undefined}
            onClick={() => onChange(item)}
            className={`min-w-9 px-2.5 py-2 text-[0.72rem] font-medium tracking-[0.12em] uppercase tabular-nums transition ${
              item === page
                ? "text-foreground underline decoration-glow decoration-1 underline-offset-8"
                : "text-muted hover:text-foreground"
            }`}
          >
            {item}
          </button>
        ),
      )}

      <button
        type="button"
        disabled={page >= pages}
        onClick={() => onChange(page + 1)}
        className="px-3 py-2 text-[0.68rem] font-medium tracking-[0.14em] uppercase text-muted transition hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:text-muted"
      >
        {copy.next}
      </button>
    </nav>
  );
}

export function FilterDrawer({
  open,
  onClose,
  resultLabel,
  children,
}: {
  open: boolean;
  onClose: () => void;
  resultLabel: string;
  children: ReactNode;
}) {
  const { dict } = useDictionary();
  const titleId = useId();

  useEffect(() => {
    if (!open) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end md:hidden">
      <button
        type="button"
        aria-label={dict.products.filters.close}
        className="absolute inset-0 bg-[rgba(20,28,34,0.38)] backdrop-blur-[2px] animate-drawer-backdrop"
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative flex h-full w-full max-w-md flex-col bg-[color-mix(in_oklab,var(--frost)_97%,white)] shadow-[-12px_0_40px_rgba(20,28,34,0.12)] animate-drawer-panel"
      >
        <div className="flex items-center justify-between border-b border-border/70 px-5 py-4">
          <h2
            id={titleId}
            className="font-display text-2xl font-medium tracking-tight"
          >
            {dict.products.filters.title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-[0.68rem] font-medium tracking-[0.14em] uppercase text-muted transition hover:text-foreground"
          >
            {dict.products.close}
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-6">{children}</div>
        <div className="border-t border-border/70 px-5 py-4">
          <button type="button" onClick={onClose} className="btn-primary w-full">
            {resultLabel}
          </button>
        </div>
      </aside>
    </div>
  );
}

export function FilterButton({
  count,
  onClick,
}: {
  count: number;
  onClick: () => void;
}) {
  const { dict, t } = useDictionary();
  const copy = dict.products.filters;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={count > 0 ? t(copy.openWithCount, { count }) : copy.open}
      className="inline-flex items-center gap-2.5 border border-border/80 bg-[color-mix(in_oklab,var(--frost)_88%,white)] px-3.5 py-2.5 text-[0.68rem] font-medium tracking-[0.14em] uppercase transition hover:border-foreground/40 md:hidden"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        className="h-3.5 w-3.5"
      >
        <path
          d="M4 7h16M7 12h10M10 17h4"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      </svg>
      {copy.open}
      {count > 0 ? (
        <span className="bg-foreground px-1.5 py-0.5 text-[0.58rem] tabular-nums text-on-accent">
          {count}
        </span>
      ) : null}
    </button>
  );
}

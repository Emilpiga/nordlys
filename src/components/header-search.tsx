"use client";

import Image from "next/image";
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useTransition,
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { useRouter } from "next/navigation";
import { predictiveSearchAction } from "@/app/actions/search";
import { useDictionary } from "@/components/dictionary-provider";
import { LocaleLink } from "@/components/locale-link";
import { ProductPrice } from "@/components/product-price";
import { localePath } from "@/lib/i18n/locales";
import type {
  CatalogSearchResult,
  CollectionSummary,
} from "@/lib/shopify/types";

type HeaderSearchProps = {
  collections?: CollectionSummary[];
};

type ResultItem =
  | { kind: "suggestion"; id: string; text: string }
  | { kind: "collection"; id: string; handle: string; title: string }
  | { kind: "product"; id: string; handle: string }
  | { kind: "viewAll"; id: "viewAll" };

const emptyResult: CatalogSearchResult = {
  products: [],
  collections: [],
  suggestions: [],
};

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="11"
        cy="11"
        r="6.25"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <path
        d="M16 16.5 20 20.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function HeaderSearch({ collections = [] }: HeaderSearchProps) {
  const { locale, dict, t } = useDictionary();
  const router = useRouter();
  const inputId = useId();
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const desktopInputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);
  const requestId = useRef(0);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [result, setResult] = useState<CatalogSearchResult>(emptyResult);
  const [ready, setReady] = useState(false);
  const [, startTransition] = useTransition();

  const trimmed = query.trim();
  const searching = trimmed.length >= 2;
  const rooms = collections.slice(0, 6);

  const items = useMemo<ResultItem[]>(() => {
    if (!searching) {
      return rooms.map((collection) => ({
        kind: "collection" as const,
        id: collection.id,
        handle: collection.handle,
        title: collection.title,
      }));
    }

    const next: ResultItem[] = [
      ...result.suggestions.map((text) => ({
        kind: "suggestion" as const,
        id: `s-${text}`,
        text,
      })),
      ...result.collections.map((collection) => ({
        kind: "collection" as const,
        id: collection.id,
        handle: collection.handle,
        title: collection.title,
      })),
      ...result.products.map((product) => ({
        kind: "product" as const,
        id: product.id,
        handle: product.handle,
      })),
    ];

    if (next.length > 0 || result.products.length > 0) {
      next.push({ kind: "viewAll", id: "viewAll" });
    }

    return next;
  }, [result, rooms, searching]);

  const panelOpen = open || mobileOpen;
  const showPanel = panelOpen && (searching || rooms.length > 0);

  useEffect(() => {
    if (!searching) {
      setResult(emptyResult);
      setReady(false);
      return;
    }

    setReady(false);
    const handle = window.setTimeout(() => {
      const id = ++requestId.current;
      startTransition(async () => {
        const next = await predictiveSearchAction(trimmed, locale);
        if (id !== requestId.current) return;
        setResult(next);
        setReady(true);
        setActive(0);
      });
    }, 180);

    return () => window.clearTimeout(handle);
  }, [locale, searching, trimmed]);

  useEffect(() => {
    if (!panelOpen) return;

    function onPointer(event: MouseEvent | TouchEvent) {
      const target = event.target as Node | null;
      if (target && rootRef.current?.contains(target)) return;
      setOpen(false);
      setMobileOpen(false);
    }

    function onKey(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        setMobileOpen(false);
        desktopInputRef.current?.blur();
      }
    }

    window.addEventListener("mousedown", onPointer);
    window.addEventListener("touchstart", onPointer);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onPointer);
      window.removeEventListener("touchstart", onPointer);
      window.removeEventListener("keydown", onKey);
    };
  }, [panelOpen]);

  useEffect(() => {
    function onShortcut(event: globalThis.KeyboardEvent) {
      if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== "k") {
        return;
      }
      event.preventDefault();
      if (window.matchMedia("(min-width: 768px)").matches) {
        desktopInputRef.current?.focus();
        setOpen(true);
      } else {
        setMobileOpen(true);
      }
    }

    window.addEventListener("keydown", onShortcut);
    return () => window.removeEventListener("keydown", onShortcut);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    const frame = window.requestAnimationFrame(() => {
      mobileInputRef.current?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [mobileOpen]);

  function searchHref(value = trimmed) {
    const q = value.trim();
    return q ? `/search?q=${encodeURIComponent(q)}` : "/search";
  }

  function go(href: string) {
    setOpen(false);
    setMobileOpen(false);
    router.push(localePath(locale, href));
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    const item = items[active];
    if (item?.kind === "product") {
      go(`/products/${item.handle}`);
      return;
    }
    if (item?.kind === "collection") {
      go(`/collections/${encodeURIComponent(item.handle)}`);
      return;
    }
    if (item?.kind === "suggestion") {
      setQuery(item.text);
      go(searchHref(item.text));
      return;
    }
    go(searchHref());
  }

  function onFieldKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
    if (!showPanel || items.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((index) => (index + 1) % items.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((index) => (index - 1 + items.length) % items.length);
    }
  }

  function panel(inputRef: typeof desktopInputRef) {
    const emptySearch = searching && ready && items.length === 0;

    return (
      <div
        id={listId}
        role="listbox"
        aria-label={dict.search.label}
        className="overflow-hidden border border-border/70 bg-[color-mix(in_oklab,var(--frost)_96%,white)] shadow-[0_18px_50px_rgba(20,28,34,0.12)]"
      >
        {!searching && rooms.length > 0 ? (
          <p className="px-4 pb-1 pt-3 text-[0.62rem] font-medium tracking-[0.18em] uppercase text-glow">
            {dict.search.rooms}
          </p>
        ) : null}

        {emptySearch ? (
          <p className="px-4 py-5 text-sm font-light text-muted">
            {t(dict.search.empty, { query: trimmed })}
          </p>
        ) : null}

        <ul className="max-h-[min(70vh,28rem)] overflow-y-auto py-1">
          {items.map((item, index) => {
            const selected = index === active;
            const rowClass = `flex w-full items-center gap-3 px-4 py-2.5 text-left transition ${
              selected
                ? "bg-[color-mix(in_oklab,var(--mist)_70%,white)]"
                : "hover:bg-[color-mix(in_oklab,var(--mist)_45%,white)]"
            }`;

            if (item.kind === "suggestion") {
              return (
                <li key={item.id} role="option" aria-selected={selected}>
                  <button
                    type="button"
                    className={rowClass}
                    onMouseEnter={() => setActive(index)}
                    onClick={() => {
                      setQuery(item.text);
                      inputRef.current?.focus();
                      go(searchHref(item.text));
                    }}
                  >
                    <SearchIcon className="h-3.5 w-3.5 shrink-0 text-muted" />
                    <span className="text-sm font-light text-foreground">
                      {item.text}
                    </span>
                  </button>
                </li>
              );
            }

            if (item.kind === "collection") {
              return (
                <li key={item.id} role="option" aria-selected={selected}>
                  <LocaleLink
                    href={`/collections/${encodeURIComponent(item.handle)}`}
                    className={rowClass}
                    onMouseEnter={() => setActive(index)}
                    onClick={() => {
                      setOpen(false);
                      setMobileOpen(false);
                    }}
                  >
                    <span className="min-w-0 flex-1 truncate font-display text-lg font-medium tracking-tight">
                      {item.title}
                    </span>
                    <span className="shrink-0 text-[0.62rem] font-medium tracking-[0.14em] uppercase text-muted">
                      {dict.search.room}
                    </span>
                  </LocaleLink>
                </li>
              );
            }

            if (item.kind === "viewAll") {
              return (
                <li key={item.id} role="option" aria-selected={selected}>
                  <LocaleLink
                    href={searchHref()}
                    className={`${rowClass} text-[0.68rem] font-medium tracking-[0.14em] uppercase text-muted`}
                    onMouseEnter={() => setActive(index)}
                    onClick={() => {
                      setOpen(false);
                      setMobileOpen(false);
                    }}
                  >
                    {t(dict.search.viewAll, { query: trimmed })}
                  </LocaleLink>
                </li>
              );
            }

            const product = result.products.find(
              (entry) => entry.handle === item.handle,
            );
            if (!product) return null;

            return (
              <li key={item.id} role="option" aria-selected={selected}>
                <LocaleLink
                  href={`/products/${product.handle}`}
                  className={rowClass}
                  onMouseEnter={() => setActive(index)}
                  onClick={() => {
                    setOpen(false);
                    setMobileOpen(false);
                  }}
                >
                  <span className="relative h-14 w-11 shrink-0 overflow-hidden bg-mist">
                    {product.featuredImage ? (
                      <Image
                        src={product.featuredImage.url}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="44px"
                      />
                    ) : null}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-foreground">
                      {product.title}
                    </span>
                    <span className="mt-0.5 block">
                      <ProductPrice
                        handle={product.handle}
                        price={product.price}
                      />
                    </span>
                  </span>
                </LocaleLink>
              </li>
            );
          })}
        </ul>
      </div>
    );
  }

  const fieldClassName =
    "w-full appearance-none text-sm font-light text-foreground outline-none transition placeholder:text-muted/70 [&::-webkit-search-cancel-button]:hidden";

  return (
    <div ref={rootRef} className="relative flex h-full w-auto shrink-0 md:min-w-0 md:w-full md:flex-1">
      <div className="relative hidden h-full min-w-0 w-full md:block">
        <form onSubmit={submit} className="relative h-full">
          <label htmlFor={inputId} className="sr-only">
            {dict.search.label}
          </label>
          <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            ref={desktopInputRef}
            id={inputId}
            type="search"
            value={query}
            autoComplete="off"
            role="combobox"
            aria-expanded={showPanel && open}
            aria-controls={listId}
            aria-autocomplete="list"
            placeholder={dict.search.placeholder}
            className={`${fieldClassName} h-full border-r border-border/70 bg-[color-mix(in_oklab,var(--mist)_40%,white)] pl-12 pr-14 focus:bg-[color-mix(in_oklab,var(--frost)_88%,white)]`}
            onChange={(event) => {
              setQuery(event.target.value);
              setOpen(true);
              setActive(0);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={onFieldKeyDown}
          />
          {query ? (
            <button
              type="button"
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[0.68rem] tracking-[0.12em] uppercase text-muted transition hover:text-foreground"
              onClick={() => {
                setQuery("");
                setResult(emptyResult);
                desktopInputRef.current?.focus();
              }}
            >
              {dict.search.clear}
            </button>
          ) : null}
        </form>
        {showPanel && open ? (
          <div className="absolute inset-x-0 top-full z-50">
            {panel(desktopInputRef)}
          </div>
        ) : null}
      </div>

      <button
        type="button"
        className="inline-flex h-9 w-9 items-center justify-center text-foreground transition hover:text-accent md:hidden"
        aria-label={dict.search.open}
        onClick={() => setMobileOpen(true)}
      >
        <SearchIcon className="h-[1.2rem] w-[1.2rem]" />
      </button>

      {mobileOpen ? (
        <div className="fixed inset-x-0 top-[var(--header-height)] z-50 border-b border-border/70 bg-frost px-5 py-3 md:hidden">
          <form onSubmit={submit} className="relative">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              ref={mobileInputRef}
              type="search"
              value={query}
              autoComplete="off"
              role="combobox"
              aria-expanded={showPanel}
              aria-controls={listId}
              aria-autocomplete="list"
              placeholder={dict.search.placeholder}
              className={`${fieldClassName} h-10 bg-[color-mix(in_oklab,var(--mist)_40%,white)] pl-10 pr-9 focus:bg-[color-mix(in_oklab,var(--frost)_88%,white)]`}
              onChange={(event) => {
                setQuery(event.target.value);
                setActive(0);
              }}
              onKeyDown={onFieldKeyDown}
            />
            <button
              type="button"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[0.68rem] tracking-[0.12em] uppercase text-muted"
              onClick={() => {
                setQuery("");
                setMobileOpen(false);
              }}
            >
              {dict.search.close}
            </button>
          </form>
          {showPanel ? <div className="mt-3">{panel(mobileInputRef)}</div> : null}
        </div>
      ) : null}
    </div>
  );
}

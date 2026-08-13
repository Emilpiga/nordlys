"use client";

import { useDictionary } from "@/components/dictionary-provider";
import { LocaleLink } from "@/components/locale-link";
import type { CollectionSummary } from "@/lib/shopify/types";

type CategoryChipsProps = {
  collections: CollectionSummary[];
  activeHandle?: string;
  allCount?: number;
};

const activeClass =
  "border-foreground bg-foreground !text-[var(--on-accent)]";
const idleClass =
  "border-border/80 text-muted hover:border-foreground/50 hover:text-foreground";

export function CategoryChips({
  collections,
  activeHandle,
  allCount,
}: CategoryChipsProps) {
  const { dict } = useDictionary();

  if (collections.length === 0) return null;

  return (
    <nav aria-label={dict.nav.categories} className="flex flex-wrap gap-2">
      <LocaleLink
        href="/products"
        className={`border px-3.5 py-2 text-[0.68rem] font-medium tracking-[0.14em] uppercase transition ${
          !activeHandle ? activeClass : idleClass
        }`}
        style={!activeHandle ? { color: "var(--on-accent)" } : undefined}
      >
        {dict.nav.viewAll}
        {typeof allCount === "number" ? (
          <span className="ml-1.5 tabular-nums opacity-70">{allCount}</span>
        ) : null}
      </LocaleLink>
      {collections.map((collection) => {
        const active = collection.handle === activeHandle;
        return (
          <LocaleLink
            key={collection.id}
            href={`/collections/${encodeURIComponent(collection.handle)}`}
            className={`border px-3.5 py-2 text-[0.68rem] font-medium tracking-[0.14em] uppercase transition ${
              active ? activeClass : idleClass
            }`}
            style={active ? { color: "var(--on-accent)" } : undefined}
          >
            {collection.title}
            <span className="ml-1.5 tabular-nums opacity-70">
              {collection.productCount}
            </span>
          </LocaleLink>
        );
      })}
    </nav>
  );
}

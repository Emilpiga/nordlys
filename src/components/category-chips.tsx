"use client";

import { useDictionary } from "@/components/dictionary-provider";
import { LocaleLink } from "@/components/locale-link";
import type { ProductCategory } from "@/lib/shopify/types";
import { categoryParamFromId } from "@/lib/shopify/taxonomy";

type CategoryChipsProps = {
  categories: ProductCategory[];
  activeId?: string;
  allCount?: number;
};

const activeClass =
  "border-foreground bg-foreground !text-[var(--on-accent)]";
const idleClass =
  "border-border/80 text-muted hover:border-foreground/50 hover:text-foreground";

export function CategoryChips({
  categories,
  activeId,
  allCount,
}: CategoryChipsProps) {
  const { dict } = useDictionary();

  if (categories.length === 0) return null;

  const activeParam = activeId ? categoryParamFromId(activeId) : null;

  return (
    <nav aria-label={dict.nav.categories} className="flex flex-wrap gap-2">
      <LocaleLink
        href="/products"
        className={`border px-3.5 py-2 text-[0.68rem] font-medium tracking-[0.14em] uppercase transition ${
          !activeParam ? activeClass : idleClass
        }`}
        style={!activeParam ? { color: "var(--on-accent)" } : undefined}
      >
        {dict.nav.viewAll}
        {typeof allCount === "number" ? (
          <span className="ml-1.5 tabular-nums opacity-70">{allCount}</span>
        ) : null}
      </LocaleLink>
      {categories.map((category) => {
        const param = categoryParamFromId(category.id);
        const active = param === activeParam;
        return (
          <LocaleLink
            key={category.id}
            href={`/categories/${encodeURIComponent(param)}`}
            className={`border px-3.5 py-2 text-[0.68rem] font-medium tracking-[0.14em] uppercase transition ${
              active ? activeClass : idleClass
            }`}
            style={active ? { color: "var(--on-accent)" } : undefined}
          >
            {category.name}
            <span className="ml-1.5 tabular-nums opacity-70">
              {category.productCount}
            </span>
          </LocaleLink>
        );
      })}
    </nav>
  );
}

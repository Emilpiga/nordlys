"use client";

import { useDictionary } from "@/components/dictionary-provider";
import { LocaleLink } from "@/components/locale-link";
import {
  catalogCollectionNav,
  shortCollectionLabel,
} from "@/lib/shopify/collections";
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

function ChipLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <LocaleLink
      href={href}
      className={`border px-3.5 py-2 text-[0.68rem] font-medium tracking-[0.14em] uppercase transition ${
        active ? activeClass : idleClass
      }`}
      style={active ? { color: "var(--on-accent)" } : undefined}
    >
      {children}
    </LocaleLink>
  );
}

export function CategoryChips({
  collections,
  activeHandle,
  allCount,
}: CategoryChipsProps) {
  const { dict } = useDictionary();
  const nav = catalogCollectionNav(collections, activeHandle);

  if (nav.primary.length === 0) return null;

  return (
    <div className="space-y-3">
      <nav aria-label={dict.nav.categories} className="flex flex-wrap gap-2">
        <ChipLink href="/products" active={!activeHandle}>
          {dict.nav.viewAll}
          {typeof allCount === "number" ? (
            <span className="ml-1.5 tabular-nums opacity-70">{allCount}</span>
          ) : null}
        </ChipLink>
        {nav.primary.map((collection) => {
          const clothingActive =
            collection.handle === "klader" && nav.inClothingBranch;
          const active =
            collection.handle === activeHandle || clothingActive;
          return (
            <ChipLink
              key={collection.id}
              href={`/collections/${encodeURIComponent(collection.handle)}`}
              active={active}
            >
              {collection.title}
              <span className="ml-1.5 tabular-nums opacity-70">
                {collection.productCount}
              </span>
            </ChipLink>
          );
        })}
      </nav>

      {nav.genders.length > 0 ? (
        <nav aria-label={nav.clothingRoot?.title ?? "Kläder"} className="flex flex-wrap gap-2">
          {nav.genders.map((collection) => {
            const active =
              collection.handle === activeHandle ||
              nav.clothingGenderKey === collection.handle;
            return (
              <ChipLink
                key={collection.id}
                href={`/collections/${encodeURIComponent(collection.handle)}`}
                active={active}
              >
                {collection.title}
                <span className="ml-1.5 tabular-nums opacity-70">
                  {collection.productCount}
                </span>
              </ChipLink>
            );
          })}
        </nav>
      ) : null}

      {nav.types.length > 0 ? (
        <nav
          aria-label={nav.clothingGender?.title ?? nav.clothingGenderKey ?? ""}
          className="flex flex-wrap gap-2"
        >
          {nav.clothingGender ? (
            <ChipLink
              href={`/collections/${encodeURIComponent(nav.clothingGender.handle)}`}
              active={activeHandle === nav.clothingGender.handle}
            >
              {dict.products.filters.allCategories}
            </ChipLink>
          ) : null}
          {nav.types.map((collection) => (
            <ChipLink
              key={collection.id}
              href={`/collections/${encodeURIComponent(collection.handle)}`}
              active={collection.handle === activeHandle}
            >
              {shortCollectionLabel(
                collection.title,
                nav.clothingGender?.title,
              )}
              <span className="ml-1.5 tabular-nums opacity-70">
                {collection.productCount}
              </span>
            </ChipLink>
          ))}
        </nav>
      ) : null}
    </div>
  );
}

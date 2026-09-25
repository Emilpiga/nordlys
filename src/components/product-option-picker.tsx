"use client";

import Image from "@/components/soft-image";
import { OptionSelect } from "@/components/option-select";
import { useDictionary } from "@/components/dictionary-provider";
import { formatMoney } from "@/lib/format";
import type {
  Product,
  ProductImage,
  ProductVariant,
} from "@/lib/shopify/types";
import {
  isOptionValueInStock,
  optionPricesVary,
  priceForOptionValue,
  selectOptionValue,
} from "@/lib/shopify/variants";

const CHIP_OPTION_LIMIT = 6;
const LONG_VALUE_CHARS = 16;

type ProductOption = Product["options"][number];

type ProductOptionPickerProps = {
  option: ProductOption;
  values: string[];
  selected: Record<string, string>;
  variants: ProductVariant[];
  onChange: (next: Record<string, string>) => void;
  size?: "sm" | "md";
};

const COLOR_OPTION_PATTERN = /^(färg|farge|farve|väri|colou?r)$/i;

/** Variant photo per colour value — only when every value has one. */
export function colorSwatchImages(
  optionName: string,
  values: string[],
  variants: ProductVariant[],
): Map<string, ProductImage> | null {
  if (!COLOR_OPTION_PATTERN.test(optionName.trim()) || values.length < 2) {
    return null;
  }
  const images = new Map<string, ProductImage>();
  for (const value of values) {
    const image = variants.find(
      (variant) =>
        variant.image &&
        variant.selectedOptions.some(
          (option) => option.name === optionName && option.value === value,
        ),
    )?.image;
    if (!image) return null;
    images.set(value, image);
  }
  return images;
}

export function shouldUseOptionSelect(values: string[]) {
  if (values.length > CHIP_OPTION_LIMIT) return true;
  return values.some((value) => value.trim().length > LONG_VALUE_CHARS);
}

export function ProductOptionPicker({
  option,
  values,
  selected,
  variants,
  onChange,
  size = "md",
}: ProductOptionPickerProps) {
  const { locale } = useDictionary();
  const current = selected[option.name] ?? values[0];
  const swatches = colorSwatchImages(option.name, values, variants);
  const useSelect = !swatches && shouldUseOptionSelect(values);
  const showPrices = optionPricesVary(variants, option.name, values, selected);
  const compact = size === "sm";

  function choose(value: string) {
    onChange(selectOptionValue(variants, selected, option.name, value));
  }

  function hintFor(value: string) {
    if (!showPrices) return undefined;
    const price = priceForOptionValue(variants, option.name, value, selected);
    return price ? formatMoney(price, locale) : undefined;
  }

  return (
    <fieldset className={compact ? "mt-6 space-y-3" : "space-y-3"}>
      <legend className="text-[0.68rem] font-medium tracking-[0.18em] uppercase text-muted">
        {option.name}
        {!useSelect && current ? (
          <span className="ml-2 font-normal normal-case tracking-normal text-foreground/70">
            {current}
          </span>
        ) : null}
      </legend>
      {swatches ? (
        <div className="flex flex-wrap gap-2.5">
          {values.map((value) => {
            const image = swatches.get(value)!;
            const active = current === value;
            const inStock = isOptionValueInStock(
              variants,
              option.name,
              value,
              selected,
            );
            const hint = hintFor(value);
            const label = hint ? `${value}, ${hint}` : value;
            return (
              <button
                key={value}
                type="button"
                aria-pressed={active}
                aria-label={label}
                title={label}
                onClick={() => choose(value)}
                className={`relative shrink-0 overflow-hidden rounded-full bg-mist ring-offset-2 ring-offset-background transition ${
                  compact ? "h-10 w-10" : "h-12 w-12"
                } ${
                  active
                    ? "ring-[1.5px] ring-foreground"
                    : "ring-1 ring-border/80 hover:ring-foreground/50"
                } ${inStock ? "" : "opacity-45"}`}
              >
                <Image
                  src={image.url}
                  alt=""
                  fill
                  sizes={compact ? "40px" : "48px"}
                  className="object-cover"
                />
                {inStock ? null : (
                  <span
                    aria-hidden
                    className="absolute left-1/2 top-1/2 h-px w-[140%] -translate-x-1/2 -translate-y-1/2 -rotate-45 bg-foreground/70"
                  />
                )}
              </button>
            );
          })}
        </div>
      ) : useSelect ? (
        <OptionSelect
          label={option.name}
          value={current}
          options={values.map((value) => ({
            value,
            hint: hintFor(value),
            unavailable: !isOptionValueInStock(
              variants,
              option.name,
              value,
              selected,
            ),
          }))}
          onChange={choose}
        />
      ) : (
        <div className="flex flex-wrap gap-2">
          {values.map((value) => {
            const active = current === value;
            const inStock = isOptionValueInStock(
              variants,
              option.name,
              value,
              selected,
            );
            const hint = hintFor(value);
            return (
              <button
                key={value}
                type="button"
                aria-pressed={active}
                onClick={() => choose(value)}
                className={`min-w-12 border text-sm transition ${
                  compact ? "px-3.5 py-2" : "px-4 py-2.5"
                } ${
                  active
                    ? "border-foreground bg-foreground text-on-accent"
                    : inStock
                      ? "border-border/80 bg-transparent text-foreground hover:border-foreground/50"
                      : "border-border/50 text-muted/55 line-through opacity-55 hover:border-foreground/40 hover:opacity-80"
                }`}
              >
                <span className="block">{value}</span>
                {hint ? (
                  <span
                    className={`block text-[0.68rem] font-light tabular-nums ${
                      active ? "text-on-accent/80" : "text-muted"
                    }`}
                  >
                    {hint}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      )}
    </fieldset>
  );
}

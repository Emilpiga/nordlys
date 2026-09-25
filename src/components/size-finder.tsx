"use client";

import { useId, useState } from "react";
import { useDictionary } from "@/components/dictionary-provider";
import {
  EU_EQUIVALENT,
  USUAL_SIZES,
  nearestValue,
  normalizeSize,
  productValueFor,
  recommendedSize,
  rememberUsualSize,
  sortSizeValues,
  type LetterSize,
} from "@/lib/size-guide";

type SizeFinderProps = {
  /** The product's size values (any order). */
  values: string[];
  /** The shopper's usual EU size, remembered across products. */
  usual: LetterSize | null;
  isInStock: (value: string) => boolean;
  onChoose: (value: string) => void;
  compact?: boolean;
};

/**
 * "Runs small" note plus a small finder: tell us your usual size and we point
 * at the one to pick here (one up), with a conversion table underneath.
 */
export function SizeFinder({
  values,
  usual,
  isInStock,
  onChoose,
  compact = false,
}: SizeFinderProps) {
  const { dict, t } = useDictionary();
  const copy = dict.products;
  const panelId = useId();
  const [open, setOpen] = useState(false);

  const ideal = usual ? recommendedSize(usual) : null;
  const exact = ideal ? productValueFor(values, ideal) : null;
  const pick = exact ?? (ideal ? nearestValue(values, ideal) : null);
  const sorted = sortSizeValues(values);

  return (
    <div className={compact ? "space-y-2" : "space-y-2.5"}>
      <p className="text-xs font-light leading-relaxed text-muted">
        {copy.sizeRunsSmall}{" "}
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((current) => !current)}
          className="font-medium text-foreground underline decoration-border underline-offset-4 transition hover:decoration-foreground"
        >
          {open ? copy.sizeFinderClose : copy.sizeFinderToggle}
        </button>
      </p>

      {open ? (
        <div
          id={panelId}
          className="animate-fade border border-border/80 bg-[color-mix(in_oklab,var(--frost)_96%,white)] p-4"
        >
          <p className="text-[0.68rem] font-medium tracking-[0.18em] uppercase text-muted">
            {copy.sizeFinderQuestion}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {USUAL_SIZES.map((size) => {
              const active = usual === size;
              return (
                <button
                  key={size}
                  type="button"
                  aria-pressed={active}
                  onClick={() => rememberUsualSize(size)}
                  className={`min-w-10 border px-2.5 py-1.5 text-xs transition ${
                    active
                      ? "border-foreground bg-foreground text-on-accent"
                      : "border-border/80 hover:border-foreground/50"
                  }`}
                >
                  {size}
                </button>
              );
            })}
          </div>

          {usual && ideal && pick ? (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-4">
              <div>
                <p className="font-display text-lg font-medium leading-tight">
                  {t(copy.sizeFinderRecommend, { size: pick })}
                </p>
                {!exact ? (
                  <p className="mt-1 text-xs font-light text-muted">
                    {t(copy.sizeFinderUnavailable, { size: ideal, nearest: pick })}
                  </p>
                ) : null}
              </div>
              {isInStock(pick) ? (
                <button
                  type="button"
                  onClick={() => onChoose(pick)}
                  className="btn-primary !px-4 !py-2 !text-[0.62rem]"
                >
                  {t(copy.sizeFinderSelect, { size: pick })}
                </button>
              ) : null}
            </div>
          ) : null}

          <table className="mt-4 w-full border-t border-border/60 pt-3 text-xs tabular-nums">
            <tbody>
              <tr>
                <th
                  scope="row"
                  className="py-1.5 pr-3 text-left font-medium text-muted"
                >
                  {copy.sizeFinderOurs}
                </th>
                {sorted.map((value) => (
                  <td key={value} className="px-1 py-1.5 text-center font-medium">
                    {value}
                  </td>
                ))}
              </tr>
              <tr>
                <th
                  scope="row"
                  className="py-1.5 pr-3 text-left font-medium text-muted"
                >
                  {copy.sizeFinderEu}
                </th>
                {sorted.map((value) => {
                  const size = normalizeSize(value);
                  const eu = size ? EU_EQUIVALENT[size] : undefined;
                  return (
                    <td key={value} className="px-1 py-1.5 text-center font-light text-muted">
                      {eu ? (
                        <>
                          {eu.letter}
                          <span className="block text-[0.62rem]">{eu.number}</span>
                        </>
                      ) : (
                        "–"
                      )}
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}

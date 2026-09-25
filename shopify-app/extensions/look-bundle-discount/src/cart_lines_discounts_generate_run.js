import { completeLookLines, mondayOf } from "./looks.js";

/**
 * @typedef {import("../generated/api").CartInput} RunInput
 * @typedef {import("../generated/api").CartLinesDiscountsGenerateRunResult} CartLinesDiscountsGenerateRunResult
 */

const NO_DISCOUNT = { operations: [] };

/**
 * "Veckans look": a percentage off every line of a complete weekly look.
 *
 * @param {RunInput} input
 * @returns {CartLinesDiscountsGenerateRunResult}
 */
export function cartLinesDiscountsGenerateRun(input) {
  if (!input.discount.discountClasses.includes("PRODUCT")) return NO_DISCOUNT;

  const config = input.discount.metafield?.jsonValue;
  const percent = Number(config?.percent);
  if (!config?.weeks || !(percent > 0)) return NO_DISCOUNT;

  const looks = config.weeks[mondayOf(input.shop.localTime.date)];
  const lineIds = completeLookLines(input.cart.lines, looks);
  if (lineIds.length === 0) return NO_DISCOUNT;

  return {
    operations: [
      {
        productDiscountsAdd: {
          candidates: [
            {
              message: config.message || `Veckans look −${percent}%`,
              targets: lineIds.map((id) => ({ cartLine: { id } })),
              value: { percentage: { value: percent } },
            },
          ],
          selectionStrategy: "FIRST",
        },
      },
    ],
  };
}

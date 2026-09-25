import assert from "node:assert/strict";
import { test } from "node:test";
import { cartLinesDiscountsGenerateRun } from "../src/cart_lines_discounts_generate_run.js";
import { completeLookLines, mondayOf } from "../src/looks.js";

const P = (n) => `gid://shopify/Product/${n}`;
const line = (id, product) => ({ id, merchandise: { product: { id: P(product) } } });

const config = {
  percent: 10,
  message: "Veckans look −10%",
  weeks: { "2026-09-28": [[P(1), P(2), P(3)], [P(7), P(8), P(9)]] },
};

function input(lines, date = "2026-10-01", classes = ["PRODUCT"]) {
  return {
    cart: { lines },
    shop: { localTime: { date } },
    discount: { discountClasses: classes, metafield: { jsonValue: config } },
  };
}

test("mondayOf maps every weekday to its Monday", () => {
  assert.equal(mondayOf("2026-09-28"), "2026-09-28");
  assert.equal(mondayOf("2026-10-01"), "2026-09-28");
  assert.equal(mondayOf("2026-10-04"), "2026-09-28");
  assert.equal(mondayOf("2026-10-05"), "2026-10-05");
});

test("a complete look discounts all of its lines, including extra variants", () => {
  const lines = [line("a", 1), line("b", 2), line("c", 3), line("d", 2), line("x", 5)];
  assert.deepEqual(completeLookLines(lines, config.weeks["2026-09-28"]).sort(), [
    "a",
    "b",
    "c",
    "d",
  ]);
});

test("an incomplete look gets nothing", () => {
  const result = cartLinesDiscountsGenerateRun(input([line("a", 1), line("b", 2)]));
  assert.deepEqual(result, { operations: [] });
});

test("complete look → one product discount candidate at the configured percent", () => {
  const result = cartLinesDiscountsGenerateRun(
    input([line("a", 1), line("b", 2), line("c", 3)]),
  );
  const [candidate] = result.operations[0].productDiscountsAdd.candidates;
  assert.equal(candidate.value.percentage.value, 10);
  assert.equal(candidate.message, "Veckans look −10%");
  assert.deepEqual(candidate.targets.map((t) => t.cartLine.id).sort(), ["a", "b", "c"]);
});

test("last week's look no longer qualifies", () => {
  const result = cartLinesDiscountsGenerateRun(
    input([line("a", 1), line("b", 2), line("c", 3)], "2026-10-06"),
  );
  assert.deepEqual(result, { operations: [] });
});

test("no product class or no config → no discount", () => {
  const lines = [line("a", 1), line("b", 2), line("c", 3)];
  assert.deepEqual(cartLinesDiscountsGenerateRun(input(lines, "2026-10-01", ["ORDER"])), {
    operations: [],
  });
  const withoutConfig = input(lines);
  withoutConfig.discount.metafield = null;
  assert.deepEqual(cartLinesDiscountsGenerateRun(withoutConfig), { operations: [] });
});

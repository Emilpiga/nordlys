/**
 * Pure look matching, shared by the function entry point and the tests.
 *
 * Config (the discount's `$app:looks` metafield, written by the planner at
 * vardagsstil.se/shopify-admin):
 *   { percent: 10, message: "Veckans look −10%",
 *     weeks: { "2026-09-28": [["gid://shopify/Product/1", ...], ...] } }
 */

const DAY_MS = 24 * 60 * 60 * 1000;

/** Monday (YYYY-MM-DD) of the week containing `date` (YYYY-MM-DD). */
export function mondayOf(date) {
  const day = new Date(`${date}T00:00:00Z`);
  const sinceMonday = (day.getUTCDay() + 6) % 7;
  return new Date(day.getTime() - sinceMonday * DAY_MS)
    .toISOString()
    .slice(0, 10);
}

/**
 * Cart line ids that belong to a complete look this week. A look counts only
 * when every one of its products is in the cart.
 */
export function completeLookLines(lines, looks) {
  const linesByProduct = new Map();
  for (const line of lines) {
    const productId = line.merchandise?.product?.id;
    if (!productId) continue;
    const ids = linesByProduct.get(productId) ?? [];
    ids.push(line.id);
    linesByProduct.set(productId, ids);
  }

  const targets = new Set();
  for (const look of looks ?? []) {
    if (!Array.isArray(look) || look.length === 0) continue;
    if (!look.every((productId) => linesByProduct.has(productId))) continue;
    for (const productId of look) {
      for (const lineId of linesByProduct.get(productId)) targets.add(lineId);
    }
  }
  return [...targets];
}

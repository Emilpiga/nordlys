/**
 * The automatic weekly pick ("variety"): for each piece in a look, choose a
 * buyable product that isn't featured in nearby weeks — before or after, so a
 * re-roll also respects weeks already planned ahead. Never-featured products
 * come first, then the ones featured furthest away. Ties are broken by a seed
 * (week + slot), so a re-run gives the same answer and a re-roll a new one.
 */

export type PoolProduct = { id: string; buyable: boolean };

export type PickInput = {
  recipe: string[][];
  /** Collection handle -> products in collection order. */
  pools: Map<string, PoolProduct[]>;
  /** Product id -> weeks to the nearest other week that features it. */
  featuredDistance: Map<string, number>;
  /** A product within this many weeks counts as recently featured. */
  varietyWeeks: number;
  /** Products already used this week (other slots) — never repeat within a week. */
  taken: Set<string>;
  seed: string;
};

function hash(value: string) {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Returns one product id per recipe slot, or null if the look can't be filled. */
export function pickLook(input: PickInput): string[] | null {
  const chosen: string[] = [];
  const used = new Set(input.taken);

  for (const [index, handles] of input.recipe.entries()) {
    let pick: string | null = null;
    for (const handle of handles) {
      const candidates = (input.pools.get(handle) ?? []).filter(
        (product) => product.buyable && !used.has(product.id),
      );
      if (candidates.length === 0) continue;

      const ranked = candidates
        .map((product) => {
          // Never-featured ranks as furthest away.
          const distance =
            input.featuredDistance.get(product.id) ?? Number.MAX_SAFE_INTEGER;
          return {
            id: product.id,
            recent: distance <= input.varietyWeeks,
            distance,
            tiebreak: hash(`${input.seed}:${index}:${product.id}`),
          };
        })
        .sort(
          (a, b) =>
            Number(a.recent) - Number(b.recent) ||
            b.distance - a.distance ||
            a.tiebreak - b.tiebreak,
        );

      pick = ranked[0].id;
      break;
    }
    if (!pick) return null;
    used.add(pick);
    chosen.push(pick);
  }

  return chosen;
}

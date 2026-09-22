import type { TractionBadge, TractionMetrics } from "@/lib/product-traction-types";

export type FeaturedBadgeInput = TractionMetrics;

/**
 * Assign badges relative to the other products in the featured set.
 *
 * - bestseller: sales leaders; on a tie, the 2 most recently *sold* win
 * - trending / in_demand / popular: sole leaders among what's left (ties skipped)
 */
export function assignFeaturedBadges(
  metrics: ReadonlyArray<FeaturedBadgeInput>,
): Map<string, TractionBadge> {
  const badges = new Map<string, TractionBadge>();
  if (metrics.length === 0) return badges;

  const claimed = new Set<string>();

  const claimBestseller = () => {
    const pool = metrics.filter((row) => !claimed.has(row.productId));
    if (pool.length === 0) return;

    let best = -Infinity;
    for (const row of pool) {
      best = Math.max(best, row.sales);
    }
    if (!Number.isFinite(best) || best <= 0) return;

    const leaders = pool.filter((row) => row.sales === best);
    const winners =
      leaders.length === 1
        ? leaders
        : [...leaders]
            .sort((a, b) => b.lastSaleAt - a.lastSaleAt)
            .slice(0, 2);

    for (const winner of winners) {
      claimed.add(winner.productId);
      badges.set(winner.productId, "bestseller");
    }
  };

  const claimUniqueLeader = (
    badge: TractionBadge,
    valueOf: (row: FeaturedBadgeInput) => number,
  ) => {
    const pool = metrics.filter((row) => !claimed.has(row.productId));
    if (pool.length === 0) return;

    let best = -Infinity;
    for (const row of pool) {
      best = Math.max(best, valueOf(row));
    }
    if (!Number.isFinite(best) || best <= 0) return;

    const leaders = pool.filter((row) => valueOf(row) === best);
    if (leaders.length !== 1) return;

    claimed.add(leaders[0].productId);
    badges.set(leaders[0].productId, badge);
  };

  claimBestseller();
  claimUniqueLeader("trending", (row) => row.views);
  claimUniqueLeader("in_demand", (row) => row.carts);
  claimUniqueLeader("popular", (row) => row.score);

  return badges;
}

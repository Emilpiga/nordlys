export type TractionBadge =
  | "bestseller"
  | "trending"
  | "in_demand"
  | "popular";

export type TractionMetrics = {
  productId: string;
  views: number;
  carts: number;
  sales: number;
  score: number;
  /** Epoch ms of the most recent paid sale, when known. */
  lastSaleAt: number;
};

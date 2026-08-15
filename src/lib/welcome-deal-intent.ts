import { stripLocalePrefix } from "@/lib/i18n/locales";

const STORAGE_KEY = "welcome_deal_browse";

export type BrowseKind = "pdp" | "listing" | "cart" | "confirmed" | "other";

type BrowseState = {
  products: string[];
  firstProductAt: number | null;
  listingMs: number;
  listingEnteredAt: number | null;
};

const EMPTY: BrowseState = {
  products: [],
  firstProductAt: null,
  listingMs: 0,
  listingEnteredAt: null,
};

export function classifyBrowsePath(pathname: string): BrowseKind {
  const path = stripLocalePrefix(pathname);
  if (path.startsWith("/order/confirmed")) return "confirmed";
  if (path === "/cart") return "cart";
  if (/^\/products\/[^/]+/.test(path)) return "pdp";
  if (
    path === "/products" ||
    path === "/search" ||
    path.startsWith("/collections/") ||
    path.startsWith("/categories/")
  ) {
    return "listing";
  }
  return "other";
}

function readState(): BrowseState {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...EMPTY };
    const parsed = JSON.parse(raw) as Partial<BrowseState>;
    return {
      products: Array.isArray(parsed.products)
        ? parsed.products.filter((id): id is string => typeof id === "string")
        : [],
      firstProductAt:
        typeof parsed.firstProductAt === "number" ? parsed.firstProductAt : null,
      listingMs: typeof parsed.listingMs === "number" ? parsed.listingMs : 0,
      listingEnteredAt:
        typeof parsed.listingEnteredAt === "number"
          ? parsed.listingEnteredAt
          : null,
    };
  } catch {
    return { ...EMPTY };
  }
}

function writeState(state: BrowseState) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Private mode / blocked storage — keep going with in-memory only.
  }
}

function markFirstProduct(state: BrowseState, now: number) {
  if (state.firstProductAt == null) state.firstProductAt = now;
}

function flushListing(state: BrowseState, now: number) {
  if (state.listingEnteredAt == null) return;
  state.listingMs += Math.max(0, now - state.listingEnteredAt);
  state.listingEnteredAt = null;
}

export function noteWelcomeDealProduct(id: string) {
  if (typeof window === "undefined" || !id) return;
  const now = Date.now();
  const state = readState();
  if (!state.products.includes(id)) state.products.push(id);
  markFirstProduct(state, now);
  writeState(state);
}

export function syncWelcomeDealBrowse(pathname: string) {
  if (typeof window === "undefined") return;
  const now = Date.now();
  const kind = classifyBrowsePath(pathname);
  const state = readState();
  flushListing(state, now);

  if (kind === "pdp") {
    const handle = stripLocalePrefix(pathname).replace(/^\/products\//, "");
    if (handle && !state.products.includes(handle)) state.products.push(handle);
    markFirstProduct(state, now);
  }

  if (kind === "listing") {
    state.listingEnteredAt = now;
  }

  writeState(state);
}

export function hasLookedAtProducts() {
  if (typeof window === "undefined") return false;
  const state = readState();
  const listingNow =
    state.listingEnteredAt == null
      ? 0
      : Math.max(0, Date.now() - state.listingEnteredAt);
  return state.products.length > 0 || state.listingMs + listingNow >= 20_000;
}

/** Browsed products long enough that a checkout decision should have happened. */
export function isHesitatingToCheckout() {
  if (typeof window === "undefined") return false;
  const state = readState();
  if (!hasLookedAtProducts()) return false;

  const now = Date.now();
  const listingNow =
    state.listingEnteredAt == null
      ? 0
      : Math.max(0, now - state.listingEnteredAt);
  const sinceFirst =
    state.firstProductAt == null ? 0 : now - state.firstProductAt;

  return (
    state.products.length >= 2 ||
    sinceFirst >= 25_000 ||
    state.listingMs + listingNow >= 25_000
  );
}

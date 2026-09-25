/**
 * Weeks are keyed by their Monday (YYYY-MM-DD) in the shop's timezone. The
 * discount function derives the same key from Shopify's shop-local date, so
 * all three sides — planner, storefront, checkout — agree on "this week".
 */

const SHOP_TIME_ZONE = "Europe/Stockholm";
const DAY_MS = 24 * 60 * 60 * 1000;

function parseDay(day: string) {
  return new Date(`${day}T00:00:00Z`);
}

function formatDay(date: Date) {
  return date.toISOString().slice(0, 10);
}

/** Today's date in the shop's timezone. */
export function shopToday(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: SHOP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function mondayOf(day: string) {
  const date = parseDay(day);
  const sinceMonday = (date.getUTCDay() + 6) % 7;
  return formatDay(new Date(date.getTime() - sinceMonday * DAY_MS));
}

export function addWeeks(weekStart: string, weeks: number) {
  return formatDay(new Date(parseDay(weekStart).getTime() + weeks * 7 * DAY_MS));
}

export function currentWeekStart(now = new Date()) {
  return mondayOf(shopToday(now));
}

/** ISO-8601 week number, e.g. 40 for the week of 28 Sep 2026. */
export function isoWeekNumber(weekStart: string) {
  const thursday = new Date(parseDay(weekStart).getTime() + 3 * DAY_MS);
  const yearStart = Date.UTC(thursday.getUTCFullYear(), 0, 1);
  return Math.ceil(((thursday.getTime() - yearStart) / DAY_MS + 1) / 7);
}

/** "28 sep – 4 okt" */
export function weekRangeLabel(weekStart: string) {
  const format = new Intl.DateTimeFormat("sv-SE", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
  const start = parseDay(weekStart);
  const end = new Date(start.getTime() + 6 * DAY_MS);
  return `${format.format(start)} – ${format.format(end)}`.replace(/\./g, "");
}

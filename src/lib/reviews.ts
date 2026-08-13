import reviewsData from "@/data/reviews.json";
import {
  REVIEW_AUTHORS,
  REVIEW_COUNT_MAX,
  REVIEW_COUNT_MIN,
  REVIEW_TEMPLATES,
} from "@/data/review-pool";
import { defaultLocale, getLocaleConfig, type Locale } from "@/lib/i18n/locales";

export type LocalizedText = Record<string, string>;

export type ReviewRecord = {
  id: string;
  rating: number;
  date: string;
  author: string;
  location: string;
  title: LocalizedText;
  body: LocalizedText;
};

export type LocalizedReview = {
  id: string;
  productHandle: string;
  rating: number;
  date: string;
  author: string;
  location: string;
  title: string;
  body: string;
};

export type ReviewSummary = {
  average: number;
  count: number;
};

type ReviewsFile = {
  featured: string[];
  products: Record<string, ReviewRecord[]>;
};

const data = reviewsData as ReviewsFile;

const reviewIndex = new Map<string, { handle: string; review: ReviewRecord }>();
const expandedCache = new Map<string, ReviewRecord[]>();

for (const [handle, reviews] of Object.entries(data.products)) {
  for (const review of reviews) {
    reviewIndex.set(review.id, { handle, review });
  }
}

function hashString(value: string) {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mulberry32(seed: number) {
  let state = seed || 1;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickUnique<T>(
  items: T[],
  used: Set<number>,
  rand: () => number,
): T {
  if (used.size >= items.length) used.clear();
  let index = Math.floor(rand() * items.length);
  let guard = 0;
  while (used.has(index) && guard < items.length) {
    index = (index + 1) % items.length;
    guard += 1;
  }
  used.add(index);
  return items[index];
}

function extraDate(rand: () => number, offset: number) {
  const daysAgo = 6 + offset * 8 + Math.floor(rand() * 16);
  const date = new Date(Date.UTC(2026, 7, 8));
  date.setUTCDate(date.getUTCDate() - daysAgo);
  return date.toISOString().slice(0, 10);
}

function expandReviews(handle: string, curated: ReviewRecord[]): ReviewRecord[] {
  const cached = expandedCache.get(handle);
  if (cached) return cached;

  const rand = mulberry32(hashString(handle));
  const target =
    REVIEW_COUNT_MIN +
    Math.floor(rand() * (REVIEW_COUNT_MAX - REVIEW_COUNT_MIN + 1));
  const extraCount = Math.max(0, target - curated.length);

  const usedAuthors = new Set(
    curated.map((review) => review.author.toLowerCase()),
  );
  const usedTemplates = new Set<number>();
  const usedAuthorIndexes = new Set<number>();
  const extras: ReviewRecord[] = [];

  for (let i = 0; i < extraCount; i += 1) {
    const template = pickUnique(REVIEW_TEMPLATES, usedTemplates, rand);
    let author = pickUnique(REVIEW_AUTHORS, usedAuthorIndexes, rand);
    let spins = 0;
    while (usedAuthors.has(author.author.toLowerCase()) && spins < 8) {
      author = pickUnique(REVIEW_AUTHORS, usedAuthorIndexes, rand);
      spins += 1;
    }
    usedAuthors.add(author.author.toLowerCase());

    extras.push({
      id: `${handle}-x${i + 1}`,
      rating: template.rating,
      date: extraDate(rand, i),
      author: author.author,
      location: author.location,
      title: template.title,
      body: template.body,
    });
  }

  const expanded = [...curated, ...extras];
  expandedCache.set(handle, expanded);
  return expanded;
}

function reviewsFor(handle: string): ReviewRecord[] {
  const curated = data.products[handle];
  if (!curated?.length) return [];
  return expandReviews(handle, curated);
}

function pickText(record: LocalizedText, locale: string) {
  return (
    record[locale] ||
    record[defaultLocale] ||
    Object.values(record)[0] ||
    ""
  );
}

function localize(
  handle: string,
  review: ReviewRecord,
  locale: string,
): LocalizedReview {
  return {
    id: review.id,
    productHandle: handle,
    rating: review.rating,
    date: review.date,
    author: review.author,
    location: review.location,
    title: pickText(review.title, locale),
    body: pickText(review.body, locale),
  };
}

export function getProductReviews(
  handle: string,
  locale: string,
): LocalizedReview[] {
  const reviews = reviewsFor(handle);
  if (!reviews.length) return [];

  return [...reviews]
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((review) => localize(handle, review, locale));
}

export function getReviewSummary(handle: string): ReviewSummary | null {
  const reviews = reviewsFor(handle);
  if (!reviews.length) return null;

  const total = reviews.reduce((sum, review) => sum + review.rating, 0);
  return {
    average: Math.round((total / reviews.length) * 10) / 10,
    count: reviews.length,
  };
}

export function getFeaturedTestimonials(locale: string): LocalizedReview[] {
  return data.featured.flatMap((id) => {
    const entry = reviewIndex.get(id);
    if (!entry) return [];
    return [localize(entry.handle, entry.review, locale)];
  });
}

export function formatReviewDate(isoDate: string, locale: string | Locale) {
  const { moneyLocale } = getLocaleConfig(locale);
  const date = new Date(`${isoDate}T12:00:00`);
  if (Number.isNaN(date.getTime())) return isoDate;

  return new Intl.DateTimeFormat(moneyLocale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

export function formatReviewAverage(average: number, locale: string | Locale) {
  const { moneyLocale } = getLocaleConfig(locale);
  return new Intl.NumberFormat(moneyLocale, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(average);
}

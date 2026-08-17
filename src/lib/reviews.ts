import "server-only";

import reviewsData from "@/data/reviews.json";
import { defaultLocale } from "@/lib/i18n/locales";
import {
  formatReviewAverage,
  formatReviewDate,
} from "@/lib/review-format";
import type {
  LocalizedReview,
  LocalizedText,
  ReviewRecord,
  ReviewSummary,
} from "@/lib/review-types";

export { formatReviewAverage, formatReviewDate };
export type {
  LocalizedReview,
  LocalizedText,
  ReviewRecord,
  ReviewSummary,
};

type ReviewsFile = {
  featured: string[];
  products: Record<string, ReviewRecord[]>;
};

/** Seeded review copy stays in `reviews.json` but is hidden on the storefront. */
export const PUBLIC_REVIEWS_ENABLED = false;

const data = reviewsData as ReviewsFile;

const reviewIndex = new Map<string, { handle: string; review: ReviewRecord }>();

for (const [handle, reviews] of Object.entries(data.products)) {
  for (const review of reviews) {
    reviewIndex.set(review.id, { handle, review });
  }
}

function reviewsFor(handle: string): ReviewRecord[] {
  return data.products[handle] ?? [];
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
  if (!PUBLIC_REVIEWS_ENABLED) return [];
  const reviews = reviewsFor(handle);
  if (!reviews.length) return [];

  return [...reviews]
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((review) => localize(handle, review, locale));
}

export function getReviewSummary(handle: string): ReviewSummary | null {
  if (!PUBLIC_REVIEWS_ENABLED) return null;
  const reviews = reviewsFor(handle);
  if (!reviews.length) return null;

  const total = reviews.reduce((sum, review) => sum + review.rating, 0);
  return {
    average: Math.round((total / reviews.length) * 10) / 10,
    count: reviews.length,
  };
}

export function getAllReviewSummaries(): Record<string, ReviewSummary> {
  const summaries: Record<string, ReviewSummary> = {};
  for (const handle of Object.keys(data.products)) {
    const summary = getReviewSummary(handle);
    if (summary) summaries[handle] = summary;
  }
  return summaries;
}

export function getFeaturedTestimonials(locale: string): LocalizedReview[] {
  if (!PUBLIC_REVIEWS_ENABLED) return [];
  return data.featured.flatMap((id) => {
    const entry = reviewIndex.get(id);
    if (!entry) return [];
    return [localize(entry.handle, entry.review, locale)];
  });
}


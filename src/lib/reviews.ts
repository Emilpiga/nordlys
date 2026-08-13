import reviewsData from "@/data/reviews.json";
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

for (const [handle, reviews] of Object.entries(data.products)) {
  for (const review of reviews) {
    reviewIndex.set(review.id, { handle, review });
  }
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
  const reviews = data.products[handle];
  if (!reviews?.length) return [];

  return [...reviews]
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((review) => localize(handle, review, locale));
}

export function getReviewSummary(handle: string): ReviewSummary | null {
  const reviews = data.products[handle];
  if (!reviews?.length) return null;

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

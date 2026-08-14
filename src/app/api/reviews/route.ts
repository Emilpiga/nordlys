import { NextResponse } from "next/server";
import { defaultLocale, isLocale } from "@/lib/i18n/locales";
import {
  getAllReviewSummaries,
  getFeaturedTestimonials,
  getProductReviews,
  getReviewSummary,
} from "@/lib/reviews";

export const runtime = "nodejs";

function localeFrom(request: Request) {
  const { searchParams } = new URL(request.url);
  const value = searchParams.get("locale") ?? defaultLocale;
  return isLocale(value) ? value : defaultLocale;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const locale = localeFrom(request);
  const handle = searchParams.get("handle")?.trim() ?? "";
  const featured = searchParams.get("featured") === "1";

  const body = featured
    ? { testimonials: getFeaturedTestimonials(locale) }
    : handle
      ? {
          summary: getReviewSummary(handle),
          reviews: getProductReviews(handle, locale),
        }
      : { summaries: getAllReviewSummaries() };

  return NextResponse.json(body, {
    headers: {
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}

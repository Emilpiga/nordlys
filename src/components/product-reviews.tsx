import { ReviewStars } from "@/components/review-stars";
import { t } from "@/lib/i18n/interpolate";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import {
  formatReviewAverage,
  formatReviewDate,
  getProductReviews,
  getReviewSummary,
  type LocalizedReview,
} from "@/lib/reviews";

type ProductReviewsProps = {
  handle: string;
  locale: string;
  dict: Dictionary;
};

function ReviewCard({
  review,
  locale,
  starsLabel,
}: {
  review: LocalizedReview;
  locale: string;
  starsLabel: string;
}) {
  return (
    <article className="border-t border-border/70 py-8 first:border-t-0 first:pt-0">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <ReviewStars rating={review.rating} label={starsLabel} size="md" />
        <h3 className="font-display text-xl font-medium tracking-tight">
          {review.title}
        </h3>
      </div>
      <p className="mt-3 max-w-2xl text-base font-light leading-relaxed text-muted">
        {review.body}
      </p>
      <p className="mt-4 text-[0.68rem] font-medium tracking-[0.12em] uppercase text-muted">
        {review.author}
        <span className="mx-1.5 text-border">·</span>
        {review.location}
        <span className="mx-1.5 text-border">·</span>
        {formatReviewDate(review.date, locale)}
      </p>
    </article>
  );
}

export function ProductReviews({ handle, locale, dict }: ProductReviewsProps) {
  const reviews = getProductReviews(handle, locale);
  const summary = getReviewSummary(handle);
  if (!reviews.length || !summary) return null;

  const averageLabel = formatReviewAverage(summary.average, locale);
  const countLabel =
    summary.count === 1
      ? dict.reviews.countOne
      : t(dict.reviews.countMany, { count: summary.count });

  return (
    <section id="reviews" className="scroll-mt-[calc(var(--header-height)+1.5rem)]">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[0.68rem] font-medium tracking-[0.2em] uppercase text-glow">
            {dict.reviews.eyebrow}
          </p>
          <h2 className="mt-3 font-display text-3xl font-medium tracking-tight sm:text-4xl">
            {dict.reviews.title}
          </h2>
        </div>
        <p className="text-sm font-light text-muted">
          {t(dict.reviews.summary, {
            rating: averageLabel,
            count: countLabel,
          })}
        </p>
      </div>

      <div>
        {reviews.map((review) => (
          <ReviewCard
            key={review.id}
            review={review}
            locale={locale}
            starsLabel={t(dict.reviews.starsLabel, { rating: review.rating })}
          />
        ))}
      </div>
    </section>
  );
}

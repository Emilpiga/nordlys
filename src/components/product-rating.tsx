"use client";

import { useDictionary } from "@/components/dictionary-provider";
import { LocaleLink } from "@/components/locale-link";
import { ReviewStars } from "@/components/review-stars";
import {
  formatReviewAverage,
  getReviewSummary,
} from "@/lib/reviews";

type ProductRatingProps = {
  handle: string;
  href?: string;
  size?: "sm" | "md";
  onClick?: () => void;
};

export function ProductRating({
  handle,
  href,
  size = "sm",
  onClick,
}: ProductRatingProps) {
  const { locale, dict, t } = useDictionary();
  const summary = getReviewSummary(handle);
  if (!summary) return null;

  const averageLabel = formatReviewAverage(summary.average, locale);
  const starsLabel = t(dict.reviews.starsLabel, { rating: averageLabel });
  const countLabel =
    summary.count === 1
      ? dict.reviews.countOne
      : t(dict.reviews.countMany, { count: summary.count });

  const content = (
    <>
      <ReviewStars rating={summary.average} label={starsLabel} size={size} />
      <span className="tabular-nums text-foreground/85">{averageLabel}</span>
      <span className="text-muted">· {countLabel}</span>
    </>
  );

  const className =
    "inline-flex items-center gap-1.5 text-[0.72rem] font-medium tracking-[0.04em] text-muted";

  if (href) {
    const isHash = href.startsWith("#");
    if (isHash) {
      return (
        <a
          href={href}
          onClick={onClick}
          className={`${className} transition hover:text-foreground`}
        >
          {content}
        </a>
      );
    }

    return (
      <LocaleLink
        href={href}
        onClick={onClick}
        className={`${className} transition hover:text-foreground`}
      >
        {content}
      </LocaleLink>
    );
  }

  return <span className={className}>{content}</span>;
}

import Image from "next/image";
import { AmbientSection, SectionRule } from "@/components/section";
import { LocaleLink } from "@/components/locale-link";
import { ReviewStars } from "@/components/review-stars";
import { t } from "@/lib/i18n/interpolate";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import { getFeaturedTestimonials } from "@/lib/reviews";
import type { Product } from "@/lib/shopify/types";

type HomeTestimonialsProps = {
  locale: string;
  dict: Dictionary;
  products: Product[];
};

export function HomeTestimonials({
  locale,
  dict,
  products,
}: HomeTestimonialsProps) {
  const testimonials = getFeaturedTestimonials(locale);
  if (testimonials.length === 0) return null;

  const productByHandle = new Map(
    products.map((product) => [product.handle, product]),
  );
  const [featured, ...rest] = testimonials;
  const featuredProduct = productByHandle.get(featured.productHandle) ?? null;
  const featuredImage =
    featuredProduct?.featuredImage ?? featuredProduct?.images[0] ?? null;

  return (
    <>
      <SectionRule />
      <AmbientSection className="mx-auto w-full max-w-6xl px-5 py-20 sm:px-8 sm:py-28">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-end lg:gap-16">
          <div>
            <p className="text-[0.68rem] font-medium tracking-[0.2em] uppercase text-glow">
              {dict.home.testimonialEyebrow}
            </p>
            <h2 className="mt-4 max-w-md font-display text-[1.85rem] font-medium leading-[1.15] tracking-tight sm:text-[2.15rem]">
              {dict.home.testimonialTitle}
            </h2>
            <p className="mt-5 max-w-sm text-base font-light leading-relaxed text-muted">
              {dict.home.testimonialSub}
            </p>
          </div>

          <figure className="relative overflow-hidden border border-border/70 bg-frost/80">
            <div className="grid sm:grid-cols-[7.5rem_minmax(0,1fr)]">
              {featuredImage ? (
                <div className="relative aspect-[4/5] sm:aspect-auto sm:min-h-[12rem]">
                  <Image
                    src={featuredImage.url}
                    alt={featuredImage.altText || featuredProduct?.title || ""}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, 120px"
                  />
                </div>
              ) : null}
              <blockquote className="flex flex-col justify-between px-6 py-7 sm:px-8 sm:py-8">
                <div>
                  <ReviewStars
                    rating={featured.rating}
                    label={t(dict.reviews.starsLabel, {
                      rating: featured.rating,
                    })}
                    size="md"
                  />
                  <p className="mt-4 font-display text-2xl font-medium leading-snug tracking-tight sm:text-[1.65rem]">
                    “{featured.body}”
                  </p>
                </div>
                <figcaption className="mt-6 text-[0.68rem] font-medium tracking-[0.12em] uppercase text-muted">
                  {featured.author}
                  <span className="mx-1.5 text-border">·</span>
                  {featured.location}
                  {featuredProduct ? (
                    <>
                      <span className="mx-1.5 text-border">·</span>
                      <LocaleLink
                        href={`/products/${featuredProduct.handle}#reviews`}
                        className="underline-offset-4 transition hover:text-foreground hover:underline"
                      >
                        {featuredProduct.title}
                      </LocaleLink>
                    </>
                  ) : null}
                </figcaption>
              </blockquote>
            </div>
          </figure>
        </div>

        {rest.length > 0 ? (
          <ul className="mt-10 grid gap-px bg-border/50 sm:grid-cols-2">
            {rest.map((review) => {
              const product = productByHandle.get(review.productHandle) ?? null;

              return (
                <li
                  key={review.id}
                  className="bg-background px-6 py-8 sm:px-8"
                >
                  <ReviewStars
                    rating={review.rating}
                    label={t(dict.reviews.starsLabel, {
                      rating: review.rating,
                    })}
                  />
                  <p className="mt-4 font-display text-xl font-medium leading-snug tracking-tight">
                    “{review.body}”
                  </p>
                  <p className="mt-5 text-[0.68rem] font-medium tracking-[0.12em] uppercase text-muted">
                    {review.author}
                    <span className="mx-1.5 text-border">·</span>
                    {review.location}
                    {product ? (
                      <>
                        <span className="mx-1.5 text-border">·</span>
                        <LocaleLink
                          href={`/products/${product.handle}#reviews`}
                          className="underline-offset-4 transition hover:text-foreground hover:underline"
                        >
                          {product.title}
                        </LocaleLink>
                      </>
                    ) : null}
                  </p>
                </li>
              );
            })}
          </ul>
        ) : null}
      </AmbientSection>
    </>
  );
}

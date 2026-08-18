import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AmbientSection, SectionRule } from "@/components/section";
import { JsonLd } from "@/components/json-ld";
import { ProductCard } from "@/components/product-card";
import { ProductPurchase } from "@/components/product-purchase";
import { ProductRating } from "@/components/product-rating";
import { ProductReviews } from "@/components/product-reviews";
import { ProductViewTracker } from "@/components/product-view-tracker";
import { getCustomerProfile } from "@/lib/customer-account";
import { sanitizeDescriptionHtml } from "@/lib/description";
import { getDictionary, t } from "@/lib/i18n/get-dictionary";
import { isLocale, localePath } from "@/lib/i18n/locales";
import { buildBreadcrumbJsonLd, buildProductJsonLd } from "@/lib/json-ld";
import { getReviewSummary } from "@/lib/reviews";
import { getProductByHandle, getCollectionByHandle, getProducts } from "@/lib/shopify";
import { shopifyConfig } from "@/lib/shopify/config";
import { getSiteUrl } from "@/lib/site-url";
import { primaryCollection } from "@/lib/shopify/collections";
import {
  localeAlternates,
  ogLocaleFor,
  socialMetadata,
} from "@/lib/seo";
import {
  imageAlt,
  meaningfulOptions,
  productMetaDescription,
  productMetaTitle,
} from "@/lib/catalog-seo";

type Props = {
  params: Promise<{ locale: string; handle: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstQuery(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0]?.trim() ?? "";
  return value?.trim() ?? "";
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, handle } = await params;
  if (!isLocale(locale)) return {};

  const product = await getProductByHandle(handle, locale);
  if (!product) return { title: "Produkt" };

  const title = productMetaTitle(product);
  const description = productMetaDescription(
    product,
    `${product.title} från ${shopifyConfig.storeName}.`,
  );
  const image = product.featuredImage ?? product.images[0] ?? null;
  const alternates = localeAlternates(locale, `/products/${product.handle}`);

  return {
    title,
    description,
    alternates,
    ...socialMetadata({
      title: `${title} · ${shopifyConfig.storeName}`,
      description,
      url: alternates.canonical,
      locale: ogLocaleFor(locale),
      type: "website",
      images: image
        ? [
            {
              url: image.url,
              width: image.width,
              height: image.height,
              alt: imageAlt(title, image.altText),
            },
          ]
        : undefined,
    }),
  };
}

export default async function ProductPage({ params, searchParams }: Props) {
  const { locale, handle } = await params;
  if (!isLocale(locale)) notFound();

  const dict = await getDictionary(locale);
  const [product, catalog, customer, query] = await Promise.all([
    getProductByHandle(handle, locale),
    getProducts(8, locale),
    getCustomerProfile(),
    searchParams,
  ]);

  if (!product) notFound();
  const variantParam = firstQuery(query.variant);
  const room = primaryCollection(product.collections);
  const collection = room
    ? await getCollectionByHandle(room.handle, locale)
    : null;

  const wishlistSaved = Boolean(
    customer?.wishlistProductIds.includes(product.id),
  );
  const gallery =
    product.images.length > 0
      ? product.images
      : product.featuredImage
        ? [product.featuredImage]
        : [];

  const related = (collection?.products ?? catalog)
    .filter((item) => item.id !== product.id)
    .slice(0, 4);

  const detailsHtml = sanitizeDescriptionHtml(product.descriptionHtml);
  const plainDescription = product.description.replace(/\s+/g, " ").trim();
  const specs = meaningfulOptions(product.options);
  const parentHref = room
    ? localePath(locale, `/collections/${encodeURIComponent(room.handle)}`)
    : localePath(locale, "/products");
  const parentLabel = room ? `← ${room.title}` : dict.products.backToShop;
  const relatedHref = room ? parentHref : localePath(locale, "/products");
  const relatedTitle = room
    ? t(dict.products.relatedInCollection, { title: room.title })
    : dict.products.relatedTitle;
  const relatedAll = room ? room.title : dict.products.relatedAll;
  const site = getSiteUrl();
  const productUrl = `${site}${localePath(locale, `/products/${product.handle}`)}`;
  const breadcrumb = [
    {
      name: dict.products.shopTitle,
      url: `${site}${localePath(locale, "/products")}`,
    },
    ...(room
      ? [{ name: room.title, url: `${site}${parentHref}` }]
      : []),
    { name: product.title, url: productUrl },
  ];

  return (
    <div>
      <JsonLd
        data={[
          buildProductJsonLd(product, locale),
          buildBreadcrumbJsonLd(breadcrumb),
        ]}
      />
      <ProductViewTracker product={product} variantId={variantParam} />
      <div className="mx-auto w-full max-w-6xl px-5 pt-12 sm:px-8 sm:pt-16">
        <Link
          href={parentHref}
          className="text-[0.68rem] font-medium tracking-[0.16em] uppercase text-muted transition hover:text-foreground"
        >
          {parentLabel}
        </Link>
      </div>

      <ProductPurchase
        product={product}
        gallery={gallery}
        initialVariantId={variantParam}
        wishlistSaved={wishlistSaved}
        header={
          <>
            <p className="text-[0.68rem] font-medium tracking-[0.2em] uppercase text-glow">
              {room ? (
                <>
                  {shopifyConfig.storeName}
                  {" · "}
                  <Link
                    href={parentHref}
                    className="underline-offset-4 transition hover:text-foreground hover:underline"
                  >
                    {room.title}
                  </Link>
                </>
              ) : product.category ? (
                <>
                  {shopifyConfig.storeName}
                  {" · "}
                  {product.category.name}
                </>
              ) : (
                <>
                  {shopifyConfig.storeName} · {dict.products.fallbackCategory}
                </>
              )}
            </p>
            <h1 className="mt-4 font-display text-[2.75rem] font-medium leading-[1.05] tracking-tight sm:text-6xl">
              {product.title}
            </h1>
            <div className="mt-4">
              <ProductRating
                handle={product.handle}
                href="#reviews"
                size="md"
              />
            </div>
            {detailsHtml ? (
              <div
                className="product-description mt-5 max-w-md text-base font-light leading-relaxed text-muted"
                dangerouslySetInnerHTML={{ __html: detailsHtml }}
              />
            ) : plainDescription ? (
              <p className="mt-5 max-w-md text-base font-light leading-relaxed text-muted">
                {plainDescription}
              </p>
            ) : (
              <p className="mt-5 max-w-md text-base font-light leading-relaxed text-muted">
                {dict.products.fallbackDescription}
              </p>
            )}
          </>
        }
        footer={
          <dl className="mt-10 grid gap-5 border-t border-border/70 pt-8 text-sm">
            {specs.map((spec) => (
              <div key={spec.name}>
                <dt className="text-[0.68rem] font-medium tracking-[0.16em] uppercase text-muted">
                  {spec.name}
                </dt>
                <dd className="mt-1.5 font-light text-foreground">
                  {spec.values.join(" · ")}
                </dd>
              </div>
            ))}
            <div>
              <dt className="text-[0.68rem] font-medium tracking-[0.16em] uppercase text-muted">
                {dict.products.shippingLabel}
              </dt>
              <dd className="mt-1.5 font-light text-foreground">
                <Link
                  href={localePath(locale, "/returns")}
                  className="underline-offset-4 transition hover:text-accent hover:underline"
                >
                  {t(dict.products.shippingValue, {
                    processing: dict.fulfillment.processingShort,
                  })}
                </Link>
              </dd>
            </div>
            <div>
              <dt className="text-[0.68rem] font-medium tracking-[0.16em] uppercase text-muted">
                {dict.products.careLabel}
              </dt>
              <dd className="mt-1.5 font-light text-foreground">
                {dict.products.careValue}
              </dd>
            </div>
            <div>
              <dt className="text-[0.68rem] font-medium tracking-[0.16em] uppercase text-muted">
                {dict.products.questionsLabel}
              </dt>
              <dd className="mt-1.5 font-light text-foreground">
                <Link
                  href={localePath(locale, "/faq")}
                  className="underline-offset-4 transition hover:text-accent hover:underline"
                >
                  {dict.products.faqLink}
                </Link>
                {" · "}
                <Link
                  href={localePath(locale, "/contact")}
                  className="underline-offset-4 transition hover:text-accent hover:underline"
                >
                  {dict.products.contactLink}
                </Link>
              </dd>
            </div>
          </dl>
        }
      />

      {getReviewSummary(product.handle) ? (
        <>
          <SectionRule />
          <AmbientSection className="mx-auto w-full max-w-6xl px-5 py-20 sm:px-8 sm:py-24">
            <ProductReviews
              handle={product.handle}
              locale={locale}
              dict={dict}
            />
          </AmbientSection>
        </>
      ) : null}

      {related.length > 0 ? (
        <>
          <SectionRule />
          <AmbientSection className="mx-auto w-full max-w-6xl px-5 py-20 sm:px-8 sm:py-24">
            <div className="mb-10 flex items-end justify-between gap-4">
              <h2 className="font-display text-3xl font-medium tracking-tight sm:text-4xl">
                {relatedTitle}
              </h2>
              <Link
                href={relatedHref}
                className="hidden text-[0.68rem] font-medium tracking-[0.16em] uppercase text-muted transition hover:text-foreground sm:inline"
              >
                {relatedAll}
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-4 lg:gap-x-7">
              {related.map((item) => (
                <ProductCard key={item.id} product={item} />
              ))}
            </div>
          </AmbientSection>
        </>
      ) : null}
    </div>
  );
}

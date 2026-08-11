import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AmbientSection, SectionRule } from "@/components/section";
import { JsonLd } from "@/components/json-ld";
import { ProductCard } from "@/components/product-card";
import { ProductPurchase } from "@/components/product-purchase";
import { ProductViewTracker } from "@/components/product-view-tracker";
import { sanitizeDescriptionHtml } from "@/lib/description";
import { getDictionary, t } from "@/lib/i18n/get-dictionary";
import { isLocale, localePath } from "@/lib/i18n/locales";
import { buildProductJsonLd } from "@/lib/json-ld";
import { getProductByHandle, getProducts } from "@/lib/shopify";
import { shopifyConfig } from "@/lib/shopify/config";
import {
  localeAlternates,
  ogLocaleFor,
  socialMetadata,
} from "@/lib/seo";
import { categoryParamFromId } from "@/lib/shopify/taxonomy";

type Props = { params: Promise<{ locale: string; handle: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, handle } = await params;
  if (!isLocale(locale)) return {};

  const product = await getProductByHandle(handle, locale);
  if (!product) return { title: "Produkt" };

  const description =
    product.description.replace(/\s+/g, " ").trim().slice(0, 160) ||
    `${product.title} från ${shopifyConfig.storeName}.`;
  const image = product.featuredImage ?? product.images[0] ?? null;
  const title = product.title;
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
              alt: image.altText || title,
            },
          ]
        : undefined,
    }),
  };
}

export default async function ProductPage({ params }: Props) {
  const { locale, handle } = await params;
  if (!isLocale(locale)) notFound();

  const dict = await getDictionary(locale);
  const [product, catalog] = await Promise.all([
    getProductByHandle(handle, locale),
    getProducts(8, locale),
  ]);

  if (!product) notFound();

  const gallery =
    product.images.length > 0
      ? product.images
      : product.featuredImage
        ? [product.featuredImage]
        : [];

  const related = catalog
    .filter((item) => item.id !== product.id)
    .slice(0, 4);

  const detailsHtml = sanitizeDescriptionHtml(product.descriptionHtml);
  const plainDescription = product.description.replace(/\s+/g, " ").trim();
  const categoryHref = product.category
    ? localePath(
        locale,
        `/categories/${encodeURIComponent(categoryParamFromId(product.category.id))}`,
      )
    : null;

  return (
    <div>
      <JsonLd data={buildProductJsonLd(product, locale)} />
      <ProductViewTracker product={product} />
      <div className="mx-auto w-full max-w-6xl px-5 pt-28 sm:px-8 sm:pt-32">
        <Link
          href={localePath(locale, "/products")}
          className="text-[0.68rem] font-medium tracking-[0.16em] uppercase text-muted transition hover:text-foreground"
        >
          {dict.products.backToShop}
        </Link>
      </div>

      <ProductPurchase
        product={product}
        gallery={gallery}
        header={
          <>
            <p className="text-[0.68rem] font-medium tracking-[0.2em] uppercase text-glow">
              {product.category ? (
                <>
                  {shopifyConfig.storeName}
                  {" · "}
                  {categoryHref ? (
                    <Link
                      href={categoryHref}
                      className="underline-offset-4 transition hover:text-foreground hover:underline"
                    >
                      {product.category.name}
                    </Link>
                  ) : (
                    product.category.name
                  )}
                </>
              ) : (
                <>
                  {shopifyConfig.storeName} ·{" "}
                  {dict.products.lightingFallbackCategory}
                </>
              )}
            </p>
            <h1 className="mt-4 font-display text-[2.75rem] font-medium leading-[1.05] tracking-tight sm:text-6xl">
              {product.title}
            </h1>
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
                    eta: dict.fulfillment.etaShort,
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

      {related.length > 0 ? (
        <>
          <SectionRule />
          <AmbientSection className="mx-auto w-full max-w-6xl px-5 py-20 sm:px-8 sm:py-24">
            <div className="mb-10 flex items-end justify-between gap-4">
              <h2 className="font-display text-3xl font-medium tracking-tight sm:text-4xl">
                {dict.products.relatedTitle}
              </h2>
              <Link
                href={localePath(locale, "/products")}
                className="hidden text-[0.68rem] font-medium tracking-[0.16em] uppercase text-muted transition hover:text-foreground sm:inline"
              >
                {dict.products.relatedAll}
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

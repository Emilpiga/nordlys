import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCartAction } from "@/app/actions/cart";
import { CartView } from "@/components/cart-view";
import { ProductCard } from "@/components/product-card";
import { getDictionary, t } from "@/lib/i18n/get-dictionary";
import { isLocale, localePath } from "@/lib/i18n/locales";
import { getProducts } from "@/lib/shopify";
import { shopifyConfig } from "@/lib/shopify/config";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};

  const dict = await getDictionary(locale);

  return {
    title: dict.cart.title,
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function CartPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dict = await getDictionary(locale);
  const [cart, products] = await Promise.all([
    getCartAction(),
    getProducts(4, locale),
  ]);
  const isEmpty = !cart || cart.totalQuantity === 0;
  const itemLabel =
    !isEmpty && cart.totalQuantity === 1
      ? dict.cart.itemOne
      : !isEmpty
        ? t(dict.cart.itemMany, { count: cart.totalQuantity })
        : null;

  return (
    <div>
      <div className="mx-auto w-full max-w-6xl px-5 pt-28 sm:px-8 sm:pt-32">
        <p className="text-[0.68rem] font-medium tracking-[0.2em] uppercase text-glow">
          {t(dict.cart.eyebrow, { brand: shopifyConfig.storeName })}
        </p>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <h1 className="font-display text-5xl font-medium tracking-tight sm:text-6xl">
            {dict.cart.title}
          </h1>
          {itemLabel ? (
            <p className="pb-1 text-[0.68rem] font-medium tracking-[0.16em] uppercase text-muted">
              {itemLabel}
            </p>
          ) : null}
        </div>
      </div>

      {isEmpty ? (
        <section className="mx-auto w-full max-w-6xl px-5 py-14 sm:px-8 sm:py-20">
          <div className="relative overflow-hidden bg-[linear-gradient(145deg,#e5ddd2_0%,#efeae3_48%,#e8e0d4_100%)] px-6 py-20 text-center sm:px-10 sm:py-28">
            <p className="animate-rise font-display text-4xl font-medium tracking-tight sm:text-5xl">
              {dict.cart.emptyTitle}
            </p>
            <p className="animate-rise delay-1 mx-auto mt-4 max-w-md text-base font-light leading-relaxed text-muted">
              {dict.cart.emptyBody}
            </p>
            <div className="animate-rise delay-2 mt-9">
              <Link
                href={localePath(locale, "/products")}
                className="btn-primary"
              >
                {dict.cart.emptyCta}
              </Link>
            </div>
          </div>

          {products.length > 0 ? (
            <div className="mt-20">
              <h2 className="font-display text-3xl font-medium tracking-tight sm:text-4xl">
                {dict.cart.startWith}
              </h2>
              <div className="mt-10 grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-4 lg:gap-x-7">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          ) : null}
        </section>
      ) : (
        <section className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
          <CartView cart={cart} />
          <div className="mt-10">
            <Link
              href={localePath(locale, "/products")}
              className="text-[0.68rem] font-medium tracking-[0.16em] uppercase text-muted transition hover:text-foreground"
            >
              {dict.cart.continueShopping}
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}

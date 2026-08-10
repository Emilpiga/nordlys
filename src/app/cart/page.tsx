import type { Metadata } from "next";
import Link from "next/link";
import { getCartAction } from "@/app/actions/cart";
import { CartView } from "@/components/cart-view";
import { ProductCard } from "@/components/product-card";
import { getProducts } from "@/lib/shopify";
import { shopifyConfig } from "@/lib/shopify/config";

export const metadata: Metadata = {
  title: "Bag",
};

export default async function CartPage() {
  const [cart, products] = await Promise.all([
    getCartAction(),
    getProducts(4),
  ]);
  const isEmpty = !cart || cart.totalQuantity === 0;
  const itemLabel =
    !isEmpty && cart.totalQuantity === 1
      ? "1 item"
      : !isEmpty
        ? `${cart.totalQuantity} items`
        : null;

  return (
    <div>
      <div className="mx-auto w-full max-w-6xl px-5 pt-28 sm:px-8 sm:pt-32">
        <p className="text-[0.68rem] font-medium tracking-[0.2em] uppercase text-blush">
          {shopifyConfig.storeName}
        </p>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <h1 className="font-display text-5xl font-medium tracking-tight sm:text-6xl">
            Your bag
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
          <div className="relative overflow-hidden bg-[linear-gradient(145deg,#d5e0e4_0%,#e8eef1_48%,#ddd4d0_100%)] px-6 py-20 text-center sm:px-10 sm:py-28">
            <p className="animate-rise font-display text-4xl font-medium tracking-tight sm:text-5xl">
              Nothing here yet
            </p>
            <p className="animate-rise delay-1 mx-auto mt-4 max-w-md text-base font-light leading-relaxed text-muted">
              Build a small ritual — cleanser, moisture, something soft for the
              evening.
            </p>
            <div className="animate-rise delay-2 mt-9">
              <Link
                href="/products"
                className="btn-primary"
              >
                Browse the collection
              </Link>
            </div>
          </div>

          {products.length > 0 ? (
            <div className="mt-20">
              <h2 className="font-display text-3xl font-medium tracking-tight sm:text-4xl">
                Start with these
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
              href="/products"
              className="text-[0.68rem] font-medium tracking-[0.16em] uppercase text-muted transition hover:text-foreground"
            >
              ← Continue shopping
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}

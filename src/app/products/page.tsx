import type { Metadata } from "next";
import { EmptyCatalog } from "@/components/setup-banner";
import { ProductCard } from "@/components/product-card";
import { getProducts } from "@/lib/shopify";

export const metadata: Metadata = {
  title: "Shoppa",
};

export default async function ProductsPage() {
  const products = await getProducts(48);

  return (
    <div className="mx-auto w-full max-w-6xl px-5 pb-14 pt-28 sm:px-8 sm:pb-20 sm:pt-32">
      <div className="mb-12 max-w-xl">
        <h1 className="font-display text-5xl font-medium tracking-tight sm:text-6xl">
          Shoppa
        </h1>
        <p className="mt-4 text-base font-light leading-relaxed text-muted">
          Vardaglig hudvård med nordisk stillhet — fukt, klarhet och mjuk hy.
        </p>
      </div>

      {products.length === 0 ? (
        <EmptyCatalog />
      ) : (
        <div className="grid grid-cols-2 gap-x-5 gap-y-12 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-7">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}

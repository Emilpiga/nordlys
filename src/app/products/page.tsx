import type { Metadata } from "next";
import { CategoryChips } from "@/components/category-chips";
import { EmptyCatalog } from "@/components/setup-banner";
import { ProductCard } from "@/components/product-card";
import { getProducts } from "@/lib/shopify";
import { shopifyConfig } from "@/lib/shopify/config";
import { socialMetadata } from "@/lib/seo";
import { getSiteUrl } from "@/lib/site-url";
import { categoriesFromProducts } from "@/lib/shopify/taxonomy";

const shopDescription =
  "Vardaglig hudvård med nordisk stillhet — fukt, klarhet och mjuk hy.";

export const metadata: Metadata = {
  title: "Shoppa",
  description: shopDescription,
  ...socialMetadata({
    title: `Shoppa · ${shopifyConfig.storeName}`,
    description: shopDescription,
    url: `${getSiteUrl()}/products`,
  }),
};

export default async function ProductsPage() {
  const products = await getProducts(100);
  const categories = categoriesFromProducts(products);

  return (
    <div className="mx-auto w-full max-w-6xl px-5 pb-14 pt-28 sm:px-8 sm:pb-20 sm:pt-32">
      <div className="mb-8 max-w-xl">
        <h1 className="font-display text-5xl font-medium tracking-tight sm:text-6xl">
          Shoppa
        </h1>
        <p className="mt-4 text-base font-light leading-relaxed text-muted">
          Vardaglig hudvård med nordisk stillhet — fukt, klarhet och mjuk hy.
        </p>
      </div>

      <div className="mb-12">
        <CategoryChips categories={categories} allCount={products.length} />
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

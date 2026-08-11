import Image from "next/image";
import { AmbientSection, SectionRule } from "@/components/section";
import { EmptyCatalog } from "@/components/setup-banner";
import { HomeHero } from "@/components/home-hero";
import { ProductCard } from "@/components/product-card";
import { getProducts } from "@/lib/shopify";
import { isShopifyConfigured, shopifyConfig } from "@/lib/shopify/config";

export default async function HomePage() {
  const products = await getProducts(8);

  return (
    <div>
      <HomeHero storeName={shopifyConfig.storeName} />

      <AmbientSection className="mx-auto w-full max-w-6xl px-5 py-24 sm:px-8 sm:py-32">
        <div className="mb-14 max-w-xl">
          <h2 className="font-display text-4xl font-medium tracking-tight sm:text-5xl">
            The collection
          </h2>
          <p className="mt-3 text-base font-light leading-relaxed text-muted">
            Essentials chosen for everyday care — clean textures, soft scent,
            skin that feels settled.
          </p>
        </div>

        {!isShopifyConfigured() || products.length === 0 ? (
          <EmptyCatalog />
        ) : (
          <div className="grid grid-cols-2 gap-x-5 gap-y-12 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-7">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </AmbientSection>

      <SectionRule />

      <AmbientSection className="mx-auto grid w-full max-w-6xl gap-12 px-5 py-24 sm:px-8 sm:py-32 lg:grid-cols-[0.85fr_1.15fr] lg:items-center lg:gap-16">
        <div>
          <p className="text-[0.68rem] font-medium tracking-[0.2em] uppercase text-blush">
            The ritual
          </p>
          <h2 className="mt-4 font-display text-4xl font-medium tracking-tight sm:text-5xl">
            Made for long winters
          </h2>
          <p className="mt-5 max-w-md text-base font-light leading-relaxed text-muted">
            Nordic air asks for moisture, patience, and formulas that do not
            shout. {shopifyConfig.storeName} keeps the ritual simple.
          </p>
        </div>
        <div className="relative min-h-[300px] overflow-hidden rounded-2xl sm:min-h-[420px]">
          <Image
            src="/winter.png"
            alt="Soft skincare ritual in winter light"
            fill
            className="object-cover object-center"
            sizes="(max-width: 1024px) 100vw, 55vw"
          />
        </div>
      </AmbientSection>
    </div>
  );
}

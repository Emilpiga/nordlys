import Image from "next/image";
import Link from "next/link";
import { AmbientSection, SectionRule } from "@/components/section";
import { EmptyCatalog } from "@/components/setup-banner";
import { ProductCard } from "@/components/product-card";
import { SiteLogo } from "@/components/site-logo";
import { getProducts } from "@/lib/shopify";
import { isShopifyConfigured, shopifyConfig } from "@/lib/shopify/config";

export default async function HomePage() {
  const products = await getProducts(8);

  return (
    <div>
      <section className="relative min-h-[100svh] overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/hero.png"
            alt={`${shopifyConfig.storeName} — Nordic skincare ritual`}
            fill
            priority
            className="animate-soft-zoom object-cover object-[center_40%]"
            sizes="100vw"
          />
          <div className="animate-veil absolute inset-0 bg-[linear-gradient(105deg,rgba(238,242,244,0.88)_0%,rgba(238,242,244,0.55)_42%,rgba(215,226,230,0.22)_100%)]" />
          <div className="absolute inset-x-0 bottom-0 h-48 bg-[linear-gradient(180deg,transparent_0%,var(--background)_100%)]" />
        </div>

        <div className="relative mx-auto flex min-h-[100svh] w-full max-w-6xl flex-col justify-end px-5 pb-16 pt-28 sm:px-8 sm:pb-24">
          <SiteLogo size="hero" priority className="animate-rise" />
          <h1 className="animate-rise delay-1 mt-5 max-w-md font-display text-3xl font-medium leading-[1.15] tracking-tight text-foreground sm:text-4xl">
            Skincare for northern light and quiet mornings.
          </h1>
          <p className="animate-rise delay-2 mt-4 max-w-sm text-base font-light leading-relaxed text-muted">
            Soft formulas. Honest ingredients. A calmer glow.
          </p>
          <div className="animate-rise delay-3 mt-9">
            <Link href="/products" className="btn-primary">
              Shop the collection
            </Link>
          </div>
        </div>
      </section>

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
        <div className="relative min-h-[300px] overflow-hidden sm:min-h-[420px]">
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

import Image from "next/image";
import Link from "next/link";
import { categoryParamFromId } from "@/lib/shopify/taxonomy";
import type { ProductCategory } from "@/lib/shopify/types";
import type { ProductImage } from "@/lib/shopify/types";

export type HomeCategory = ProductCategory & {
  image: ProductImage | null;
};

type HomeCategoryGuideProps = {
  categories: HomeCategory[];
};

export function HomeCategoryGuide({ categories }: HomeCategoryGuideProps) {
  if (categories.length === 0) return null;

  return (
    <section className="mx-auto w-full max-w-6xl px-5 py-24 sm:px-8 sm:py-32">
      <div className="mb-12 max-w-xl sm:mb-14">
        <p className="text-[0.68rem] font-medium tracking-[0.2em] uppercase text-glow">
          Hitta rätt
        </p>
        <h2 className="mt-3 font-display text-4xl font-medium tracking-tight sm:text-5xl">
          Ljus efter rum
        </h2>
        <p className="mt-4 text-base font-light leading-relaxed text-muted">
          Börja där du vill sätta stämningen — sedan bygger du vidare i lugn takt.
        </p>
      </div>

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
        {categories.map((category) => {
          const href = `/categories/${encodeURIComponent(categoryParamFromId(category.id))}`;

          return (
            <li key={category.id}>
              <Link
                href={href}
                className="group relative block min-h-[14rem] overflow-hidden rounded-2xl bg-mist sm:min-h-[16rem]"
              >
                {category.image ? (
                  <Image
                    src={category.image.url}
                    alt={category.image.altText || category.name}
                    fill
                    className="object-cover transition duration-[900ms] ease-out group-hover:scale-[1.04]"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                ) : null}
                <div
                  aria-hidden
                  className="absolute inset-0 bg-[linear-gradient(180deg,rgba(20,32,28,0.08)_0%,rgba(20,32,28,0.55)_100%)]"
                />
                <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
                  <p className="font-display text-2xl font-medium tracking-tight text-white sm:text-3xl">
                    {category.name}
                  </p>
                  <p className="mt-1 text-[0.72rem] font-medium tracking-[0.14em] uppercase text-white/75">
                    {category.productCount}{" "}
                    {category.productCount === 1 ? "produkt" : "produkter"}
                  </p>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

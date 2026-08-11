import Image from "next/image";
import Link from "next/link";
import { formatMoney } from "@/lib/format";
import type { Product } from "@/lib/shopify/types";

type ProductCardProps = {
  product: Product;
};

export function ProductCard({ product }: ProductCardProps) {
  const image = product.featuredImage;

  return (
    <Link
      href={`/products/${product.handle}`}
      className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-mist">
        {image ? (
          <Image
            src={image.url}
            alt={image.altText || product.title}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover transition duration-[900ms] ease-out group-hover:scale-[1.035]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted">
            No image
          </div>
        )}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-[rgba(20,32,28,0.06)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-2xl bg-[linear-gradient(180deg,rgba(238,242,244,0.18)_0%,transparent_24%,transparent_70%,rgba(20,32,28,0.10)_100%)]"
        />
      </div>
      <div className="mt-4 space-y-1 px-0.5">
        <h3 className="font-display text-xl font-medium leading-tight tracking-tight transition group-hover:text-accent">
          {product.title}
        </h3>
        <p className="text-sm font-light text-muted">
          {formatMoney(product.priceRange.minVariantPrice)}
        </p>
      </div>
    </Link>
  );
}

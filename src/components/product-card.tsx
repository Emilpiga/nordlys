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
      className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-mist">
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
      </div>
      <div className="mt-4 space-y-1">
        <h3 className="font-display text-xl font-medium leading-tight tracking-tight">
          {product.title}
        </h3>
        <p className="text-sm font-light text-muted">
          {formatMoney(product.priceRange.minVariantPrice)}
        </p>
      </div>
    </Link>
  );
}

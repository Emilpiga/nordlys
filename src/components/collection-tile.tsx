import Image from "@/components/soft-image";
import { LocaleLink } from "@/components/locale-link";
import type { ProductImage } from "@/lib/shopify/types";

export type CollectionTileData = {
  handle: string;
  title: string;
  intro: string;
  image: ProductImage | null;
};

/** Editorial grid cell that sends shoppers on to a related collection. */
export function CollectionTile({
  tile,
  eyebrow,
}: {
  tile: CollectionTileData;
  eyebrow: string;
}) {
  return (
    <LocaleLink
      href={`/collections/${encodeURIComponent(tile.handle)}`}
      className="group relative col-span-2 flex aspect-[8/5] flex-col justify-end overflow-hidden bg-foreground text-frost focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background lg:col-span-1 lg:aspect-auto"
    >
      {tile.image ? (
        <Image
          src={tile.image.url}
          alt=""
          fill
          sizes="(max-width: 1024px) 100vw, 25vw"
          className="object-cover opacity-80 transition duration-[900ms] ease-out group-hover:scale-[1.035] group-hover:opacity-70"
        />
      ) : null}
      <div
        aria-hidden
        className="absolute inset-0 bg-[linear-gradient(180deg,transparent_20%,rgba(20,28,34,0.78)_100%)]"
      />
      <div className="relative p-5 sm:p-6">
        <p className="text-[0.62rem] font-medium tracking-[0.2em] uppercase text-frost/75">
          {eyebrow}
        </p>
        <p className="mt-2 font-display text-2xl font-medium leading-tight tracking-tight">
          {tile.title}
          <span
            aria-hidden
            className="ml-2 inline-block transition-transform duration-300 group-hover:translate-x-1"
          >
            →
          </span>
        </p>
        <p className="mt-2 line-clamp-2 text-sm font-light leading-relaxed text-frost/80">
          {tile.intro}
        </p>
      </div>
    </LocaleLink>
  );
}

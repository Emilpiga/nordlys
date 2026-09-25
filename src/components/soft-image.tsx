"use client";

import NextImage, { type ImageProps } from "next/image";
import { useCallback, useState } from "react";
import shopifyImageLoader from "@/lib/shopify-image-loader";

/** Thumbnails this small gain nothing from a blurred preview. */
const SMALL_PX = 96;

function isSmall(sizes: string | undefined) {
  const px = sizes?.trim().match(/^(\d+)px$/);
  return px ? Number(px[1]) <= SMALL_PX : false;
}

/**
 * `next/image` with an intentional load: a tiny blurred copy of the photo
 * (from Shopify's CDN) holds the space in the right colours, then the real
 * image fades in and sharpens. Preloaded (LCP) images skip the reveal so they
 * paint immediately.
 */
export default function SoftImage({
  className = "",
  onLoad,
  preload,
  priority,
  fill,
  sizes,
  src,
  ...rest
}: ImageProps) {
  const eager = Boolean(preload || priority);
  const [loaded, setLoaded] = useState(eager);

  // Cached images can finish before hydration, so onLoad never fires.
  const ref = useCallback((node: HTMLImageElement | null) => {
    if (node?.complete && node.naturalWidth > 0) setLoaded(true);
  }, []);

  const preview =
    fill && !eager && typeof src === "string" && !isSmall(sizes)
      ? shopifyImageLoader({ src, width: 24, quality: 30 })
      : null;

  return (
    <>
      {preview && preview !== src ? (
        // eslint-disable-next-line @next/next/no-img-element -- a 24px CDN blur, not worth the image pipeline
        <img
          src={preview}
          alt=""
          aria-hidden
          decoding="async"
          className={`soft-image-preview ${loaded ? "is-done" : ""}`}
        />
      ) : null}
      <NextImage
        {...rest}
        ref={ref}
        src={src}
        fill={fill}
        sizes={sizes}
        preload={preload}
        priority={priority}
        data-loaded={loaded ? "" : undefined}
        onLoad={(event) => {
          setLoaded(true);
          onLoad?.(event);
        }}
        className={`soft-image ${className}`}
      />
    </>
  );
}

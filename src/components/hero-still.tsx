"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { HeroImage } from "@/lib/hero-images";

const INTERVAL_MS = 8000;

type HeroStillProps = {
  images: HeroImage[];
};

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function HeroStill({ images }: HeroStillProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (images.length < 2 || prefersReducedMotion()) return;

    const timeout = window.setInterval(() => {
      setIndex((current) => (current + 1) % images.length);
    }, INTERVAL_MS);

    return () => window.clearInterval(timeout);
  }, [images.length]);

  if (images.length === 0) return null;

  return (
    <div className="pointer-events-none absolute inset-0 bg-mist">
      {images.map((image, i) => {
        const active = i === index;

        return (
          <div
            key={`${image.product.id}-${image.url}`}
            className={`absolute inset-0 transition-opacity duration-[1400ms] ease-in-out ${
              active ? "opacity-100" : "opacity-0"
            }`}
          >
            <Image
              src={image.url}
              alt={active ? image.alt : ""}
              fill
              priority={i === 0}
              sizes="100vw"
              className="object-cover object-[center_40%]"
            />
          </div>
        );
      })}
    </div>
  );
}

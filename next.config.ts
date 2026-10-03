import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // PostHog via our own domain so ad blockers don't drop the events.
  async rewrites() {
    return [
      {
        source: "/ingest/static/:path*",
        destination: "https://eu-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/ingest/array/:path*",
        destination: "https://eu-assets.i.posthog.com/array/:path*",
      },
      {
        source: "/ingest/:path*",
        destination: "https://eu.i.posthog.com/:path*",
      },
    ];
  },
  // Retired collections: the Kläder umbrella and the old home categories.
  async redirects() {
    return [
      {
        source:
          "/:locale/collections/:handle(klader|kontor|kok|sovrum|tradgard|vardagsrum)",
        destination: "/:locale/products",
        permanent: true,
      },
    ];
  },
  skipTrailingSlashRedirect: true,
  images: {
    loader: "custom",
    loaderFile: "./src/lib/shopify-image-loader.ts",
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.shopify.com",
      },
      {
        protocol: "https",
        hostname: "cdn.shopifycdn.net",
      },
    ],
  },
};

export default nextConfig;

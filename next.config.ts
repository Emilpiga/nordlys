import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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

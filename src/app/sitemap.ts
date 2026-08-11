import type { MetadataRoute } from "next";
import { locales, localePath } from "@/lib/i18n/locales";
import { getProducts } from "@/lib/shopify";
import { getSiteUrl } from "@/lib/site-url";
import {
  categoriesFromProducts,
  categoryParamFromId,
} from "@/lib/shopify/taxonomy";

export const revalidate = 3600;

const staticPaths = [
  { path: "/", changeFrequency: "weekly" as const, priority: 1 },
  { path: "/products", changeFrequency: "daily" as const, priority: 0.9 },
  { path: "/about", changeFrequency: "monthly" as const, priority: 0.6 },
  { path: "/faq", changeFrequency: "monthly" as const, priority: 0.5 },
  { path: "/contact", changeFrequency: "monthly" as const, priority: 0.5 },
  { path: "/returns", changeFrequency: "monthly" as const, priority: 0.4 },
  { path: "/privacy", changeFrequency: "yearly" as const, priority: 0.3 },
  { path: "/terms", changeFrequency: "yearly" as const, priority: 0.3 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getSiteUrl();
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = locales.flatMap((locale) =>
    staticPaths.map(({ path, changeFrequency, priority }) => ({
      url: `${baseUrl}${localePath(locale, path)}`,
      lastModified: now,
      changeFrequency,
      priority,
    })),
  );

  // Product catalog language does not change handles; use default locale fetch.
  const products = await getProducts(250);
  const categories = categoriesFromProducts(products);

  const productRoutes: MetadataRoute.Sitemap = locales.flatMap((locale) =>
    products.map((product) => ({
      url: `${baseUrl}${localePath(locale, `/products/${product.handle}`)}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  );

  const categoryRoutes: MetadataRoute.Sitemap = locales.flatMap((locale) =>
    categories.map((category) => ({
      url: `${baseUrl}${localePath(
        locale,
        `/categories/${encodeURIComponent(categoryParamFromId(category.id))}`,
      )}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  );

  return [...staticRoutes, ...productRoutes, ...categoryRoutes];
}

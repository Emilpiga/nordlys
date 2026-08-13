/**
 * Public site origin for sitemap, robots, and absolute metadata URLs.
 * Prefer NEXT_PUBLIC_SITE_URL in production — must match the live canonical host
 * exactly (including www), e.g. https://www.vardagsstil.se not https://vardagsstil.se.
 */
export function getSiteUrl() {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  if (explicit) return explicit;

  const vercelProduction = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercelProduction) {
    return `https://${vercelProduction.replace(/^https?:\/\//, "")}`;
  }

  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    return `https://${vercel.replace(/^https?:\/\//, "")}`;
  }

  return "http://localhost:3000";
}

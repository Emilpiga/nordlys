export const BRAND_INK = "#1a1814";
export const BRAND_CREAM = "#f7f5f1";
export const BRAND_PAPER = "#f1eee8";
export const BRAND_MUTED = "#6a655c";

/** Rounded square + geometric V. viewBox 0 0 64 64. */
export const BRAND_MARK_V_PATH =
  "M16 16.5 32 46 48 16.5h-7.2L32 35.2 23.2 16.5Z";

export function splitBrandName(name: string) {
  const match = name.match(/^(.*?)(\.[a-z]{2,})$/i);
  if (!match) return { main: name, tld: "" };
  return { main: match[1], tld: match[2] };
}

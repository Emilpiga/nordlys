/**
 * Shopify/CJ description HTML often embeds long stacks of supplier images.
 * Keep copy and basic formatting; drop media so the PDP stays editorial.
 */
export function sanitizeDescriptionHtml(html: string): string {
  if (!html.trim()) return "";

  let cleaned = html
    // Media and common wrapper noise from supplier descriptions
    .replace(/<img\b[^>]*>/gi, "")
    .replace(/<picture\b[^>]*>[\s\S]*?<\/picture>/gi, "")
    .replace(/<figure\b[^>]*>[\s\S]*?<\/figure>/gi, "")
    .replace(/<video\b[^>]*>[\s\S]*?<\/video>/gi, "")
    .replace(/<iframe\b[^>]*>[\s\S]*?<\/iframe>/gi, "")
    .replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/gi, "")
    // Empty paragraphs / divs left behind after stripping images
    .replace(/<(p|div|span)([^>]*)>(\s|&nbsp;|<br\s*\/?>)*<\/\1>/gi, "")
    .replace(/(<br\s*\/?>\s*){3,}/gi, "<br /><br />")
    .trim();

  // If almost nothing textual remains, fall back to empty
  const textOnly = cleaned
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (textOnly.length < 12) return "";

  return cleaned;
}

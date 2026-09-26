/**
 * Shopify/CJ description HTML often embeds long stacks of supplier images.
 * Keep copy and basic formatting; drop media so the PDP stays editorial.
 */
export function sanitizeDescriptionHtml(html: string): string {
  if (!html.trim()) return "";

  const cleaned = html
    // Media and common wrapper noise from supplier descriptions
    .replace(/<img\b[^>]*>/gi, "")
    .replace(/<picture\b[^>]*>[\s\S]*?<\/picture>/gi, "")
    .replace(/<figure\b[^>]*>[\s\S]*?<\/figure>/gi, "")
    .replace(/<video\b[^>]*>[\s\S]*?<\/video>/gi, "")
    .replace(/<iframe\b[^>]*>[\s\S]*?<\/iframe>/gi, "")
    .replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/gi, "")
    // Copy that repeats the page: "runs small" sits under the size picker and
    // "choose … above" points at the options (sv / nb / da / fi).
    .replace(/<li>(?:(?!<\/li>).)*(?:Asiatisk|Aasialai)(?:(?!<\/li>).)*<\/li>/gi, "")
    .replace(/ ?(?:Asiatisk|Aasialai)\w* \w+(?: ?[,—–][^.<]*)?\./gi, "")
    .replace(/ ?(?:Välj [^.<]*ovan|Velg [^.<]*over|Vælg [^.<]*ovenfor|Valitse [^.<]*yllä)\./g, "")
    .replace(/<p>\s+/gi, "<p>")
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

/**
 * The description's opening paragraph as plain text, for a one-line summary
 * under the title, plus the rest of the HTML. No lead when the description
 * doesn't open with a short paragraph.
 */
export function splitDescriptionLead(html: string): {
  lead: string | null;
  rest: string;
} {
  const match = html.match(/^\s*<p>([\s\S]*?)<\/p>/i);
  if (!match) return { lead: null, rest: html };
  const lead = match[1]
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (lead.length < 20 || lead.length > 240) return { lead: null, rest: html };
  return { lead, rest: html.slice(match[0].length).trim() };
}

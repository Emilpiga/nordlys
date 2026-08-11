export const CONSENT_COOKIE = "nordlys_consent";
export const CONSENT_VERSION = 1;

export type ConsentState = {
  version: number;
  /** Marketing / advertising cookies (Meta, Google Ads). */
  marketing: boolean;
  updatedAt: string;
};

export type ConsentDecision = "accepted" | "rejected";

export function createConsent(marketing: boolean): ConsentState {
  return {
    version: CONSENT_VERSION,
    marketing,
    updatedAt: new Date().toISOString(),
  };
}

export function parseConsent(raw: string | null | undefined): ConsentState | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<ConsentState>;
    if (
      typeof parsed.marketing !== "boolean" ||
      parsed.version !== CONSENT_VERSION
    ) {
      return null;
    }
    return {
      version: CONSENT_VERSION,
      marketing: parsed.marketing,
      updatedAt:
        typeof parsed.updatedAt === "string"
          ? parsed.updatedAt
          : new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export function readConsentFromDocument(): ConsentState | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${CONSENT_COOKIE}=`));
  if (!match) return null;
  return parseConsent(decodeURIComponent(match.split("=").slice(1).join("=")));
}

export function writeConsentToDocument(consent: ConsentState) {
  if (typeof document === "undefined") return;
  const value = encodeURIComponent(JSON.stringify(consent));
  const maxAge = 60 * 60 * 24 * 365;
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${CONSENT_COOKIE}=${value}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
}

export function clearConsentFromDocument() {
  if (typeof document === "undefined") return;
  document.cookie = `${CONSENT_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
}

export function getMarketingPixelConfig() {
  return {
    metaPixelId: process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim() || "",
    /** Facebook App ID for og:fb:app_id (not the same as Pixel ID). */
    facebookAppId: process.env.NEXT_PUBLIC_FACEBOOK_APP_ID?.trim() || "",
    googleAdsId: process.env.NEXT_PUBLIC_GOOGLE_ADS_ID?.trim() || "",
  };
}

export function hasMarketingPixelsConfigured() {
  const { metaPixelId, googleAdsId } = getMarketingPixelConfig();
  return Boolean(metaPixelId || googleAdsId);
}

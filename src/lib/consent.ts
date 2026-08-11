/** Marketing / ads env config (Consent Mode + Google CMP handle runtime consent). */
export function getMarketingPixelConfig() {
  return {
    metaPixelId: process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim() || "",
    /** Facebook App ID for og:fb:app_id (not the same as Pixel ID). */
    facebookAppId: process.env.NEXT_PUBLIC_FACEBOOK_APP_ID?.trim() || "",
    googleAdsId: process.env.NEXT_PUBLIC_GOOGLE_ADS_ID?.trim() || "",
    /** AdSense publisher client id (ca-pub-…). */
    adsenseClientId: process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID?.trim() || "",
  };
}

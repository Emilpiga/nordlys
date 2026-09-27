export {};

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
    _fbq?: (...args: unknown[]) => void;
    __tcfapi?: (
      command: string,
      version: number,
      callback: (...args: never[]) => void,
      ...rest: unknown[]
    ) => void;
    googlefc?: {
      callbackQueue?: unknown[];
    };
    __storeMarketingConsent?: boolean | null;
    __storeSetMarketingConsent?: (granted: boolean) => void;
    /** Shopify Customer Privacy API (consent-tracking-api.js). */
    Shopify?: {
      customerPrivacy?: {
        currentVisitorConsent?: () => Partial<
          Record<"marketing" | "analytics" | "preferences", string>
        >;
        setTrackingConsent?: (
          consent: Record<string, unknown>,
          callback?: (result?: { error?: string } | null) => void,
        ) => void;
      };
    };
  }
}

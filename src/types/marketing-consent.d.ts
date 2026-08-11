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
    __nordlysMarketingConsent?: boolean | null;
    __nordlysSetMarketingConsent?: (granted: boolean) => void;
  }
}

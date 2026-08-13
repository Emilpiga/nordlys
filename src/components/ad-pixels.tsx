import Script from "next/script";
import { getMarketingPixelConfig } from "@/lib/consent";

/**
 * Marketing tags. Consent Mode defaults + Google’s CMP gate personalization;
 * Meta follows via __storeSetMarketingConsent (see ConsentModeBootstrap).
 */
export function AdPixels() {
  const { metaPixelId, googleAdsId, adsenseClientId } =
    getMarketingPixelConfig();

  if (!metaPixelId && !googleAdsId && !adsenseClientId) return null;

  return (
    <>
      {adsenseClientId ? <AdSenseScript clientId={adsenseClientId} /> : null}
      {googleAdsId ? <GoogleAdsTag id={googleAdsId} /> : null}
      {metaPixelId ? <MetaPixel id={metaPixelId} /> : null}
    </>
  );
}

function AdSenseScript({ clientId }: { clientId: string }) {
  return (
    <Script
      id="adsense"
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(clientId)}`}
      crossOrigin="anonymous"
      strategy="afterInteractive"
    />
  );
}

function MetaPixel({ id }: { id: string }) {
  return (
    <Script id="meta-pixel" strategy="afterInteractive">
      {`
        !function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window, document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');
        fbq('consent', 'revoke');
        fbq('init', ${JSON.stringify(id)});
        fbq('track', 'PageView');
        if (typeof window.__storeSetMarketingConsent === 'function' &&
            window.__storeMarketingConsent !== null) {
          window.__storeSetMarketingConsent(window.__storeMarketingConsent);
        }
      `}
    </Script>
  );
}

function GoogleAdsTag({ id }: { id: string }) {
  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`}
        strategy="afterInteractive"
      />
      <Script id="google-ads" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = window.gtag || gtag;
          gtag('js', new Date());
          gtag('config', ${JSON.stringify(id)});
        `}
      </Script>
    </>
  );
}

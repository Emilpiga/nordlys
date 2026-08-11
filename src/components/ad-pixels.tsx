"use client";

import Script from "next/script";
import { useConsent } from "@/components/consent-provider";
import { getMarketingPixelConfig } from "@/lib/consent";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    _fbq?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export function AdPixels() {
  const { ready, marketingAllowed } = useConsent();
  const { metaPixelId, googleAdsId } = getMarketingPixelConfig();

  if (!ready || !marketingAllowed) return null;

  return (
    <>
      {metaPixelId ? <MetaPixel id={metaPixelId} /> : null}
      {googleAdsId ? <GoogleAdsTag id={googleAdsId} /> : null}
    </>
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
        fbq('consent', 'grant');
        fbq('init', ${JSON.stringify(id)});
        fbq('track', 'PageView');
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
          gtag('js', new Date());
          gtag('consent', 'update', {
            ad_storage: 'granted',
            ad_user_data: 'granted',
            ad_personalization: 'granted',
            analytics_storage: 'granted'
          });
          gtag('config', ${JSON.stringify(id)});
        `}
      </Script>
    </>
  );
}

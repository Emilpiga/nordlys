import Script from "next/script";
import { CONSENT_REGIONS } from "@/lib/consent";

/**
 * Google Consent Mode v2 defaults + bridge for Meta Pixel, PostHog and
 * Shopify checkout (`store-consent` window event).
 * Must run before AdSense / gtag / Meta (strategy: beforeInteractive).
 *
 * EEA/UK/CH → denied until the shopper answers the ConsentBanner (or a
 * Google CMP, when AdSense is on). Elsewhere → granted.
 *
 * The answer lives in the `store_consent` cookie and is replayed as a
 * Consent Mode update on every page load.
 *
 * `consentRequired` comes from the visitor's country on the server: only
 * visitors outside those regions may fall back to "granted" when no CMP
 * answers — in the EEA silence stays silence.
 */
export function ConsentModeBootstrap({
  consentRequired,
}: {
  consentRequired: boolean;
}) {
  return (
    <Script id="consent-mode-defaults" strategy="beforeInteractive">
      {`
(function () {
  var consentRequired = ${JSON.stringify(consentRequired)};
  window.dataLayer = window.dataLayer || [];
  function gtag(){ window.dataLayer.push(arguments); }
  window.gtag = gtag;

  window.__storeMarketingConsent = null;
  window.__storeSetMarketingConsent = function (granted) {
    window.__storeMarketingConsent = granted;
    if (typeof window.fbq === "function") {
      window.fbq("consent", granted ? "grant" : "revoke");
    }
    try {
      window.dispatchEvent(new CustomEvent("store-consent", { detail: granted }));
    } catch (e) {}
  };

  var denied = {
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    analytics_storage: "denied"
  };
  var allGranted = {
    ad_storage: "granted",
    ad_user_data: "granted",
    ad_personalization: "granted",
    analytics_storage: "granted"
  };

  // GDPR / UK / CH regions — Google’s AdSense CMP covers these.
  gtag("consent", "default", Object.assign({}, denied, {
    wait_for_update: 500,
    region: ${JSON.stringify(CONSENT_REGIONS)}
  }));
  // Rest of world
  gtag("consent", "default", allGranted);

  var originalPush = window.dataLayer.push.bind(window.dataLayer);
  window.dataLayer.push = function () {
    var result = originalPush.apply(null, arguments);
    try {
      var payload = arguments.length === 1 ? arguments[0] : null;
      if (!payload) return result;
      var cmd = payload[0];
      var action = payload[1];
      var params = payload[2];
      if (cmd === "consent" && action === "update" && params) {
        window.__storeSetMarketingConsent(params.ad_storage === "granted");
      }
    } catch (e) {}
    return result;
  };

  // The shopper's own answer from ConsentBanner, kept for 180 days.
  window.__storeChooseConsent = function (granted) {
    try {
      document.cookie =
        "store_consent=" + (granted ? "granted" : "denied") +
        "; path=/; max-age=15552000; SameSite=Lax" +
        (location.protocol === "https:" ? "; Secure" : "");
    } catch (e) {}
    gtag("consent", "update", granted ? allGranted : denied);
  };
  var saved = /(?:^|; )store_consent=(granted|denied)/.exec(document.cookie);
  if (saved) gtag("consent", "update", saved[1] === "granted" ? allGranted : denied);

  function attachTcf() {
    if (typeof window.__tcfapi !== "function") return false;
    window.__tcfapi("addEventListener", 2, function (tcData, success) {
      if (!success) return;
      if (
        tcData.eventStatus === "tcloaded" ||
        tcData.eventStatus === "useractioncomplete"
      ) {
        var purpose1 = tcData.purpose && tcData.purpose.consents
          ? tcData.purpose.consents[1]
          : false;
        // Outside GDPR regions the CMP reports no purposes — nothing to ask.
        window.__storeSetMarketingConsent(
          tcData.gdprApplies === false || Boolean(purpose1)
        );
      }
    });
    return true;
  }

  window.googlefc = window.googlefc || {};
  window.googlefc.callbackQueue = window.googlefc.callbackQueue || [];
  window.googlefc.callbackQueue.push({
    CONSENT_DATA_READY: function () {
      attachTcf();
    }
  });

  // Non-regulated regions never get a banner — apply granted default after
  // wait. In the EEA only the shopper may answer; until they do, nothing runs.
  setTimeout(function () {
    if (attachTcf()) return;
    if (!consentRequired && window.__storeMarketingConsent === null) {
      window.__storeSetMarketingConsent(true);
    }
  }, 1200);
})();
      `}
    </Script>
  );
}

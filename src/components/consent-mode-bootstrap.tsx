import Script from "next/script";

/**
 * Google Consent Mode v2 defaults + bridge for Meta Pixel.
 * Must run before AdSense / gtag / Meta (strategy: beforeInteractive).
 *
 * EEA/UK/CH → denied until Google’s certified CMP updates consent.
 * Elsewhere → granted (Google CMP is not shown in those regions).
 */
export function ConsentModeBootstrap() {
  return (
    <Script id="consent-mode-defaults" strategy="beforeInteractive">
      {`
(function () {
  window.dataLayer = window.dataLayer || [];
  function gtag(){ window.dataLayer.push(arguments); }
  window.gtag = gtag;

  window.__nordlysMarketingConsent = null;
  window.__nordlysSetMarketingConsent = function (granted) {
    window.__nordlysMarketingConsent = granted;
    if (typeof window.fbq === "function") {
      window.fbq("consent", granted ? "grant" : "revoke");
    }
  };

  var denied = {
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    analytics_storage: "denied",
    wait_for_update: 500
  };
  var granted = {
    ad_storage: "granted",
    ad_user_data: "granted",
    ad_personalization: "granted",
    analytics_storage: "granted"
  };

  // GDPR / UK / CH regions — Google’s AdSense CMP covers these.
  gtag("consent", "default", Object.assign({}, denied, {
    region: [
      "AT","BE","BG","CH","CY","CZ","DE","DK","EE","ES","FI","FR","GB","GR",
      "HR","HU","IE","IS","IT","LI","LT","LU","LV","MT","NL","NO","PL","PT",
      "RO","SE","SI","SK"
    ]
  }));
  // Rest of world
  gtag("consent", "default", granted);

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
        window.__nordlysSetMarketingConsent(params.ad_storage === "granted");
      }
    } catch (e) {}
    return result;
  };

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
        window.__nordlysSetMarketingConsent(Boolean(purpose1));
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

  // Non-regulated regions never get TCF/CMP — apply granted default after wait.
  setTimeout(function () {
    if (attachTcf()) return;
    if (window.__nordlysMarketingConsent === null) {
      window.__nordlysSetMarketingConsent(true);
    }
  }, 1200);
})();
      `}
    </Script>
  );
}

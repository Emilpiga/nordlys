/**
 * Shopify Admin → Settings → Customer events → Custom pixel "Google Ads Purchase"
 * Must be Connected.
 *
 * Google Shopping App Purchase (1):
 *   send_to AW-18391431736/zMJHCLHuw-IcELj028FE
 *
 * Note: Google does not officially support gtag inside Shopify custom pixels.
 * We fire both gtag and the googleadservices conversion beacon so at least
 * one path can register a tag ping on checkout_completed (Shopify thank-you).
 */

const GOOGLE_ADS_ID = "AW-18391431736";
const PURCHASE_LABEL = "zMJHCLHuw-IcELj028FE";
const CONVERSION_ID = "18391431736";

window.dataLayer = window.dataLayer || [];
function gtag() {
  window.dataLayer.push(arguments);
}

const privacy0 =
  typeof init !== "undefined" ? init.customerPrivacy : null;
const marketing0 = Boolean(privacy0 && privacy0.marketingAllowed);
const analytics0 = Boolean(privacy0 && privacy0.analyticsProcessingAllowed);

gtag("consent", "default", {
  ad_storage: marketing0 ? "granted" : "denied",
  ad_user_data: marketing0 ? "granted" : "denied",
  ad_personalization: marketing0 ? "granted" : "denied",
  analytics_storage: analytics0 ? "granted" : "denied",
  wait_for_update: 500,
});

if (
  typeof api !== "undefined" &&
  api.customerPrivacy &&
  typeof api.customerPrivacy.subscribe === "function"
) {
  api.customerPrivacy.subscribe("visitorConsentCollected", function (event) {
    var p = event.customerPrivacy || {};
    var m = Boolean(p.marketingAllowed);
    var a = Boolean(p.analyticsProcessingAllowed);
    gtag("consent", "update", {
      ad_storage: m ? "granted" : "denied",
      ad_user_data: m ? "granted" : "denied",
      ad_personalization: m ? "granted" : "denied",
      analytics_storage: a ? "granted" : "denied",
    });
  });
}

gtag("js", new Date());
gtag("config", GOOGLE_ADS_ID, { allow_enhanced_conversions: true });

var script = document.createElement("script");
script.async = true;
script.src =
  "https://www.googletagmanager.com/gtag/js?id=" +
  encodeURIComponent(GOOGLE_ADS_ID);
document.head.appendChild(script);

function txId(checkout) {
  return (checkout.order && checkout.order.id) || checkout.token || "";
}

/** Image/fetch beacon — often survives custom-pixel sandbox limits better than gtag alone. */
function fireConversionBeacon(value, currency, transactionId) {
  var params = new URLSearchParams({
    label: PURCHASE_LABEL,
    guid: "ON",
    script: "0",
    value: String(value),
    currency_code: currency || "SEK",
  });
  if (transactionId) params.set("oid", String(transactionId));

  var url =
    "https://www.googleadservices.com/pagead/conversion/" +
    CONVERSION_ID +
    "/?" +
    params.toString();

  try {
    var img = new Image(1, 1);
    img.src = url;
  } catch (e) {}

  try {
    fetch(url, { mode: "no-cors", keepalive: true, credentials: "omit" }).catch(
      function () {},
    );
  } catch (e) {}
}

analytics.subscribe("checkout_completed", function (event) {
  var checkout = event.data && event.data.checkout;
  if (!checkout) return;

  var currency =
    checkout.currencyCode ||
    (checkout.totalPrice && checkout.totalPrice.currencyCode) ||
    "SEK";
  var value = Number(
    (checkout.totalPrice && checkout.totalPrice.amount) || 0,
  );
  if (!Number.isFinite(value) || value <= 0) value = 1.0;
  var transactionId = txId(checkout);

  var email = String(checkout.email || "")
    .trim()
    .toLowerCase();
  if (email) {
    gtag("set", "user_data", { email: email });
  }

  gtag("event", "conversion", {
    send_to: GOOGLE_ADS_ID + "/" + PURCHASE_LABEL,
    value: value,
    currency: currency,
    transaction_id: transactionId || undefined,
  });

  fireConversionBeacon(value, currency, transactionId);
});

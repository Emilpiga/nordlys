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
 *
 * The pixel runs in a sandboxed iframe without cookie access, so gtag here
 * cannot see the ad click, and the `gclid` on the checkout URL is gone after
 * a Klarna / Swish / 3-D Secure redirect. The storefront tag keeps the click
 * in `_gcl_aw` / `_gcl_gb` on the root domain checkout shares, and after
 * consent also as `_gclid` / `_gbraid` / `_wbraid` cart attributes; we read
 * those and put them on the beacon ourselves — only when the shopper allowed
 * marketing (the storefront passes its consent on to Shopify, see
 * ShopifyConsentBridge).
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
var consent = {
  marketing: Boolean(privacy0 && privacy0.marketingAllowed),
  analytics: Boolean(privacy0 && privacy0.analyticsProcessingAllowed),
};

gtag("consent", "default", {
  ad_storage: consent.marketing ? "granted" : "denied",
  ad_user_data: consent.marketing ? "granted" : "denied",
  ad_personalization: consent.marketing ? "granted" : "denied",
  analytics_storage: consent.analytics ? "granted" : "denied",
  wait_for_update: 500,
});

if (
  typeof api !== "undefined" &&
  api.customerPrivacy &&
  typeof api.customerPrivacy.subscribe === "function"
) {
  api.customerPrivacy.subscribe("visitorConsentCollected", function (event) {
    var p = event.customerPrivacy || {};
    consent.marketing = Boolean(p.marketingAllowed);
    consent.analytics = Boolean(p.analyticsProcessingAllowed);
    gtag("consent", "update", {
      ad_storage: consent.marketing ? "granted" : "denied",
      ad_user_data: consent.marketing ? "granted" : "denied",
      ad_personalization: consent.marketing ? "granted" : "denied",
      analytics_storage: consent.analytics ? "granted" : "denied",
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

/** URL of the checkout page (top frame), from the event or from pixel init. */
function pageUrl(event) {
  var ctx =
    (event && event.context) ||
    (typeof init !== "undefined" && init.context) ||
    {};
  return (ctx.document && ctx.document.location && ctx.document.location.href) || "";
}

function urlParam(href, name) {
  try {
    return new URL(href).searchParams.get(name) || "";
  } catch (e) {
    return "";
  }
}

/** `_gcl_aw` / `_gcl_gb` hold `GCL.<timestamp>.<click id>[.<labels>]`. */
function gclCookie(name) {
  return browser.cookie
    .get(name)
    .then(function (raw) {
      var parts = String(raw || "").split(".");
      return parts.length >= 3 && parts[0] === "GCL" ? parts[2] : "";
    })
    .catch(function () {
      return "";
    });
}

function attribute(checkout, key) {
  var list = (checkout && checkout.attributes) || [];
  for (var i = 0; i < list.length; i++) {
    if (list[i] && list[i].key === key) return String(list[i].value || "");
  }
  return "";
}

/**
 * Click ids named the way gtag's own conversion hits name them: `gclaw` /
 * `gclgb` from the storefront cookies, `gclid` / `gbraid` / `wbraid` from
 * the checkout URL (the storefront appends `gclid` on the way to checkout)
 * or from the cart attributes the storefront sets after consent.
 */
function clickIds(event, checkout) {
  var urls = [pageUrl(event), pageUrl(null)];
  function fromUrls(name) {
    for (var i = 0; i < urls.length; i++) {
      var value = urlParam(urls[i], name);
      if (value) return value;
    }
    return attribute(checkout, "_" + name);
  }
  return Promise.all([gclCookie("_gcl_aw"), gclCookie("_gcl_gb")]).then(
    function (cookies) {
      return {
        gclaw: cookies[0],
        gclgb: cookies[1],
        gclid: fromUrls("gclid"),
        gbraid: fromUrls("gbraid"),
        wbraid: fromUrls("wbraid"),
      };
    },
  );
}

/** Image/fetch beacon — often survives custom-pixel sandbox limits better than gtag alone. */
function fireConversionBeacon(value, currency, transactionId, url, ids) {
  var params = new URLSearchParams({
    label: PURCHASE_LABEL,
    guid: "ON",
    script: "0",
    value: String(value),
    currency_code: currency || "SEK",
    // Consent Mode state: G1<ad_storage><analytics_storage>.
    gcs: "G1" + (consent.marketing ? "1" : "0") + (consent.analytics ? "1" : "0"),
    npa: consent.marketing ? "0" : "1",
  });
  if (transactionId) params.set("oid", String(transactionId));
  if (url) params.set("url", url);
  if (consent.marketing) {
    Object.keys(ids).forEach(function (key) {
      if (ids[key]) params.set(key, ids[key]);
    });
  }

  var beaconUrl =
    "https://www.googleadservices.com/pagead/conversion/" +
    CONVERSION_ID +
    "/?" +
    params.toString();

  try {
    var img = new Image(1, 1);
    img.src = beaconUrl;
  } catch (e) {}

  try {
    fetch(beaconUrl, {
      mode: "no-cors",
      keepalive: true,
      credentials: "omit",
    }).catch(function () {});
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

  var url = pageUrl(event);
  clickIds(event, checkout).then(function (ids) {
    fireConversionBeacon(value, currency, transactionId, url, ids);
  });
});

/**
 * Shopify Admin → Settings → Customer events → Add custom pixel
 *
 * Purchase must fire here: checkout runs on Shopify, not the Next.js storefront.
 * The storefront only sends view_item / add_to_cart / begin_checkout (no labeled
 * funnel conversions) plus a purchase backup on /order/confirmed.
 *
 * 1. Paste this entire file into a custom pixel named "Google Ads Purchase"
 * 2. Permission: not required beyond Customer events defaults
 * 3. Connect the pixel (Customer events → Connect) so it runs on checkout / thank-you
 * 4. PURCHASE_LABEL must be the label from Google Ads → Google Shopping App Purchase
 *    (or your primary Website Purchase action) tag setup: AW-…/LABEL
 *
 * In Google & YouTube app → Conversion event settings → Checkout completed:
 * either keep Shopping App Purchase OR check "Add custom conversion ID/label"
 * with the same AW-…/LABEL. Only Purchase should be Primary in Ads.
 *
 * Keep Page view / Add to cart / Begin checkout secondary or unused for bidding.
 */

const GOOGLE_ADS_ID = "AW-18391431736";
const PURCHASE_LABEL = "zMJHCLHuw-IcELj028FE";

window.dataLayer = window.dataLayer || [];
function gtag() {
  window.dataLayer.push(arguments);
}

function applyConsent(privacy) {
  const marketing = Boolean(privacy?.marketingAllowed);
  const analyticsAllowed = Boolean(privacy?.analyticsProcessingAllowed);
  gtag("consent", "update", {
    ad_storage: marketing ? "granted" : "denied",
    ad_user_data: marketing ? "granted" : "denied",
    ad_personalization: marketing ? "granted" : "denied",
    analytics_storage: analyticsAllowed ? "granted" : "denied",
  });
}

const initialPrivacy =
  typeof init !== "undefined" ? init.customerPrivacy : undefined;
gtag("consent", "default", {
  ad_storage: initialPrivacy?.marketingAllowed ? "granted" : "denied",
  ad_user_data: initialPrivacy?.marketingAllowed ? "granted" : "denied",
  ad_personalization: initialPrivacy?.marketingAllowed ? "granted" : "denied",
  analytics_storage: initialPrivacy?.analyticsProcessingAllowed
    ? "granted"
    : "denied",
  wait_for_update: 500,
});

if (
  typeof api !== "undefined" &&
  api.customerPrivacy &&
  typeof api.customerPrivacy.subscribe === "function"
) {
  api.customerPrivacy.subscribe("visitorConsentCollected", (event) => {
    applyConsent(event.customerPrivacy);
  });
}

gtag("js", new Date());
gtag("config", GOOGLE_ADS_ID, { allow_enhanced_conversions: true });

const script = document.createElement("script");
script.async = true;
script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GOOGLE_ADS_ID)}`;
document.head.appendChild(script);

function numericId(gid) {
  const value = String(gid || "");
  const parts = value.split("/");
  return parts[parts.length - 1] || value;
}

function checkoutItems(checkout) {
  return (checkout.lineItems || [])
    .map((item) => {
      const id = numericId(item.variant?.id || item.id);
      if (!id) return null;
      const amount = Number(
        item.variant?.price?.amount || item.finalLinePrice?.amount || 0,
      );
      return {
        id,
        item_id: id,
        google_business_vertical: "retail",
        item_name: item.title || item.variant?.title,
        ...(Number.isFinite(amount) && amount > 0 ? { price: amount } : {}),
        quantity: item.quantity || 1,
      };
    })
    .filter(Boolean);
}

function userData(checkout) {
  const email = String(checkout.email || "")
    .trim()
    .toLowerCase();
  const phone =
    checkout.phone ||
    checkout.shippingAddress?.phone ||
    checkout.billingAddress?.phone ||
    "";
  const addr = checkout.shippingAddress || checkout.billingAddress || {};
  const data = {};
  if (email) data.email = email;
  if (phone) data.phone_number = String(phone).trim();
  if (addr.firstName || addr.lastName || addr.address1 || addr.zip) {
    data.address = {
      first_name: addr.firstName,
      last_name: addr.lastName,
      street: addr.address1,
      city: addr.city,
      region: addr.province,
      postal_code: addr.zip,
      country: addr.countryCode,
    };
  }
  return data;
}

function transactionId(checkout) {
  return checkout.order?.id || checkout.token || "";
}

analytics.subscribe("checkout_completed", (event) => {
  if (!GOOGLE_ADS_ID || !PURCHASE_LABEL) return;

  const checkout = event.data.checkout;
  if (!checkout) return;

  const privacy =
    typeof init !== "undefined" ? init.customerPrivacy : undefined;
  const currency = checkout.currencyCode || checkout.totalPrice?.currencyCode;
  const value = Number(checkout.totalPrice?.amount || 0);
  const txid = transactionId(checkout);
  const params = {
    send_to: GOOGLE_ADS_ID,
    value,
    currency,
    items: checkoutItems(checkout),
    ...(txid ? { transaction_id: txid } : {}),
  };

  const enhanced = userData(checkout);
  if (Object.keys(enhanced).length && privacy?.marketingAllowed !== false) {
    gtag("set", "user_data", enhanced);
  }

  gtag("event", "purchase", params);
  gtag("event", "conversion", {
    send_to: `${GOOGLE_ADS_ID}/${PURCHASE_LABEL}`,
    value,
    currency,
    ...(txid ? { transaction_id: txid } : {}),
  });
});

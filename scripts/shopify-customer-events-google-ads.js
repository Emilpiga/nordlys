/**
 * Shopify Admin → Settings → Customer events → Add custom pixel
 *
 * Purchase must fire here: checkout runs on Shopify, not the Next.js storefront.
 * The storefront still sends view_item / add_to_cart / begin_checkout via gtag.
 *
 * 1. Paste this entire file into a new custom pixel
 * 2. Replace AW-XXXXXXXXX with NEXT_PUBLIC_GOOGLE_ADS_ID
 * 3. Replace PURCHASE_LABEL with the conversion label from Google Ads
 *    (Goals → conversion action → tag setup → send_to `AW-…/LABEL`)
 * 4. Connect the pixel to checkout / thank-you and save
 *
 * Keep Purchase as the only primary optimization goal in Google Ads.
 * Add to cart / begin checkout / page view should stay secondary or unused.
 */

const GOOGLE_ADS_ID = "AW-XXXXXXXXX";
const PURCHASE_LABEL = "PURCHASE_LABEL";

window.dataLayer = window.dataLayer || [];
function gtag() {
  window.dataLayer.push(arguments);
}

const marketing = Boolean(
  typeof init !== "undefined" && init.customerPrivacy?.marketingAllowed,
);
const analyticsAllowed = Boolean(
  typeof init !== "undefined" &&
    init.customerPrivacy?.analyticsProcessingAllowed,
);
gtag("consent", "default", {
  ad_storage: marketing ? "granted" : "denied",
  ad_user_data: marketing ? "granted" : "denied",
  ad_personalization: marketing ? "granted" : "denied",
  analytics_storage: analyticsAllowed ? "granted" : "denied",
});

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
  if (!GOOGLE_ADS_ID || GOOGLE_ADS_ID === "AW-XXXXXXXXX") return;

  const checkout = event.data.checkout;
  if (!checkout) return;

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
  if (Object.keys(enhanced).length) {
    gtag("set", "user_data", enhanced);
  }

  gtag("event", "purchase", params);
  if (PURCHASE_LABEL && PURCHASE_LABEL !== "PURCHASE_LABEL") {
    gtag("event", "conversion", {
      send_to: `${GOOGLE_ADS_ID}/${PURCHASE_LABEL}`,
      value,
      currency,
      ...(txid ? { transaction_id: txid } : {}),
    });
  }
});

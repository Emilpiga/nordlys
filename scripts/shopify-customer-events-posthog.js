/**
 * Shopify Admin → Settings → Customer events → Add custom pixel "PostHog checkout"
 * Paste this file, set POSTHOG_KEY, save and Connect.
 *
 * Continues the storefront journey through Shopify-hosted checkout. The
 * storefront stores its PostHog ids on the cart (`_posthog_distinct_id`,
 * `_posthog_session_id`) right before redirecting here, so these events land
 * on the same person and session as the product views before them.
 *
 * Sends plain fetch requests to PostHog's capture API — no cookies, no SDK.
 */

const POSTHOG_KEY = "phc_REPLACE_ME";
const POSTHOG_CAPTURE_URL = "https://eu.i.posthog.com/i/v0/e/";

function attribute(checkout, key) {
  var list = (checkout && checkout.attributes) || [];
  for (var i = 0; i < list.length; i++) {
    if (list[i] && list[i].key === key) return String(list[i].value || "");
  }
  return "";
}

function money(value) {
  var amount = Number(value && value.amount);
  return Number.isFinite(amount) ? amount : undefined;
}

function checkoutProperties(checkout) {
  if (!checkout) return {};
  var lines = checkout.lineItems || [];
  return {
    value: money(checkout.totalPrice),
    subtotal: money(checkout.subtotalPrice),
    shipping: money(checkout.shippingLine && checkout.shippingLine.price),
    currency: checkout.currencyCode || undefined,
    item_count: lines.reduce(function (sum, line) {
      return sum + (Number(line.quantity) || 0);
    }, 0),
    product_ids: lines.map(function (line) {
      var variant = line.variant || {};
      return String((variant.product && variant.product.id) || variant.id || "");
    }),
    discount_codes: (checkout.discountApplications || [])
      .map(function (d) {
        return d.title || "";
      })
      .filter(Boolean),
    shipping_country:
      (checkout.shippingAddress && checkout.shippingAddress.countryCode) ||
      undefined,
    checkout_token: checkout.token || undefined,
  };
}

var lastCheckout = null;

function send(eventName, event, checkout, extra) {
  if (checkout) lastCheckout = checkout;
  checkout = checkout || lastCheckout;

  var distinctId = attribute(checkout, "_posthog_distinct_id");
  var sessionId = attribute(checkout, "_posthog_session_id");
  var location = (event.context && event.context.document &&
    event.context.document.location) || {};

  var properties = Object.assign(
    {
      $current_url: location.href,
      $pathname: location.pathname,
      $host: location.host,
      $process_person_profile: false,
      source: "shopify_checkout",
      // No storefront ids means the cart was not started on our site.
      linked_to_storefront: Boolean(distinctId),
    },
    sessionId ? { $session_id: sessionId } : {},
    checkoutProperties(checkout),
    extra || {},
  );

  var body = JSON.stringify({
    api_key: POSTHOG_KEY,
    event: eventName,
    distinct_id: distinctId || "shopify_" + event.clientId,
    timestamp: event.timestamp,
    properties: properties,
  });

  try {
    fetch(POSTHOG_CAPTURE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body,
      keepalive: true,
      credentials: "omit",
    }).catch(function () {});
  } catch (e) {}
}

function checkoutOf(event) {
  return (event.data && event.data.checkout) || null;
}

// Page views carry no checkout (and so no storefront ids); hold the first
// one until checkout_started tells us who this is.
var pendingPageViews = [];

// Page views inside checkout keep the visitor visible on PostHog's live view.
analytics.subscribe("page_viewed", function (event) {
  if (lastCheckout) send("$pageview", event, null);
  else pendingPageViews.push(event);
});

analytics.subscribe("checkout_started", function (event) {
  var checkout = checkoutOf(event);
  var held = pendingPageViews;
  pendingPageViews = [];
  held.forEach(function (pageView) {
    send("$pageview", pageView, checkout);
  });
  send("checkout_started", event, checkout);
});

analytics.subscribe("checkout_contact_info_submitted", function (event) {
  send("checkout_contact_submitted", event, checkoutOf(event));
});

analytics.subscribe("checkout_address_info_submitted", function (event) {
  send("checkout_address_submitted", event, checkoutOf(event));
});

analytics.subscribe("checkout_shipping_info_submitted", function (event) {
  send("checkout_shipping_submitted", event, checkoutOf(event));
});

analytics.subscribe("payment_info_submitted", function (event) {
  send("checkout_payment_submitted", event, checkoutOf(event));
});

analytics.subscribe("checkout_completed", function (event) {
  var checkout = checkoutOf(event);
  send("order_completed", event, checkout, {
    order_id: (checkout && checkout.order && checkout.order.id) || undefined,
  });
});

// Errors shown to the shopper (declined card, invalid address, …) — often why they leave.
analytics.subscribe("alert_displayed", function (event) {
  var alert = (event.data && event.data.alert) || {};
  send("checkout_alert", event, null, {
    alert_type: alert.type,
    alert_target: alert.target,
    alert_message: alert.value,
  });
});

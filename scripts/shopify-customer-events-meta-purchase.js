/**
 * Shopify Admin → Settings → Customer events → Add custom pixel
 *
 * 1. Paste this entire file into a new custom pixel
 * 2. Replace YOUR_META_PIXEL_ID with NEXT_PUBLIC_META_PIXEL_ID
 *    (example: 1629403708806437)
 * 3. Connect the pixel and save
 *
 * Purchase cannot fire from the Next.js app because checkout runs on Shopify.
 * Prefer also enabling Sales channels → Facebook & Instagram for catalog + CAPI.
 */

const META_PIXEL_ID = "YOUR_META_PIXEL_ID";

function ensureFbq() {
  if (window.fbq) return;
  !(function (f, b, e, v, n, t, s) {
    if (f.fbq) return;
    n = f.fbq = function () {
      n.callMethod
        ? n.callMethod.apply(n, arguments)
        : n.queue.push(arguments);
    };
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = !0;
    n.version = "2.0";
    n.queue = [];
    t = b.createElement(e);
    t.async = !0;
    t.src = v;
    s = b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t, s);
  })(
    window,
    document,
    "script",
    "https://connect.facebook.net/en_US/fbevents.js",
  );
  fbq("init", META_PIXEL_ID);
}

analytics.subscribe("checkout_completed", (event) => {
  ensureFbq();
  const checkout = event.data.checkout;
  if (!checkout) return;

  const currency = checkout.currencyCode || checkout.totalPrice?.currencyCode;
  const value = Number(checkout.totalPrice?.amount || 0);
  const contentIds = (checkout.lineItems || [])
    .map((item) => {
      const id = item.variant?.id || item.id || "";
      const parts = String(id).split("/");
      return parts[parts.length - 1] || id;
    })
    .filter(Boolean);
  const numItems = (checkout.lineItems || []).reduce(
    (sum, item) => sum + (item.quantity || 0),
    0,
  );

  fbq("track", "Purchase", {
    content_ids: contentIds,
    content_type: "product",
    value,
    currency,
    num_items: numItems,
    order_id: checkout.order?.id || checkout.token,
  });
});

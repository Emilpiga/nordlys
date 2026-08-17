# Harbor — headless Shopify storefront

Next.js storefront + Shopify commerce + CJ Dropshipping fulfillment.

## Architecture

```
Customer → Next.js (Vercel)
         → Shopify Storefront API (catalog + cart)
         → Shopify Checkout (payments)
         → Shopify Admin order
         → CJ Dropshipping app fulfills + syncs tracking
```

CJ is configured in Shopify Admin. This repo does not call CJ directly.

## 1. Shopify store + Headless tokens

1. Create a store at [shopify.com](https://www.shopify.com) (or a Partner development store).
2. Install the **[Headless](https://apps.shopify.com/headless)** sales channel.
3. In Admin → **Sales channels → Headless → Create storefront**.
4. Open **Manage API access** and copy:
   - **Public** Storefront API access token → `SHOPIFY_STOREFRONT_ACCESS_TOKEN`
   - **Private** Storefront API access token → `SHOPIFY_STOREFRONT_PRIVATE_ACCESS_TOKEN` (preferred for this Next.js server)
5. Note your shop domain: `your-store.myshopify.com` (no `https://`).
6. Publish products to the **Headless** sales channel (or “All channels”) or the storefront catalog will be empty.

### Common 401 mistake

Dev Dashboard **Client ID / Client secret (`shpss_…`)** are **not** Storefront API tokens. Using `shpss_` in `SHOPIFY_STOREFRONT_ACCESS_TOKEN` always returns `UNAUTHORIZED`.

Also wrong: Admin API tokens (`shpat_…`).

Optional but useful in Admin:

- Shopify Payments (or your region’s provider)
- **Markets** for SE / NO / DK / FI (see languages checklist below)
- Order notification email templates

### Languages & Markets (required for localized catalog)

The storefront serves **`/sv`**, **`/no`**, **`/da`**, **`/fi`** and calls Storefront API with matching `@inContext(language, country)` plus cart `buyerIdentity.countryCode`.

| URL locale | Shopify language | Shopify country |
|------------|------------------|-----------------|
| `sv` | `SV` | `SE` |
| `no` | `NB` | `NO` |
| `da` | `DA` | `DK` |
| `fi` | `FI` | `FI` |

In Shopify Admin:

1. Enable languages **SV, NB, DA, FI** (Translate & Adapt or equivalent). Norwegian is **NB** (Bokmål), not `NO`.
2. Create/configure Markets for **Sweden, Norway, Denmark, Finland** and attach those languages.
3. Rewrite catalog copy into those languages (see below) — supplier dumps should not be published as-is.
4. Confirm via Storefront `localization { availableCountries { isoCode availableLanguages { isoCode } } }`.

UI chrome is translated in-app. **Product titles/descriptions** only change when Shopify returns translations for the active language.

### Rewrite catalog copy (Admin API)

Storefront tokens cannot write translations. Create a **custom Admin app** with `read_products`, `write_products`, `read_translations`, `write_translations`, `read_locales`, `write_locales`, then:

```bash
# Preview rewritten copy (no Shopify writes)
npm run translate:products -- --dry-run

# Enable NB/DA/FI, rewrite Swedish source, localize the rest
npm run translate:products
```

Copy is written locally in `scripts/catalog-copy-data.mjs` (structured titles, benefit bullets, option labels — not a translation of the CJ dump). The script only **pushes** that copy. Requires `SHOPIFY_ADMIN_ACCESS_TOKEN`.

## 2. CJ Dropshipping

1. Create a [CJ Dropshipping](https://cjdropshipping.com) account.
2. In Shopify Admin → Apps, install **CJ Dropshipping**.
3. Connect your CJ account in the app.
4. Import products from CJ into Shopify (set retail price / margin).
5. Enable auto-fulfillment when you trust the mapping (start manual for the first orders).

Test with a real low-cost SKU end-to-end: place order on the Next.js site → pay in Shopify Checkout → fulfill in CJ → confirm tracking appears on the Shopify order.

## 3. This storefront

```bash
cp .env.example .env.local
npm install
npm run dev
```

Fill `.env.local`:

| Variable | Example |
|----------|---------|
| `NEXT_PUBLIC_STORE_NAME` | Your brand name |
| `NEXT_PUBLIC_SUPPORT_EMAIL` | Public support inbox (Contact / legal pages) |
| `NEXT_PUBLIC_LEGAL_NAME` | Registered company name (shown on legal pages and footer) |
| `NEXT_PUBLIC_LEGAL_ADDRESS` | Geographic business address (`Skepparegatan 3a, 302 94 Halmstad, Sverige`) |
| `NEXT_PUBLIC_ORG_NUMBER` | Organisationsnummer / CVR / Y-tunnus |
| `NEXT_PUBLIC_VAT_NUMBER` | VAT / momsregistreringsnummer |
| `NEXT_PUBLIC_RETURNS_ADDRESS` | Optional fixed returns address (otherwise emailed on request) |
| `NEXT_PUBLIC_META_PIXEL_ID` | Meta Pixel ID (loads only after cookie consent) |
| `NEXT_PUBLIC_FACEBOOK_APP_ID` | Facebook App ID for `fb:app_id` (Sharing Debugger / Meta) |
| `NEXT_PUBLIC_GOOGLE_ADS_ID` | Google Ads tag ID `AW-…` (same consent gate) |
| `NEXT_PUBLIC_GOOGLE_ADS_PURCHASE_LABEL` | Purchase conversion label (the part after `/` in `AW-…/LABEL`) |
| `NEXT_PUBLIC_GOOGLE_ADS_ADD_TO_CART_LABEL` | Optional. Add-to-cart conversion label (keep this action **secondary**) |
| `NEXT_PUBLIC_GOOGLE_ADS_BEGIN_CHECKOUT_LABEL` | Optional. Begin-checkout conversion label (keep this action **secondary**) |
| `SHOPIFY_STORE_DOMAIN` | `your-store.myshopify.com` |
| `SHOPIFY_CHECKOUT_DOMAIN` | Branded checkout host, e.g. `checkout.vardagsstil.se` (see below) |
| `SHOPIFY_STOREFRONT_ACCESS_TOKEN` | Public token from Headless channel |
| `SHOPIFY_STOREFRONT_PRIVATE_ACCESS_TOKEN` | Private token from Headless channel |
| `SHOPIFY_STOREFRONT_API_VERSION` | `2026-04` |
| `SHOPIFY_STOREFRONT_LANGUAGE` | Fallback language code, e.g. `SV` (URL locale overrides) |
| `SHOPIFY_STOREFRONT_COUNTRY` | Fallback country code, e.g. `SE` (URL locale overrides) |
| `NEXT_PUBLIC_SITE_URL` | Canonical origin (OAuth callbacks, SEO) |
| `SHOPIFY_WELCOME_DISCOUNT_CODE` | Discount code for the 10% popup deal (default `VARDAG10`) |
| `SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_SECRET` | Matching confidential client secret |
| `SHOPIFY_CUSTOMER_ACCOUNT_CALLBACK_URL` | HTTPS callback, e.g. `https://…/api/auth/callback` |
| `CUSTOMER_SESSION_SECRET` | Optional cookie sealing secret |
| `RESEND_API_KEY` | Resend API key for the contact form |
| `RESEND_FROM_EMAIL` | Verified from address, e.g. `Harbor <hello@domain.com>` |

Open [http://localhost:3000](http://localhost:3000) (redirects to `/sv` by default). Language selector is in the header.

## 4. Customer accounts

1. Shopify Admin → **Settings → Customer accounts** → enable **Customer accounts**.
2. **Sales channels → Headless → your storefront → Customer Account API**:
   - Client type: **Confidential**
   - Callback URL: `https://YOUR_DOMAIN/api/auth/callback` (ngrok HTTPS URL in local dev — Shopify rejects `localhost` / `http`)
   - Logout / post-logout redirect: your storefront origin
   - Scopes include customer read/write as exposed by Headless
3. Copy client id + secret into `.env.local`.
4. Create the wishlist metafield (once):

```bash
node scripts/ensure-wishlist-metafield.mjs
```

Namespace/key: `harbor.wishlist` (`json`, customer account `READ_WRITE`).

Routes: `/[locale]/account`, `/account/orders`, `/account/orders/[id]`, `/account/wishlist`.

## 5. Contact (Resend)

1. Create a [Resend](https://resend.com) account and verify your sending domain.
2. Set `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, and `NEXT_PUBLIC_SUPPORT_EMAIL`.
3. Contact page posts via server action to your support inbox.

## 6. Welcome 10% discount popup

A delayed popup asks visitors who have looked at products but not checked out: **Vill du ha 10% rabatt?** (`Ja, tack!` / `Nej, tack!`).

It does **not** show on first landing. It waits until they have opened a product (or spent time in the catalog), then offers after they pause, close the cart without paying, or linger on the cart page.

- **Yes** applies Shopify discount code `VARDAG10` (or `SHOPIFY_WELCOME_DISCOUNT_CODE`) to the current cart, or to the next cart they create.
- **No** hides the popup for 14 days.
- After checkout (`/order/confirmed`) the deal is marked used on that device so it is not applied again.

Create the code in Shopify Admin **before** turning this on in production:

1. **Discounts → Create discount → Discount code**
2. Code: `VARDAG10` (must match the env value)
3. Type: **Percentage**, **10%**, applies to the entire order
4. **Limit to one use per customer** (uses checkout email)
5. Save, then set `SHOPIFY_WELCOME_DISCOUNT_CODE=VARDAG10` locally and on Vercel

## 7. Post-purchase landing + Checkout UI extension

Shopify Checkout always lands on Shopify’s thank-you page (auto-redirect to your domain is blocked).

1. Storefront page: `/[locale]/order/confirmed` (clears cart, optional Purchase pixel).
2. Deploy the app in [`shopify-app/`](shopify-app/) — see [`shopify-app/README.md`](shopify-app/README.md).
3. In Checkout editor, enable the **thank-you-continue** block and set **Storefront URL** + locale.

## 8. Google Ads conversions

The Google tag on the storefront sends `view_item`, `add_to_cart`, and `begin_checkout`. **Purchase must also fire from Shopify**, because checkout does not run on this origin.

1. In Google Ads → **Goals → Summary**, open the **Purchase** conversion action → tag setup, and copy the `send_to` value `AW-…/LABEL`.
2. Set `NEXT_PUBLIC_GOOGLE_ADS_ID` and `NEXT_PUBLIC_GOOGLE_ADS_PURCHASE_LABEL` on Vercel (and locally), then redeploy.
3. Shopify Admin → **Settings → Customer events → Add custom pixel**. Paste [`scripts/shopify-customer-events-google-ads.js`](scripts/shopify-customer-events-google-ads.js), connect it to checkout / thank-you, save.
4. Redeploy the Checkout UI extension so the thank-you CTA passes `txid` (order GID). Google Ads uses that as `transaction_id` so a click-through to `/order/confirmed` is not counted twice.
5. In campaign **conversion goals**, keep **Purchase** as the only primary goal. Remove or demote **Add to cart**, **Begin checkout**, and **Page view** — those are observation events, not bidding targets.

Optional: if you create secondary conversion actions for add to cart / begin checkout, paste those labels into the matching `NEXT_PUBLIC_GOOGLE_ADS_*_LABEL` env vars and redeploy.

## What’s included

- Locales: Swedish, Norwegian, Danish, Finnish (`/sv`, `/no`, `/da`, `/fi`)
- Home, product grid (cursor pagination via Storefront API), product detail, cart drawer + cart page
- Cookie-backed Shopify Cart with Markets `buyerIdentity`
- 10% welcome-deal popup (Shopify discount code on next checkout)
- Checkout redirect to Shopify Checkout URL (branded `checkout.` subdomain or `*.myshopify.com`)
- Customer Account API login, orders, tracking, wishlist
- Contact form (Resend) + About, FAQ, Privacy, Terms, Shipping & returns
- Branded order confirmation page + Checkout thank-you CTA extension
- Consent Mode + ad pixels
- Graceful empty state when Shopify credentials are missing

## What’s not in this storefront (on purpose)

- Custom checkout (Shopify-hosted Checkout)
- Automatic redirect off Shopify thank-you (Checkout Extensibility limitation)
- Direct CJ API (use the Shopify app)
- Domain-per-country (`.se` / `.no`) — subpaths only
- CMS / blog

## Deploy

1. Push to GitHub.
2. Import on [Vercel](https://vercel.com).
3. Add the same env vars (including Customer Account callback = production HTTPS URL).
4. In Shopify, allow your production domain for the Headless / custom storefront channel if prompted.
5. Register the production OAuth callback + logout URLs in Headless Customer Account API settings.
6. Point DNS at Vercel.
7. Deploy / enable the Checkout UI extension (`shopify-app/`).

### Branded checkout URL (`checkout.yourdomain.com`)

Apex/`www` stay on Vercel. Checkout needs a **separate subdomain that Shopify hosts**:

1. DNS: create `checkout.vardagsstil.se` as a CNAME to the target Shopify shows (often `shops.myshopify.com`), or add the subdomain from **Shopify Admin → Settings → Domains**.
2. In **Domains**, set that subdomain’s **Target** to **Online Store** and make it **Primary**.
3. Keep `vardagsstil.se` / `www` pointed at Vercel (do **not** point the apex at Shopify if the Next storefront lives there).
4. Set `SHOPIFY_CHECKOUT_DOMAIN=checkout.vardagsstil.se` locally and on Vercel, then redeploy.

Until that subdomain is live on Shopify, leave `SHOPIFY_CHECKOUT_DOMAIN` empty so checkout uses `*.myshopify.com`.

## Sibling split

- **Storefront / brand / ads** — this Next.js app + creatives
- **Ops** — Shopify Admin + CJ imports, fulfillment rules, refunds
- **Checkout CTA** — `shopify-app/` thank-you extension
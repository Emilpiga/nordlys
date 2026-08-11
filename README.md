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
| `no` | `NO` | `NO` |
| `da` | `DA` | `DK` |
| `fi` | `FI` | `FI` |

In Shopify Admin:

1. Enable languages **SV, NO, DA, FI** (Translate & Adapt or equivalent).
2. Create/configure Markets for **Sweden, Norway, Denmark, Finland** and attach those languages.
3. Translate (or auto-translate) products, collections, and checkout content.
4. Confirm via Storefront `localization { availableCountries { isoCode availableLanguages { isoCode } } }`.

UI chrome is translated in-app. **Product titles/descriptions** only change when Shopify returns translations for the active language.

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
| `NEXT_PUBLIC_META_PIXEL_ID` | Meta Pixel ID (loads only after cookie consent) |
| `NEXT_PUBLIC_FACEBOOK_APP_ID` | Facebook App ID for `fb:app_id` (Sharing Debugger / Meta) |
| `NEXT_PUBLIC_GOOGLE_ADS_ID` | Google Ads tag ID `AW-…` (same consent gate) |
| `SHOPIFY_STORE_DOMAIN` | `your-store.myshopify.com` |
| `SHOPIFY_STOREFRONT_ACCESS_TOKEN` | Public token from Headless channel |
| `SHOPIFY_STOREFRONT_PRIVATE_ACCESS_TOKEN` | Private token from Headless channel |
| `SHOPIFY_STOREFRONT_API_VERSION` | `2026-04` |
| `SHOPIFY_STOREFRONT_LANGUAGE` | Fallback language code, e.g. `SV` (URL locale overrides) |
| `SHOPIFY_STOREFRONT_COUNTRY` | Fallback country code, e.g. `SE` (URL locale overrides) |

Open [http://localhost:3000](http://localhost:3000) (redirects to `/sv` by default). Language selector is in the header.

## What’s included

- Locales: Swedish, Norwegian, Danish, Finnish (`/sv`, `/no`, `/da`, `/fi`)
- Home, product grid, product detail, cart drawer + cart page
- Cookie-backed Shopify Cart with Markets `buyerIdentity`
- Checkout redirect to Shopify Checkout URL
- About, FAQ, Privacy, Terms, Shipping & returns, Contact
- Consent Mode + ad pixels
- Graceful empty state when Shopify credentials are missing

## What’s not in v1 (on purpose)

- Customer accounts
- Custom checkout (needs Shopify Plus)
- Direct CJ API (use the Shopify app)
- Domain-per-country (`.se` / `.no`) — subpaths only
- CMS / blog

## Deploy

1. Push to GitHub.
2. Import on [Vercel](https://vercel.com).
3. Add the same env vars.
4. In Shopify, allow your production domain for the Headless / custom storefront channel if prompted.
5. Point DNS at Vercel.

## Sibling split

- **Storefront / brand / ads** — this Next.js app + creatives
- **Ops** — Shopify Admin + CJ imports, fulfillment rules, refunds

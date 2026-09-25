# Vardagsstil Shopify app

One app, three parts:

| Part | Where | What |
|------|-------|------|
| **Veckans look** planner | `vardagsstil.se/shopify-admin` (Next.js, `src/app/shopify-admin`) | Embedded page in Shopify admin: plan 8 weeks of looks, override with the product picker, set the discount |
| `look-bundle-discount` | `extensions/look-bundle-discount` | Discount Function: X % off every line of this week's look when all its pieces are in the cart |
| `thank-you-continue` | `extensions/thank-you-continue` | "Continue to store" block on the Thank you / Order status pages |

This folder only holds the app config and extensions. The planner UI and API
live in the storefront and deploy with it to Vercel.

## How the weekly look works

1. The planner keeps the current week + 7 ahead filled, per slot (Dam, Herr,
   Vardagsrum, Sovrum, Kök). Empty slots get an automatic pick: buyable
   products not featured within the last *N* weeks (setting, default 6),
   never-featured first.
2. You override a slot with **Välj produkter** (Shopify product picker, exactly
   3), re-roll with **Föreslå ny**, or return to **Tillbaka till auto**.
3. The plan is stored in Upstash Redis (`looks:v1:*`). The storefront reads it
   from there; the discount function gets it as JSON in its discount's
   `$app:looks` metafield and picks the current week from the shop-local date.
4. A daily Vercel Cron (`/api/shopify-admin/cron`) fills new weeks and
   republishes, so nothing depends on someone opening the planner.

## Setup

Vercel env vars (storefront project):

- `SHOPIFY_APP_CLIENT_ID` — optional; defaults to `client_id` in `shopify.app.toml`
- `SHOPIFY_APP_CLIENT_SECRET` — this app's client secret (Partner Dashboard → app → API access, or `npx shopify app env show`)
- `CRON_SECRET` — any long random string; Vercel sends it to the cron route

Deploy the config and extensions (scopes, app URL, discount function):

```bash
cd shopify-app
npm install
npx shopify app deploy
```

Then open **Apps → Vardagsstil** in Shopify admin and approve the new
permissions. The first load creates the automatic discount "Veckans look".

Function tests: `npm test`.

## Thank-you block

In **Checkout and accounts editor**, add the **thank-you-continue** block and set
**Storefront URL** (e.g. `https://vardagsstil.se`) and **Default locale** (`sv`).

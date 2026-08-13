# Harbor Checkout UI extension

Adds a **Continue to store** button on Shopify’s Thank you and Order status pages that links to the headless storefront `/[locale]/order/confirmed`.

Shopify Checkout Extensibility does **not** allow automatic redirects off the thank-you page. This extension is the supported CTA path.

## Setup

1. Create a Shopify app (Partner Dashboard or `shopify app init`) and copy its client id into `shopify.app.toml`.
2. Install Shopify CLI and from this folder run:

```bash
cd shopify-app
npm install
npx shopify app dev
```

3. In **Checkout and accounts editor**, add the **thank-you-continue** block (placement e.g. above order status).
4. Extension settings:
   - **Storefront URL** — production origin, e.g. `https://www.vardagsstil.se`
   - **Default locale** — `sv` (or `no` / `da` / `fi`)

5. Deploy:

```bash
npx shopify app deploy
```

The confirmed page clears the cart cookie and can fire the Meta Purchase pixel when `value` + `currency` query params are present.

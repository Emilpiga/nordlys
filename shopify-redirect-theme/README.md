# Harbor headless redirect

Vendored from Shopify’s [Hydrogen redirect theme](https://github.com/Shopify/hydrogen-redirect-theme). It replaces Dawn on the Shopify-hosted domain (`checkout.vardagsstil.se` and `*.myshopify.com`) so those URLs cannot be used as a second storefront.

Shopify Checkout (`/checkouts/…`, Shop Pay, thank-you) does **not** use this Liquid theme. Keep the **Online Store** sales channel installed, and do **not** password-protect the store — that now intercepts hosted checkout.

Hostname is preset to `vardagsstil.se`. Next.js already locale-prefixes paths such as `/products/…` → `/sv/products/…`.

## Publish (required)

The Admin app in this repo does not have `write_themes`, so this cannot be pushed from a script. In Shopify Admin:

1. Zip this folder (from the repo root):

   ```bash
   npm run theme:zip
   ```

2. **Online Store → Themes → Add theme → Upload zip file** and choose `shopify-redirect-theme.zip`.
3. **Publish** the uploaded theme (leave Dawn unpublished in the library).
4. Confirm `https://checkout.vardagsstil.se/` redirects to `https://vardagsstil.se/`.
5. Confirm a real cart checkout from the Next.js store still opens Shopify Checkout.

## Do not

- Password-protect **Online Store → Preferences**. That blocks Storefront API `checkoutUrl`.
- Remove the **Online Store** sales channel. Hosted checkout is served from that domain.
- Point `checkout.vardagsstil.se` at Vercel. Shopify must keep serving that host.

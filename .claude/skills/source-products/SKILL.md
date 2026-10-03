---
name: source-products
description: Find clothing that Swedish dropshipping competitors already sell well, match it on CJ, and import it into Shopify with the competitor's listing. Use when asked to source, find or import new products.
---

# Source products from competitors

Goal: new clothing for the store, taken from Swedish (SEK) dropshipping stores that already sell it, fulfilled by CJ. The competitor's title, description, variants, prices and images are copied as they are. Clothing only.

Arguments, if any, are a store URL, a product URL, or a number of products to add. With none, find stores yourself and aim for about five products.

## 1. Find stores

Look for Swedish clothing stores that are dropshipping and spending on ads:

- Search the web for Swedish product phrasing ("stickad kofta dam fri frakt") and look past the known chains (Lindex, Zalando, KappAhl …). Dropshippers are usually Shopify stores with long delivery times, a generic brand and heavy discounts.
- Check the domain in the Google Ads Transparency Center (`adstransparency.google.com/?region=SE&domain=<domain>`) with the browser. Running many ads, recently, is the signal that the products sell.
- Skip stores that don't charge SEK; the script refuses them.

Present the stores as a list (ads count, catalog size, typical price, what they sell) and stop. The user picks which stores or collections to copy; continue only with those.

## 2. Pick products

```bash
npm run source -- <store or collection URL> --limit=30
```

Lists best sellers first. Pick clothing with a real description, several images and sensible variants. Skip anything branded, and anything already in our catalog.

## 3. Match on CJ

```bash
npm run source -- <product URL> --q="women knit cardigan long" --q="…"
```

Search terms are English. Open the source image and the CJ candidate images and compare them: it must be the same garment, not a similar one. No match on CJ means the product is dropped.

## 4. Pair variants

```bash
npm run source -- <product URL> --pid=<CJ pid>
```

- Read the "Check each colour" lines and look at both images for every colour.
- Colours whose names don't pair: `--colors="Sand=Apricot,Mörkgrön=Army Green"`. Single variants: `--pair="Navy / S/M=Blue-M"`.
- Variants left unpaired are not imported. A product where most variants can't be paired is a bad match.
- Prices: a variant marked `raised-to-min` means the competitor undercuts our floor; one marked `capped-at-max` means their price is far above CJ's cost, which often signals a different, better product. Look again before keeping either.
- Fix the warnings the script prints (competitor's name in the copy, wrong clothing type via `--type=` / `--gender=`).

The entry lands in `scripts/sourced-batch.json`.

## 5. Translate

In the batch entry, add `translations` with `nb`, `da` and `fi`, each `{ title, descriptionHtml, metaTitle, metaDescription }`, translated from the Swedish. Keep the HTML structure.

## 6. Import

```bash
npm run import:cj -- --from=scripts/sourced-batch.json --dry-run
```

Show the user the dry-run output and the list of products, and wait for a yes before the real run — it publishes to the storefront and Google.

```bash
npm run import:cj -- --from=scripts/sourced-batch.json
```

This creates, links CJ, publishes, fixes the shipping profile and registers translations. Finish by reporting what was imported, what was dropped and why. Remove imported entries from the batch file.

# Shopify → Medusa v2 pivot plan

Status: proposal, not started. Written against the repo as of commit `c3e8b27`.

## The honest framing

The storefront is not the hard part. `src/lib/shopify/` is a clean, isolated seam:
`queries.ts` + `mutations.ts` + `mappers.ts` → domain types in `types.ts` → components.
Components import `@/lib/shopify/types` and never touch GraphQL shapes. Swapping the data
source behind that seam is maybe a week of work.

What Shopify is doing for us today, for free, that we would have to build:

1. **Checkout.** We have zero payment, address, shipping-selection, VAT, order-confirmation
   or transactional-email code. `cart.checkoutUrl` hands the customer to Shopify and Shopify
   handles all of it. On Medusa, this is ours.
2. **CJ fulfillment automation.** There is no CJ code in this repo at all — it is wired up in
   Shopify Admin via CJ's app. Medusa has no CJ integration, official or community-maintained,
   so product import, order push, tracking sync and stock sync all become ours.

So this pivot is roughly: *keep the storefront, rebuild checkout, build the supplier
integration.* Budget accordingly. Estimated **9–12 weeks for one developer**, with checkout
and CJ being ~half of it.

Hosting is a rounding error either way, so do not let it drive the decision. A single Hetzner
CX22-class box (2 vCPU / 4 GB, roughly €4–6/mo) runs Postgres, Redis and Medusa in `shared`
worker mode comfortably for a store doing up to a few thousand orders a month. Medusa Cloud at
$99/mo is buying away ops work, not compute. The build cost — Phases 4 and 5 — dominates the
economics by an order of magnitude. Medusa wins on **control and no GMV-linked fees at
volume**, not on month-one cost.

Since we are not live, there is no data migration, no dual-running, no legacy compatibility
layer. Clean cut.

---

## Phase 0 — Decisions and de-risking spike

Do not start Phase 1 until these are settled. Three of them can invalidate the whole plan.

### Blocking decisions

**D1. Market scope at launch.** Today `src/lib/i18n/locales.ts` ships four locales
(`sv`/`no`/`da`/`fi`) and Shopify Markets silently handles four currencies and four tax
setups. On Medusa each becomes an explicit Region + Tax Region, and Norway is outside the EU
(VOEC registration, customs declarations). Strong recommendation: **launch Sweden only**
(SEK, 25% VAT, tax-inclusive), keep the locale routing code, and add regions later. This
removes a large chunk of Phase 1 and most of the tax risk.

**D2. Payments.** Stripe is the only first-class option (`@medusajs/medusa/payment-stripe`,
bundled). Klarna is reachable through Stripe's Payment Method Configuration — but not via the
flow in Medusa's own checkout docs, which is card-only, and there is a known open bug where
the Klarna/PayPal redirect back from Stripe fails to fire `order.placed` and leaves a stuck
`_medusa_cart_id` cookie. **Swish has no working Medusa v2 integration** — the one plugin that
lists it ships mock APIs and says so in its own README. If Swish is a launch requirement, the
pivot is off or you are writing a custom `AbstractPaymentProvider` against Swish
Handelsplatsen. Recommendation: **cards + Klarna via Stripe, Swish deferred.**

**D3. Hosting.** Medusa's backend cannot run on Vercel — it needs a persistent Node process
for the worker, the Redis-backed event bus, scheduled jobs and long-running workflows. Medusa
also removed its per-host deployment guides (Railway/Render/DigitalOcean are gone; only a
generic self-host guide and a Vercel guide for the storefront remain).

The docs push a two-instance topology (separate `server` and `worker`), but `shared` is the
**default and supported** worker mode and runs both in one process. For our volume that is
fine, and splitting later is an env-var change (`MEDUSA_WORKER_MODE`), not a rewrite. So the
cheap option is genuinely cheap:

| Option | Monthly | What you own |
|---|---|---|
| One Hetzner CX22-class VPS, Docker Compose, `shared` mode | ~€5 | Everything: backups, patching, uptime, TLS |
| Fly/Railway, split server + worker, managed PG + Redis | ~$25–45 | Upgrades, backups config, monitoring |
| Medusa Cloud Launch | $99 | Nothing infra; preview envs and support included |

**Recommendation: self-host on one box in `shared` mode**, with two non-negotiable conditions,
because both failure modes here are silent and expensive:

1. **Tested Postgres restores, not just backups.** This database holds orders we have charged
   money for. Automate dumps off-box and actually restore one before launch.
2. **Uptime monitoring on the CJ webhook endpoint specifically.** CJ disables a webhook topic
   after two consecutive hours below 80% delivery success and requires *manual* reactivation
   (see Phase 5). A single box down over a weekend means order notifications stop and nothing
   tells us. This is the one place where the single-box choice has a sharp edge, and the
   reconciliation polling job in Phase 5 is the mitigation.

If we already have a box with headroom, a Postgres and a Redis for other projects, the marginal
cost of Medusa is close to zero and this decision is trivial. Revisit Cloud only if ops turns
out to be the bottleneck.

Self-hosting gotchas to expect: the Docker Compose SSL bug (module connections force SSL for
any non-localhost host, so a stock `postgres:*-alpine` service fails — workaround
`databaseDriverOptions: { ssl: false, sslmode: "disable" }`), and the Redis event bus hang in
v2.17.0 that made startup block forever in both `shared` and `worker` mode, fixed in 2.17.1.
Both are reasons to pin exact versions and read release notes.

### Spike (target: 3–5 days, throwaway code, separate branch)

Prove the two things most likely to kill the project:

- **CJ order placement.** Get an API key, `getAccessToken`, `product/listV2`,
  `logistic/freightCalculate` for `CN → SE`, then `shopping/order/createOrderV3` with
  `isSandbox: 1`. Confirm we can place and read back a sandbox order.
- **Klarna checkout return leg.** Bare Medusa + Stripe Payment Element, Klarna enabled,
  complete a cart end to end and confirm the order actually lands and the cart cookie clears.

If the Klarna return leg cannot be made to work reliably, revisit D2 before committing.

---

## Phase 1 — Repo restructure and backend foundation

**Restructure to a workspace monorepo.** The Medusa backend is a separate deployable; it does
not belong inside the Next app.

```
dropshipping/
├── apps/
│   ├── storefront/        ← everything currently at repo root
│   └── backend/           ← create-medusa-app output
├── docs/
├── package.json           ← workspace root
└── pnpm-workspace.yaml
```

Move the existing app wholesale into `apps/storefront/`. `vercel.json` needs a root directory
update. Note that `AGENTS.md` resolves `node_modules/next/dist/docs/` relative to itself — keep
the Next.js agent rules block reachable from the storefront app.

**Scaffold the backend.** `npx create-medusa-app@latest` pinned to an exact version. Do **not**
take the bundled Next.js storefront starter — it is on Next 15 + Tailwind 3, behind our Next 16
+ Tailwind 4. Read it as a reference implementation for the `@medusajs/js-sdk` and cart/region
logic, port the patterns by hand, and delete it.

Pin exact `@medusajs/*` versions. Medusa's own release policy states minor releases include
breaking changes; four config-level breaking changes shipped across the last seven minors.

**Infrastructure.** Postgres 15+ (the DB user needs create privileges), Redis, Node 20–24 LTS,
S3-compatible storage, an email provider (Resend or SendGrid both have official guides). Two
processes from one codebase: `MEDUSA_WORKER_MODE=server` (serves admin) and
`MEDUSA_WORKER_MODE=worker` (`DISABLE_MEDUSA_ADMIN=true`). `COOKIE_SECRET` and `JWT_SECRET`
must be set or the app crashes on boot in production.

Deploy gotcha to encode in CI from day one: `medusa build` emits to `.medusa/server`, and you
install and migrate *inside that directory* — `cd .medusa/server && npm install && npm run
predeploy && npm run start`. Only the **server** process runs `predeploy` (the migration); the
worker must not, or the two race.

**Commerce configuration.** One Sales Channel, one Region (SEK, country `SE`), one Tax Region
(`se`, 25% default plus reduced-rate rules where applicable), and a `PricePreference` of
`{ attribute: "currency_code", value: "SEK", is_tax_inclusive: true }` so Medusa derives VAT
out of the displayed price rather than adding it on top. Test discounts against tax-inclusive
pricing explicitly — Medusa's docs warn that enabling tax-inclusiveness changes how promotions
apply. Default tax provider `tp_system` is fine for one country; Avalara is the only official
third-party tax integration and we do not need it.

Create a publishable API key scoped to the sales channel. This is the Medusa analogue of
`SHOPIFY_STOREFRONT_ACCESS_TOKEN` — it is how the backend infers which catalog to serve.

Register the Stripe payment module and enable it on the region.

**Exit criteria:** admin reachable, a seeded product visible over `/store/products` with a
correct tax-inclusive SEK price, server and worker both healthy, migrations running in CI.

---

## Phase 2 — Catalog: CJ import and the category re-model

**CJ module.** `apps/backend/src/modules/cj/` — a service wrapping the CJ API. It has no data
models of its own for the client part, so it does not need to extend `MedusaService`.

Non-negotiable constraints from CJ's API, all of which shape the design:

- **QPS = 1 per account**, on auth and everything else. Call `GET /setting/get` first to read
  the real `qpsLimit` and `quotaLimits` for our account and design backoff around those
  numbers. Nothing may call CJ synchronously inside a request path.
- Access tokens are cached server-side by CJ for 24h — re-calling `getAccessToken` returns the
  same token, so you cannot force-rotate. CJ's docs contradict themselves on lifetime (15 vs
  180 days); read `accessTokenExpiryDate` off the response rather than hardcoding either.
- Use `product/listV2` and `product/query`; `logistic/trackInfo` for tracking
  (`getTrackInfo` is deprecated).

**Product import.** A workflow that maps CJ products → Medusa products/variants, plus a mapping
table (`cj_pid`/`cj_vid` ↔ Medusa `product_id`/`variant_id`) and a scheduled job for stock and
price refresh. Persist CJ ids on our side; do not try to derive them at runtime.

**Category re-model — this is the hidden work item.** Today categories are *not* Shopify
collections; `src/lib/shopify/taxonomy.ts` derives them from Shopify's Standard Product
Taxonomy GIDs on `product.category`, and `/categories/[id]` routes on the GID tail. Medusa has
no equivalent taxonomy. We move to Medusa Product Categories with our own handles, which
changes the URL shape from `/categories/{gid-tail}` to `/categories/{handle}` — better for SEO
anyway, and nothing is indexed yet.

While here: delete the unused collections surface. `getCollections()` /
`getCollectionByHandle()` in `src/lib/shopify/index.ts` are dead code and
`src/app/[locale]/collections/[handle]/` is an empty stub. Do not port either.

**Translations.** Medusa v2 now has a native Translation Module (v2.12.3+, behind
`featureFlags: { translation: true }`) — this replaces what `@inContext` was doing for catalog
content. Store Swedish as the base content directly on the product records and use the module
only if/when we add locales. The storefront sets locale via `sdk.setLocale("sv-SE")`, which
sends an `x-medusa-locale` header, and missing translations fall back to base content. Caveat:
feature-flagged and recent, and coverage is products plus a handful of peripheral models
rather than everything. If Sweden-only per D1, this is close to a no-op at launch.

**Exit criteria:** real CJ products in Medusa with correct SEK prices and images, categories
browsable, stock sync job running without tripping rate limits.

---

## Phase 3 — Storefront data-layer swap

This is the cheap phase, because the seam already exists. Replace `src/lib/shopify/` with
`src/lib/medusa/` and keep the domain types as the contract.

| Delete | Replace with |
|---|---|
| `client.ts`, `config.ts` | `@medusajs/js-sdk` client + publishable key |
| `queries.ts`, `mutations.ts`, `fragments.ts` | typed SDK calls with `fields` selection |
| `mappers.ts` | Medusa DTO → domain type mappers (same role) |
| `taxonomy.ts`, `collections.ts` | Medusa category helpers |
| `types.ts` | **keep, adjusted** — drop `Cart.checkoutUrl`, drop `Collection*` |
| `getShopifyContext()` in `locales.ts` | locale → `{ region_id, locale_code }` resolver |

Also drop `@shopify/hydrogen-react` entirely — it is used for exactly one thing,
`createStorefrontClient` in `client.ts:1` — and remove the `cdn.shopify.com` remote patterns
from `next.config.ts`.

`types.ts` survives nearly intact, which is the main reason this is tractable. The real work is
in what leaks around it:

- **IDs change from Shopify GIDs to Medusa ids.** Audit `src/lib/meta-pixel.ts` (content ids),
  `src/lib/json-ld.ts` (Product schema, `sku`/`offers`), and `src/app/sitemap.ts`.
- **Cart plumbing.** The architecture stays — server actions in `src/app/actions/cart.ts`,
  cart id in an httpOnly cookie, `cart-provider.tsx` mirroring server state. Only the calls
  change. Rename the cookie off `shopify_cart_id`. Medusa carts are region-scoped, so the
  locale-switch path currently calling `cartBuyerIdentityUpdate` becomes a region update.
- **Cache invalidation.** `POST /api/revalidate` is currently driven by Shopify Admin
  webhooks. Retarget it at Medusa subscribers on product/category events; keep the
  `REVALIDATE_SECRET` bearer check and the existing tag scheme.
- **Setup banner.** `src/components/setup-banner.tsx` checks `isShopifyConfigured()` and
  mentions CJ in its copy — rewrite against Medusa config or delete it.

`src/lib/fulfillment.ts` is already marked deprecated and superseded by `dict.fulfillment` in
the JSON dictionaries. Delete it now rather than porting it.

**Exit criteria:** every page renders from Medusa, cart add/update/remove works, no
`@shopify/*` import and no `SHOPIFY_*` env var remains anywhere.

---

## Phase 4 — Checkout (the largest new build)

Everything here is net-new. There is nothing to port.

**Flow.** Create cart with `region_id` → line items → email + addresses → list and set shipping
method → initialize payment session on the payment collection → confirm with Stripe's client
SDK → `sdk.store.cart.complete(cartId)`.

Two traps to code against from the start:

1. `complete()` returns a **discriminated union**. `data.type === "cart"` means *failure* with
   the reason in `data.error` — returned as HTTP 200, not a thrown error. Check the type; do
   not assume success.
2. Use Stripe's `<PaymentElement>` and `confirmPayment()` with redirect handling, **not** the
   `<CardElement>` / `confirmCardPayment()` example in Medusa's checkout docs, which cannot
   support Klarna. Control the method set from a Stripe Payment Method Configuration
   (`paymentMethodConfiguration: "pmc_..."`) so Klarna can be toggled from the Stripe dashboard
   without a redeploy. Handle the redirect-return path defensively per the D2 spike findings,
   including clearing the cart cookie.

Also needed: Stripe webhook endpoint at `/hooks/payment/stripe_stripe` with
`payment_intent.succeeded` / `payment_failed` / `amount_capturable_updated` subscribed; a guard
for zero-total carts (Stripe rejects zero-amount intents — route to the Manual provider); an
order confirmation page; and transactional emails (confirmation, shipping) via Resend or
SendGrid.

**Marketing tracking moves.** `scripts/shopify-customer-events-meta-purchase.js` exists only
because Purchase fired inside Shopify Checkout. Delete it and fire Purchase from our own
confirmation page, consent-gated through the existing `consent-mode-bootstrap.tsx` path.

**Legal.** We now own the checkout, so we own the disclosures: Swedish distance-selling
withdrawal rights, price/VAT/shipping display before payment, and order confirmation content.
The existing `/terms`, `/returns` and `/privacy` pages need review against a checkout we
control rather than Shopify's.

**Exit criteria:** a real card order and a real Klarna order both complete end to end in
Stripe test mode, produce a Medusa order, send an email, and fire exactly one Purchase event.

---

## Phase 5 — CJ fulfillment automation

**Shipping rates — read this before wiring anything.** Medusa calls a fulfillment provider's
`calculatePrice` when the customer views shipping options, when a shipping method is added, and
**on every cart refresh**, which happens after most cart changes including adding a line item.
CJ's freight endpoint is capped at 1 request/second. And if `calculatePrice` throws or returns
no `calculated_amount`, the shipping option cannot be resolved and **checkout is blocked**.

So: build the fulfillment provider (`AbstractFulfillmentProviderService`, registered via
`ModuleProvider(Modules.FULFILLMENT, ...)`) against a **cached** freight table, refreshed by a
background job, with an unconditional fallback flat rate on cache miss or error. Never let a
live CJ call sit in the checkout path. Flat-rate or free shipping thresholds sidestep this
entirely and are worth considering on merit.

**Order push.** Use a **workflow with compensation steps**, triggered from the `order.placed`
path — not a bare subscriber that logs and forgets. A subscriber that fails silently leaves a
paid order unfulfilled with nobody notified. Send our order id as CJ's `orderNumber` and treat
it as the idempotency key. Set `fromCountryCode`, `logisticName` (which must come from the
freight calculation — the two endpoints are coupled), and `iossType`. Build the whole thing
against `isSandbox: 1` first.

**IOSS is a business decision, not a config flag.** `iossType` selects between the recipient
paying VAT on arrival (1), our own IOSS registration (2), or CJ's (3). CJ's IOSS does not apply
above €150 — over that, the customer gets charged on delivery. Decide this deliberately; it is
a customer-experience cliff.

**Webhooks — the operationally dangerous part.** CJ requires HTTPS, a `200` within **3
seconds**, and exactly one callback URL per topic (`product`, `stock`, `order`, `logistics`).
Failed pushes retry only 3 times. Worst of all: CJ tracks success rate hourly and **disables a
topic after two consecutive hours below 80%**, requiring manual reactivation. A short outage on
our side silently kills order notifications.

Therefore: the webhook route does nothing but verify the signature, enqueue, and return 200.
Verify as `Base64(HmacSHA256(secret = openId, message = raw body))` against the `sign` header,
computed over the **raw** body before parsing. Dedupe on `messageId`, which is stable across
retries. Note that ordinary dropship orders arrive as `UPDATE`, never `INSERT`. Add uptime
monitoring and alerting on the webhook endpoint specifically, plus a reconciliation job polling
`getOrderDetailBatch` (100 ids per call) as a backstop for anything the webhooks miss.

Product/stock webhooks require explicit per-product subscription — `subscribeAll` was retired
for all accounts after July 2026, so enumerate ids (max 100 per call).

**Exit criteria:** sandbox order flows Medusa → CJ → tracking number → Medusa fulfillment →
customer email, with no manual steps; webhook endpoint monitored; reconciliation job proven by
deliberately dropping a webhook.

---

## Phase 6 — Ops hardening and cutover

- Pin exact `@medusajs/*` versions; read release notes before every minor bump. Rollbacks are
  manual and per-module (`medusa db:rollback <module> ...`, then downgrade, then re-migrate).
- Admin env vars are inlined at build time — `admin.backendUrl` must be set before the build,
  and changing admin config needs a rebuild, not a restart.
- Backups on Postgres, alerting on the worker process and the CJ webhook endpoint, error
  tracking on the storefront.
- Update `.env.example` for the Medusa variables and delete every `SHOPIFY_*` entry. Add the
  two that are currently used in code but missing from the template:
  `NEXT_PUBLIC_FACEBOOK_APP_ID` and `NEXT_PUBLIC_SITE_URL`.
- Rewrite `README.md` — the current architecture diagram and the "CJ is configured in Shopify
  Admin" instructions become wrong.
- Cancel Shopify, revoke the tokens, remove the CJ app from Shopify.

### Everything that gets deleted

Since we are not live, nothing is kept for compatibility:

- `src/lib/shopify/` — the entire directory
- `@shopify/hydrogen-react` dependency and the Shopify CDN patterns in `next.config.ts`
- All `SHOPIFY_*` env vars
- `scripts/shopify-customer-events-meta-purchase.js`
- `src/lib/fulfillment.ts` (already deprecated)
- `src/app/[locale]/collections/[handle]/` (empty stub) and the dead collections API
- `src/components/setup-banner.tsx` in its current form

---

## Risk register

| Risk | Impact | Mitigation |
|---|---|---|
| Klarna redirect bug blocks orders | Kills the pivot for a Swedish store | Prove it in the Phase 0 spike before committing |
| Swish unavailable on Medusa | Lost conversion vs. competitors | Launch without it; custom provider later if data justifies |
| CJ freight in `calculatePrice` rate-limits | Customers cannot check out | Cached rate table + background refresh + flat-rate fallback |
| CJ webhook topic auto-disabled after downtime | Silent fulfillment stoppage | Thin fast webhook route, monitoring, polling reconciliation job |
| Medusa minor releases break us | Unplanned work mid-build | Exact version pins, deliberate upgrades, read release notes |
| Checkout build underestimated | Timeline slips most here | Treat Phase 4 as the critical path; do not parallelize it away |
| Multi-currency Nordic scope | Multiplies tax/region/customs work | Launch Sweden only (D1) |
| Feature-flagged modules (Translation, Caching) | Immature surface area | Avoid depending on them at launch if Sweden-only |

---

## Verdict: do not do this yet

The pivot is technically sound and the storefront is unusually well-positioned for it. The
problem is that the thing it buys is worth far less than the "escape Shopify's cut" framing
suggests.

**The GMV-fee argument mostly does not apply to us.** Shopify's 2% third-party transaction fee
on Basic is waived entirely when Shopify Payments is the processor. And Shopify Payments in
Sweden lands in the same range as Stripe — Stripe is 1.5% + 1.80 kr for standard EEA cards, and
Shopify does not publish Swedish rates publicly (they appear in admin only), with estimates
around 1.5–2.1%. So leaving saves the **subscription** (~$29–39/mo) plus at most a few tenths
of a percentage point on processing. Call it $400–900/year at modest volume — not a percentage
of revenue.

**And the checkout we build will probably convert worse.** Shopify Checkout is one of the most
heavily A/B-tested surfaces in ecommerce, with Shop Pay for returning customers, address
autocomplete, saved cards and fraud analysis. Our v1 will have none of that. The marketing
stack in this repo — Meta Pixel, Google Ads, Consent Mode, AdSense — says the plan is paid
acquisition, which means margin is thin and conversion rate is the whole game. A 1–2 point drop
in checkout conversion costs more than the platform fee saves.

**We already have most of the upside.** We are *already* headless: our own Next.js storefront,
our own brand, SEO, performance and UX, with Shopify reduced to a commerce API behind
`src/lib/shopify/`. The generic advice to leave Shopify is aimed at merchants trapped in Liquid
themes and app subscriptions. That is not our situation. What remains to "own" is specifically
the two hardest, highest-risk pieces: checkout and supplier automation.

Payback on 9–12 weeks of work against ~$700/year is measured in decades, and that ignores the
real cost — 9–12 weeks not spent on product selection, creative and acquisition, which is what
actually determines whether this store works.

## Payment and platform risk

This is a stronger argument for leaving than fees, and it was underweighted above. But it does
not resolve the way it first appears.

### The risk is real and we are the exact profile that triggers it

Shopify Payments reserves are documented policy, not anecdote. Percentage-based reserves
commonly run **10–30% of transactions held for 30–180 days**, and on account
flag or suspension Shopify can hold **100% of payouts for 90–120 days**, occasionally 180.
Terms are set algorithmically, are not negotiable, and trigger on refund rate, dispute rate, or
a volume surge read as fraud.

Dropshipping with China-origin fulfillment is precisely the profile that triggers this: long
delivery windows produce disputes, and Visa's monitoring program flags merchants above a 0.9%
chargeback rate. Worse, the failure mode is a **death spiral specific to our model** — we pay
CJ *after* the customer pays us, so frozen funds mean we cannot pay the supplier, which delays
fulfillment, which produces more disputes, which deepens the freeze.

### But moving to Medusa + Stripe does not escape it

**Shopify Payments is Stripe.** Shopify's own processor list names Stripe Payments Europe, Ltd.
as the payment processor for European Shopify Payments merchants, and accepting Shopify Payments
terms means accepting Stripe's Prohibited and Restricted Businesses terms. Shopify Payments is a
white-labelled aggregator on Stripe infrastructure, inheriting Stripe's underwriting criteria
and risk thresholds.

So a Medusa + Stripe migration moves us from Stripe-behind-Shopify to Stripe-direct. Same
counterparty, same risk engine, same restricted-business list. Stripe independently reserves the
right to impose reserves, freeze, or terminate at its discretion, with holds typically running
90–180 days, and names dropshipping as a high-risk category. **The platform swap alone buys
nothing here.**

### What actually reduces the risk

In rough order of effect, and mostly independent of platform choice:

1. **Ship from CJ's EU warehouses for top SKUs.** Delivery in days instead of weeks is the
   single largest lever on dispute rate, and dispute rate is what drives reserves. This is a
   sourcing decision available today on Shopify.
2. **Dispute-rate discipline.** Tracking uploaded promptly, proactive delivery comms, generous
   and fast refunds, realistic delivery estimates on the PDP. Keep chargebacks well under 0.9%.
3. **A second acquirer.** The standard mitigation is redundancy so revenue keeps moving during a
   freeze. Do not concentrate all cash flow in one processor.
4. **Eventually, a dedicated merchant account** rather than a pooled aggregator, which gets real
   underwriting and negotiated reserve terms instead of algorithmic ones.
5. **Hold a cash buffer** sized to cover supplier payments through a 90–120 day freeze.

### Where Medusa genuinely helps — and this is the best argument for it so far

Items 3 and 4 are **economically penalised on Shopify**. Basic charges a 2% third-party
transaction fee on anything not processed by Shopify Payments, so running a second acquirer or a
dedicated merchant account costs 2% of that revenue on top of the acquirer's own rate. Owning
checkout removes that penalty entirely: multiple payment providers, routing by risk, failover
during a freeze, and processor switching without re-platforming.

There is also **platform risk distinct from payment risk**. Shopify can terminate the store, not
just the payouts. Being headless already protects the storefront, but a termination would take
the catalog, orders, checkout and fulfillment together. On Medusa the only third party who can
cut us off is the processor, and processors are replaceable.

**This lowers the crossover but does not move it to now.** Pre-revenue there is no capital to
freeze — the exposure scales with revenue, as does the value of processor optionality. What it
does mean is that the migration trigger should fire **earlier than the pure cost arithmetic
suggests**: around 4–5 storefronts, or at the revenue level where a 90-day freeze would be
existential, rather than waiting for 8–10.

## The multi-storefront case

The intent is a **portfolio of storefronts** on shared infrastructure, not one store. That is
the one scenario where this pivot clearly wins eventually, because the build amortises and
Shopify's cost is per-store while Medusa's is not.

Medusa is well suited to it: Sales Channels plus per-channel publishable API keys are a
first-class concept, so one backend serves N storefronts off one catalog, with one admin, one
order queue, one CJ integration, and one checkout implementation shared across all N.

### Where the crossover actually is

| | Shopify, N stores | Medusa, N storefronts |
|---|---|---|
| Subscription | N × ~$468/yr | €60/yr hosting, flat |
| Checkout build | none | 9–12 weeks, once |
| CJ integration | N app installs, free | one build, shared |
| Admin surfaces | N | 1 |
| Marginal cost of storefront N+1 | $39/mo + setup | ~0 |

Rough arithmetic, counting both subscription and the admin overhead of running N separate
Shopify backends against a ~400-hour build:

- **N ≤ 3:** Shopify wins clearly. Payback on the build is 7–10 years.
- **N ≈ 8–10:** crossover on cost alone. Subscription is $3,700–4,700/yr and per-store admin
  overhead starts to dominate.
- **N > 10:** Medusa wins decisively, and the marginal cost of each new storefront approaches
  zero.

Adjust that down to **N ≈ 4–5** once payment-freeze exposure is priced in (see above): processor
optionality has real option value that the subscription arithmetic does not capture, and a
90-day freeze at moderate volume is existential for a model that pays its supplier after the
customer pays.

**So the question is not whether, it is when — and the answer is at modest scale, not at N=1.**

### Why sequencing still says "later", more strongly not less

A storefront-portfolio strategy works by launching many niches, killing most of them fast, and
scaling the one or two that show profitable unit economics. That strategy is bottlenecked by
**time-to-launch and speed of kill decisions**, not by platform fees.

Building Medusa first inverts that. Nothing can launch until checkout works, so the first 9–12
weeks produce zero demand signal for any niche. A dead Shopify store costs $39/mo and one click
to cancel; three months of platform building costs the whole testing window. And a checkout that
converts a point or two worse now damages *every* storefront in the portfolio rather than one.

Note also that the storefront-template leverage — one Next.js codebase deployed N times with
different branding — is **already available on Shopify**, because we are already headless. That
is the bulk of the per-store savings, and it does not require Medusa.

### Recommended sequence

1. **Now:** launch 2–3 storefronts on Shopify, reusing this Next.js app as a template with
   per-store config. Find out whether any niche has profitable unit economics. Cost ~$120/mo,
   zero build.
2. **Trigger:** once there is at least one profitably validated storefront *and* a repeatable
   playbook for launching the next one, commit to Medusa. At that point the build is an
   investment against known returns, informed by real checkout data, funded by revenue — and
   the target N makes the arithmetic obvious.
3. **Then:** execute Phases 0–6, migrate the proven storefronts, and scale to N on Medusa.

If we cannot yet make one storefront profitable, building a platform to run ten is premature.
If we can, the platform is obviously correct.

### One scaling constraint to design for now

**CJ's rate limit is per account, not per store.** QPS = 1 covers everything: product sync,
freight quotes, order pushes. Ten storefronts sharing one CJ account share that single request
per second. This means a global queue across all storefronts rather than per-store schedulers,
and possibly multiple CJ accounts partitioned by storefront. CJ's webhook subscription endpoints
do take a `shopId`, so multi-store is supported on their side — but the throughput ceiling is
the account's, and it does not scale with storefront count. Worth confirming CJ's per-account
quotas via `GET /setting/get` before assuming N storefronts fit under one account.

The same warning applies with more force to the single-backend topology: one Medusa instance
serving N storefronts means one outage takes down all N. At the point of committing, revisit the
hosting decision (D3) with that blast radius in mind.

### Triggers to revisit sooner

- **Klarna economics.** Check the real Swedish numbers in Shopify admin. Klarna is a large share
  of Swedish checkouts, and if Klarna orders incur the 2% third-party surcharge on Basic, the
  blended cost shifts materially. Note Stripe's own Klarna rate in Sweden is 2.99% + 4.00 kr,
  well above its card rate — so this can cut either way. **This is a real number to go get.**
- **A concrete blocker.** Something the business needs that Shopify will not do — custom checkout
  logic, bundling, subscriptions, B2B pricing. Write it down when it happens rather than arguing
  it in the abstract.
- **Volume where Plus is the alternative.** Shopify Plus starts around $2,300/mo per store, which
  reverses the arithmetic completely and much earlier in N.

Until a trigger fires: ship on Shopify, prove a niche, and keep `src/lib/shopify/` clean so this
plan stays executable at roughly constant cost.

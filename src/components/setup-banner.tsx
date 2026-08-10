import Link from "next/link";
import {
  getStorefrontCredentialHint,
  isShopifyConfigured,
  shopifyConfig,
} from "@/lib/shopify/config";

export function SetupBanner() {
  const token =
    shopifyConfig.privateStorefrontToken ||
    shopifyConfig.publicStorefrontToken;
  const credentialHint = token ? getStorefrontCredentialHint(token) : null;

  if (isShopifyConfigured() && !credentialHint) return null;

  return (
    <div className="border-b border-blush/35 bg-[color-mix(in_oklab,var(--blush)_14%,white)] px-5 py-3 text-sm text-foreground sm:px-8">
      <p className="mx-auto max-w-6xl">
        {credentialHint ? (
          credentialHint
        ) : (
          <>
            Shopify is not connected yet. Copy{" "}
            <code className="font-mono text-xs">.env.example</code> to{" "}
            <code className="font-mono text-xs">.env.local</code>, add Headless
            channel Storefront API tokens, then import products with CJ
            Dropshipping. See the README. Store name placeholder:{" "}
            <strong>{shopifyConfig.storeName}</strong>.
          </>
        )}
      </p>
    </div>
  );
}

export function EmptyCatalog() {
  return (
    <div className="border border-dashed border-border/80 px-6 py-16 text-center">
      <h2 className="font-display text-3xl font-medium tracking-tight">
        Collection coming soon
      </h2>
      <p className="mx-auto mt-3 max-w-md text-sm font-light text-muted">
        Products appear here once they are published to your Headless sales
        channel.
      </p>
      <Link
        href="/products"
        className="mt-6 inline-flex text-sm font-medium text-accent underline-offset-4 hover:underline"
      >
        Refresh
      </Link>
    </div>
  );
}

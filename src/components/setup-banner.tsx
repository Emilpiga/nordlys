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
    <div className="border-b border-glow/35 bg-[color-mix(in_oklab,var(--glow)_14%,white)] px-5 py-3 text-sm text-foreground sm:px-8">
      <p className="mx-auto max-w-6xl">
        {credentialHint ? (
          credentialHint
        ) : (
          <>
            Shopify är inte kopplat ännu. Kopiera{" "}
            <code className="font-mono text-xs">.env.example</code> till{" "}
            <code className="font-mono text-xs">.env.local</code>, lägg till
            Storefront API-tokens från Headless-kanalen och importera produkter
            med CJ Dropshipping. Se README. Butiksnamn (placeholder):{" "}
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
        Kollektionen kommer snart
      </h2>
      <p className="mx-auto mt-3 max-w-md text-sm font-light text-muted">
        Produkter visas här när de publicerats till din Headless-försäljningskanal.
      </p>
    </div>
  );
}

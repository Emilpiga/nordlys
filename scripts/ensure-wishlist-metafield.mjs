# Create wishlist metafield definition for Customer Account API writes.
# Requires SHOPIFY_STORE_DOMAIN + SHOPIFY_ADMIN_ACCESS_TOKEN.
#
# Usage: node scripts/ensure-wishlist-metafield.mjs

const domain = process.env.SHOPIFY_STORE_DOMAIN?.replace(/^https?:\/\//, "").split("/")[0];
const token = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
const version = process.env.SHOPIFY_ADMIN_API_VERSION || "2026-04";

if (!domain || !token) {
  console.error("Set SHOPIFY_STORE_DOMAIN and SHOPIFY_ADMIN_ACCESS_TOKEN");
  process.exit(1);
}

const mutation = `#graphql
  mutation CreateWishlistMetafieldDefinition($definition: MetafieldDefinitionInput!) {
    metafieldDefinitionCreate(definition: $definition) {
      createdDefinition { id namespace key }
      userErrors { field message code }
    }
  }
`;

const response = await fetch(
  `https://${domain}/admin/api/${version}/graphql.json`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": token,
    },
    body: JSON.stringify({
      query: mutation,
      variables: {
        definition: {
          name: "Wishlist",
          namespace: "harbor",
          key: "wishlist",
          description: "Product GIDs saved by the customer on the headless storefront",
          type: "json",
          ownerType: "CUSTOMER",
          access: {
            customerAccount: "READ_WRITE",
            storefront: "NONE",
          },
        },
      },
    }),
  },
);

const json = await response.json();
const payload = json?.data?.metafieldDefinitionCreate;
if (!response.ok || json.errors?.length) {
  console.error(JSON.stringify(json, null, 2));
  process.exit(1);
}

if (payload?.userErrors?.length) {
  const already =
    payload.userErrors.some((e) =>
      String(e.message || e.code || "")
        .toLowerCase()
        .includes("taken"),
    ) ||
    payload.userErrors.some((e) => e.code === "TAKEN");
  if (already) {
    console.log("Wishlist metafield definition already exists.");
    process.exit(0);
  }
  console.error(payload.userErrors);
  process.exit(1);
}

console.log("Created", payload?.createdDefinition);

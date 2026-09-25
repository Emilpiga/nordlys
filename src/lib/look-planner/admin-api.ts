import "server-only";

const API_VERSION = "2025-10";

export class AdminApiError extends Error {}

/** Admin GraphQL as the Vardagsstil app (offline token from the planner). */
export async function plannerAdminGraphql<T>(
  shop: string,
  accessToken: string,
  query: string,
  variables: Record<string, unknown> = {},
): Promise<T> {
  const response = await fetch(
    `https://${shop}/admin/api/${API_VERSION}/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": accessToken,
      },
      body: JSON.stringify({ query, variables }),
      cache: "no-store",
    },
  );
  const json = (await response.json().catch(() => ({}))) as {
    data?: T;
    errors?: unknown;
  };
  if (!response.ok || json.errors || !json.data) {
    throw new AdminApiError(
      `Admin API ${response.status}: ${JSON.stringify(json.errors ?? json).slice(0, 500)}`,
    );
  }
  return json.data;
}

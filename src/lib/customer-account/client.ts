import { getCustomerAccountApiConfiguration } from "./discovery";
import { getValidAccessToken } from "./session";

type GraphQlError = { message: string };

export class CustomerAccountAuthError extends Error {
  constructor(message = "Customer is not authenticated.") {
    super(message);
    this.name = "CustomerAccountAuthError";
  }
}

export async function customerAccountFetch<T>({
  query,
  variables,
}: {
  query: string;
  variables?: Record<string, unknown>;
}): Promise<T> {
  const accessToken = await getValidAccessToken();
  if (!accessToken) {
    throw new CustomerAccountAuthError();
  }

  const config = await getCustomerAccountApiConfiguration();
  const response = await fetch(config.graphql_api, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: accessToken,
      "User-Agent": "HarborStorefront",
    },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });

  if (response.status === 401 || response.status === 403) {
    throw new CustomerAccountAuthError(
      `Customer Account API ${response.status} unauthorized.`,
    );
  }

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Customer Account API ${response.status}: ${text}`);
  }

  const json = (await response.json()) as {
    data?: T;
    errors?: GraphQlError[];
  };

  if (json.errors?.length) {
    throw new Error(json.errors.map((error) => error.message).join("\n"));
  }

  if (!json.data) {
    throw new Error("Customer Account API returned no data.");
  }

  return json.data;
}

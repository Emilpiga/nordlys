export type CustomerMoney = {
  amount: string;
  currencyCode: string;
};

export type CustomerProfile = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  defaultAddress: string[] | null;
  wishlistProductIds: string[];
};

export type CustomerOrderSummary = {
  id: string;
  name: string;
  number: number | null;
  processedAt: string;
  financialStatus: string | null;
  fulfillmentStatus: string | null;
  totalPrice: CustomerMoney;
  previewItems: {
    name: string;
    quantity: number;
    imageUrl: string | null;
  }[];
};

export type CustomerOrderDetail = {
  id: string;
  name: string;
  number: number | null;
  processedAt: string;
  financialStatus: string | null;
  fulfillmentStatus: string | null;
  statusPageUrl: string | null;
  totalPrice: CustomerMoney;
  subtotal: CustomerMoney | null;
  totalShipping: CustomerMoney | null;
  totalTax: CustomerMoney | null;
  shippingAddress: string[] | null;
  lineItems: {
    title: string;
    name: string;
    quantity: number;
    variantTitle: string | null;
    price: CustomerMoney | null;
    imageUrl: string | null;
  }[];
  fulfillments: {
    id: string;
    status: string | null;
    createdAt: string | null;
    latestShipmentStatus: string | null;
    tracking: {
      company: string | null;
      number: string | null;
      url: string | null;
    }[];
  }[];
};

export type OrdersPage = {
  orders: CustomerOrderSummary[];
  pageInfo: {
    hasNextPage: boolean;
    endCursor: string | null;
  };
};

export function encodeOrderParam(orderId: string) {
  return Buffer.from(orderId, "utf8").toString("base64url");
}

export function decodeOrderParam(value: string) {
  try {
    const decoded = Buffer.from(value, "base64url").toString("utf8");
    if (decoded.startsWith("gid://shopify/Order")) return decoded;
  } catch {
    // fall through
  }
  if (value.startsWith("gid://shopify/Order")) return value;
  return null;
}

export function parseWishlistValue(value: string | null | undefined): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === "string");
  } catch {
    return [];
  }
}

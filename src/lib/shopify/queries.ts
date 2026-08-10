import { CART_FRAGMENT, PRODUCT_CARD_FRAGMENT, PRODUCT_FRAGMENT } from "./fragments";

export const GET_PRODUCTS_QUERY = /* GraphQL */ `
  query GetProducts($first: Int!) {
    products(first: $first, sortKey: BEST_SELLING) {
      nodes {
        ...ProductCardFields
      }
    }
  }
  ${PRODUCT_CARD_FRAGMENT}
`;

export const GET_PRODUCT_BY_HANDLE_QUERY = /* GraphQL */ `
  query GetProductByHandle($handle: String!) {
    product(handle: $handle) {
      ...ProductFields
    }
  }
  ${PRODUCT_FRAGMENT}
`;

export const GET_CART_QUERY = /* GraphQL */ `
  query GetCart($cartId: ID!) {
    cart(id: $cartId) {
      ...CartFields
    }
  }
  ${CART_FRAGMENT}
`;

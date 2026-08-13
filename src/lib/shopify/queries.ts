import {
  CART_FRAGMENT,
  COLLECTION_CARD_FRAGMENT,
  COLLECTION_FRAGMENT,
  IMAGE_FRAGMENT,
  MONEY_FRAGMENT,
  PRODUCT_CARD_FRAGMENT,
  PRODUCT_FRAGMENT,
} from "./fragments";

export const GET_PRODUCTS_QUERY = /* GraphQL */ `
  query GetProducts(
    $first: Int!
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    products(first: $first, sortKey: BEST_SELLING) {
      nodes {
        ...ProductCardFields
      }
    }
  }
  ${PRODUCT_CARD_FRAGMENT}
`;

export const GET_PRODUCT_BY_HANDLE_QUERY = /* GraphQL */ `
  query GetProductByHandle(
    $handle: String!
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    product(handle: $handle) {
      ...ProductFields
    }
  }
  ${PRODUCT_FRAGMENT}
`;

export const GET_CART_QUERY = /* GraphQL */ `
  query GetCart(
    $cartId: ID!
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    cart(id: $cartId) {
      ...CartFields
    }
  }
  ${CART_FRAGMENT}
`;

export const GET_COLLECTIONS_QUERY = /* GraphQL */ `
  query GetCollections(
    $first: Int!
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    collections(first: $first, sortKey: TITLE) {
      nodes {
        ...CollectionCardFields
      }
    }
  }
  ${COLLECTION_CARD_FRAGMENT}
`;

export const GET_COLLECTION_BY_HANDLE_QUERY = /* GraphQL */ `
  query GetCollectionByHandle(
    $handle: String!
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    collection(handle: $handle) {
      ...CollectionFields
    }
  }
  ${COLLECTION_FRAGMENT}
`;

export const PREDICTIVE_SEARCH_QUERY = /* GraphQL */ `
  query PredictiveSearch(
    $query: String!
    $limit: Int!
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    predictiveSearch(
      query: $query
      limit: $limit
      types: [PRODUCT, COLLECTION, QUERY]
      unavailableProducts: HIDE
    ) {
      products {
        id
        handle
        title
        featuredImage {
          ...ImageFields
        }
        priceRange {
          minVariantPrice {
            ...MoneyFields
          }
        }
      }
      collections {
        id
        handle
        title
      }
      queries {
        text
      }
    }
  }
  ${IMAGE_FRAGMENT}
  ${MONEY_FRAGMENT}
`;

export const SEARCH_PRODUCTS_QUERY = /* GraphQL */ `
  query SearchProducts(
    $query: String!
    $first: Int!
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    search(
      query: $query
      first: $first
      types: [PRODUCT]
      prefix: LAST
      unavailableProducts: HIDE
    ) {
      nodes {
        ... on Product {
          ...ProductCardFields
        }
      }
    }
  }
  ${PRODUCT_CARD_FRAGMENT}
`;

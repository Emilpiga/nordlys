export const WISHLIST_NAMESPACE = "harbor";
export const WISHLIST_KEY = "wishlist";

export const CUSTOMER_QUERY = /* GraphQL */ `
  query CustomerAccount {
    customer {
      id
      firstName
      lastName
      emailAddress {
        emailAddress
      }
      phoneNumber {
        phoneNumber
      }
      defaultAddress {
        formatted
        city
        country
      }
      metafield(namespace: "${WISHLIST_NAMESPACE}", key: "${WISHLIST_KEY}") {
        id
        value
        type
      }
    }
  }
`;

export const CUSTOMER_ORDERS_QUERY = /* GraphQL */ `
  query CustomerOrders($first: Int!, $after: String) {
    customer {
      id
      orders(first: $first, after: $after, sortKey: PROCESSED_AT, reverse: true) {
        pageInfo {
          hasNextPage
          endCursor
        }
        nodes {
          id
          name
          number
          processedAt
          financialStatus
          fulfillmentStatus
          totalPrice {
            amount
            currencyCode
          }
          lineItems(first: 5) {
            nodes {
              name
              quantity
              image {
                url
                altText
              }
            }
          }
        }
      }
    }
  }
`;

export const CUSTOMER_ORDER_QUERY = /* GraphQL */ `
  query CustomerOrder($orderId: ID!) {
    order(id: $orderId) {
      id
      name
      number
      processedAt
      financialStatus
      fulfillmentStatus
      statusPageUrl
      totalPrice {
        amount
        currencyCode
      }
      subtotal {
        amount
        currencyCode
      }
      totalShipping {
        amount
        currencyCode
      }
      totalTax {
        amount
        currencyCode
      }
      shippingAddress {
        formatted
        city
        country
      }
      lineItems(first: 50) {
        nodes {
          title
          name
          quantity
          currentTotalPrice {
            amount
            currencyCode
          }
          variantTitle
          image {
            url
            altText
            width
            height
          }
        }
      }
      fulfillments(first: 10) {
        nodes {
          id
          status
          createdAt
          latestShipmentStatus
          trackingInformation {
            company
            number
            url
          }
        }
      }
    }
  }
`;

export const METAFIELDS_SET_MUTATION = /* GraphQL */ `
  mutation MetafieldsSet($metafields: [MetafieldsSetInput!]!) {
    metafieldsSet(metafields: $metafields) {
      metafields {
        id
        key
        namespace
        value
      }
      userErrors {
        field
        message
        code
      }
    }
  }
`;

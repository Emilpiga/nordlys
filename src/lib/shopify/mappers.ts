import type { Cart, Product, ProductImage, ProductVariant } from "./types";

type ShopifyImage = {
  url: string;
  altText: string | null;
  width: number;
  height: number;
} | null;

type ShopifyMoney = {
  amount: string;
  currencyCode: string;
};

type ShopifyProductCard = {
  id: string;
  handle: string;
  title: string;
  featuredImage: ShopifyImage;
  priceRange: {
    minVariantPrice: ShopifyMoney;
    maxVariantPrice: ShopifyMoney;
  };
};

type ShopifyProduct = ShopifyProductCard & {
  description: string;
  descriptionHtml: string;
  images: { nodes: NonNullable<ShopifyImage>[] };
  options: { id: string; name: string; values: string[] }[];
  variants: {
    nodes: {
      id: string;
      title: string;
      availableForSale: boolean;
      selectedOptions: { name: string; value: string }[];
      price: ShopifyMoney;
      compareAtPrice: ShopifyMoney | null;
      image: ShopifyImage;
    }[];
  };
};

type ShopifyCart = {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  cost: {
    subtotalAmount: ShopifyMoney;
    totalAmount: ShopifyMoney;
  };
  lines: {
    nodes: {
      id: string;
      quantity: number;
      cost: { totalAmount: ShopifyMoney };
      merchandise: {
        id: string;
        title: string;
        selectedOptions: { name: string; value: string }[];
        price: ShopifyMoney;
        product: {
          handle: string;
          title: string;
          featuredImage: ShopifyImage;
        };
      };
    }[];
  };
};

function mapImage(image: ShopifyImage): ProductImage | null {
  if (!image) return null;
  return {
    url: image.url,
    altText: image.altText,
    width: image.width,
    height: image.height,
  };
}

export function mapProductCard(product: ShopifyProductCard): Product {
  return {
    id: product.id,
    handle: product.handle,
    title: product.title,
    description: "",
    descriptionHtml: "",
    featuredImage: mapImage(product.featuredImage),
    images: product.featuredImage ? [mapImage(product.featuredImage)!] : [],
    priceRange: product.priceRange,
    options: [],
    variants: [],
  };
}

export function mapProduct(product: ShopifyProduct): Product {
  const variants: ProductVariant[] = product.variants.nodes.map((variant) => ({
    id: variant.id,
    title: variant.title,
    availableForSale: variant.availableForSale,
    price: variant.price,
    compareAtPrice: variant.compareAtPrice,
    selectedOptions: variant.selectedOptions,
    image: mapImage(variant.image),
  }));

  return {
    id: product.id,
    handle: product.handle,
    title: product.title,
    description: product.description,
    descriptionHtml: product.descriptionHtml,
    featuredImage: mapImage(product.featuredImage),
    images: product.images.nodes.map((image) => mapImage(image)!),
    priceRange: product.priceRange,
    options: product.options,
    variants,
  };
}

export function mapCart(cart: ShopifyCart): Cart {
  return {
    id: cart.id,
    checkoutUrl: cart.checkoutUrl,
    totalQuantity: cart.totalQuantity,
    cost: cart.cost,
    lines: cart.lines.nodes.map((line) => ({
      id: line.id,
      quantity: line.quantity,
      cost: line.cost,
      merchandise: {
        id: line.merchandise.id,
        title: line.merchandise.title,
        price: line.merchandise.price,
        selectedOptions: line.merchandise.selectedOptions,
        product: {
          handle: line.merchandise.product.handle,
          title: line.merchandise.product.title,
          featuredImage: mapImage(line.merchandise.product.featuredImage),
        },
      },
    })),
  };
}

import type {
  Cart,
  Collection,
  CollectionSummary,
  Product,
  ProductCollectionRef,
  ProductImage,
  ProductVariant,
  SeoContent,
} from "./types";
import { normalizeCheckoutUrl } from "./config";

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

type ShopifyCategory = {
  id: string;
  name: string;
} | null;

type ShopifySeo = {
  title?: string | null;
  description?: string | null;
} | null;

type ShopifyProductCard = {
  id: string;
  handle: string;
  title: string;
  updatedAt?: string | null;
  seo?: ShopifySeo;
  collections?: { nodes: ProductCollectionRef[] };
  category?: ShopifyCategory;
  featuredImage: ShopifyImage;
  images?: { nodes: NonNullable<ShopifyImage>[] };
  priceRange: {
    minVariantPrice: ShopifyMoney;
    maxVariantPrice: ShopifyMoney;
  };
  options?: { id: string; name: string; values: string[] }[];
  variants?: {
    nodes: {
      id: string;
      title: string;
      sku?: string | null;
      availableForSale: boolean;
      selectedOptions: { name: string; value: string }[];
      price: ShopifyMoney;
      compareAtPrice: ShopifyMoney | null;
      image: ShopifyImage;
    }[];
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
      sku?: string | null;
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
  discountCodes?: { applicable: boolean; code: string }[];
  discountAllocations?: { discountedAmount: ShopifyMoney }[];
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

function mapSeo(seo: ShopifySeo | undefined): SeoContent {
  return {
    title: seo?.title?.trim() || null,
    description: seo?.description?.trim() || null,
  };
}

function mapVariant(
  variant: NonNullable<ShopifyProductCard["variants"]>["nodes"][number],
): ProductVariant {
  return {
    id: variant.id,
    title: variant.title,
    sku: variant.sku?.trim() || null,
    availableForSale: variant.availableForSale,
    price: variant.price,
    compareAtPrice: variant.compareAtPrice,
    selectedOptions: variant.selectedOptions,
    image: mapImage(variant.image),
  };
}

export function mapProductCard(product: ShopifyProductCard): Product {
  const variants: ProductVariant[] = (product.variants?.nodes ?? []).map(
    mapVariant,
  );

  const gallery = (product.images?.nodes ?? [])
    .map((image) => mapImage(image))
    .filter((image): image is ProductImage => Boolean(image));
  const featured = mapImage(product.featuredImage);
  const images =
    gallery.length > 0 ? gallery : featured ? [featured] : [];

  return {
    id: product.id,
    handle: product.handle,
    title: product.title,
    description: "",
    descriptionHtml: "",
    updatedAt: product.updatedAt ?? null,
    seo: mapSeo(product.seo),
    collections: product.collections?.nodes ?? [],
    category: product.category
      ? { id: product.category.id, name: product.category.name }
      : null,
    featuredImage: featured,
    images,
    priceRange: product.priceRange,
    options: product.options ?? [],
    variants,
  };
}

export function mapProduct(product: ShopifyProduct): Product {
  const variants: ProductVariant[] = product.variants.nodes.map(mapVariant);

  return {
    id: product.id,
    handle: product.handle,
    title: product.title,
    description: product.description,
    descriptionHtml: product.descriptionHtml,
    updatedAt: product.updatedAt ?? null,
    seo: mapSeo(product.seo),
    collections: product.collections?.nodes ?? [],
    category: product.category
      ? { id: product.category.id, name: product.category.name }
      : null,
    featuredImage: mapImage(product.featuredImage),
    images: product.images.nodes.map((image) => mapImage(image)!),
    priceRange: product.priceRange,
    options: product.options,
    variants,
  };
}

type ShopifyCollectionCard = {
  id: string;
  handle: string;
  title: string;
  description: string;
  updatedAt?: string | null;
  seo?: ShopifySeo;
  image: ShopifyImage;
  products?: { nodes: { id?: string; featuredImage: ShopifyImage }[] };
};

type ShopifyCollection = ShopifyCollectionCard & {
  descriptionHtml: string;
  products: { nodes: ShopifyProductCard[] };
};

export function mapCollectionCard(
  collection: ShopifyCollectionCard,
): CollectionSummary {
  const seen = new Set<string>();
  const sampleImages: ProductImage[] = [];

  for (const node of collection.products?.nodes ?? []) {
    const image = mapImage(node.featuredImage);
    if (!image?.url) continue;
    const key = image.url.split("?")[0] ?? image.url;
    if (seen.has(key)) continue;
    seen.add(key);
    sampleImages.push(image);
  }

  const productIds = (collection.products?.nodes ?? [])
    .map((node) => node.id)
    .filter((id): id is string => Boolean(id));

  return {
    id: collection.id,
    handle: collection.handle,
    title: collection.title,
    description: collection.description,
    updatedAt: collection.updatedAt ?? null,
    seo: mapSeo(collection.seo),
    image: mapImage(collection.image) ?? sampleImages[0] ?? null,
    productCount: productIds.length || (collection.products?.nodes?.length ?? 0),
    productIds,
    sampleImages,
  };
}

export function mapCollection(collection: ShopifyCollection): Collection {
  return {
    ...mapCollectionCard(collection),
    descriptionHtml: collection.descriptionHtml,
    products: collection.products.nodes.map(mapProductCard),
  };
}

function mapDiscountTotal(
  allocations: { discountedAmount: ShopifyMoney }[] | undefined,
): ShopifyMoney | null {
  if (!allocations?.length) return null;
  let total = 0;
  let currencyCode = allocations[0]?.discountedAmount.currencyCode;
  for (const allocation of allocations) {
    const amount = Number(allocation.discountedAmount.amount);
    if (!Number.isFinite(amount) || amount <= 0) continue;
    total += amount;
    currencyCode = allocation.discountedAmount.currencyCode;
  }
  if (!currencyCode || total <= 0) return null;
  return { amount: total.toFixed(2), currencyCode };
}

export function mapCart(cart: ShopifyCart): Cart {
  return {
    id: cart.id,
    checkoutUrl: normalizeCheckoutUrl(cart.checkoutUrl),
    totalQuantity: cart.totalQuantity,
    cost: cart.cost,
    discountCodes: (cart.discountCodes ?? []).map((entry) => ({
      code: entry.code,
      applicable: entry.applicable,
    })),
    discountTotal: mapDiscountTotal(cart.discountAllocations),
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

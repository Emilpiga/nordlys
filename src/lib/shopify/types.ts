export type Money = {
  amount: string;
  currencyCode: string;
};

export type ProductImage = {
  url: string;
  altText: string | null;
  width: number;
  height: number;
};

export type ProductVariant = {
  id: string;
  title: string;
  availableForSale: boolean;
  price: Money;
  compareAtPrice: Money | null;
  selectedOptions: { name: string; value: string }[];
  image: ProductImage | null;
};

export type ProductCategoryRef = {
  id: string;
  name: string;
};

export type ProductCategory = ProductCategoryRef & {
  productCount: number;
};

export type Product = {
  id: string;
  handle: string;
  title: string;
  description: string;
  descriptionHtml: string;
  category: ProductCategoryRef | null;
  featuredImage: ProductImage | null;
  images: ProductImage[];
  priceRange: {
    minVariantPrice: Money;
    maxVariantPrice: Money;
  };
  options: { id: string; name: string; values: string[] }[];
  variants: ProductVariant[];
};

export type CartLine = {
  id: string;
  quantity: number;
  merchandise: {
    id: string;
    title: string;
    product: {
      handle: string;
      title: string;
      featuredImage: ProductImage | null;
    };
    price: Money;
    selectedOptions: { name: string; value: string }[];
  };
  cost: {
    totalAmount: Money;
  };
};

export type Cart = {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  cost: {
    subtotalAmount: Money;
    totalAmount: Money;
  };
  lines: CartLine[];
};

export type CollectionSummary = {
  id: string;
  handle: string;
  title: string;
  description: string;
  image: ProductImage | null;
};

export type Collection = CollectionSummary & {
  descriptionHtml: string;
  products: Product[];
};

export type LocalizedText = Record<string, string>;

export type ReviewRecord = {
  id: string;
  rating: number;
  date: string;
  author: string;
  location: string;
  title: LocalizedText;
  body: LocalizedText;
};

export type LocalizedReview = {
  id: string;
  productHandle: string;
  rating: number;
  date: string;
  author: string;
  location: string;
  title: string;
  body: string;
};

export type ReviewSummary = {
  average: number;
  count: number;
};

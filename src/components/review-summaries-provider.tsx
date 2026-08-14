"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { ReviewSummary } from "@/lib/review-types";

const ReviewSummariesContext = createContext<Record<string, ReviewSummary>>({});

export function ReviewSummariesProvider({
  summaries,
  children,
}: {
  summaries: Record<string, ReviewSummary>;
  children: ReactNode;
}) {
  return (
    <ReviewSummariesContext.Provider value={summaries}>
      {children}
    </ReviewSummariesContext.Provider>
  );
}

export function useReviewSummary(handle: string): ReviewSummary | null {
  return useContext(ReviewSummariesContext)[handle] ?? null;
}

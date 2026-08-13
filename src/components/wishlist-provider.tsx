"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import {
  restoreWishlistAction,
  toggleWishlistAction,
} from "@/app/actions/wishlist";

type ToggleResult =
  | { ok: true; wishlistProductIds: string[]; added: boolean }
  | { ok: false; reason: "auth" | "error" };

type WishlistContextValue = {
  ids: string[];
  isSaved: (productId: string) => boolean;
  toggle: (productId: string) => Promise<ToggleResult>;
};

const WishlistContext = createContext<WishlistContextValue | null>(null);

const LOCAL_KEY = "harbor:wishlist:v1";

type LocalPayload = {
  customerId: string;
  productIds: string[];
};

function readLocalIds(customerId: string): string[] {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as LocalPayload;
    if (parsed?.customerId !== customerId || !Array.isArray(parsed.productIds)) {
      return [];
    }
    return parsed.productIds.filter((id): id is string => typeof id === "string");
  } catch {
    return [];
  }
}

function writeLocalIds(customerId: string, productIds: string[]) {
  try {
    const payload: LocalPayload = {
      customerId,
      productIds: Array.from(new Set(productIds)),
    };
    localStorage.setItem(LOCAL_KEY, JSON.stringify(payload));
  } catch {
    /* ignore quota / private mode */
  }
}

export function WishlistProvider({
  customerId,
  productIds: serverIds,
  children,
}: {
  customerId: string | null;
  productIds: string[];
  children: ReactNode;
}) {
  const router = useRouter();
  const [ids, setIdsState] = useState(serverIds);
  const restoredFor = useRef<string | null>(null);

  const persist = useCallback(
    (next: string[]) => {
      const unique = Array.from(new Set(next));
      setIdsState(unique);
      if (customerId) writeLocalIds(customerId, unique);
    },
    [customerId],
  );

  useEffect(() => {
    if (!customerId) {
      setIdsState([]);
      restoredFor.current = null;
      return;
    }

    if (serverIds.length > 0) {
      persist(serverIds);
      return;
    }

    const local = readLocalIds(customerId);
    setIdsState(local);

    // Rewrite the httpOnly cookie from localStorage once per customer session
    // when the server copy is missing (common when metafield sync is blocked).
    if (local.length > 0 && restoredFor.current !== customerId) {
      restoredFor.current = customerId;
      void restoreWishlistAction(local).then((result) => {
        if (result.ok) {
          persist(result.wishlistProductIds);
          router.refresh();
        }
      });
    }
  }, [customerId, serverIds, persist, router]);

  const isSaved = useCallback(
    (productId: string) => ids.includes(productId),
    [ids],
  );

  const toggle = useCallback(
    async (productId: string): Promise<ToggleResult> => {
      const result = await toggleWishlistAction(productId);
      if (result.ok) {
        persist(result.wishlistProductIds);
      }
      return result;
    },
    [persist],
  );

  return (
    <WishlistContext.Provider value={{ ids, isSaved, toggle }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used within WishlistProvider");
  }
  return context;
}

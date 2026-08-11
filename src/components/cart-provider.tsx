"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Cart } from "@/lib/shopify/types";

type CartContextValue = {
  cart: Cart | null;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  setCart: (cart: Cart | null) => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({
  cart: serverCart,
  children,
}: {
  cart: Cart | null;
  children: ReactNode;
}) {
  const [cart, setCart] = useState(serverCart);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setCart(serverCart);
  }, [serverCart]);

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  return (
    <CartContext.Provider
      value={{
        cart,
        isOpen,
        openCart,
        closeCart,
        setCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
}

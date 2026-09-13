"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { STORAGE_KEY, parseStored, type CartItem } from "@/lib/cart-storage";

export type { CartItem };

type CartContextValue = {
  items: CartItem[];
  count: number;
  addItem: (productId: string) => void;
  removeItem: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setItems(parseStored(localStorage.getItem(STORAGE_KEY)));
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, loaded]);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      count: items.reduce((n, item) => n + item.quantity, 0),
      addItem: (productId) =>
        setItems((prev) => {
          const existing = prev.find((item) => item.productId === productId);
          if (existing) {
            return prev.map((item) =>
              item.productId === productId ? { ...item, quantity: item.quantity + 1 } : item
            );
          }
          return [...prev, { productId, quantity: 1 }];
        }),
      removeItem: (productId) => setItems((prev) => prev.filter((item) => item.productId !== productId)),
      setQuantity: (productId, quantity) =>
        setItems((prev) => {
          if (quantity <= 0) return prev.filter((item) => item.productId !== productId);
          return prev.map((item) => (item.productId === productId ? { ...item, quantity } : item));
        }),
      clear: () => setItems([]),
    }),
    [items]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}

"use client";

import { useCart } from "./cart-context";

export function AddToCartButton({ productId, available }: { productId: string; available: boolean }) {
  const { items, addItem } = useCart();
  const quantity = items.find((item) => item.productId === productId)?.quantity ?? 0;

  return (
    <button type="button" className="button" disabled={!available} onClick={() => addItem(productId)}>
      {quantity > 0 ? `In cart (${quantity})` : "Add to cart"}
    </button>
  );
}

import { getProduct } from "@/lib/store";
import type { OrderItem } from "@/types/domain";

export type CartPricing =
  | { ok: true; items: OrderItem[]; subtotal: number }
  | { ok: false; error: string };

/**
 * Prices a client-supplied cart against the store's own product records.
 *
 * The one place carts turn into money. Both POST /api/orders and the coupon
 * preview endpoint price the same cart, and they must agree exactly — a
 * preview that accepted a cart the order route rejects (or priced it
 * differently) would quote the customer a total they cannot pay. Nothing
 * price-shaped on the input is read: only productId and quantity.
 *
 * Two documented defects are preserved deliberately, see
 * docs/coverage-findings.md #5 (Number() accepts "3", 3.0 and exotic numeric
 * forms) and #6 (a repeated productId becomes two lines rather than merging).
 */
export const priceCart = (items: unknown[]): CartPricing => {
  const priced: OrderItem[] = [];

  for (const raw of items) {
    if (typeof raw !== "object" || raw === null) return { ok: false, error: "Invalid item" };
    const entry = raw as Record<string, unknown>;
    const productId = typeof entry.productId === "string" ? entry.productId : "";
    const quantity = Number(entry.quantity);
    const product = getProduct(productId);
    if (!product) return { ok: false, error: `Unknown product: ${productId}` };
    if (!product.available) return { ok: false, error: `${product.name} is not available` };
    if (!Number.isInteger(quantity) || quantity < 1) return { ok: false, error: "Invalid quantity" };
    priced.push({
      productId: product.id,
      productName: product.name,
      unitPrice: product.price,
      quantity,
      subtotal: product.price * quantity,
    });
  }

  return { ok: true, items: priced, subtotal: priced.reduce((sum, item) => sum + item.subtotal, 0) };
};

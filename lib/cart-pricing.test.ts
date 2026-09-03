import { beforeEach, describe, expect, it } from "vitest";
import { priceCart } from "@/lib/cart-pricing";
import { updateProduct } from "@/lib/store";
import { resetStore } from "@/tests/support/store";

const ok = (result: ReturnType<typeof priceCart>) => (result.ok ? result : undefined);
const errorOf = (result: ReturnType<typeof priceCart>) => (result.ok ? undefined : result.error);

beforeEach(() => resetStore());

describe("priceCart", () => {
  it("prices a line from the store, ignoring anything price-shaped on the input", () => {
    const result = priceCart([{ productId: "espresso", quantity: 2, unitPrice: 1, subtotal: 1, price: 1 }]);
    expect(ok(result)?.items).toEqual([
      { productId: "espresso", productName: "Espresso", unitPrice: 12000, quantity: 2, subtotal: 24000 },
    ]);
    expect(ok(result)?.subtotal).toBe(24000);
  });

  it("sums across lines", () => {
    const result = priceCart([
      { productId: "espresso", quantity: 2 },
      { productId: "cookie", quantity: 3 },
    ]);
    expect(ok(result)?.subtotal).toBe(12000 * 2 + 11000 * 3);
  });

  it("prices an empty cart as zero", () => {
    // Callers reject empty carts themselves, before their own body validation
    // order would be disturbed; this function has no opinion about it.
    expect(priceCart([])).toEqual({ ok: true, items: [], subtotal: 0 });
  });

  it("rejects an unknown product by id", () => {
    expect(errorOf(priceCart([{ productId: "nope", quantity: 1 }]))).toBe("Unknown product: nope");
  });

  it("rejects an unavailable product by name", () => {
    updateProduct("espresso", { available: false });
    expect(errorOf(priceCart([{ productId: "espresso", quantity: 1 }]))).toBe("Espresso is not available");
  });

  it("rejects a non-object item", () => {
    expect(errorOf(priceCart(["espresso"]))).toBe("Invalid item");
  });

  it("rejects zero, negative and fractional quantities", () => {
    for (const quantity of [0, -1, 1.5]) {
      expect(errorOf(priceCart([{ productId: "espresso", quantity }]))).toBe("Invalid quantity");
    }
  });

  it("checks the product before the quantity", () => {
    // Pinned: an unknown id with a bad quantity reports the id, which is the
    // more actionable of the two faults.
    expect(errorOf(priceCart([{ productId: "nope", quantity: 0 }]))).toBe("Unknown product: nope");
  });

  it("accepts numeric-string quantities", () => {
    // NOTE: current behavior, pinned deliberately. Number("3") is 3, so a
    // string quantity prices fine. See docs/coverage-findings.md #5.
    expect(ok(priceCart([{ productId: "espresso", quantity: "3" }]))?.subtotal).toBe(36000);
  });

  it("keeps a repeated product as two separate lines", () => {
    // NOTE: current behavior, pinned deliberately. Lines are never merged, so
    // the same product can appear twice. See docs/coverage-findings.md #6.
    const result = priceCart([
      { productId: "espresso", quantity: 1 },
      { productId: "espresso", quantity: 1 },
    ]);
    expect(ok(result)?.items).toHaveLength(2);
    expect(ok(result)?.subtotal).toBe(24000);
  });
});

import { describe, expect, it } from "vitest";
import { formatPrice } from "@/lib/format";

describe("formatPrice", () => {
  it("renders integer cents as Turkish lira", () => {
    // Espresso is 12000 in data/products.json.
    expect(formatPrice(12000)).toBe("₺120,00");
  });

  it("renders zero", () => {
    expect(formatPrice(0)).toBe("₺0,00");
  });
});

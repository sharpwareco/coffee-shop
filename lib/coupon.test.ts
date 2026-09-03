import { describe, expect, it } from "vitest";
import { evaluateCoupon, normalizeCouponCode } from "@/lib/coupon";
import type { Coupon } from "@/types/domain";

const NOW = new Date("2026-09-03T12:00:00.000Z");

const makeCoupon = (overrides: Partial<Coupon> = {}): Coupon => ({
  code: "WELCOME50",
  description: "Welcome discount",
  amountOff: 5000,
  minSubtotal: 0,
  expiresAt: null,
  active: true,
  ...overrides,
});

const reasonOf = (coupon: Coupon | undefined, subtotal: number, now: Date = NOW) => {
  const result = evaluateCoupon(coupon, subtotal, now);
  return result.ok ? undefined : result.reason;
};

describe("normalizeCouponCode", () => {
  it("trims and uppercases", () => {
    expect(normalizeCouponCode(" welcome50 ")).toBe("WELCOME50");
  });

  it("leaves an already canonical code alone", () => {
    expect(normalizeCouponCode("WELCOME50")).toBe("WELCOME50");
  });

  it("does not strip separators", () => {
    // Deliberately narrow: "WELCOME-50" is a different code, not a typo we fix.
    expect(normalizeCouponCode("welcome-50")).toBe("WELCOME-50");
    expect(normalizeCouponCode("wel come50")).toBe("WEL COME50");
  });

  it("collapses an all-whitespace code to the empty string", () => {
    expect(normalizeCouponCode("   ")).toBe("");
  });
});

describe("evaluateCoupon", () => {
  it("discounts by the coupon amount and hands the coupon back", () => {
    const coupon = makeCoupon();
    expect(evaluateCoupon(coupon, 20000, NOW)).toEqual({ ok: true, discount: 5000, coupon });
  });

  it("rejects an unknown coupon", () => {
    expect(evaluateCoupon(undefined, 20000, NOW).ok).toBe(false);
  });

  it("rejects an inactive coupon without revealing that the code exists", () => {
    // The two messages must be byte-identical: a different message for an
    // inactive code would confirm to a stranger that the code is real.
    expect(reasonOf(makeCoupon({ active: false }), 20000)).toBe(reasonOf(undefined, 20000));
  });

  it("reports an expired coupon by name", () => {
    const coupon = makeCoupon({ expiresAt: "2026-06-30T23:59:59.000Z" });
    expect(reasonOf(coupon, 20000)).toBe("Coupon WELCOME50 has expired");
  });

  it("treats a null expiry as never expiring", () => {
    const farFuture = new Date("2099-01-01T00:00:00.000Z");
    expect(evaluateCoupon(makeCoupon({ expiresAt: null }), 20000, farFuture).ok).toBe(true);
  });

  it("treats the expiry instant itself as expired", () => {
    // NOTE: the boundary is pinned deliberately. expiresAt is the moment the
    // coupon stops working, not the last moment it works.
    const coupon = makeCoupon({ expiresAt: NOW.toISOString() });
    expect(evaluateCoupon(coupon, 20000, NOW).ok).toBe(false);
    expect(evaluateCoupon(coupon, 20000, new Date(NOW.getTime() - 1)).ok).toBe(true);
  });

  it("accepts a subtotal exactly equal to minSubtotal", () => {
    const coupon = makeCoupon({ minSubtotal: 20000 });
    expect(evaluateCoupon(coupon, 20000, NOW)).toEqual({ ok: true, discount: 5000, coupon });
  });

  it("rejects a subtotal one cent below minSubtotal, naming the threshold", () => {
    const coupon = makeCoupon({ minSubtotal: 20000 });
    expect(reasonOf(coupon, 19999)).toBe("Coupon WELCOME50 requires a minimum of ₺200,00");
  });

  it("clamps a discount larger than the subtotal", () => {
    const coupon = makeCoupon({ amountOff: 30000 });
    expect(evaluateCoupon(coupon, 11000, NOW)).toEqual({ ok: true, discount: 11000, coupon });
  });

  it("clamps exactly to the subtotal so the total can reach zero but never go below", () => {
    const coupon = makeCoupon({ amountOff: 30000 });
    const result = evaluateCoupon(coupon, 11000, NOW);
    expect(result.ok && 11000 - result.discount).toBe(0);
  });

  it("checks existence before expiry, and expiry before the minimum", () => {
    // Order matters: a customer holding an expired coupon should be told it
    // expired, not that their cart is too small.
    const coupon = makeCoupon({ expiresAt: "2026-06-30T23:59:59.000Z", minSubtotal: 90000 });
    expect(reasonOf(coupon, 20000)).toBe("Coupon WELCOME50 has expired");
  });

  it("checks active before expiry", () => {
    const coupon = makeCoupon({ active: false, expiresAt: "2026-06-30T23:59:59.000Z" });
    expect(reasonOf(coupon, 20000)).toBe(reasonOf(undefined, 20000));
  });
});

import { formatPrice } from "@/lib/format";
import type { Coupon } from "@/types/domain";

export type CouponEvaluation =
  // The accepted coupon comes back with the verdict so callers can record it
  // without a redundant lookup or a non-null assertion: ok:true is reachable
  // only for a coupon that exists, but the union alone cannot show that.
  | { ok: true; discount: number; coupon: Coupon }
  | { ok: false; reason: string };

/**
 * Customer input -> the canonical stored form. Trim and uppercase, nothing
 * else: "WELCOME-50" is a different code, not a typo to be repaired.
 *
 * Every caller must funnel through this. The validate endpoint and the order
 * route both look coupons up, and two normalizations would eventually disagree
 * about which strings mean the same coupon.
 */
export const normalizeCouponCode = (input: string) => input.trim().toUpperCase();

/**
 * An unknown code and an inactive one deliberately produce the SAME message.
 * A distinct "this coupon is switched off" would confirm to a stranger that
 * the code is real, which is exactly what guessing at codes is looking for.
 */
const NOT_VALID = "That coupon code is not valid";

/**
 * Decides what a coupon is worth on one cart. Pure: `now` is a parameter so
 * expiry behaviour is testable without touching the clock, and the subtotal is
 * passed in already computed from server-side product prices.
 *
 * Rules are checked existence -> active -> expiry -> minimum, so the customer
 * gets the most actionable message rather than the first one that happens to
 * fail.
 */
export const evaluateCoupon = (
  coupon: Coupon | undefined,
  subtotal: number,
  now: Date
): CouponEvaluation => {
  if (!coupon || !coupon.active) return { ok: false, reason: NOT_VALID };

  // expiresAt is the instant the coupon stops working, not the last instant it
  // works — so the boundary itself is expired.
  if (coupon.expiresAt !== null && Date.parse(coupon.expiresAt) <= now.getTime()) {
    return { ok: false, reason: `Coupon ${coupon.code} has expired` };
  }

  if (subtotal < coupon.minSubtotal) {
    return {
      ok: false,
      reason: `Coupon ${coupon.code} requires a minimum of ${formatPrice(coupon.minSubtotal)}`,
    };
  }

  // A coupon worth more than the cart empties it; it never pays the customer.
  return { ok: true, discount: Math.min(coupon.amountOff, subtotal), coupon };
};

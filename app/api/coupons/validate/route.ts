import { NextResponse } from "next/server";
import { getCoupon } from "@/lib/store";
import { evaluateCoupon, normalizeCouponCode } from "@/lib/coupon";
import { priceCart } from "@/lib/cart-pricing";

const badRequest = (error: string) => NextResponse.json({ error }, { status: 400 });

/**
 * Preview endpoint for the checkout coupon field. Public on purpose: it is a
 * storefront affordance and it grants nothing — POST /api/orders re-evaluates
 * the coupon from scratch, so this response carries no authority.
 *
 * The subtotal is computed here from the store's own product prices, through
 * the same priceCart the order route uses — so the preview cannot accept a
 * cart the order route would reject, or price one differently. Nothing
 * price-shaped on the request is read: a client-supplied subtotal could
 * otherwise lie its way past `minSubtotal`.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest("Invalid JSON body");
  }

  if (typeof body !== "object" || body === null) return badRequest("Invalid request body");

  const { code, items } = body as Record<string, unknown>;

  const normalized = typeof code === "string" ? normalizeCouponCode(code) : "";
  if (!normalized) return badRequest("Coupon code is required");
  if (!Array.isArray(items) || items.length === 0) return badRequest("Cart is empty");

  const pricing = priceCart(items);
  if (!pricing.ok) return badRequest(pricing.error);
  const subtotal = pricing.subtotal;

  const evaluation = evaluateCoupon(getCoupon(normalized), subtotal, new Date());
  if (!evaluation.ok) return badRequest(evaluation.reason);

  return NextResponse.json({
    code: normalized,
    discount: evaluation.discount,
    subtotal,
    total: subtotal - evaluation.discount,
  });
}

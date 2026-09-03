import { NextResponse } from "next/server";
import { getCoupon, getProduct } from "@/lib/store";
import { evaluateCoupon, normalizeCouponCode } from "@/lib/coupon";

const badRequest = (error: string) => NextResponse.json({ error }, { status: 400 });

/**
 * Preview endpoint for the checkout coupon field. Public on purpose: it is a
 * storefront affordance and it grants nothing — POST /api/orders re-evaluates
 * the coupon from scratch, so this response carries no authority.
 *
 * The subtotal is computed here from the store's own product prices. Nothing
 * price-shaped on the request is read: a client-supplied subtotal could lie its
 * way past `minSubtotal`, and item validation mirrors POST /api/orders so the
 * preview rejects the same carts the order route would.
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

  let subtotal = 0;
  for (const raw of items) {
    if (typeof raw !== "object" || raw === null) return badRequest("Invalid item");
    const entry = raw as Record<string, unknown>;
    const productId = typeof entry.productId === "string" ? entry.productId : "";
    const quantity = Number(entry.quantity);
    const product = getProduct(productId);
    if (!product) return badRequest(`Unknown product: ${productId}`);
    if (!product.available) return badRequest(`${product.name} is not available`);
    if (!Number.isInteger(quantity) || quantity < 1) return badRequest("Invalid quantity");
    subtotal += product.price * quantity;
  }

  const evaluation = evaluateCoupon(getCoupon(normalized), subtotal, new Date());
  if (!evaluation.ok) return badRequest(evaluation.reason);

  return NextResponse.json({
    code: normalized,
    discount: evaluation.discount,
    subtotal,
    total: subtotal - evaluation.discount,
  });
}

import { NextResponse } from "next/server";
import { createOrder, getCoupon } from "@/lib/store";
import { evaluateCoupon, normalizeCouponCode } from "@/lib/coupon";
import { priceCart } from "@/lib/cart-pricing";
import type { AppliedCoupon } from "@/types/domain";

const badRequest = (error: string) => NextResponse.json({ error }, { status: 400 });

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest("Invalid JSON body");
  }

  if (typeof body !== "object" || body === null) return badRequest("Invalid request body");

  const { customer, items, card, couponCode } = body as Record<string, unknown>;

  if (typeof customer !== "object" || customer === null) return badRequest("Missing customer");
  if (!Array.isArray(items) || items.length === 0) return badRequest("Cart is empty");
  if (typeof card !== "object" || card === null) return badRequest("Missing card");

  const c = customer as Record<string, unknown>;
  const name = typeof c.name === "string" ? c.name.trim() : "";
  const email = typeof c.email === "string" ? c.email.trim() : "";
  const phone = typeof c.phone === "string" ? c.phone.trim() : "";
  const address = typeof c.address === "string" ? c.address.trim() : "";
  if (!name || !email || !phone || !address) return badRequest("Missing customer fields");
  if (!email.includes("@")) return badRequest("Invalid email");

  const pricing = priceCart(items);
  if (!pricing.ok) return badRequest(pricing.error);
  const orderItems = pricing.items;

  const k = card as Record<string, unknown>;
  const number = typeof k.number === "string" ? k.number.replace(/\D/g, "") : "";
  const expiry = typeof k.expiry === "string" ? k.expiry.trim() : "";
  const cvc = typeof k.cvc === "string" ? k.cvc.trim() : "";

  if (!/^\d{16}$/.test(number)) return badRequest("Invalid card number");
  if (!/^\d{3,4}$/.test(cvc)) return badRequest("Invalid CVC");

  const expiryMatch = /^(\d{2})\/(\d{2})$/.exec(expiry);
  if (!expiryMatch) return badRequest("Invalid expiry (use MM/YY)");
  const month = Number(expiryMatch[1]);
  const year = 2000 + Number(expiryMatch[2]);
  const now = new Date();
  const currentMonth = now.getFullYear() * 12 + now.getMonth();
  const expiryMonth = year * 12 + (month - 1);
  if (month < 1 || month > 12 || expiryMonth <= currentMonth) return badRequest("Card is expired");

  const subtotal = pricing.subtotal;

  // The coupon is re-evaluated here from scratch: /api/coupons/validate is a
  // preview, and nothing it returned is carried over or trusted. Only the code
  // itself comes from the client; the discount is derived from the server-side
  // subtotal computed just above.
  const code = typeof couponCode === "string" ? normalizeCouponCode(couponCode) : "";
  let discount = 0;
  let appliedCoupon: AppliedCoupon | null = null;

  if (code) {
    const evaluation = evaluateCoupon(getCoupon(code), subtotal, new Date());
    // A coupon that has since expired, been switched off, or no longer clears
    // its minimum rejects the whole order. Silently placing it undiscounted
    // would charge more than the checkout page showed.
    if (!evaluation.ok) return badRequest(evaluation.reason);
    discount = evaluation.discount;
    appliedCoupon = { code: evaluation.coupon.code, amountOff: evaluation.coupon.amountOff };
  }

  const timestamp = new Date().toISOString();

  const order = createOrder({
    id: crypto.randomUUID(),
    customer: { name, email, phone, address },
    items: orderItems,
    subtotal,
    discount,
    coupon: appliedCoupon,
    total: subtotal - discount,
    payment: { method: "card", last4: number.slice(-4) },
    status: "pending",
    createdAt: timestamp,
    updatedAt: timestamp,
  });

  return NextResponse.json(order, { status: 201 });
}

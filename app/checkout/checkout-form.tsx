"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart, type CartItem } from "@/components/cart-context";
import { formatPrice } from "@/lib/format";
import { formatExpiry } from "@/lib/expiry";
import { errorMessage } from "@/lib/api-error";
import type { Product } from "@/types/domain";

/**
 * What the server told us when the code was applied, plus the cart it was
 * priced against. The discount is never recomputed here — the server owns
 * every eligibility rule — so if the cart moves the preview is dropped rather
 * than shown against a subtotal it was not evaluated for.
 */
type AppliedCoupon = { code: string; discount: number; cartKey: string };

export function CheckoutForm({ products }: { products: Product[] }) {
  const router = useRouter();
  const { items, clear } = useCart();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expiry, setExpiry] = useState("");
  const [couponInput, setCouponInput] = useState("");
  const [couponChecking, setCouponChecking] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [applied, setApplied] = useState<AppliedCoupon | null>(null);

  const rows = items
    .map((item) => ({ item, product: products.find((p) => p.id === item.productId) }))
    .filter((row): row is { item: CartItem; product: Product } => Boolean(row.product));

  const orderItems = rows.map(({ item }) => ({ productId: item.productId, quantity: item.quantity }));
  const cartKey = orderItems.map(({ productId, quantity }) => `${productId}:${quantity}`).join("|");

  const subtotal = rows.reduce((sum, row) => sum + row.product.price * row.item.quantity, 0);
  // A preview priced against a different cart is stale, not merely inaccurate:
  // showing it would quote a total the order route would refuse.
  const coupon = applied && applied.cartKey === cartKey ? applied : null;
  const couponWentStale = applied !== null && coupon === null;
  const total = subtotal - (coupon?.discount ?? 0);

  async function applyCoupon() {
    setCouponError(null);
    setCouponChecking(true);
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponInput, items: orderItems }),
      });
      const data: unknown = await res.json();
      if (!res.ok) {
        setApplied(null);
        setCouponError(errorMessage(data, "That coupon could not be applied"));
        return;
      }
      const preview = data as { code: string; discount: number };
      setApplied({ code: preview.code, discount: preview.discount, cartKey });
    } catch {
      setApplied(null);
      setCouponError("Network error. Please try again.");
    } finally {
      setCouponChecking(false);
    }
  }

  function removeCoupon() {
    setApplied(null);
    setCouponError(null);
    setCouponInput("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const form = new FormData(event.currentTarget);
    const payload = {
      customer: {
        name: form.get("name"),
        email: form.get("email"),
        phone: form.get("phone"),
        address: form.get("address"),
      },
      items: orderItems,
      card: {
        number: form.get("cardNumber"),
        expiry: form.get("expiry"),
        cvc: form.get("cvc"),
      },
      // Only the code travels: the order route re-evaluates it from scratch.
      ...(coupon ? { couponCode: coupon.code } : {}),
    };

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data: unknown = await res.json();
      if (!res.ok) {
        setError(errorMessage(data, "Something went wrong"));
        return;
      }
      clear();
      router.push(`/confirmation?orderId=${(data as { id: string }).id}`);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (rows.length === 0) {
    return (
      <main className="container">
        <section className="empty-state">
          <h1>Nothing to check out</h1>
          <p className="muted">Your cart is empty.</p>
          <Link href="/" className="button">Browse products</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="container page">
      <h1>Checkout</h1>
      <div className="checkout-layout">
        <form onSubmit={handleSubmit} className="checkout-form">
          <fieldset>
            <legend>Contact</legend>
            <label>Name<input name="name" required autoComplete="name" /></label>
            <label>Email<input name="email" type="email" required autoComplete="email" /></label>
            <label>Phone<input name="phone" type="tel" required autoComplete="tel" /></label>
            <label>Address<input name="address" required autoComplete="street-address" /></label>
          </fieldset>
          <fieldset>
            <legend>Payment</legend>
            <p className="muted">Demo checkout — no real card is charged.</p>
            <label>Card number<input name="cardNumber" inputMode="numeric" placeholder="4242 4242 4242 4242" required /></label>
            <div className="field-row">
              <label>Expiry<input name="expiry" placeholder="MM/YY" inputMode="numeric" value={expiry} onChange={(e) => setExpiry(formatExpiry(e.target.value))} required /></label>
              <label>CVC<input name="cvc" inputMode="numeric" placeholder="123" required /></label>
            </div>
          </fieldset>
          {error && <p className="form-error">{error}</p>}
          <button type="submit" className="button button-block" disabled={submitting}>
            {submitting ? "Placing order…" : `Pay ${formatPrice(total)}`}
          </button>
        </form>
        <aside className="summary-card">
          <h2>Order summary</h2>
          <ul className="summary-list">
            {rows.map(({ item, product }) => (
              <li key={product.id}>
                <span>{product.name} × {item.quantity}</span>
                <span>{formatPrice(product.price * item.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="coupon-field">
            {coupon ? (
              <div className="coupon-applied">
                <span className="muted">Coupon {coupon.code} applied</span>
                <button type="button" className="remove-btn" onClick={removeCoupon}>Remove</button>
              </div>
            ) : (
              <div className="coupon-row">
                <input
                  aria-label="Coupon code"
                  placeholder="Coupon code"
                  autoComplete="off"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                />
                <button
                  type="button"
                  className="button-secondary"
                  onClick={applyCoupon}
                  disabled={couponChecking || couponInput.trim() === ""}
                >
                  {couponChecking ? "Checking…" : "Apply"}
                </button>
              </div>
            )}
            {couponWentStale && <p className="muted">Your cart changed, so the coupon was cleared. Apply it again.</p>}
            {couponError && <p className="form-error">{couponError}</p>}
          </div>
          {coupon && (
            <ul className="summary-list">
              <li><span>Subtotal</span><span>{formatPrice(subtotal)}</span></li>
              <li><span>Discount</span><span>−{formatPrice(coupon.discount)}</span></li>
            </ul>
          )}
          <div className="cart-total">
            <span>Total</span>
            <strong>{formatPrice(total)}</strong>
          </div>
        </aside>
      </div>
    </main>
  );
}

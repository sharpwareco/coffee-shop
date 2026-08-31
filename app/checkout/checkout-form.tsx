"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart, type CartItem } from "@/components/cart-context";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/types/domain";

export function CheckoutForm({ products }: { products: Product[] }) {
  const router = useRouter();
  const { items, clear } = useCart();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rows = items
    .map((item) => ({ item, product: products.find((p) => p.id === item.productId) }))
    .filter((row): row is { item: CartItem; product: Product } => Boolean(row.product));

  const total = rows.reduce((sum, row) => sum + row.product.price * row.item.quantity, 0);

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
      items: items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
      card: {
        number: form.get("cardNumber"),
        expiry: form.get("expiry"),
        cvc: form.get("cvc"),
      },
    };

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data: unknown = await res.json();
      if (!res.ok) {
        setError(typeof data === "object" && data !== null && "error" in data && typeof (data as { error: unknown }).error === "string"
          ? (data as { error: string }).error
          : "Something went wrong");
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
              <label>Expiry<input name="expiry" placeholder="MM/YY" required /></label>
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
          <div className="cart-total">
            <span>Total</span>
            <strong>{formatPrice(total)}</strong>
          </div>
        </aside>
      </div>
    </main>
  );
}

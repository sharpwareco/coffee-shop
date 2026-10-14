"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart, type CartItem } from "@/components/cart-context";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/types/domain";

export function CartView({ products }: { products: Product[] }) {
  const { items, setQuantity, removeItem } = useCart();

  const rows = items
    .map((item) => ({ item, product: products.find((p) => p.id === item.productId) }))
    .filter((row): row is { item: CartItem; product: Product } => Boolean(row.product));

  const total = rows.reduce((sum, row) => sum + row.product.price * row.item.quantity, 0);

  if (rows.length === 0) {
    return (
      <main className="container">
        <section className="empty-state">
          <h1>Your cart is empty</h1>
          <p className="muted">Add something from the shop.</p>
          <Link href="/" className="button">Browse products</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="container page">
      <h1>Your cart</h1>
      <div className="cart-layout">
        <ul className="cart-list">
          {rows.map(({ item, product }) => (
            <li key={product.id} className="cart-row">
              <Image src={product.imageUrl} alt={product.name} width={80} height={80} className="cart-thumb" />
              <div className="cart-info">
                <h2>{product.name}</h2>
                <span className="muted">{formatPrice(product.price)} each</span>
              </div>
              <div className="qty-stepper">
                <button type="button" onClick={() => setQuantity(product.id, item.quantity - 1)} aria-label="Decrease quantity">−</button>
                <span>{item.quantity}</span>
                <button type="button" onClick={() => setQuantity(product.id, item.quantity + 1)} aria-label="Increase quantity">+</button>
              </div>
              <strong className="cart-line-total">{formatPrice(product.price * item.quantity)}</strong>
              <button type="button" className="remove-btn" onClick={() => removeItem(product.id)}>Remove</button>
            </li>
          ))}
        </ul>
        <aside className="cart-summary">
          <div className="cart-total">
            <span>Total</span>
            <strong>{formatPrice(total)}</strong>
          </div>
          <Link href="/checkout" className="button button-block">Checkout</Link>
          <Link href="/" className="button-secondary button-block">Continue shopping</Link>
        </aside>
      </div>
    </main>
  );
}

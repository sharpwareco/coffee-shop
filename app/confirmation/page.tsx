import Link from "next/link";
import { getOrder } from "@/lib/store";
import { formatPrice } from "@/lib/format";

export default async function Confirmation({ searchParams }: { searchParams: Promise<{ orderId?: string }> }) {
  const { orderId } = await searchParams;
  const order = orderId ? getOrder(orderId) : undefined;

  if (!order) {
    return (
      <main className="container">
        <section className="empty-state">
          <h1>Order not found</h1>
          <p className="muted">We couldn&apos;t find that order.</p>
          <Link href="/" className="button">Back to shop</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="container page">
      <section className="confirmation-card">
        <h1>Order confirmed</h1>
        <p className="muted">
          Thanks, {order.customer.name}. Your order is <strong>{order.status}</strong>.
        </p>
        <div className="summary-card">
          <h2>Order {order.id}</h2>
          <ul className="summary-list">
            {order.items.map((item) => (
              <li key={item.productId}>
                <span>{item.productName} × {item.quantity}</span>
                <span>{formatPrice(item.subtotal)}</span>
              </li>
            ))}
          </ul>
          <div className="cart-total">
            <span>Total</span>
            <strong>{formatPrice(order.total)}</strong>
          </div>
          <p className="muted">Paid with card ending in {order.payment.last4}</p>
        </div>
        <Link href="/" className="button">Continue shopping</Link>
      </section>
    </main>
  );
}

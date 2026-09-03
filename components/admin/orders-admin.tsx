"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AdminNav } from "./admin-nav";
import { formatPrice } from "@/lib/format";
import { errorMessage } from "@/lib/api-error";
import { formatDate } from "@/lib/date";
import type { Order, OrderStatus } from "@/types/domain";

const STATUSES: OrderStatus[] = ["pending", "preparing", "ready", "completed", "cancelled"];

export function OrdersAdmin({ orders }: { orders: Order[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  async function changeStatus(order: Order, status: OrderStatus) {
    if (status === order.status) return;
    setError(null);
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        setError(errorMessage(await res.json().catch(() => null), "Update failed"));
      }
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    }
  }

  return (
    <main className="container page">
      <AdminNav />
      <h1>Orders</h1>
      {error && <p className="form-error">{error}</p>}

      {orders.length === 0 ? (
        <section className="empty-state">
          <p className="muted">No orders yet.</p>
        </section>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Customer</th>
              <th>Items</th>
              <th>Total</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td>
                  <div className="mono">{order.id.slice(0, 8)}</div>
                  <div className="muted">{formatDate(order.createdAt)}</div>
                </td>
                <td>
                  <div>{order.customer.name}</div>
                  <div className="muted">{order.customer.email}</div>
                </td>
                <td className="order-items">
                  {order.items.map((item) => (
                    <div key={item.productId} className="order-item">
                      <div className="order-item-line">
                        <span>{item.quantity} × {item.productName}</span>
                        <span>{formatPrice(item.subtotal)}</span>
                      </div>
                      <div className="muted order-item-unit">{formatPrice(item.unitPrice)} each</div>
                    </div>
                  ))}
                </td>
                <td>
                  <div>{formatPrice(order.total)}</div>
                  {order.coupon && (
                    <div className="muted">
                      <span className="mono">{order.coupon.code}</span> −{formatPrice(order.discount)}
                      {order.discount < order.coupon.amountOff && (
                        <> (capped from {formatPrice(order.coupon.amountOff)})</>
                      )}
                    </div>
                  )}
                </td>
                <td>
                  <select value={order.status} onChange={(e) => changeStatus(order, e.target.value as OrderStatus)}>
                    {STATUSES.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}

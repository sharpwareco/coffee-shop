"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AdminNav } from "./admin-nav";
import { formatPrice } from "@/lib/format";
import type { Order, OrderStatus } from "@/types/domain";

const STATUSES: OrderStatus[] = ["pending", "preparing", "ready", "completed", "cancelled"];

const errorMessage = (data: unknown, fallback: string): string =>
  typeof data === "object" && data !== null && "error" in data && typeof (data as { error?: unknown }).error === "string"
    ? (data as { error: string }).error
    : fallback;

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
                <td className="mono">{order.id.slice(0, 8)}</td>
                <td>
                  <div>{order.customer.name}</div>
                  <div className="muted">{order.customer.email}</div>
                </td>
                <td>{order.items.reduce((n, item) => n + item.quantity, 0)}</td>
                <td>{formatPrice(order.total)}</td>
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

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AdminNav } from "@/components/admin/admin-nav";
import { formatDate } from "@/lib/date";
import { formatPrice } from "@/lib/format";
import { ADMIN_COOKIE, ADMIN_COOKIE_VALUE } from "@/lib/session";
import { listCoupons } from "@/lib/store";

export default async function AdminCouponsPage() {
  const jar = await cookies();
  if (jar.get(ADMIN_COOKIE)?.value !== ADMIN_COOKIE_VALUE) redirect("/admin/login");

  const coupons = listCoupons();

  return (
    <main className="container page">
      <AdminNav />
      <h1>Coupons</h1>

      {coupons.length === 0 ? (
        <section className="empty-state">
          <p className="muted">No coupons yet.</p>
        </section>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Description</th>
              <th>Amount off</th>
              <th>Minimum subtotal</th>
              <th>Expires</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {coupons.map((coupon) => (
              <tr key={coupon.code}>
                <td className="mono">{coupon.code}</td>
                <td>{coupon.description}</td>
                <td>{formatPrice(coupon.amountOff)}</td>
                <td>
                  {coupon.minSubtotal === 0 ? (
                    <span className="muted">No minimum</span>
                  ) : (
                    formatPrice(coupon.minSubtotal)
                  )}
                </td>
                <td>
                  {coupon.expiresAt === null ? (
                    <span className="muted">Never</span>
                  ) : (
                    formatDate(coupon.expiresAt)
                  )}
                </td>
                <td>{coupon.active ? "Active" : "Inactive"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}

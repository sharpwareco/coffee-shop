import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { OrdersAdmin } from "@/components/admin/orders-admin";
import { listOrders } from "@/lib/store";
import { ADMIN_COOKIE, ADMIN_COOKIE_VALUE } from "@/lib/session";

export default async function AdminOrdersPage() {
  const jar = await cookies();
  if (jar.get(ADMIN_COOKIE)?.value !== ADMIN_COOKIE_VALUE) redirect("/admin/login");

  return <OrdersAdmin orders={listOrders()} />;
}

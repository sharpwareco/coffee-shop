import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ProductsAdmin } from "@/components/admin/products-admin";
import { listProducts } from "@/lib/store";
import { ADMIN_COOKIE, ADMIN_COOKIE_VALUE } from "@/lib/session";

export default async function AdminProductsPage() {
  const jar = await cookies();
  if (jar.get(ADMIN_COOKIE)?.value !== ADMIN_COOKIE_VALUE) redirect("/admin/login");

  return <ProductsAdmin products={listProducts()} />;
}

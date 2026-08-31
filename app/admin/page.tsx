import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE, ADMIN_COOKIE_VALUE } from "@/lib/session";

export default async function AdminIndex() {
  const jar = await cookies();
  const authed = jar.get(ADMIN_COOKIE)?.value === ADMIN_COOKIE_VALUE;
  redirect(authed ? "/admin/products" : "/admin/login");
}

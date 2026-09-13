"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export function AdminNav() {
  const router = useRouter();

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <nav className="admin-nav">
      <Link href="/admin/products">Products</Link>
      <Link href="/admin/orders">Orders</Link>
      <button type="button" className="logout-btn" onClick={logout}>Log out</button>
    </nav>
  );
}

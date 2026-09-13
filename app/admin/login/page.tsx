import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/login-form";
import { ADMIN_COOKIE, ADMIN_COOKIE_VALUE } from "@/lib/session";

export default async function AdminLoginPage() {
  const jar = await cookies();
  if (jar.get(ADMIN_COOKIE)?.value === ADMIN_COOKIE_VALUE) redirect("/admin/products");

  return (
    <main className="container page">
      <section className="auth-card">
        <h1>Admin login</h1>
        <LoginForm />
      </section>
    </main>
  );
}

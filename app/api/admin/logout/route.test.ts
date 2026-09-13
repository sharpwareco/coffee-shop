import { describe, expect, it } from "vitest";
import { POST } from "./route";
import { ADMIN_COOKIE, isAdmin } from "@/lib/session";

describe("POST /api/admin/logout", () => {
  it("responds ok", async () => {
    const res = POST();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });

  it("expires the admin cookie", () => {
    const cookie = POST().headers.get("set-cookie") ?? "";
    expect(cookie).toContain(`${ADMIN_COOKIE}=`);
    expect(cookie).toContain("Max-Age=0");
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("Path=/");
  });

  it("leaves behind a cookie that no longer authenticates", () => {
    const cookie = (POST().headers.get("set-cookie") ?? "").split(";")[0];
    expect(isAdmin(new Request("http://test/api/products", { headers: { cookie } }))).toBe(false);
  });
});

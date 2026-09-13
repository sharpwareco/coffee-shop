import { describe, expect, it } from "vitest";
import { POST } from "./route";
import { ADMIN_COOKIE, ADMIN_COOKIE_VALUE, ADMIN_PASSWORD, ADMIN_USERNAME, isAdmin } from "@/lib/session";
import { jsonHeaders } from "@/tests/support/store";

const login = (body: unknown) =>
  POST(
    new Request("http://test/api/admin/login", {
      method: "POST",
      headers: jsonHeaders,
      body: typeof body === "string" ? body : JSON.stringify(body),
    })
  );

const errorOf = async (res: Response) => ((await res.json()) as { error: string }).error;

describe("POST /api/admin/login", () => {
  it("rejects malformed JSON", async () => {
    const res = await login("{not json");
    expect(res.status).toBe(400);
    expect(await errorOf(res)).toBe("Invalid JSON body");
  });

  it("rejects a non-object body", async () => {
    const res = await login("null");
    expect(res.status).toBe(400);
    expect(await errorOf(res)).toBe("Invalid body");
  });

  it.each([
    ["wrong username", { username: "root", password: ADMIN_PASSWORD }],
    ["wrong password", { username: ADMIN_USERNAME, password: "hunter2" }],
    ["both wrong", { username: "root", password: "hunter2" }],
    ["missing fields", {}],
    ["non-string credentials", { username: 1, password: 2 }],
  ])("rejects %s with 401", async (_label, body) => {
    const res = await login(body);
    expect(res.status).toBe(401);
    expect(await errorOf(res)).toBe("Invalid credentials");
  });

  it("compares the username case-sensitively", async () => {
    // Pins the exact `!==` comparison; adding .toLowerCase() would widen who
    // can authenticate and no other test would notice.
    const res = await login({ username: ADMIN_USERNAME.toUpperCase(), password: ADMIN_PASSWORD });
    expect(res.status).toBe(401);
  });

  it("compares the password case-sensitively", async () => {
    const res = await login({ username: ADMIN_USERNAME, password: ADMIN_PASSWORD.toUpperCase() });
    expect(res.status).toBe(401);
  });

  it("sets no cookie on a failed login", async () => {
    const res = await login({ username: "root", password: "hunter2" });
    expect(res.headers.get("set-cookie")).toBeNull();
  });

  it("accepts the correct credentials", async () => {
    const res = await login({ username: ADMIN_USERNAME, password: ADMIN_PASSWORD });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });

  it("issues a hardened session cookie", async () => {
    const res = await login({ username: ADMIN_USERNAME, password: ADMIN_PASSWORD });
    const cookie = res.headers.get("set-cookie") ?? "";

    expect(cookie).toContain(`${ADMIN_COOKIE}=${ADMIN_COOKIE_VALUE}`);
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("Path=/");
    expect(cookie).toContain("Max-Age=86400");
    expect(cookie.toLowerCase()).toContain("samesite=lax");
  });

  it("issues a cookie that isAdmin actually accepts", async () => {
    const res = await login({ username: ADMIN_USERNAME, password: ADMIN_PASSWORD });
    const cookie = (res.headers.get("set-cookie") ?? "").split(";")[0];
    expect(isAdmin(new Request("http://test/api/products", { headers: { cookie } }))).toBe(true);
  });
});

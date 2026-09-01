import { describe, expect, it } from "vitest";
import { ADMIN_COOKIE, ADMIN_COOKIE_VALUE, isAdmin } from "@/lib/session";

const withCookie = (cookie: string) =>
  new Request("http://test/api/products", { headers: { cookie } });

describe("isAdmin", () => {
  it("accepts the admin cookie", () => {
    expect(isAdmin(withCookie(`${ADMIN_COOKIE}=${ADMIN_COOKIE_VALUE}`))).toBe(true);
  });

  it("accepts the admin cookie alongside others", () => {
    expect(isAdmin(withCookie(`theme=dark; ${ADMIN_COOKIE}=${ADMIN_COOKIE_VALUE}; lang=tr`))).toBe(true);
  });

  it("rejects a request with no cookie header", () => {
    expect(isAdmin(new Request("http://test/api/products"))).toBe(false);
  });

  it("rejects an empty or unrelated cookie header", () => {
    expect(isAdmin(withCookie(""))).toBe(false);
    expect(isAdmin(withCookie("theme=dark"))).toBe(false);
  });

  it("rejects the admin cookie with the wrong value", () => {
    expect(isAdmin(withCookie(`${ADMIN_COOKIE}=nope`))).toBe(false);
    expect(isAdmin(withCookie(`${ADMIN_COOKIE}=`))).toBe(false);
  });

  it("rejects a cookie whose name merely ends with the admin cookie name", () => {
    // Guards the exact per-part comparison: a refactor to `header.includes(...)`
    // would let this through and silently open the admin gate.
    expect(isAdmin(withCookie(`not_${ADMIN_COOKIE}=${ADMIN_COOKIE_VALUE}`))).toBe(false);
    expect(isAdmin(withCookie(`x=${ADMIN_COOKIE}=${ADMIN_COOKIE_VALUE}`))).toBe(false);
  });
});

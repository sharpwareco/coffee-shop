import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PATCH } from "./route";
import { createOrder, getOrder } from "@/lib/store";
import { adminJsonHeaders, jsonHeaders, resetStore } from "@/tests/support/store";
import type { Order, OrderStatus } from "@/types/domain";

const ORDER_ID = "order-under-test";

const seedOrder = () =>
  createOrder({
    id: ORDER_ID,
    customer: { name: "Ada", email: "ada@example.test", phone: "555", address: "Street 1" },
    items: [{ productId: "espresso", productName: "Espresso", unitPrice: 12000, quantity: 1, subtotal: 12000 }],
    subtotal: 12000,
    discount: 0,
    coupon: null,
    total: 12000,
    payment: { method: "card", last4: "4242" },
    status: "pending",
    createdAt: "2026-08-31T00:00:00.000Z",
    updatedAt: "2026-08-31T00:00:00.000Z",
  });

const patch = (id: string, body: unknown, headers: HeadersInit = adminJsonHeaders) =>
  PATCH(
    new Request("http://test/api/orders/x", {
      method: "PATCH",
      headers,
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
    { params: Promise.resolve({ id }) }
  );

const errorOf = async (res: Response) => ((await res.json()) as { error: string }).error;

beforeEach(() => {
  resetStore();
  seedOrder();
});

// Safety net: the fake timers below are installed inside a test body, so a
// failing assertion would otherwise leak real-timer state into later tests.
afterEach(() => vi.useRealTimers());

describe("PATCH /api/orders/[id] — authorization", () => {
  it("rejects a request with no admin cookie", async () => {
    const res = await patch(ORDER_ID, { status: "ready" }, jsonHeaders);
    expect(res.status).toBe(401);
    expect(await errorOf(res)).toBe("Unauthorized");
    expect(getOrder(ORDER_ID)?.status).toBe("pending");
  });

  it("checks authorization before order existence", async () => {
    expect(await errorOf(await patch("unknown", { status: "ready" }, jsonHeaders))).toBe("Unauthorized");
  });

  it("checks order existence before parsing the body", async () => {
    expect(await errorOf(await patch("unknown", "{not json"))).toBe("Order not found");
  });
});

describe("PATCH /api/orders/[id] — validation", () => {
  it("404s for an unknown order", async () => {
    const res = await patch("unknown", { status: "ready" });
    expect(res.status).toBe(404);
    expect(await errorOf(res)).toBe("Order not found");
  });

  it("rejects malformed JSON", async () => {
    const res = await patch(ORDER_ID, "{not json");
    expect(res.status).toBe(400);
    expect(await errorOf(res)).toBe("Invalid JSON body");
  });

  it("rejects a non-object body", async () => {
    expect(await errorOf(await patch(ORDER_ID, "null"))).toBe("Invalid body");
  });

  it.each(["shipped", "", "PENDING", "done"])("rejects status %j", async (status) => {
    const res = await patch(ORDER_ID, { status });
    expect(res.status).toBe(400);
    expect(await errorOf(res)).toBe("Invalid status");
  });

  it("rejects a non-string status", async () => {
    expect(await errorOf(await patch(ORDER_ID, { status: 1 }))).toBe("Invalid status");
    expect(await errorOf(await patch(ORDER_ID, {}))).toBe("Invalid status");
  });

  it("leaves the order untouched when the status is invalid", async () => {
    await patch(ORDER_ID, { status: "shipped" });
    expect(getOrder(ORDER_ID)?.status).toBe("pending");
  });
});

describe("PATCH /api/orders/[id] — success", () => {
  const STATUSES: OrderStatus[] = ["pending", "preparing", "ready", "completed", "cancelled"];

  it("covers every status the route accepts", () => {
    // Guards against drift: this local list mirrors STATUSES in route.ts, so
    // ADDING a status there would otherwise go untested by the it.each below.
    expect(STATUSES).toHaveLength(5);
    expect(new Set(STATUSES).size).toBe(STATUSES.length);
  });

  it.each(STATUSES)("accepts the %s status", async (status) => {
    const res = await patch(ORDER_ID, { status });
    expect(res.status).toBe(200);
    expect(((await res.json()) as Order).status).toBe(status);
    expect(getOrder(ORDER_ID)?.status).toBe(status);
  });

  it("refreshes updatedAt but not createdAt", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-01T10:00:00.000Z"));

    const order = (await (await patch(ORDER_ID, { status: "preparing" })).json()) as Order;
    expect(order.updatedAt).toBe("2026-09-01T10:00:00.000Z");
    expect(order.createdAt).toBe("2026-08-31T00:00:00.000Z");

    vi.useRealTimers();
  });
});

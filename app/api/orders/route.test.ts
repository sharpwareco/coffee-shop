import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";
import { listOrders, updateProduct } from "@/lib/store";
import { jsonHeaders, resetStore } from "@/tests/support/store";
import type { Order } from "@/types/domain";

const NOW = new Date("2026-06-15T12:00:00.000Z");

const post = (body: unknown) =>
  POST(
    new Request("http://test/api/orders", {
      method: "POST",
      headers: jsonHeaders,
      body: typeof body === "string" ? body : JSON.stringify(body),
    })
  );

const validPayload = (overrides: Record<string, unknown> = {}) => ({
  customer: { name: "Ada Lovelace", email: "ada@example.test", phone: "5550001", address: "Analytical St 1" },
  items: [{ productId: "espresso", quantity: 2 }],
  card: { number: "4111111111111234", expiry: "12/30", cvc: "123" },
  ...overrides,
});

const errorOf = async (res: Response) => ((await res.json()) as { error: string }).error;

beforeEach(() => {
  resetStore();
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});

afterEach(() => vi.useRealTimers());

describe("POST /api/orders — body shape", () => {
  it("rejects malformed JSON", async () => {
    const res = await post("{not json");
    expect(res.status).toBe(400);
    expect(await errorOf(res)).toBe("Invalid JSON body");
  });

  it("rejects a non-object body", async () => {
    expect(await errorOf(await post("null"))).toBe("Invalid request body");
    expect(await errorOf(await post('"a string"'))).toBe("Invalid request body");
  });

  it("requires customer, items and card", async () => {
    expect(await errorOf(await post({ items: [], card: {} }))).toBe("Missing customer");
    expect(await errorOf(await post(validPayload({ items: undefined })))).toBe("Cart is empty");
    expect(await errorOf(await post(validPayload({ card: undefined })))).toBe("Missing card");
  });

  it("rejects an empty cart", async () => {
    expect(await errorOf(await post(validPayload({ items: [] })))).toBe("Cart is empty");
  });
});

describe("POST /api/orders — customer validation", () => {
  it.each(["name", "email", "phone", "address"])("rejects a blank %s", async (field) => {
    const customer = { ...validPayload().customer, [field]: "   " };
    const res = await post(validPayload({ customer }));
    expect(res.status).toBe(400);
    expect(await errorOf(res)).toBe("Missing customer fields");
  });

  it.each(["name", "email", "phone", "address"])(
    "treats a non-string %s as missing",
    async (field) => {
      const customer = { ...validPayload().customer, [field]: 42 };
      expect(await errorOf(await post(validPayload({ customer })))).toBe("Missing customer fields");
    }
  );

  it("treats an absent customer object as missing fields", async () => {
    expect(await errorOf(await post(validPayload({ customer: {} })))).toBe("Missing customer fields");
  });

  it.each(["not-an-email", "nope.example.test", "ada"])(
    "rejects email %s for having no @",
    async (email) => {
      // "nope.example.test" has a dot but no @, so this pins includes("@")
      // specifically rather than "contains some punctuation".
      const customer = { ...validPayload().customer, email };
      expect(await errorOf(await post(validPayload({ customer })))).toBe("Invalid email");
    }
  );

  it("trims customer fields before storing", async () => {
    const customer = { name: "  Ada  ", email: " ada@example.test ", phone: " 555 ", address: " Street 1 " };
    const order = (await (await post(validPayload({ customer }))).json()) as Order;
    expect(order.customer).toEqual({
      name: "Ada",
      email: "ada@example.test",
      phone: "555",
      address: "Street 1",
    });
  });
});

describe("POST /api/orders — item validation", () => {
  it("rejects a non-object item", async () => {
    expect(await errorOf(await post(validPayload({ items: ["espresso"] })))).toBe("Invalid item");
    expect(await errorOf(await post(validPayload({ items: [null] })))).toBe("Invalid item");
  });

  it("rejects an unknown product", async () => {
    const res = await post(validPayload({ items: [{ productId: "unicorn-latte", quantity: 1 }] }));
    expect(res.status).toBe(400);
    expect(await errorOf(res)).toBe("Unknown product: unicorn-latte");
  });

  it("reports a missing productId as an unknown product", async () => {
    expect(await errorOf(await post(validPayload({ items: [{ quantity: 1 }] })))).toBe("Unknown product: ");
  });

  it("rejects an unavailable product by name", async () => {
    updateProduct("espresso", { available: false });
    const res = await post(validPayload());
    expect(await errorOf(res)).toBe("Espresso is not available");
  });

  it.each([0, -1, 2.5])("rejects a quantity of %s", async (quantity) => {
    const res = await post(validPayload({ items: [{ productId: "espresso", quantity }] }));
    expect(res.status).toBe(400);
    expect(await errorOf(res)).toBe("Invalid quantity");
  });

  it("accepts a numeric-string quantity", async () => {
    // NOTE: current behavior, pinned deliberately. `Number(entry.quantity)`
    // coerces, so "3" passes as 3. See docs/coverage-findings.md #5.
    const order = (await (await post(validPayload({ items: [{ productId: "espresso", quantity: "3" }] }))).json()) as Order;
    expect(order.items[0].quantity).toBe(3);
  });

  it.each([
    ["a boolean", true, 1],
    ["a single-element array", ["3"], 3],
  ])("silently coerces %s quantity", async (_label, quantity, expected) => {
    // NOTE: current behavior, pinned deliberately. Number() coercion is much
    // wider than the documented string case. See docs/coverage-findings.md #5.
    const order = (await (await post(validPayload({ items: [{ productId: "espresso", quantity }] }))).json()) as Order;
    expect(order.items[0].quantity).toBe(expected);
  });

  it("accepts an absurdly large quantity with no upper bound", async () => {
    // NOTE: current behavior, pinned deliberately. Number.isInteger(1e21) is
    // true, so this persists a real order with a nonsense total.
    // See docs/coverage-findings.md #5.
    const res = await post(validPayload({ items: [{ productId: "espresso", quantity: 1e21 }] }));
    expect(res.status).toBe(201);
    expect(((await res.json()) as Order).total).toBe(12000 * 1e21);
  });

  it("reports an unknown product before an invalid quantity", async () => {
    // NOTE: the product lookup runs before the quantity check, so a bad
    // product id masks a bad quantity. See docs/coverage-findings.md #5.
    const res = await post(validPayload({ items: [{ productId: "nope", quantity: 0 }] }));
    expect(await errorOf(res)).toBe("Unknown product: nope");
  });

  it("keeps duplicate product ids as separate line items", async () => {
    // NOTE: current behavior, pinned deliberately. See findings #6.
    const items = [
      { productId: "espresso", quantity: 1 },
      { productId: "espresso", quantity: 2 },
    ];
    const order = (await (await post(validPayload({ items }))).json()) as Order;
    expect(order.items).toHaveLength(2);
    expect(order.total).toBe(12000 * 3);
  });
});

describe("POST /api/orders — card validation", () => {
  const withCard = (card: Record<string, unknown>) => post(validPayload({ card: { ...validPayload().card, ...card } }));

  it.each(["424242424242424", "42424242424242423", "abcd", ""])(
    "rejects card number %j",
    async (number) => {
      expect(await errorOf(await withCard({ number }))).toBe("Invalid card number");
    }
  );

  it("treats a non-string card number as invalid", async () => {
    expect(await errorOf(await withCard({ number: 4242424242424242 }))).toBe("Invalid card number");
  });

  it("treats a non-string CVC as invalid", async () => {
    expect(await errorOf(await withCard({ cvc: 123 }))).toBe("Invalid CVC");
  });

  it("treats a non-string expiry as malformed", async () => {
    expect(await errorOf(await withCard({ expiry: 1230 }))).toBe("Invalid expiry (use MM/YY)");
  });

  it("accepts a card number with spaces", async () => {
    const res = await withCard({ number: "4242 4242 4242 4242" });
    expect(res.status).toBe(201);
  });

  it.each(["12", "12345", "abc"])("rejects CVC %j", async (cvc) => {
    expect(await errorOf(await withCard({ cvc }))).toBe("Invalid CVC");
  });

  it("accepts a 3- and 4-digit CVC", async () => {
    expect((await withCard({ cvc: "123" })).status).toBe(201);
    expect((await withCard({ cvc: "1234" })).status).toBe(201);
  });

  it.each(["1230", "12-30", "1/30", "december", ""])(
    "rejects expiry %j as malformed",
    async (expiry) => {
      expect(await errorOf(await withCard({ expiry }))).toBe("Invalid expiry (use MM/YY)");
    }
  );

  it.each(["00", "13", "99"])("reports out-of-range month %s as 'expired'", async (month) => {
    // NOTE: current behavior, pinned deliberately. An out-of-range month is
    // MALFORMED, not expired — route.ts:65 folds both checks into one
    // condition, so the message misdescribes the fault.
    // See docs/coverage-findings.md #9.
    expect(await errorOf(await withCard({ expiry: `${month}/30` }))).toBe("Card is expired");
  });

  it("rejects a card whose expiry is in the past", async () => {
    expect(await errorOf(await withCard({ expiry: "05/26" }))).toBe("Card is expired");
    expect(await errorOf(await withCard({ expiry: "12/25" }))).toBe("Card is expired");
  });

  it("rejects a card expiring in the current month", async () => {
    // NOTE: current behavior, pinned deliberately. Cards are conventionally
    // valid THROUGH the end of their expiry month, so `expiryMonth <=
    // currentMonth` is almost certainly off by one.
    // See docs/coverage-findings.md #1.
    expect(await errorOf(await withCard({ expiry: "06/26" }))).toBe("Card is expired");
  });

  it("accepts a card expiring next month", async () => {
    expect((await withCard({ expiry: "07/26" })).status).toBe(201);
  });

  it.each(["01", "02", "11", "12"])("accepts valid month %s", async (month) => {
    // Pins the lower bound of `month < 1`. Without an 01 case, widening the
    // guard to `month < 2` would reject every January card undetected.
    expect((await withCard({ expiry: `${month}/30` })).status).toBe(201);
  });

  it("reports a card error only after items are valid", async () => {
    const res = await post(validPayload({ items: [{ productId: "nope", quantity: 1 }], card: { number: "1" } }));
    expect(await errorOf(res)).toBe("Unknown product: nope");
  });
});

describe("POST /api/orders — success", () => {
  it("creates a pending order and persists it", async () => {
    const res = await post(validPayload());
    expect(res.status).toBe(201);

    const order = (await res.json()) as Order;
    expect(order.status).toBe("pending");
    expect(order.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(order.createdAt).toBe(NOW.toISOString());
    expect(order.updatedAt).toBe(NOW.toISOString());
    expect(listOrders()).toHaveLength(1);
    expect(listOrders()[0].id).toBe(order.id);
  });

  it("snapshots product name and price onto the line item", async () => {
    const order = (await (await post(validPayload())).json()) as Order;
    expect(order.items).toEqual([
      { productId: "espresso", productName: "Espresso", unitPrice: 12000, quantity: 2, subtotal: 24000 },
    ]);
  });

  it("totals the subtotals across line items", async () => {
    const items = [
      { productId: "espresso", quantity: 2 },
      { productId: "cookie", quantity: 3 },
    ];
    const order = (await (await post(validPayload({ items }))).json()) as Order;
    expect(order.total).toBe(12000 * 2 + 11000 * 3);
  });

  it("records a coupon-free order with a zero discount", async () => {
    const items = [
      { productId: "espresso", quantity: 2 },
      { productId: "cookie", quantity: 3 },
    ];
    const order = (await (await post(validPayload({ items }))).json()) as Order;
    expect(order.subtotal).toBe(12000 * 2 + 11000 * 3);
    expect(order.discount).toBe(0);
    expect(order.coupon).toBeNull();
    expect(order.total).toBe(order.subtotal - order.discount);
  });

  it("stores the LAST four card digits, not the first four", async () => {
    // The fixture PAN starts 4111 and ends 1234 precisely so this assertion can
    // tell slice(-4) from slice(0, 4). A repdigit card number cannot.
    const order = (await (await post(validPayload())).json()) as Order;
    expect(order.payment).toEqual({ method: "card", last4: "1234" });
    expect(order.payment.last4).not.toBe("4111");
  });

  it("never persists the full card number", async () => {
    const order = (await (await post(validPayload())).json()) as Order;
    expect(JSON.stringify(order)).not.toContain("4111111111111234");
    expect(JSON.stringify(order)).not.toContain("41111111");
  });

  it("gives every order a distinct id", async () => {
    const a = (await (await post(validPayload())).json()) as Order;
    const b = (await (await post(validPayload())).json()) as Order;
    expect(a.id).not.toBe(b.id);
    expect(listOrders()).toHaveLength(2);
  });
});

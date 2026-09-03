import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";
import { updateProduct } from "@/lib/store";
import { formatPrice } from "@/lib/format";
import { jsonHeaders, resetStore } from "@/tests/support/store";

const post = (body: unknown) =>
  POST(
    new Request("http://test/api/coupons/validate", {
      method: "POST",
      headers: jsonHeaders,
      body: typeof body === "string" ? body : JSON.stringify(body),
    })
  );

const errorOf = async (res: Response) => ((await res.json()) as { error: string }).error;

type ValidateResponse = { code: string; discount: number; subtotal: number; total: number };
const bodyOf = async (res: Response) => (await res.json()) as ValidateResponse;

// espresso is 12000 cents; one of them is the baseline cart everywhere below.
const oneEspresso = [{ productId: "espresso", quantity: 1 }];

beforeEach(() => resetStore());
afterEach(() => vi.useRealTimers());

describe("POST /api/coupons/validate — success", () => {
  it("applies a valid coupon and reports the server-computed totals", async () => {
    const res = await post({ code: "WELCOME50", items: oneEspresso });
    expect(res.status).toBe(200);
    expect(await bodyOf(res)).toEqual({
      code: "WELCOME50",
      subtotal: 12000,
      discount: 5000,
      total: 7000,
    });
  });

  it("normalizes the submitted code", async () => {
    const res = await post({ code: "  welcome50  ", items: oneEspresso });
    expect(res.status).toBe(200);
    expect((await bodyOf(res)).code).toBe("WELCOME50");
  });

  it("sums multiple lines and quantities into the subtotal", async () => {
    // espresso 12000 x2 + cookie 11000 x1 = 35000
    const res = await post({
      code: "WELCOME50",
      items: [
        { productId: "espresso", quantity: 2 },
        { productId: "cookie", quantity: 1 },
      ],
    });
    expect(res.status).toBe(200);
    expect(await bodyOf(res)).toEqual({
      code: "WELCOME50",
      subtotal: 35000,
      discount: 5000,
      total: 30000,
    });
  });

  it("clamps a coupon worth more than the cart so the total is never negative", async () => {
    const res = await post({ code: "ONTHEHOUSE300", items: oneEspresso });
    expect(res.status).toBe(200);
    expect(await bodyOf(res)).toEqual({
      code: "ONTHEHOUSE300",
      subtotal: 12000,
      discount: 12000,
      total: 0,
    });
  });
});

describe("POST /api/coupons/validate — the subtotal is server-side only", () => {
  it("ignores a client-supplied subtotal that would fake its way past minSubtotal", async () => {
    // BIGORDER100 needs 50000; the cart is 12000. A lying `subtotal` field must
    // not be read off the request — the server reprices from the store.
    const res = await post({ code: "BIGORDER100", items: oneEspresso, subtotal: 999999 });
    expect(res.status).toBe(400);
    expect(await errorOf(res)).toBe(
      `Coupon BIGORDER100 requires a minimum of ${formatPrice(50000)}`
    );
  });

  it("ignores client-supplied prices and reprices from the store", async () => {
    const res = await post({
      code: "WELCOME50",
      items: [{ productId: "espresso", quantity: 1, unitPrice: 1, subtotal: 1, price: 1 }],
    });
    expect(res.status).toBe(200);
    expect((await bodyOf(res)).subtotal).toBe(12000);
  });
});

describe("POST /api/coupons/validate — ineligible coupons", () => {
  it("rejects an unknown code", async () => {
    const res = await post({ code: "NOPE", items: oneEspresso });
    expect(res.status).toBe(400);
    expect(await errorOf(res)).toBe("That coupon code is not valid");
  });

  it("rejects an inactive coupon with the same message as an unknown one", async () => {
    const res = await post({ code: "LEGACY10", items: oneEspresso });
    expect(res.status).toBe(400);
    expect(await errorOf(res)).toBe("That coupon code is not valid");
  });

  it("rejects an expired coupon", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-01T00:00:00.000Z"));

    const res = await post({ code: "SUMMER25", items: oneEspresso });
    expect(res.status).toBe(400);
    expect(await errorOf(res)).toBe("Coupon SUMMER25 has expired");
  });

  it("accepts the same coupon before it expires", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-01T00:00:00.000Z"));

    const res = await post({ code: "SUMMER25", items: oneEspresso });
    expect(res.status).toBe(200);
    expect((await bodyOf(res)).discount).toBe(2500);
  });

  it("rejects a cart below the coupon's minimum subtotal", async () => {
    const res = await post({ code: "BIGORDER100", items: oneEspresso });
    expect(res.status).toBe(400);
    expect(await errorOf(res)).toBe(
      `Coupon BIGORDER100 requires a minimum of ${formatPrice(50000)}`
    );
  });

  it("accepts the same coupon once the cart reaches the minimum", async () => {
    // espresso 12000 x5 = 60000 >= 50000
    const res = await post({ code: "BIGORDER100", items: [{ productId: "espresso", quantity: 5 }] });
    expect(res.status).toBe(200);
    expect(await bodyOf(res)).toEqual({
      code: "BIGORDER100",
      subtotal: 60000,
      discount: 10000,
      total: 50000,
    });
  });
});

describe("POST /api/coupons/validate — request validation", () => {
  it("rejects malformed JSON", async () => {
    const res = await post("{not json");
    expect(res.status).toBe(400);
    expect(await errorOf(res)).toBe("Invalid JSON body");
  });

  it("rejects a non-object body", async () => {
    expect(await errorOf(await post("null"))).toBe("Invalid request body");
  });

  it.each([undefined, "", "   ", 42])("rejects code %j", async (code) => {
    const res = await post({ code, items: oneEspresso });
    expect(res.status).toBe(400);
    expect(await errorOf(res)).toBe("Coupon code is required");
  });

  it("rejects empty items", async () => {
    const res = await post({ code: "WELCOME50", items: [] });
    expect(res.status).toBe(400);
    expect(await errorOf(res)).toBe("Cart is empty");
  });

  it("rejects a missing or non-array items", async () => {
    expect(await errorOf(await post({ code: "WELCOME50" }))).toBe("Cart is empty");
    expect(await errorOf(await post({ code: "WELCOME50", items: "espresso" }))).toBe("Cart is empty");
  });

  it("rejects a non-object item", async () => {
    expect(await errorOf(await post({ code: "WELCOME50", items: [null] }))).toBe("Invalid item");
  });

  it("rejects an unknown product id", async () => {
    const res = await post({ code: "WELCOME50", items: [{ productId: "unicorn", quantity: 1 }] });
    expect(res.status).toBe(400);
    expect(await errorOf(res)).toBe("Unknown product: unicorn");
  });

  it("rejects an unavailable product", async () => {
    updateProduct("espresso", { available: false });
    const res = await post({ code: "WELCOME50", items: oneEspresso });
    expect(res.status).toBe(400);
    expect(await errorOf(res)).toBe("Espresso is not available");
  });

  it.each([0, -1, 1.5, "two", null])("rejects quantity %j", async (quantity) => {
    const res = await post({ code: "WELCOME50", items: [{ productId: "espresso", quantity }] });
    expect(res.status).toBe(400);
    expect(await errorOf(res)).toBe("Invalid quantity");
  });
});

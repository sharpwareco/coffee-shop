import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createOrder,
  createProduct,
  deleteProduct,
  getOrder,
  getProduct,
  listOrders,
  listProducts,
  updateOrderStatus,
  updateProduct,
  listCoupons,
  getCoupon,
} from "@/lib/store";
import type { Order, Product } from "@/types/domain";
import { resetStore } from "@/tests/support/store";

const SEEDED_PRODUCTS = 10;
const SEEDED_COUPONS = 5;

const makeProduct = (overrides: Partial<Product> = {}): Product => ({
  id: "test-product",
  name: "Test Product",
  description: "",
  price: 10000,
  category: "drink",
  imageUrl: "https://example.test/x.jpg",
  available: true,
  createdAt: "2026-08-31T00:00:00.000Z",
  updatedAt: "2026-08-31T00:00:00.000Z",
  ...overrides,
});

const makeOrder = (overrides: Partial<Order> = {}): Order => ({
  id: "order-1",
  customer: { name: "Ada", email: "ada@example.test", phone: "555", address: "Somewhere" },
  items: [{ productId: "espresso", productName: "Espresso", unitPrice: 12000, quantity: 1, subtotal: 12000 }],
  subtotal: 12000,
  discount: 0,
  coupon: null,
  total: 12000,
  payment: { method: "card", last4: "4242" },
  status: "pending",
  createdAt: "2026-08-31T00:00:00.000Z",
  updatedAt: "2026-08-31T00:00:00.000Z",
  ...overrides,
});

beforeEach(() => resetStore());

describe("products", () => {
  it("seeds from data/products.json", () => {
    expect(listProducts()).toHaveLength(SEEDED_PRODUCTS);
    expect(listProducts()[0].id).toBe("espresso");
  });

  it("finds a product by id", () => {
    expect(getProduct("espresso")?.name).toBe("Espresso");
  });

  it("returns undefined for an unknown id", () => {
    expect(getProduct("nope")).toBeUndefined();
  });

  it("appends a created product and returns it", () => {
    const created = createProduct(makeProduct());
    expect(created.id).toBe("test-product");
    expect(listProducts()).toHaveLength(SEEDED_PRODUCTS + 1);
    expect(getProduct("test-product")).toBe(created);
  });

  it("applies a patch and refreshes updatedAt", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-01T10:00:00.000Z"));

    const updated = updateProduct("espresso", { price: 13000, available: false });

    expect(updated?.price).toBe(13000);
    expect(updated?.available).toBe(false);
    expect(updated?.name).toBe("Espresso");
    expect(updated?.updatedAt).toBe("2026-09-01T10:00:00.000Z");
    expect(updated?.createdAt).toBe("2026-08-31T00:00:00.000Z");

    vi.useRealTimers();
  });

  it("returns undefined when updating an unknown product", () => {
    expect(updateProduct("nope", { price: 1 })).toBeUndefined();
  });

  it("deletes a product once", () => {
    expect(deleteProduct("espresso")).toBe(true);
    expect(listProducts()).toHaveLength(SEEDED_PRODUCTS - 1);
    expect(getProduct("espresso")).toBeUndefined();
    expect(deleteProduct("espresso")).toBe(false);
  });

  it("reports false when deleting an unknown product", () => {
    expect(deleteProduct("nope")).toBe(false);
    expect(listProducts()).toHaveLength(SEEDED_PRODUCTS);
  });

  it("hands out the live internal array", () => {
    // NOTE: current behavior, pinned deliberately. listProducts() returns the
    // store's own array by reference, so callers can mutate state without
    // going through the exported API. See docs/coverage-findings.md #4.
    listProducts().push(makeProduct({ id: "smuggled" }));
    expect(getProduct("smuggled")).toBeDefined();
  });
});

describe("orders", () => {
  it("starts empty", () => {
    expect(listOrders()).toEqual([]);
  });

  it("appends a created order and finds it by id", () => {
    const created = createOrder(makeOrder());
    expect(listOrders()).toHaveLength(1);
    expect(getOrder("order-1")).toBe(created);
  });

  it("returns undefined for an unknown order", () => {
    expect(getOrder("nope")).toBeUndefined();
  });

  it("updates status and refreshes updatedAt", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-01T10:00:00.000Z"));

    createOrder(makeOrder());
    const updated = updateOrderStatus("order-1", "preparing");

    expect(updated?.status).toBe("preparing");
    expect(updated?.updatedAt).toBe("2026-09-01T10:00:00.000Z");

    vi.useRealTimers();
  });

  it("returns undefined when updating an unknown order", () => {
    expect(updateOrderStatus("nope", "ready")).toBeUndefined();
  });
});

describe("coupons", () => {
  it("seeds from data/coupons.json", () => {
    expect(listCoupons()).toHaveLength(SEEDED_COUPONS);
  });

  it("finds a coupon by its exact stored code", () => {
    expect(getCoupon("WELCOME50")?.amountOff).toBe(5000);
  });

  it("does not normalize the code it is given", () => {
    // getCoupon is deliberately dumb: normalization belongs to one shared
    // helper on the caller side, so no two call sites can drift apart.
    expect(getCoupon("welcome50")).toBeUndefined();
    expect(getCoupon(" WELCOME50 ")).toBeUndefined();
  });

  it("returns undefined for an unknown code", () => {
    expect(getCoupon("NOPE")).toBeUndefined();
  });

  it("seeds coupons that exercise every eligibility rule", () => {
    const coupons = listCoupons();
    expect(coupons.some((c) => c.minSubtotal > 0)).toBe(true);
    expect(coupons.some((c) => c.expiresAt !== null && Date.parse(c.expiresAt) < Date.now())).toBe(true);
    expect(coupons.some((c) => !c.active)).toBe(true);
    expect(coupons.some((c) => c.minSubtotal === 0 && c.expiresAt === null && c.active)).toBe(true);
  });

  it("seeds a coupon worth more than the cheapest possible cart", () => {
    // Otherwise the clamp (discount = min(amountOff, subtotal), spec.md) would
    // be unreachable from seed data and issue 04 could not test it honestly.
    const cheapestProduct = Math.min(...listProducts().map((p) => p.price));
    const eligibleEverywhere = listCoupons().filter((c) => c.active && c.minSubtotal === 0);
    expect(eligibleEverywhere.some((c) => c.amountOff > cheapestProduct)).toBe(true);
  });

  it("stores every code in canonical uppercase form", () => {
    for (const coupon of listCoupons()) expect(coupon.code).toBe(coupon.code.toUpperCase());
  });
});

afterEach(() => vi.useRealTimers());

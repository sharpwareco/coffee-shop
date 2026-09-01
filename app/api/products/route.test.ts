import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET, POST } from "./route";
import { listProducts } from "@/lib/store";
import { adminJsonHeaders, jsonHeaders, resetStore } from "@/tests/support/store";
import seedProducts from "@/data/products.json";
import type { Product } from "@/types/domain";

const SEEDED = seedProducts.length;

const post = (body: unknown, headers: HeadersInit = adminJsonHeaders) =>
  POST(
    new Request("http://test/api/products", {
      method: "POST",
      headers,
      body: typeof body === "string" ? body : JSON.stringify(body),
    })
  );

const validProduct = (overrides: Record<string, unknown> = {}) => ({
  name: "Iced Latte Special",
  description: "Cold and good",
  price: 15000,
  category: "drink",
  imageUrl: "https://example.test/latte.jpg",
  ...overrides,
});

const errorOf = async (res: Response) => ((await res.json()) as { error: string }).error;

beforeEach(() => resetStore());
afterEach(() => vi.useRealTimers());

describe("GET /api/products", () => {
  it("returns the full catalogue", async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    const products = (await res.json()) as Product[];
    expect(products).toHaveLength(SEEDED);
    expect(products.map((p) => p.id)).toContain("espresso");
  });
});

describe("POST /api/products — authorization", () => {
  it("rejects a request with no admin cookie", async () => {
    const res = await post(validProduct(), jsonHeaders);
    expect(res.status).toBe(401);
    expect(await errorOf(res)).toBe("Unauthorized");
  });

  it("does not create anything when unauthorized", async () => {
    await post(validProduct(), jsonHeaders);
    expect(listProducts()).toHaveLength(SEEDED);
  });

  it("checks authorization before parsing the body", async () => {
    expect(await errorOf(await post("{not json", jsonHeaders))).toBe("Unauthorized");
  });
});

describe("POST /api/products — validation", () => {
  it("rejects malformed JSON", async () => {
    expect(await errorOf(await post("{not json"))).toBe("Invalid JSON body");
  });

  it("rejects a non-object body", async () => {
    expect(await errorOf(await post("null"))).toBe("Invalid body");
  });

  it("requires a name", async () => {
    expect(await errorOf(await post(validProduct({ name: "   " })))).toBe("Name is required");
    expect(await errorOf(await post(validProduct({ name: 42 })))).toBe("Name is required");
  });

  it.each([-1, 12.5, "15000", null])("rejects price %j", async (price) => {
    expect(await errorOf(await post(validProduct({ price })))).toBe(
      "Price must be a non-negative integer (cents)"
    );
  });

  it("accepts a zero price", async () => {
    expect((await post(validProduct({ price: 0 }))).status).toBe(201);
  });

  it("requires a known category", async () => {
    expect(await errorOf(await post(validProduct({ category: "dessert" })))).toBe(
      "Category must be 'drink' or 'food'"
    );
    expect(await errorOf(await post(validProduct({ category: undefined })))).toBe(
      "Category must be 'drink' or 'food'"
    );
  });

  it("requires an image URL", async () => {
    expect(await errorOf(await post(validProduct({ imageUrl: "" })))).toBe("Image URL is required");
    expect(await errorOf(await post(validProduct({ imageUrl: undefined })))).toBe("Image URL is required");
  });

  it("treats a non-string image URL as missing", async () => {
    expect(await errorOf(await post(validProduct({ imageUrl: 42 })))).toBe("Image URL is required");
  });

  it("treats a non-string description as empty", async () => {
    const res = await post(validProduct({ name: "Desc Coercion", description: 42 }));
    expect(res.status).toBe(201);
    expect(((await res.json()) as Product).description).toBe("");
  });
});

describe("POST /api/products — id generation", () => {
  const idOf = async (name: string) =>
    ((await (await post(validProduct({ name }))).json()) as Product).id;

  it("slugifies the name", async () => {
    expect(await idOf("Mocha Deluxe")).toBe("mocha-deluxe");
    expect(await idOf("  Café  Crème!  ")).toBe("caf-cr-me");
  });

  it("collides with a seeded id and takes the next suffix", async () => {
    // "iced-latte" already exists in data/products.json.
    expect(await idOf("Iced Latte")).toBe("iced-latte-2");
  });

  it("appends an incrementing suffix on collision", async () => {
    expect(await idOf("Espresso")).toBe("espresso-2");
    expect(await idOf("Espresso")).toBe("espresso-3");
    expect(await idOf("Espresso")).toBe("espresso-4");
  });

  it("falls back to 'product' when the name has no slug characters", async () => {
    expect(await idOf("!!!")).toBe("product");
    expect(await idOf("???")).toBe("product-2");
  });
});

describe("POST /api/products — success", () => {
  it("creates and persists the product", async () => {
    const res = await post(validProduct());
    expect(res.status).toBe(201);

    const product = (await res.json()) as Product;
    expect(product.name).toBe("Iced Latte Special");
    expect(product.price).toBe(15000);
    expect(product.category).toBe("drink");
    expect(listProducts()).toHaveLength(SEEDED + 1);
  });

  it("defaults availability to true", async () => {
    const product = (await (await post(validProduct())).json()) as Product;
    expect(product.available).toBe(true);
  });

  it("honours an explicit availability flag", async () => {
    const product = (await (await post(validProduct({ available: false }))).json()) as Product;
    expect(product.available).toBe(false);
  });

  it("defaults a missing description to an empty string", async () => {
    const product = (await (await post(validProduct({ description: undefined }))).json()) as Product;
    expect(product.description).toBe("");
  });

  it("stamps createdAt and updatedAt with the current time", async () => {
    // Asserting only createdAt === updatedAt is tautological: both read the
    // same const, so it holds for any value including the epoch.
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-01T10:00:00.000Z"));

    const product = (await (await post(validProduct())).json()) as Product;
    expect(product.createdAt).toBe("2026-09-01T10:00:00.000Z");
    expect(product.updatedAt).toBe("2026-09-01T10:00:00.000Z");

    vi.useRealTimers();
  });

  it("coerces a non-boolean availability to true rather than storing it", async () => {
    // NOTE: current behavior, pinned deliberately. The `typeof === "boolean"`
    // check means a truthy non-boolean falls back to true instead of being
    // rejected. See docs/coverage-findings.md #10.
    const product = (await (await post(validProduct({ name: "Avail Coercion", available: "no" }))).json()) as Product;
    expect(product.available).toBe(true);
  });
});

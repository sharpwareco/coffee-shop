import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DELETE, GET, PUT } from "./route";
import { getProduct, listProducts } from "@/lib/store";
import { adminJsonHeaders, adminHeaders, jsonHeaders, resetStore } from "@/tests/support/store";
import seedProducts from "@/data/products.json";
import type { Product } from "@/types/domain";

const SEEDED = seedProducts.length;

const ctx = (id: string) => ({ params: Promise.resolve({ id }) });

const get = (id: string) => GET(new Request("http://test/api/products/x"), ctx(id));

const put = (id: string, body: unknown, headers: HeadersInit = adminJsonHeaders) =>
  PUT(
    new Request("http://test/api/products/x", {
      method: "PUT",
      headers,
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
    ctx(id)
  );

const del = (id: string, headers: HeadersInit = adminHeaders) =>
  DELETE(new Request("http://test/api/products/x", { method: "DELETE", headers }), ctx(id));

const errorOf = async (res: Response) => ((await res.json()) as { error: string }).error;

beforeEach(() => resetStore());
afterEach(() => vi.useRealTimers());

describe("GET /api/products/[id]", () => {
  it("returns the product", async () => {
    const res = await get("espresso");
    expect(res.status).toBe(200);
    expect(((await res.json()) as Product).name).toBe("Double Espresso");
  });

  it("404s for an unknown id", async () => {
    const res = await get("unicorn");
    expect(res.status).toBe(404);
    expect(await errorOf(res)).toBe("Product not found");
  });
});

describe("PUT /api/products/[id]", () => {
  it("rejects a request with no admin cookie", async () => {
    const res = await put("espresso", { price: 1 }, jsonHeaders);
    expect(res.status).toBe(401);
    expect(getProduct("espresso")?.price).toBe(12000);
  });

  it("checks authorization before existence", async () => {
    expect((await put("unicorn", {}, jsonHeaders)).status).toBe(401);
  });

  it("404s for an unknown id", async () => {
    const res = await put("unicorn", { price: 1 });
    expect(res.status).toBe(404);
    expect(await errorOf(res)).toBe("Product not found");
  });

  it("rejects malformed JSON", async () => {
    expect(await errorOf(await put("espresso", "{not json"))).toBe("Invalid JSON body");
  });

  it("rejects a non-object body", async () => {
    expect(await errorOf(await put("espresso", "null"))).toBe("Invalid body");
  });

  it("applies a partial patch and leaves other fields alone", async () => {
    const res = await put("espresso", { price: 13500 });
    expect(res.status).toBe(200);

    const product = (await res.json()) as Product;
    expect(product.price).toBe(13500);
    expect(product.name).toBe("Double Espresso");
    expect(product.category).toBe("drink");
  });

  it("updates every patchable field", async () => {
    const product = (await (
      await put("espresso", {
        name: "  Doppio  ",
        description: "Two shots",
        imageUrl: "https://example.test/doppio.jpg",
        available: false,
        category: "food",
        price: 20000,
      })
    ).json()) as Product;

    expect(product).toMatchObject({
      name: "Doppio",
      description: "Two shots",
      imageUrl: "https://example.test/doppio.jpg",
      available: false,
      category: "food",
      price: 20000,
    });
  });

  it("silently ignores a blank name instead of rejecting it", async () => {
    // NOTE: current behavior, pinned deliberately. The guard at route.ts:32
    // requires a non-empty trimmed string, so a blank name is dropped from the
    // patch rather than returning 400. See docs/coverage-findings.md #7.
    const product = (await (await put("espresso", { name: "   " })).json()) as Product;
    expect(product.name).toBe("Double Espresso");
  });

  it("can set a price to zero", async () => {
    // Pins `data.price !== undefined`. Weakening it to a truthy check would
    // make a zero price a silent 200 no-op, as POST already guards against.
    const product = (await (await put("espresso", { price: 0 })).json()) as Product;
    expect(product.price).toBe(0);
  });

  it("can clear a description to an empty string", async () => {
    const product = (await (await put("espresso", { description: "" })).json()) as Product;
    expect(product.description).toBe("");
  });

  it("can clear an image URL to an empty string", async () => {
    // NOTE: PUT permits an empty imageUrl that POST rejects outright.
    // Pinned deliberately. See docs/coverage-findings.md #7.
    const product = (await (await put("espresso", { imageUrl: "" })).json()) as Product;
    expect(product.imageUrl).toBe("");
  });

  it("bumps updatedAt even when the patch changes nothing", async () => {
    // NOTE: current behavior, pinned deliberately. updateProduct applies
    // { updatedAt } unconditionally, so a no-op PUT dirties the audit
    // timestamp. See docs/coverage-findings.md #7.
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-01T10:00:00.000Z"));

    const product = (await (await put("espresso", { name: "   " })).json()) as Product;
    expect(product.name).toBe("Double Espresso");
    expect(product.updatedAt).toBe("2026-09-01T10:00:00.000Z");
    expect(product.createdAt).toBe("2026-08-31T00:00:00.000Z");

    vi.useRealTimers();
  });

  it("ignores unknown fields", async () => {
    const product = (await (await put("espresso", { colour: "red" })).json()) as Product;
    expect(product).not.toHaveProperty("colour");
  });

  it("rejects a bad category", async () => {
    expect(await errorOf(await put("espresso", { category: "dessert" }))).toBe(
      "Category must be 'drink' or 'food'"
    );
  });

  it.each([-1, 12.5, "100"])("rejects price %j", async (price) => {
    expect(await errorOf(await put("espresso", { price }))).toBe(
      "Price must be a non-negative integer (cents)"
    );
  });

  it("leaves the product untouched when validation fails", async () => {
    await put("espresso", { name: "Renamed", price: -1 });
    expect(getProduct("espresso")?.name).toBe("Double Espresso");
  });
});

describe("DELETE /api/products/[id]", () => {
  it("rejects a request with no admin cookie", async () => {
    const res = await del("espresso", {});
    expect(res.status).toBe(401);
    expect(listProducts()).toHaveLength(SEEDED);
  });

  it("deletes the product", async () => {
    const res = await del("espresso");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(listProducts()).toHaveLength(SEEDED - 1);
    expect(getProduct("espresso")).toBeUndefined();
  });

  it("404s on a second delete", async () => {
    await del("espresso");
    const res = await del("espresso");
    expect(res.status).toBe(404);
    expect(await errorOf(res)).toBe("Product not found");
  });

  it("404s for an unknown id", async () => {
    expect((await del("unicorn")).status).toBe(404);
  });
});

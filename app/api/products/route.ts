import { NextResponse } from "next/server";
import { createProduct, getProduct, listProducts } from "@/lib/store";
import { isAdmin } from "@/lib/session";
import type { ProductCategory } from "@/types/domain";

const slugify = (name: string) =>
  name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const badRequest = (error: string) => NextResponse.json({ error }, { status: 400 });

export function GET() {
  return NextResponse.json(listProducts());
}

export async function POST(request: Request) {
  if (!isAdmin(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest("Invalid JSON body");
  }
  if (typeof body !== "object" || body === null) return badRequest("Invalid body");

  const data = body as Record<string, unknown>;
  const name = typeof data.name === "string" ? data.name.trim() : "";
  const description = typeof data.description === "string" ? data.description : "";
  const price = data.price;
  const category = data.category;
  const imageUrl = typeof data.imageUrl === "string" ? data.imageUrl : "";
  const available = typeof data.available === "boolean" ? data.available : true;

  if (!name) return badRequest("Name is required");
  if (typeof price !== "number" || !Number.isInteger(price) || price < 0) {
    return badRequest("Price must be a non-negative integer (cents)");
  }
  if (category !== "drink" && category !== "food") return badRequest("Category must be 'drink' or 'food'");
  if (!imageUrl) return badRequest("Image URL is required");

  const base = slugify(name) || "product";
  let id = base;
  let suffix = 2;
  while (getProduct(id)) id = `${base}-${suffix++}`;

  const timestamp = new Date().toISOString();
  const product = createProduct({
    id,
    name,
    description,
    price,
    category: category as ProductCategory,
    imageUrl,
    available,
    createdAt: timestamp,
    updatedAt: timestamp,
  });

  return NextResponse.json(product, { status: 201 });
}

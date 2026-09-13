import { NextResponse } from "next/server";
import { deleteProduct, getProduct, updateProduct } from "@/lib/store";
import { isAdmin } from "@/lib/session";
import type { Product, ProductCategory } from "@/types/domain";

const badRequest = (error: string) => NextResponse.json({ error }, { status: 400 });

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const product = getProduct(id);
  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });
  return NextResponse.json(product);
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!isAdmin(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  if (!getProduct(id)) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest("Invalid JSON body");
  }
  if (typeof body !== "object" || body === null) return badRequest("Invalid body");

  const data = body as Record<string, unknown>;
  const patch: Partial<Product> = {};

  if (typeof data.name === "string" && data.name.trim()) patch.name = data.name.trim();
  if (typeof data.description === "string") patch.description = data.description;
  if (typeof data.imageUrl === "string") patch.imageUrl = data.imageUrl;
  if (typeof data.available === "boolean") patch.available = data.available;
  if (data.category !== undefined) {
    if (data.category !== "drink" && data.category !== "food") return badRequest("Category must be 'drink' or 'food'");
    patch.category = data.category as ProductCategory;
  }
  if (data.price !== undefined) {
    if (typeof data.price !== "number" || !Number.isInteger(data.price) || data.price < 0) {
      return badRequest("Price must be a non-negative integer (cents)");
    }
    patch.price = data.price;
  }

  return NextResponse.json(updateProduct(id, patch));
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!isAdmin(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  if (!deleteProduct(id)) return NextResponse.json({ error: "Product not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}

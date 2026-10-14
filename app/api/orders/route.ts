import { NextResponse } from "next/server";
import { createOrder, getProduct } from "@/lib/store";
import type { OrderItem } from "@/types/domain";

const badRequest = (error: string) => NextResponse.json({ error }, { status: 400 });

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest("Invalid JSON body");
  }

  if (typeof body !== "object" || body === null) return badRequest("Invalid request body");

  const { customer, items, card } = body as Record<string, unknown>;

  if (typeof customer !== "object" || customer === null) return badRequest("Missing customer");
  if (!Array.isArray(items) || items.length === 0) return badRequest("Cart is empty");
  if (typeof card !== "object" || card === null) return badRequest("Missing card");

  const c = customer as Record<string, unknown>;
  const name = typeof c.name === "string" ? c.name.trim() : "";
  const email = typeof c.email === "string" ? c.email.trim() : "";
  const phone = typeof c.phone === "string" ? c.phone.trim() : "";
  const address = typeof c.address === "string" ? c.address.trim() : "";
  if (!name || !email || !phone || !address) return badRequest("Missing customer fields");
  if (!email.includes("@")) return badRequest("Invalid email");

  const orderItems: OrderItem[] = [];
  for (const raw of items) {
    if (typeof raw !== "object" || raw === null) return badRequest("Invalid item");
    const entry = raw as Record<string, unknown>;
    const productId = typeof entry.productId === "string" ? entry.productId : "";
    const quantity = Number(entry.quantity);
    const product = getProduct(productId);
    if (!product) return badRequest(`Unknown product: ${productId}`);
    if (!product.available) return badRequest(`${product.name} is not available`);
    if (!Number.isInteger(quantity) || quantity < 1) return badRequest("Invalid quantity");
    orderItems.push({
      productId: product.id,
      productName: product.name,
      unitPrice: product.price,
      quantity,
      subtotal: product.price * quantity,
    });
  }

  const k = card as Record<string, unknown>;
  const number = typeof k.number === "string" ? k.number.replace(/\D/g, "") : "";
  const expiry = typeof k.expiry === "string" ? k.expiry.trim() : "";
  const cvc = typeof k.cvc === "string" ? k.cvc.trim() : "";

  if (!/^\d{16}$/.test(number)) return badRequest("Invalid card number");
  if (!/^\d{3,4}$/.test(cvc)) return badRequest("Invalid CVC");

  const expiryMatch = /^(\d{2})\/(\d{2})$/.exec(expiry);
  if (!expiryMatch) return badRequest("Invalid expiry (use MM/YY)");
  const month = Number(expiryMatch[1]);
  const year = 2000 + Number(expiryMatch[2]);
  const now = new Date();
  const currentMonth = now.getFullYear() * 12 + now.getMonth();
  const expiryMonth = year * 12 + (month - 1);
  if (month < 1 || month > 12 || expiryMonth <= currentMonth) return badRequest("Card is expired");

  const total = orderItems.reduce((sum, item) => sum + item.subtotal, 0);
  const timestamp = new Date().toISOString();

  const order = createOrder({
    id: crypto.randomUUID(),
    customer: { name, email, phone, address },
    items: orderItems,
    total,
    payment: { method: "card", last4: number.slice(-4) },
    status: "pending",
    createdAt: timestamp,
    updatedAt: timestamp,
  });

  return NextResponse.json(order, { status: 201 });
}

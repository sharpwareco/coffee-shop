import { NextResponse } from "next/server";
import { getOrder, updateOrderStatus } from "@/lib/store";
import { isAdmin } from "@/lib/session";
import type { OrderStatus } from "@/types/domain";

const STATUSES: OrderStatus[] = ["pending", "preparing", "ready", "completed", "cancelled"];

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!isAdmin(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  if (!getOrder(id)) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (typeof body !== "object" || body === null) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const status = (body as Record<string, unknown>).status;
  if (typeof status !== "string" || !STATUSES.includes(status as OrderStatus)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  return NextResponse.json(updateOrderStatus(id, status as OrderStatus));
}

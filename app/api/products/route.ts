import { NextResponse } from "next/server";
import { listProducts } from "@/lib/store";

export function GET() {
  return NextResponse.json(listProducts());
}

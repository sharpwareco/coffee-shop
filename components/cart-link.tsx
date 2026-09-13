"use client";

import Link from "next/link";
import { useCart } from "./cart-context";

export function CartLink() {
  const { count } = useCart();
  return <Link href="/cart">Cart{count > 0 ? ` (${count})` : ""}</Link>;
}

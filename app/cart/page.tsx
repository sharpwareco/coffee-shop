import { listProducts } from "@/lib/store";
import { CartView } from "./cart-view";

export default function CartPage() {
  return <CartView products={listProducts()} />;
}

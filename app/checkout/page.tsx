import { listProducts } from "@/lib/store";
import { CheckoutForm } from "./checkout-form";

export default function CheckoutPage() {
  return <CheckoutForm products={listProducts()} />;
}

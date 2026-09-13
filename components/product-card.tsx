import Image from "next/image";
import { AddToCartButton } from "./add-to-cart-button";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/types/domain";

export function ProductCard({ product }: { product: Product }) {
  return (
    <article className="product-card">
      <Image src={product.imageUrl} alt={product.name} width={600} height={400} className="product-image" />
      <div className="product-body">
        <span className="eyebrow">{product.category}</span>
        <h2>{product.name}</h2>
        <p>{product.description}</p>
        <div className="product-footer">
          <strong>{formatPrice(product.price)}</strong>
          <AddToCartButton productId={product.id} available={product.available} />
        </div>
      </div>
    </article>
  );
}

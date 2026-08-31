import { ProductCard } from "@/components/product-card";
import { listProducts } from "@/lib/store";

export default function Home() {
  const products = listProducts();
  return (
    <main>
      <section className="hero container">
        <p className="eyebrow">Coffee after dark</p>
        <h1>Good coffee.<br />No ceremony.</h1>
        <p className="hero-copy">Drinks and food from a deliberately tiny e-commerce app built for AI engineering labs.</p>
      </section>
      <section className="container product-grid">
        {products.map((product) => <ProductCard key={product.id} product={product} />)}
      </section>
    </main>
  );
}

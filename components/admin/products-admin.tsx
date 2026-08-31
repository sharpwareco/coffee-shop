"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AdminNav } from "./admin-nav";
import { formatPrice } from "@/lib/format";
import type { Product, ProductCategory } from "@/types/domain";

type Draft = {
  id?: string;
  name: string;
  description: string;
  price: string;
  category: ProductCategory;
  imageUrl: string;
  available: boolean;
};

const emptyDraft: Draft = {
  name: "",
  description: "",
  price: "",
  category: "drink",
  imageUrl: "",
  available: true,
};

const centsToLira = (cents: number) => (cents / 100).toFixed(2);
const liraToCents = (input: string) => Math.round(Number(input.replace(",", ".")) * 100);

const errorMessage = (data: unknown, fallback: string): string =>
  typeof data === "object" && data !== null && "error" in data && typeof (data as { error?: unknown }).error === "string"
    ? (data as { error: string }).error
    : fallback;

export function ProductsAdmin({ products }: { products: Product[] }) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const cardRef = useRef<HTMLElement | null>(null);
  const nameRef = useRef<HTMLInputElement | null>(null);

  const editing = Boolean(draft.id);

  useEffect(() => {
    if (draft.id) {
      cardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      nameRef.current?.focus({ preventScroll: true });
    }
  }, [draft.id]);

  function startCreate() {
    setDraft(emptyDraft);
    setError(null);
  }

  function startEdit(product: Product) {
    setDraft({
      id: product.id,
      name: product.name,
      description: product.description,
      price: centsToLira(product.price),
      category: product.category,
      imageUrl: product.imageUrl,
      available: product.available,
    });
    setError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cents = liraToCents(draft.price);
    if (!Number.isFinite(cents) || cents < 0) {
      setError("Enter a valid price (e.g. 120.00)");
      return;
    }

    setError(null);
    setSubmitting(true);

    const payload = {
      name: draft.name,
      description: draft.description,
      price: cents,
      category: draft.category,
      imageUrl: draft.imageUrl,
      available: draft.available,
    };

    try {
      const res = await fetch(draft.id ? `/api/products/${draft.id}` : "/api/products", {
        method: draft.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        setError(errorMessage(await res.json().catch(() => null), "Save failed"));
        return;
      }
      startCreate();
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(product: Product) {
    if (!confirm(`Delete "${product.name}"?`)) return;
    try {
      const res = await fetch(`/api/products/${product.id}`, { method: "DELETE" });
      if (!res.ok) {
        setError(errorMessage(await res.json().catch(() => null), "Delete failed"));
        return;
      }
      if (draft.id === product.id) startCreate();
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    }
  }

  return (
    <main className="container page">
      <AdminNav />
      <h1>Products</h1>

      <section className="admin-card" ref={cardRef}>
        <h2>{editing ? `Edit ${draft.name}` : "New product"}</h2>
        <form onSubmit={handleSubmit} className="checkout-form">
          <div className="field-row">
            <label>
              Name
              <input ref={nameRef} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} required />
            </label>
            <label>
              Price (TRY)
              <input value={draft.price} onChange={(e) => setDraft({ ...draft, price: e.target.value })} inputMode="decimal" placeholder="120.00" required />
            </label>
          </div>
          <div className="field-row">
            <label>
              Category
              <select value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value as ProductCategory })}>
                <option value="drink">drink</option>
                <option value="food">food</option>
              </select>
            </label>
            <label className="checkbox-row">
              <input type="checkbox" checked={draft.available} onChange={(e) => setDraft({ ...draft, available: e.target.checked })} />
              Available
            </label>
          </div>
          <label>
            Image URL
            <input value={draft.imageUrl} onChange={(e) => setDraft({ ...draft, imageUrl: e.target.value })} required />
          </label>
          <label>
            Description
            <textarea value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} rows={2} />
          </label>
          {error && <p className="form-error">{error}</p>}
          <div className="admin-actions">
            <button type="submit" className="button" disabled={submitting}>
              {submitting ? "Saving…" : editing ? "Save changes" : "Create product"}
            </button>
            {editing && (
              <button type="button" className="button-secondary" onClick={startCreate}>Cancel</button>
            )}
          </div>
        </form>
      </section>

      <table className="admin-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Price</th>
            <th>Category</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.id}>
              <td>{product.name}</td>
              <td>{formatPrice(product.price)}</td>
              <td>{product.category}</td>
              <td>{product.available ? "Available" : "Unavailable"}</td>
              <td className="table-actions">
                <button type="button" className="button-secondary" onClick={() => startEdit(product)}>Edit</button>
                <button type="button" className="remove-btn" onClick={() => handleDelete(product)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}

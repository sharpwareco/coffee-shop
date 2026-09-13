import seedProducts from "@/data/products.json";
import type { Order, OrderStatus, Product } from "@/types/domain";

type Store = { products: Product[]; orders: Order[] };

const globalStore = globalThis as typeof globalThis & { __midnightCoffeeStore?: Store };

const store = globalStore.__midnightCoffeeStore ?? {
  products: structuredClone(seedProducts) as Product[],
  orders: []
};

globalStore.__midnightCoffeeStore = store;

export const listProducts = () => store.products;
export const getProduct = (id: string) => store.products.find((p) => p.id === id);
export const createProduct = (product: Product) => { store.products.push(product); return product; };
export const updateProduct = (id: string, patch: Partial<Product>) => {
  const product = getProduct(id);
  if (!product) return undefined;
  Object.assign(product, patch, { updatedAt: new Date().toISOString() });
  return product;
};
export const deleteProduct = (id: string) => {
  const index = store.products.findIndex((p) => p.id === id);
  if (index < 0) return false;
  store.products.splice(index, 1);
  return true;
};

export const listOrders = () => store.orders;
export const getOrder = (id: string) => store.orders.find((o) => o.id === id);
export const createOrder = (order: Order) => { store.orders.push(order); return order; };
export const updateOrderStatus = (id: string, status: OrderStatus) => {
  const order = getOrder(id);
  if (!order) return undefined;
  order.status = status;
  order.updatedAt = new Date().toISOString();
  return order;
};

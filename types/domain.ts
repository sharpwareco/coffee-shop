export type ProductCategory = "drink" | "food";

export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: ProductCategory;
  imageUrl: string;
  available: boolean;
  createdAt: string;
  updatedAt: string;
};

export type OrderStatus = "pending" | "preparing" | "ready" | "completed" | "cancelled";

export type Customer = {
  name: string;
  email: string;
  phone: string;
  address: string;
};

export type Coupon = {
  code: string;
  description: string;
  amountOff: number;
  minSubtotal: number;
  expiresAt: string | null;
  active: boolean;
};

/** The Coupon a customer claimed on one Order, as recorded on that Order. */
export type AppliedCoupon = {
  code: string;
  amountOff: number;
};

export type OrderItem = {
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
};

export type Order = {
  id: string;
  customer: Customer;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  coupon: AppliedCoupon | null;
  total: number;
  payment: { method: "card"; last4: string };
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
};

import { listCoupons, listOrders, listProducts, type Store } from "@/lib/store";
import seedProducts from "@/data/products.json";
import seedCoupons from "@/data/coupons.json";
import { ADMIN_COOKIE, ADMIN_COOKIE_VALUE } from "@/lib/session";
import type { Coupon, Product } from "@/types/domain";

const globalStore = globalThis as typeof globalThis & { __midnightCoffeeStore?: Store };

/**
 * lib/store.ts reads store.products / store.orders / store.coupons at call time
 * rather than capturing them, so reassigning those properties fully resets
 * state without touching production code or resetting the module registry.
 */
export function resetStore() {
  const store = globalStore.__midnightCoffeeStore;
  if (!store) throw new Error("store singleton was not initialized");
  store.products = structuredClone(seedProducts) as Product[];
  store.orders = [];
  store.coupons = structuredClone(seedCoupons) as Coupon[];

  // Confirm through the public API that the reassignment actually took effect.
  // The comment above depends on lib/store.ts reading store.* at call time; if
  // that is ever refactored to capture the arrays in module scope, the two
  // lines above would silently no-op and leak state across tests as an
  // order-dependent, intermittent failure that looks like a product bug.
  if (
    listProducts().length !== seedProducts.length ||
    listOrders().length !== 0 ||
    listCoupons().length !== seedCoupons.length
  ) {
    throw new Error(
      "resetStore did not take effect — lib/store.ts may no longer read store.* at call time"
    );
  }
}

export const adminHeaders = { cookie: `${ADMIN_COOKIE}=${ADMIN_COOKIE_VALUE}` };

export const jsonHeaders = { "Content-Type": "application/json" };

export const adminJsonHeaders = { ...jsonHeaders, ...adminHeaders };

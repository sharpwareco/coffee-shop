# Spec: Coupon codes at checkout

Customers can enter a coupon code at checkout and see a fixed discount applied to their order before paying.

## Vocabulary

Defined in `CONTEXT.md`: **Coupon** (the rule), **Coupon Code** (the string the customer types), **Discount** (the cents taken off one order), **Subtotal** (items before discount), **Total** (what is paid).

## Domain model

```ts
export type Coupon = {
  code: string;             // canonical, uppercase: "WELCOME50"
  description: string;      // "İlk sipariş indirimi"
  amountOff: number;        // cents, fixed amount (no percentage coupons)
  minSubtotal: number;      // cents; 0 means no threshold
  expiresAt: string | null; // ISO; null means never expires
  active: boolean;
};
```

`Order` gains three required fields:

```ts
subtotal: number;                                // sum of item subtotals
discount: number;                                // cents actually deducted
coupon: { code: string; amountOff: number } | null;
```

With no coupon: `subtotal` = old total, `discount: 0`, `coupon: null`. The fields are never optional — admin UI and tests deal with one shape.

## Invariants

- `total === subtotal - discount`, always.
- `total >= 0`, always. A coupon worth more than the cart clamps: `discount = Math.min(amountOff, subtotal)`.
- `order.coupon.amountOff` and `order.discount` may differ (that is the clamp). `coupon` records *which coupon was claimed*; `discount` records *what was actually deducted*.
- The server is the only authority on the discount. Nothing the client sends about prices or subtotals is trusted — same rule the existing order repricing follows.

## Eligibility rules

A coupon applies when all hold:

1. A coupon with the normalized code exists.
2. `active === true`.
3. `expiresAt === null` or `expiresAt` is in the future.
4. `subtotal >= minSubtotal`.

Deliberately **not** in scope: usage caps (total or per-customer), percentage discounts, product- or category-scoped coupons, stacking multiple coupons. Per-customer limits are not even expressible — `Customer` is data embedded in one order, not a persistent account.

## Code matching

`trim()` + `toUpperCase()`, then exact match. No hyphen or whitespace normalization. One shared `normalizeCouponCode` — never two normalizations in two call sites.

## Behaviour

- Checkout has a coupon field in the order summary. "Apply" calls `POST /api/coupons/validate` and shows the discount; "Remove" clears it.
- The validate response is a preview only. `POST /api/orders` re-evaluates the coupon from scratch.
- If the coupon was valid at apply time but invalid at submit time (expired, deactivated, cart dropped below `minSubtotal`), the **whole order is rejected** with 400. It is never silently placed at the higher price.

## Out of scope

Admin coupon CRUD. Coupons live in `data/coupons.json`; admin gets a read-only view. Adding/editing coupons is a separate effort.

## Storage

`data/coupons.json` is cloned into the store singleton alongside products. Runtime mutation is never written back — restarting resets coupons to seed, exactly like products.

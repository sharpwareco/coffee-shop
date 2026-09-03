# 01 — Coupon domain types, seed data and store

Status: ready-for-agent
Blocked by: —

Lay the data foundation. No behaviour yet.

## Scope

**`types/domain.ts`**

- Add `Coupon` exactly as specified in `../spec.md`.
- Add to `Order`: `subtotal: number`, `discount: number`, `coupon: { code: string; amountOff: number } | null`. All three required.

**`data/coupons.json`** — a small seed set that exercises the rules:

- one plain always-valid coupon (`minSubtotal: 0`, `expiresAt: null`, `active: true`)
- one with a `minSubtotal` threshold
- one already expired
- one with `active: false`

Codes uppercase. Amounts in cents, consistent with product prices.

**`lib/store.ts`**

- Add `coupons` to the `Store` type and the singleton initializer (`structuredClone(seedCoupons)`).
- Export `listCoupons()` and `getCoupon(code)`. `getCoupon` does an exact match on the stored code — it does **not** normalize; normalization is the caller's job via `lib/coupon.ts` (issue 02). Keep the store dumb.

**`tests/support/store.ts`**

- `resetStore()` must also reassign `store.coupons`.
- Extend the self-verify check to include the coupon count. Read the comment block there first — it exists precisely to catch a reset that silently no-ops.

**Existing tests** — adding required `Order` fields will break order fixtures in `lib/store.test.ts` and `app/api/orders/[id]/route.test.ts`. Update them to the new shape.

## Done when

`npm test` passes and `npm run build` typechecks. `POST /api/orders` now returns `subtotal`, `discount: 0`, `coupon: null` on every order (set them in the existing handler — the total calculation itself does not change yet).

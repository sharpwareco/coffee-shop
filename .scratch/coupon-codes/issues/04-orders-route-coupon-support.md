# 04 — Coupon support in `POST /api/orders`

Status: ready-for-agent
Blocked by: 02

Where the discount actually becomes real.

## Scope

`app/api/orders/route.ts` accepts an optional `couponCode: string` in the body.

- Absent, empty or whitespace-only → `subtotal`, `discount: 0`, `coupon: null`, `total === subtotal`. Existing behaviour unchanged.
- Present → normalize, look up, `evaluateCoupon(coupon, subtotal, new Date())`. This is a **fresh evaluation**; nothing from `/api/coupons/validate` is carried over or trusted.
- `ok: false` → `badRequest(reason)`. The entire order is rejected. It is never placed at the undiscounted price — that would charge the customer more than the UI showed them.
- `ok: true` → persist `subtotal`, `discount`, `coupon: { code, amountOff }`, and `total = subtotal - discount`.

Where the coupon check sits relative to the card validation is a judgement call — put it after item pricing (it needs the subtotal) and keep the existing card checks in place.

## Tests — extend `app/api/orders/route.test.ts`

- order with a valid coupon: `total`, `subtotal`, `discount`, `coupon` all correct on the persisted order
- clamped coupon: `total` is 0, `discount < coupon.amountOff`
- expired / inactive / unknown code → 400, and **no order is created** (assert `listOrders()` is still empty — a rejected order must not leave a partial record)
- below `minSubtotal` → 400
- coupon code with surrounding whitespace and lowercase → accepted
- no coupon → `discount: 0`, `coupon: null`

## Done when

`npm test` passes.

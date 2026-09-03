# 03 — `POST /api/coupons/validate`

Status: ready-for-agent
Blocked by: 02

A preview endpoint so the customer sees the discount before entering card details. Its response carries no authority — issue 04 re-evaluates everything.

## Scope

`app/api/coupons/validate/route.ts`, following the existing hand-validation conventions (`badRequest` helper, `unknown` body, `{ error: string }` on failure).

Request: `{ code: string, items: Array<{ productId: string, quantity: number }> }`

The subtotal is computed **server-side from `items`** by looking each product up in the store. The client never sends a subtotal — a client-supplied one could fake its way past `minSubtotal`.

Item validation mirrors `POST /api/orders`: unknown product, unavailable product and non-integer/`< 1` quantity are all 400.

Success (200): `{ code, discount, subtotal, total }` — `code` normalized, `total = subtotal - discount`.
Failure: 400 with `{ error }` from `evaluateCoupon`'s `reason`.

No auth — this is a public storefront endpoint.

## Tests — `app/api/coupons/validate/route.test.ts`

Valid coupon; unknown code; inactive; expired; subtotal below `minSubtotal`; empty `items`; unknown product id; malformed JSON body. Use `resetStore()` and the seed coupons.

## Done when

`npm test` passes and the endpoint never reads a subtotal off the request.

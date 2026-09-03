# 05 — Coupon field in the checkout form

Status: ready-for-agent
Blocked by: 03, 04

## Scope

`app/checkout/checkout-form.tsx`, inside the `summary-card` aside, below the item list and above the totals — that is where the concept belongs.

- Text input + an **`type="button"`** Apply button. It must not submit the checkout form.
- Apply calls `POST /api/coupons/validate` with `{ code, items }` built from the same `rows` the summary renders. Its own loading and error state, entirely separate from the form's `submitting` / `error`.
- Errors surface via `errorMessage()` from `lib/api-error.ts`, like the rest of the app.
- On success, store the applied `{ code, discount }` in component state and show a "Remove" affordance that clears it.
- Totals block: with a coupon, three rows — `Subtotal`, `Discount −₺X` (formatted with `formatPrice`), `Total`. Without one, the single `Total` row exactly as today. Do not change the no-coupon appearance.
- The pay button shows the discounted total: `Pay ${formatPrice(total)}`.
- Submit sends `couponCode` in the `POST /api/orders` payload when one is applied.
- If the order submit fails with a coupon error, the message is shown in the form's normal error slot. The customer can remove the coupon and retry.

## Constraints

`components/**` and `app/checkout/**` are outside coverage and untested. So put **no rules here** — every eligibility decision stays in `lib/coupon.ts` and the route handlers. This component only displays what the server told it.

## Done when

`npm run build` and `npm run lint` pass, and a manual run of the cart → checkout → confirmation flow applies a discount end to end.

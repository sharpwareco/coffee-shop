# 02 — `lib/coupon.ts`: normalization and evaluation

Status: ready-for-agent
Blocked by: 01

The single source of truth for coupon rules. Both route handlers call this; neither reimplements a rule.

## Scope

```ts
export const normalizeCouponCode = (input: string): string;

export type CouponEvaluation =
  | { ok: true; discount: number }
  | { ok: false; reason: string };

export const evaluateCoupon = (
  coupon: Coupon | undefined,
  subtotal: number,
  now: Date
): CouponEvaluation;
```

- `normalizeCouponCode`: `trim()` + `toUpperCase()`. Nothing else.
- `evaluateCoupon` takes `now` as a parameter — never reads the clock itself, so expiry tests are not wall-clock dependent.
- `discount = Math.min(coupon.amountOff, subtotal)`.
- `reason` strings are customer-facing and follow the existing `badRequest` phrasing style, e.g. `"Coupon WELCOME50 has expired"`, `"Coupon WELCOME50 is not valid"` (unknown or inactive — do not leak that an inactive code exists), `` `Coupon WELCOME50 requires a minimum of ${formatPrice(minSubtotal)}` ``.

Check the order of rules: existence → active → expiry → minSubtotal, so the customer gets the most actionable message.

## Tests — `lib/coupon.test.ts`

Cover the boundaries, not just the happy path:

- `subtotal` exactly equal to `minSubtotal` (must pass — off-by-one guard)
- `amountOff` greater than `subtotal` → clamped, resulting total is 0, never negative
- `expiresAt: null` → never expires
- `expiresAt` exactly `now` → decide and pin the boundary with an explicit assertion
- `active: false` and unknown code → both `ok: false`
- normalization: `" welcome50 "` matches `WELCOME50`; `"WELCOME-50"` does **not**

## Divergences from this ticket, decided during implementation

- `CouponEvaluation`'s success branch also carries the accepted `coupon`, so callers record `code`/`amountOff`
  without a second lookup or a non-null assertion. The ticket declared `{ ok: true; discount: number }`.
- Unknown and inactive codes both return `"That coupon code is not valid"` — a single code-free string rather
  than the ticket's `"Coupon WELCOME50 is not valid"` example. An unknown code has no name to echo, and the
  ticket's own requirement is that the two cases be indistinguishable.
- An unparsable `expiresAt` counts as expired. `NaN` comparisons are all false, so the obvious check would
  read a malformed date as a coupon no date could ever switch off.

## Done when

`npm test` passes. No route handler is touched in this issue.

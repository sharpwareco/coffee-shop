# Coverage findings

Issues surfaced while building out the test suite and during the review that followed.
**None of the behavioral defects below are fixed.** Where a test can pin current behavior it does, with a
`NOTE:` comment at the assertion, so a future fix fails a test loudly rather than drifting silently.

Two caveats on that promise, stated up front because the doc is only as good as its accuracy:

- **#16 is not pinned by any test.** Replacing the hardcoded credentials with real auth would not fail
  anything — `lib/session.test.ts` imports the constants rather than asserting their values.
- **#12–#15 are not pinned either, and are not counted by coverage.** They live in `components/**` and
  `app/checkout/**`, which `vitest.config.mts` excludes because React component testing is out of scope.
  That exclusion means those files contribute nothing to the 100% figure. They are untested and uncounted,
  not low-risk — and four of the defects below are in exactly that blind spot.

Ordered by how much each would cost if it bit.

---

## 1. A card expiring in the current month is rejected — `app/api/orders/route.ts:65`

```ts
if (month < 1 || month > 12 || expiryMonth <= currentMonth) return badRequest("Card is expired");
```

Payment cards are valid **through the end of** their expiry month. A card marked `06/26` is good until
30 June 2026, but on 15 June 2026 this rejects it as expired. The comparison should be `<`.

Real customers holding a card in its final month cannot check out. Highest-impact item here.

- Pinned by: `app/api/orders/route.test.ts` → *"rejects a card expiring in the current month"*
- Should keep passing after a fix: *"accepts a card expiring next month"*, *"accepts valid month 01/02/11/12"*

## 2. `formatDate` throws on a timestamp with no time part — `lib/date.ts`

```ts
const [date, time] = iso.split("T");
// …
return `${day}.${month}.${year} ${time.slice(0, 5)}`;
```

Given `"2026-08-31"` or `""`, `time` is `undefined` and `time.slice` throws.

**Blast radius is the whole page, not one row.** It is called at `components/admin/orders-admin.tsx:61`
inside the `orders.map` table body, and there is no error boundary in `app/admin/orders/page.tsx` or
`app/layout.tsx`. One malformed `createdAt` throws during render, React unmounts the tree, and *every* order
becomes invisible — presenting to the operator as "the orders page is down" with no clue it is one bad row.

Latent today: everything writes `new Date().toISOString()`. It becomes live the moment orders arrive from an
import, a fixture, or a changed store. The fix is three characters (`time?.slice(0, 5) ?? ""`).

- Pinned by: `lib/date.test.ts` → *"throws on a string with no time component"*

## 3. Blank and exotic prices are accepted — `components/admin/products-admin.tsx:66-67`

```ts
const cents = liraToCents(draft.price);
if (!Number.isFinite(cents) || cents < 0) { setError(…); return; }
```

`Number()` is far more permissive than a decimal parser, and the `isFinite` guard does not narrow it:

| input | cents | result |
|---|---|---|
| `""`, `" "`, `"\t"` | `0` | free product |
| `"1e3"` | `100000` | ₺1000 |
| `"0x10"` | `1600` | ₺16 |

The `required` attribute blocks a genuinely empty field but **not a single space**, so the whitespace row is
reachable through the UI. The API agrees (`price: 0` is a valid non-negative integer), so nothing downstream
catches it.

- Pinned by: `lib/format.test.ts` → *"treats blank input %j as zero, not NaN"* (covers `" "`, the reachable
  case) and *"accepts exponent and hex notation as prices"*

## 4. `listProducts()` hands out the live internal array — `lib/store.ts:15,31`

```ts
export const listProducts = () => store.products;
export const listOrders  = () => store.orders;
```

Both return the store's own array by reference, so any caller can `push`/`splice` store state without going
through `createProduct`/`deleteProduct`, bypassing id-collision handling and `updatedAt` stamping.

Returning a shallow copy would close it, and appears safe: all five call sites (`app/page.tsx:5`,
`app/cart/page.tsx:5`, `app/checkout/page.tsx:5`, `app/admin/products/page.tsx:11`,
`app/admin/orders/page.tsx:11`) pass the result straight into a component as props and none depends on array
identity. Left unfixed only because it is out of scope here, not because it is risky.

- Pinned by: `lib/store.test.ts` → *"hands out the live internal array"*

## 5. `quantity` coercion is far wider than it looks — `app/api/orders/route.ts:36-40`

`Number(entry.quantity)` accepts much more than the intended integer:

| input | stored | outcome |
|---|---|---|
| `"3"` | `3` | string accepted |
| `true` | `1` | boolean accepted |
| `["3"]` | `3` | single-element array accepted |
| `1e21` | `1e21` | **201, with `total: 1.2e+25`** — `Number.isInteger(1e21)` is `true` and there is no upper bound |

The last row persists a real order carrying a nonsense total. `price` in `POST /api/products` is the same
class of hole.

Separately, the product lookup runs **before** the quantity check, so `{ productId: "nope", quantity: 0 }`
reports only `Unknown product: nope`; a client fixing the reported problem gets a second rejection.

- Pinned by: `app/api/orders/route.test.ts` → *"silently coerces %s quantity"*, *"accepts an absurdly large
  quantity with no upper bound"*, *"reports an unknown product before an invalid quantity"*

## 6. Duplicate product ids become duplicate line items — `app/api/orders/route.ts:32-48`

Posting the same `productId` twice produces two line items rather than one merged item. The total is still
correct, so this is a presentation/product decision — but the confirmation page and admin table both render
the product twice.

- Pinned by: `app/api/orders/route.test.ts` → *"keeps duplicate product ids as separate line items"*

## 7. `PUT` silently no-ops on falsy values and dirties `updatedAt` — `app/api/products/[id]/route.ts:32-45`

```ts
if (typeof data.name === "string" && data.name.trim()) patch.name = data.name.trim();
```

`PUT { name: "   " }` returns **200 and a success-shaped body**, having changed nothing. `POST` rejects the
same input with `400 Name is required`. Same field, same intent, opposite outcomes by verb — an admin who
blanks a name gets success and no explanation.

Three siblings share the shape but are guarded by `typeof`/`!== undefined` rather than truthiness, so they
currently work; the tests now pin them so a "tidy-up" to truthy checks cannot silently break them:
`price: 0`, `description: ""`, and `imageUrl: ""` are all settable. Note `imageUrl: ""` is *accepted* by PUT
while POST rejects an empty `imageUrl` outright — the same verb asymmetry as `name`.

Additionally, `updateProduct` (`lib/store.ts:21`) applies `{ updatedAt }` **unconditionally**, so even a
patch that changes nothing bumps the record's audit timestamp.

- Pinned by: `app/api/products/[id]/route.test.ts` → *"silently ignores a blank name instead of rejecting
  it"*, *"can set a price to zero"*, *"can clear a description to an empty string"*, *"can clear an image URL
  to an empty string"*, *"bumps updatedAt even when the patch changes nothing"*

## 8. `formatDate` silently discards the timezone offset — `lib/date.ts`

It string-slices the literal ISO fields rather than parsing, so `"2026-08-31T14:30:00Z"` and
`"2026-08-31T14:30:00+03:00"` both render as `31.08.2026 14:30`. A UTC timestamp is displayed as if it were
local time. Harmless while every timestamp is generated the same way; wrong the moment they are not.

- Pinned by: `lib/date.test.ts` → *"truncates seconds and the timezone suffix"*

## 9. An out-of-range month is reported as an expired card — `app/api/orders/route.ts:65`

`month < 1 || month > 12 || expiryMonth <= currentMonth` folds a **malformed** month into the **expired**
message. Expiry `13/30` returns `"Card is expired"`, which is simply untrue and sends the customer to check
the wrong thing on their card.

- Pinned by: `app/api/orders/route.test.ts` → *"reports out-of-range month %s as 'expired'"*

## 10. A non-boolean `available` is coerced to `true` — `app/api/products/route.ts:36`

`typeof data.available === "boolean" ? data.available : true` means `available: "no"` creates an
**available** product rather than returning 400. Every other field on this endpoint validates its type and
rejects; this one silently substitutes.

- Pinned by: `app/api/products/route.test.ts` → *"coerces a non-boolean availability to true rather than
  storing it"*

## 11. A corrupt cart is silently discarded — `lib/cart-storage.ts:26-28`

```ts
} catch { return []; }
```

Unreadable storage and empty storage are indistinguishable to the caller. The customer's basket empties
itself between visits, nothing is logged, and no message is shown. At minimum the two cases should be
separable so the UI can say *"We couldn't restore your cart"* instead of rendering a silently empty one.

- Pinned by: `lib/cart-storage.test.ts` → *"returns an empty cart for unparseable or non-array JSON"*

## 12. A placed order can be reported as a network failure, with the cart already cleared — `app/checkout/checkout-form.tsx:46-61`

**Not pinned, not covered.** The most severe item in the codebase.

```ts
const res = await fetch("/api/orders", {…});
const data: unknown = await res.json();   // no .catch — the three admin components all have one
…
clear();                                   // inside the try
router.push(`/confirmation?orderId=${(data as { id: string }).id}`);  // inside the try
} catch { setError("Network error. Please try again."); }
```

Two defects compound on the money path. `res.json()` is unguarded, so a truncated body or an HTML proxy
response on an otherwise-successful `201` throws — and the order is **already created** in the store
(`app/api/orders/route.ts:70`). Because `clear()` and `router.push()` are also inside the `try`, any throw
after the successful POST empties the cart and then reports "Network error". The customer retries, hits
`rows.length === 0` → *"Nothing to check out"*, and is left with an order they were told failed, no order id,
and no cart to rebuild.

The catch also collapses a JSON parse failure, an undefined `data.id`, and a `router.push` throw into the
same four-word message.

## 13. Logout has no error handling, and a failed logout looks like success — `components/admin/admin-nav.tsx:9-13`

**Not pinned, not covered.** Security-relevant.

```ts
await fetch("/api/admin/logout", { method: "POST" });
router.push("/admin/login");
```

No `try`, no `res.ok`, no error state. On a network failure the promise rejects, `router.push` never runs,
and clicking "Log out" does *visibly nothing*. On a non-2xx the cookie survives, the code navigates to
`/admin/login` anyway, and `app/admin/login/page.tsx:8` redirects an authenticated user straight back to
`/admin/products` — so the admin appears to bounce off the login page while **still logged in**, plausibly on
a shared machine.

## 14. `changeStatus` refreshes on the failure path and erases its own error — `components/admin/orders-admin.tsx:26-29`

**Not pinned, not covered.**

```ts
if (!res.ok) { setError(errorMessage(await res.json().catch(() => null), "Update failed")); }
router.refresh();   // no `return` — runs on success and failure alike
```

Every other handler in the codebase returns after `setError`; this one does not. On an expired session the
401 sets an error, then the refresh triggers the redirect in `app/admin/orders/page.tsx:9`, unmounting
`OrdersAdmin` and taking the error state with it — the status change is lost and the admin lands on the login
page with no explanation. The `<select>` also snaps back to the server value, leaving "rejected" and "never
sent" visually identical. And with one shared error slot for the whole table, "Update failed" appears with no
indication of *which* order failed.

## 15. Unguarded `localStorage` in the app-wide provider — `components/cart-context.tsx:24,29`

**Not pinned, not covered.**

`parseStored` defends against `null` and bad JSON, but `localStorage` *itself* throws in Safari private
browsing, when a browser blocks site data, and on `QuotaExceededError`. Neither the `getItem` nor the
`setItem` call is wrapped, and `CartProvider` wraps the entire tree at `app/layout.tsx:16` — so a throw takes
down every page, not just the cart.

## 16. The admin session is trivially forgeable — `lib/session.ts:1-4`

```ts
export const ADMIN_COOKIE_VALUE = "authenticated";
export const ADMIN_USERNAME = "admin";
export const ADMIN_PASSWORD = "admin1234";
```

Credentials are hardcoded in source and the session cookie is a fixed string, not a signed token. The cookie
is `httpOnly` (`app/api/admin/login/route.ts:25`), so `document.cookie` will not set it — but curl, DevTools,
or any proxy will. There is no expiry beyond the 24h `Max-Age` and no way to revoke a session.

Understood to be acceptable for a training skeleton. Flagged because it must not ship as-is, and because
**no test pins it** — the suite imports these constants rather than asserting their values, so replacing them
with real auth breaks nothing. `lib/session.test.ts` does guard the *parsing* (including a near-miss cookie
name that a refactor to `header.includes(...)` would let through).

---

## Resolved while adding coverage

Five helpers were extracted from `"use client"` components into `lib/` so they could be tested at all. All
five were verified byte-identical to their originals — the moves changed no behavior:

| Extracted | From |
|---|---|
| `errorMessage` → `lib/api-error.ts` | `login-form.tsx`, `products-admin.tsx`, `orders-admin.tsx` — **three byte-identical copies**, plus a fourth inlined copy in `checkout-form.tsx` with a different fallback string, now also consolidated |
| `formatExpiry` → `lib/expiry.ts` | `app/checkout/checkout-form.tsx` |
| `formatDate` → `lib/date.ts` | `components/admin/orders-admin.tsx` |
| `parseStored`, `STORAGE_KEY`, `CartItem` → `lib/cart-storage.ts` | `components/cart-context.tsx` |
| `centsToLira`, `liraToCents` → `lib/format.ts` | `components/admin/products-admin.tsx` |

## Still open, below the bar for a numbered finding

- **`res.status` is discarded at all four `errorMessage` call sites.** A 502 from a proxy, a 500 with an HTML
  body, or a 413 all render as "Save failed" / "Update failed" / "Login failed". Passing
  `` errorMessage(body, `Save failed (${res.status})`) `` is a one-line change that makes them reportable.
- **The generic `catch` blocks wrap post-success navigation as well as the fetch** in `login-form.tsx:28-29`,
  `products-admin.tsx:94-95`, and `checkout-form.tsx:57-58`. A throw from `router.push` tells a
  successfully-authenticated admin the network failed; in `products-admin.tsx` the natural retry creates a
  **duplicate product** with an `-2` suffix.
- **`slugify` strips non-ASCII**, so `"Café Crème"` becomes `caf-cr-me`. Cosmetic, but user-visible in URLs.

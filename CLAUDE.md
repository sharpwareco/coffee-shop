# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev            # Next dev server (Node 22+ required)
npm run build          # production build
npm run lint           # eslint (next/core-web-vitals + next/typescript)
npm test               # vitest run
npm run test:coverage  # vitest + v8 coverage (text/html/json-summary)

npx vitest run lib/date.test.ts          # single file
npx vitest run -t "rejects a card"       # single test by name
```

There is no separate typecheck script; `npm run build` is the type gate (`tsc --noEmit` also works).

## Architecture

Next.js 15 App Router, React 19, TypeScript strict, zero runtime dependencies beyond Next/React. No database, ORM, payment provider, customer auth, or validation library — that is deliberate (see "Demo philosophy" in README.md). Prefer shallow folders and direct functions over layered abstractions.

**In-memory store (`lib/store.ts`)** — the whole data layer. `data/products.json` and `data/coupons.json` are `structuredClone`d into a singleton hung off `globalThis.__midnightCoffeeStore` so Next's dev-server module reloading doesn't duplicate it. Runtime mutations are never written back to JSON; restarting the server resets products and coupons to seed and drops all orders. Store getters (`listProducts`, `listOrders`, `listCoupons`) return the live internal arrays, and mutators (`updateProduct`, `updateOrderStatus`) mutate objects in place — callers share references with the store.

**Server components read the store directly.** `app/page.tsx`, `app/cart/page.tsx`, `app/checkout/page.tsx` and the admin pages call `listProducts()`/`listOrders()` at render time and pass results into `"use client"` components. The API routes exist for mutations and for client-side fetches, not as the read path for pages.

**Auth is two parallel checks against one cookie** (`lib/session.ts`, hardcoded `admin`/`admin1234`):
- Route handlers: `isAdmin(request)` parses the raw `cookie` header → 401.
- Admin server components: `await cookies()` + `redirect("/admin/login")`.

Adding an admin-mutating route means adding the `isAdmin` guard explicitly; nothing enforces it centrally.

**Cart** lives entirely client-side in `components/cart-context.tsx` (React Context + `localStorage`, parse/validate in `lib/cart-storage.ts`), storing only `{productId, quantity}`. `POST /api/orders` reprices every line from the server-side product record — never trust client prices.

**Conventions**
- Prices are integer cents everywhere; format at the edge with `lib/format.ts` (`formatPrice` → tr-TR/TRY, `centsToLira`/`liraToCents` for form fields).
- Route handlers hand-validate `unknown` bodies with a local `badRequest` helper and return `{ error: string }`; clients unwrap it via `errorMessage()` in `lib/api-error.ts`.
- Dynamic route params are Promises in Next 15: `context: { params: Promise<{ id: string }> }`.
- Product ids are slugified from the name with a numeric suffix on collision (`app/api/products/route.ts`).
- Import via the `@/` alias (mapped in both `tsconfig.json` and `vitest.config.mts`).

## Tests and known defects

Tests are co-located `*.test.ts` beside the code, with shared helpers in `tests/support/store.ts` (`resetStore()`, `adminHeaders`, `jsonHeaders`). `resetStore()` reassigns `store.products`/`store.orders` on the singleton and then self-verifies through the public API — it depends on `lib/store.ts` reading `store.*` at call time, so don't refactor those getters to capture the arrays in module scope.

Coverage is scoped to `lib/**/*.ts` and `app/api/**/*.ts`. `components/**` and `app/checkout/**` are untested **and uncounted** — not low-risk; several known defects live there. The `.tsx` exclusion is also forced by a `@vitest/coverage-v8` 4.1.11 bug (JSX parse failure in the uncovered-file pass); recheck on upgrade.

**`docs/coverage-findings.md` catalogues 16 known defects that are intentionally NOT fixed.** Most are pinned by tests carrying a `NOTE:` comment at the assertion, so "fixing" one breaks its test. Before changing behavior in `lib/date.ts`, `lib/format.ts`, `lib/cart-storage.ts`, the card-expiry check in `app/api/orders/route.ts`, or the `PUT` patch logic in `app/api/products/[id]/route.ts`, read that doc — if a fix is genuinely wanted, update the pinning test and the doc entry together rather than silently flipping the assertion.

## Agent skills

### Issue tracker

Issues and specs live as markdown files under `.scratch/<feature-slug>/` in this repo. See `docs/agents/issue-tracker.md`.

### Triage labels

The five canonical triage roles, used verbatim as `Status:` values in issue files. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.

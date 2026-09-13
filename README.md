# Midnight Coffee

Deliberately simple coffee-shop e-commerce app for AI engineering training.

## Requirements
- Node.js 22+
- npm

## Run
```bash
npm install
npm run dev
```

## Test
```bash
npm test              # run the suite
npm run test:coverage # suite + coverage report
```

Tests are co-located as `*.test.ts` next to the code they cover, with shared helpers in `tests/support/`.
Coverage is scoped to `lib/**` and `app/api/**` — the React components in `components/**` and
`app/checkout/**` are **not tested and not counted**. Known defects, including several in that untested
surface, are catalogued in [`docs/coverage-findings.md`](docs/coverage-findings.md).

## What it does
### Customer storefront (no login)
- Product grid from the seed catalog.
- Add to cart with a React Context cart persisted to `localStorage`.
- `/cart` with quantity controls, `/checkout` with order summary, and `/confirmation`.
- `POST /api/orders` reprices items server-side from product IDs/quantities, validates a simulated card (any 16-digit number), stores only the card `last4`, and creates a `pending` order.
- Checkout accepts any 16-digit card number (spaces optional) and auto-formats the expiry field to `MM/YY`; a future expiry and 3-digit CVC are required.

### Admin
- `/admin/login` — demo credential `admin / admin1234`.
- `/admin/products` — create, edit, delete products in the in-memory store.
- `/admin/orders` — list orders and move them between `pending`, `preparing`, `ready`, `completed`, `cancelled`.
- Admin mutation APIs are protected server-side with a small HttpOnly-cookie session.

## Data model
`data/products.json` is loaded into a process-global in-memory datastore in `lib/store.ts`.

Runtime changes are intentionally NOT written back to JSON. Restarting the Next.js server resets products to the seed and removes all orders.

## Demo warnings
- **Not for production.** No database, ORM, real payment provider, customer auth, or rate limiting.
- Card numbers, CVVs and expirations are never persisted; only the card's `last4` is stored on the order.
- The admin session is a fixed HttpOnly cookie — the credential is hardcoded for the demo.

## Demo philosophy
Simplicity is intentional. Prefer shallow folders, direct functions and the in-memory store over production architecture.

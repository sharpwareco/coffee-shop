# Midnight Coffee

Deliberately simple coffee-shop e-commerce skeleton for AI engineering training.

## Requirements
- Node.js 22+
- npm

## Run
```bash
npm install
npm run dev
```

## Data model
`data/products.json` is loaded into a process-global in-memory datastore in `lib/store.ts`.

Runtime changes are intentionally NOT written back to JSON. Restarting the Next.js server resets products to the seed and removes all orders.

## Current baseline
- Seed products
- In-memory product/order store
- Public product APIs
- Storefront shell
- Product cards

Cart, checkout and admin are implemented by the training tasks under `tasks/`.

## Demo philosophy
This is not a production architecture. Simplicity is intentional.

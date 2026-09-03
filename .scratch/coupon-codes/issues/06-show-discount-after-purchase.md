# 06 — Show the discount on confirmation and in admin

Status: ready-for-agent
Blocked by: 04

Without this, a customer who used a coupon and the admin looking at their order see different stories.

## Scope

**`app/confirmation/page.tsx`** — below the item list, the same three rows as checkout: `Subtotal`, `Discount −₺X`, `Total`. When `order.discount === 0`, render today's single `Total` row unchanged.

**`components/admin/orders-admin.tsx`** — in the total cell, show the coupon code alongside the total when `order.coupon` is set. If `discount < coupon.amountOff` (the clamp), make that visible rather than misleading — showing the actual `discount` is what matters.

Both read fields that already exist on the order after issue 04. No new API calls.

## Done when

`npm run build` and `npm run lint` pass; a discounted order shows consistent numbers on the confirmation page and the admin orders table.

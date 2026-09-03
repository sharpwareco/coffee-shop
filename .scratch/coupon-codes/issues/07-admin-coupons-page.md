# 07 — Read-only `/admin/coupons` page

Status: ready-for-agent
Blocked by: 01

## Scope

`app/admin/coupons/page.tsx` — a server component that calls `listCoupons()` directly at render time, like the other admin pages. Guard with `await cookies()` + `redirect("/admin/login")`, matching `app/admin/orders/page.tsx` exactly.

Table columns: code, description, `amountOff` (via `formatPrice`), `minSubtotal`, `expiresAt`, `active`.

Add a `Coupons` link to `components/admin/admin-nav.tsx`.

## Explicitly not in scope

No API route, no create/edit/delete, no client component. Coupons are seed data; admin only reads them. Adding `POST`/`PUT`/`DELETE` routes would each need their own explicit `isAdmin` guard — nothing enforces that centrally — and that is a separate effort.

## Done when

`npm run build` and `npm run lint` pass; visiting `/admin/coupons` while logged out redirects to the login page.

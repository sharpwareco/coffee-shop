# Task 2 — Admin

Implement `/admin/login`, `/admin/products`, `/admin/orders` and logout. Fixed demo credential: admin / admin1234. Use the smallest server-side HttpOnly-cookie session; no auth framework, JWT infrastructure, DB users or roles. Protect admin mutation APIs server-side. Product create/edit/delete uses the existing in-memory store. Admin can list orders and change only valid statuses: pending, preparing, ready, completed, cancelled. Keep UI consistent with DESIGN.md and intentionally small. Run lint and build.

# Design direction

Source of truth: https://raw.githubusercontent.com/silverspell/awesome-design-md/refs/heads/main/design-md/shopify/DESIGN.md

This project adapts that system to a coffee-store storefront. Key local rules:
- Dark first: #000000 root, #02090A cards, #061A1C sections, #102620 elevated surfaces.
- White primary text, #A1A1AA muted text.
- #36F4A4 is a restrained accent/focus color, not a large-surface fill.
- Primary CTAs are full pill buttons.
- Cards/inputs use rounded corners and subtle borders (#1E2C31).
- Generous spacing and a max ~1280px content width.
- Responsive: 1 column mobile, 2 tablet, 3 desktop is fine for product grids.
- Use system Helvetica/Arial/Inter-like fallbacks; do not depend on proprietary fonts.
- Avoid generic SaaS dashboards, excessive gradients, charts and decorative complexity.

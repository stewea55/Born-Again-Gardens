# copy-corrected-1 copy updates (revised)

**Date:** 2026-03-07

**Summary:** Implements revised copy/UX updates from `xEdits 1.2/Copy changes` on `copy-corrected-1`, including basket per-unit display from DB, conditional harvest modal close behavior with Add vs Confirm states, shop empty-state cleanup, homepage wishlist link card, and payment flow label removal.

## Scope

- `components/BasketClient.js`
  - Update copy to `Market Price` and `Payment Amount`.
  - Fetch `unit` from `public.plant_catalog` for basket line items and display as `price per unit`.
- `components/HarvestClient.js`
  - Enforce Add/Confirm mutual visibility.
  - Quantity `0`: Add visible and outside click closes.
  - Quantity `> 0`: Confirm visible; outside click does not close; Confirm saves and closes.
- `components/ShopClient.js`
  - Remove temporary v1 scaffold copy.
  - Hide `View cart` CTA for now.
  - Show explicit empty-state message when no products exist.
- `app/page.js`
  - Add wishlist card between generous support and volunteer sections.
  - Make `wishlist` an inline hyperlink to MyRegistry.
- `components/PaymentClient.js`
  - Remove `Flow:` line from payment summary while keeping total/donation lines.
- Logging
  - Update `organization/Project-Decisions.md`.
  - Update `organization/Project-Simple-Decisions.md`.
  - Update `organization/Push-to-Production.md` for the temporary hidden `View cart` behavior.

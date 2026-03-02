# Harvest page plant catalog – change plan

**Date:** 2026-03-01  
**Summary:** Harvest catalog: 3 columns (including phone), square image+name cards; detail modal (close by clicking outside only; no category in content; null fields hidden; Add to basket becomes quantity toggle); category filter toggles; search with autofill; alphabetical sort; switch to market_price in code and docs.

---

**Source:** [xEdits 1.1/harvest page plant catalog.md](xEdits 1.1/harvest page plant catalog.md)

**Current state:** [app/harvest/page.js](app/harvest/page.js) fetches `id, name, description, suggested_donation, unit` and orders by `id`. [components/HarvestClient.js](components/HarvestClient.js) renders a two-column grid of cards showing name, description, suggested amount, and "Add to basket"; no image, no popup, no category/search/sort.

**DB note:** You renamed `suggested_donation` to `market_price` in the DB. The app still uses `suggested_donation` in the select and in the client; all of that will be updated to `market_price`.

---

## 1. Data and API

- **Harvest page fetch ([app/harvest/page.js](app/harvest/page.js))**
  - Select all columns needed for catalog + detail popup: `id, name, scientific_name, category, description, harvest_start, harvest_end, medicinal_benefits, harvest_instructions, companion_plants, market_price, unit, status, image_url, in_stock, created_at`.
  - Order by `name` ascending (alphabetical) instead of `id`.
- **HarvestClient**
  - Use `market_price` everywhere (basket `unit_price`, any displayed price). Remove references to `suggested_donation`.

---

## 2. Card display (catalog only)

- **Content:** Each card shows only **plant image** (`image_url`) and **plant name**. No description or price on the card.
- **Layout:** **3 cards per row** on all screen sizes, including phone. **Square** cards.
  - Add a dedicated grid class in [app/globals.css](app/globals.css) (e.g. `.harvest-catalog-grid`): `grid-template-columns: repeat(3, 1fr)`, gap, and square aspect ratio (`aspect-ratio: 1`) on each card; image fills the card (object-fit cover), name below or overlaid per branding.
  - No responsive column reduction: always 3 columns across (phone, tablet, desktop). Ensure touch targets and text remain usable on small screens (e.g. via min font size or card min-width if needed).

---

## 3. Plant detail popup (modal)

- **Trigger:** Clicking a plant card opens a **popup/modal**.
- **Close:** **Only** by clicking anywhere outside the popup (on the backdrop). No X button. Reuse the existing pattern: `modal-backdrop` with `onClick={onClose}` and inner `modal` with `onClick={(e) => e.stopPropagation()}` (see [components/CheckoutGateModal.js](components/CheckoutGateModal.js)).
- **Content:**
  - Show plant information from `plant_catalog`, including **Market price** (label "Market price", value from `market_price`). **Do not include "category"** in the modal. For any column whose value is **null** in the table, **do not display** that header/row in the modal (only render fields that have a value). Use typography from [Word doc/Layout and Branding Rules.md](Word doc/Layout and Branding Rules.md).
- **Add to basket / quantity in modal:**
  - **When opening the modal:** If this plant is **already in the basket**, show the **quantity toggle** with the **current basket quantity** for that plant (do not show "Add to basket"). If the plant is **not** in the basket, show "Add to basket".
  - **When user clicks "Add to basket":** Add the plant to the basket with quantity 1 and **replace** the button with the quantity toggle (showing 1).
  - **When the user closes the modal:** The quantity currently shown in the modal **is** the basket quantity for that plant. **Set** the basket line item to that quantity (replace, not add). Example: user adds tomato (quantity 1), closes → basket has 1. User re-opens tomato, sees quantity 1, changes to 4, closes → basket now has 4 for tomato (not 5). So the modal quantity on close **updates** the basket; it is never additive.

---

## 4. Category filter (visibility toggle)

- **UI:** Buttons labeled by **category** as stored in `public.plant_catalog` (e.g. fruit, vegetable, herb, flower). Derive the list of buttons from distinct `category` values in the fetched plants.
- **Behavior:** Multi-select toggle. Clicking a category button toggles it on/off. The set of selected categories defines which cards are visible (plant's `category` is in the selected set). **If no category is selected, show all plants.**
- **Placement:** Above the card grid (e.g. below search, with flex wrap for many categories).

---

## 5. Search with autofill

- **Search bar:** Text input that filters the **visible** catalog (after category filter) by plant name (and optionally scientific_name). Typing narrows the list in real time.
- **Autofill:** As the user types, show a dropdown (or inline list) of **matching plant names** from the current dataset (filtered by category first, then by name match). Selecting an option can either: (a) set the search term and filter to that plant, or (b) scroll to / highlight that card and optionally open the detail modal. Simplest: filter list by search term and show a small dropdown of up to N matching names; choosing one applies that as the search filter (and optionally opens the modal for that plant). No new backend; use client-side filter over the already-fetched, category-filtered list.

---

## 6. Sort

- **Rule:** Always sort plants **alphabetically by plant name** (A–Z).
- **Scope:** Applied to the list **after** category and search filters, so visible cards are always in alphabetical order. Server already returns by `name`; client should preserve that order when applying category and search filters (e.g. filter in place without re-sorting, or sort filtered array by `name` before rendering).

---

## 7. Implementation order (suggested)

1. **Data + market_price:** Update [app/harvest/page.js](app/harvest/page.js) select and order; update [components/HarvestClient.js](components/HarvestClient.js) to use `market_price` and receive full plant fields.
2. **Layout + cards:** New grid CSS; card = image + name only; always 3 columns (including phone).
3. **Detail modal:** Modal in HarvestClient; close only via backdrop click; render only non-null plant fields (exclude category); "Add to basket" that becomes a quantity toggle when used.
4. **Category filter:** Derive categories from data; category toggle buttons; filter visible cards (none selected = all).
5. **Sort:** Ensure filtered list is sorted by `name` (already from server; re-sort after client filter if needed).
6. **Search + autofill:** Search input; filter by name (and optionally scientific_name); optional dropdown of matching names for autofill.
7. **Docs:** Update [organization/Project-Decisions.md](organization/Project-Decisions.md) (and [Project-Simple-Decisions.md](organization/Project-Simple-Decisions.md)) to use `market_price` instead of `suggested_donation` in plant_catalog column list. Add a one-line log in [organization/Old-Features-Changed.md](organization/Old-Features-Changed.md) for the column rename. If [organization/Form-API-to-DB.md](organization/Form-API-to-DB.md) mentions suggested_donation for plant_catalog, update to market_price.

---

## 8. Files to touch (summary)

- **Data / server:** [app/harvest/page.js](app/harvest/page.js)
- **Client UI:** [components/HarvestClient.js](components/HarvestClient.js)
- **Styles:** [app/globals.css](app/globals.css)
- **Docs:** [organization/Project-Decisions.md](organization/Project-Decisions.md), [organization/Project-Simple-Decisions.md](organization/Project-Simple-Decisions.md), [organization/Old-Features-Changed.md](organization/Old-Features-Changed.md), [organization/Form-API-to-DB.md](organization/Form-API-to-DB.md) (if applicable)

No RLS or schema changes required; plant_catalog remains read-only and the column rename is already done in the DB.

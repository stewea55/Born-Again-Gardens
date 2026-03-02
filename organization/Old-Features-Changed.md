# Old Features Changed

When we change or drop something that was in Project-Decisions or Potential-Features, add one line here with **date and short reason**. Update or remove the item from the source file.

---

## Log

- **2026-02-27:** Removed sponsorships payment path; corporate sponsors contact via email/phone only (info@bornagaingardens.org, 317-385-4165). Sponsor tables are display-only, manually updated. See Project-Decisions (Company / sponsor).
- **2026-03-01:** Renamed plant catalog pricing field from `suggested_donation` to `market_price`; updated harvest catalog fetch/render and docs to use the new field.
- **2026-03-01:** Replaced admin design TBD with implemented `/admin` flow and corrected table reference from `other_catalog` to `shop_catalog` in decisions docs.
- **2026-03-01:** Combined sponsor usage into single table `sponsors_public` for "Our Generous Sponsors"; added RLS (select anon/auth, all admin). Admin API generates UUID for new sponsor rows. See Form-API-to-DB and Project-Decisions.

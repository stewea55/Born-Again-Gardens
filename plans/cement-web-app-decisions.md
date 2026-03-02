# Cement Web App Plan

**Date:** 2025-02-04

**Summary:** Lock the product, data, and auth decisions (platform, catalog, sensitive data, guest one-time flow, login at checkout) into Project-Decisions.md and Project-Simple-Decisions.md, with Security-Checklist updated for request context (user vs guest). Ensures the web app plan is documented and passes security rules.

---

## Goal

Write the agreed product, data, and auth decisions into Project-Decisions.md (source of truth) and Project-Simple-Decisions.md (short summary). Include Date for new content. Content satisfies security.mdc and Security-Checklist.md.

## Delivered

- **Project-Decisions.md** — Full sections: Platform and infra, Product, Data and access (catalog, sensitive, routes), Guest (no login), Auth and checkout UX. Security-aligned (RLS, no raw PII in logs, route rules, account deletion with retained payment records).
- **Project-Simple-Decisions.md** — Same section headings with 1–2 plain-language sentences each.
- **Security-Checklist.md** — Request context note: logged-in user or guest (one-time); RLS and route checks handle both; "session and role" means this request context.

Plans folder and rule (`.cursor/rules/plan-storage.mdc`) created so future plans are stored here with date and summary.

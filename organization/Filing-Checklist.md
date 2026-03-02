# Filing Checklist

Use this as the **one-place checklist** for where each decision or topic goes. When you add or change a decision, put it in the right file(s) using this table.

---

## Where each decision / topic goes

| Decision / topic | Primary file | Also add to |
|------------------|--------------|-------------|
| API design, routes, auth, payloads | API.md | plans/api-and-backend-plan.md (source for v1) |
| Form fields / API payload → DB table & columns | Form-API-to-DB.md | Keep table/column names matching Supabase exactly |

---

## File purposes (quick reference)

| File | Put in it |
|------|-----------|
| **Project-Decisions.md** | Decisions you've **locked in**. Source of truth for "what we're building." |
| **Push-to-Production.md (p2p)** | **Before go-live:** steps you must do for production (backups, staging, Sentry, secrets, etc.). Checklist format. |
| **Post-Production_Upgrades.md** | **After go-live:** upgrades that help scaling/security/UX but aren't required for first production push. Bare-minimum implementation notes. |
| **Potential-Features.md** | Things you're **not decided on yet**. Can overlap with before or after production. |
| **Old-Features-Changed.md** | **Log only:** when you change or drop a feature, add a line here with date and reason. |
| **API.md** | **When you start building:** our API design (routes, auth, payloads) and third-party APIs (Calendly, OpenRouter, Supabase). |
| **Form-API-to-DB.md** | **Form/API → DB mapping:** which form fields and API payloads map to which Supabase table and column. Single place for records; keep in sync with Supabase schema. |

---

## Quick flow

- **New decision** → Project-Decisions.md (and, if it's a production step, also p2p).
- **"We might do this later"** → Potential-Features.md or Post-Production_Upgrades.md (depending on "undecided" vs "decided but after launch").
- **Change/remove a decision** → add a line in Old-Features-Changed.md and update or remove from Project-Decisions.md (or Potential-Features.md).

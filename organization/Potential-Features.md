# Potential Features

Items we're **not decided on yet** or will revisit later. See [Filing-Checklist.md](Filing-Checklist.md) for where decisions go when locked in.

---

## Admin full design

**Date:** 2025-02-05

Admin exists and can masquerade (e.g. as a Google user), monitor, and change data in certain tables via the app (no direct DB access). The **full design** — which tables, which actions, UI, audit logging — is not in scope for the current API/backend plan. We'll revisit later.

---

## Form/display order (guest and company)

**Date:** 2025-02-05

Order of fields on guest and company forms is TBD. Form inputs will map to DB column names (Guests table for guest form, Sponsors table for company form). Display order on the form is flexible and can be decided later.

---

## Realtime

**Date:** 2025-02-05

Whether to enable Supabase Realtime on any tables is undecided. Decision TBD for all tables.

---

## Summary

- [ ] Admin full design (masquerade, monitor, change data — which tables, actions, audit)
- [ ] Form/display order for guest and company forms
- [ ] Realtime: enable or not for tables (TBD)

# Upcoming events table, RLS, and volunteer flow

**Date:** 2026-03-09

**Summary:** RLS was added for the new `upcoming_events` table (public read, admin full access). The app was switched from storing volunteer upcoming events in `resources` to the dedicated `upcoming_events` table. Admin CRUD uses date/time inputs and image URL or upload; the volunteer page shows only visible events with formatted dates/times and optional image and additional text.

---

- **RLS:** Migration `20260309_001_upcoming_events_rls.sql` — SELECT for anon/authenticated, INSERT/UPDATE/DELETE for `is_admin()`.
- **Backend:** Validators and queries use table `upcoming_events` with event_name, event_start_date, event_end_date, event_start_time, event_end_time, image_url, additional_textbox, visibility. `lib/upcoming-events.js` reads where visibility = true.
- **Admin UI:** AdminClient and AdminTableEditor updated with date/time column types (native pickers), image_url (text + upload), visibility toggle. No id or created_at in form.
- **Volunteer page:** UpcomingEvents component displays event name, image (if set), “When:” (formatted date range and time range), additional text. Nulls omitted; date format “Monday March 9th”, time format “2:00 PM”.
- **Storage:** Event images use existing `admin-assets` bucket (upload API with folder); no new bucket.
- **Docs:** Project-Decisions, Project-Simple-Decisions, Form-API-to-DB, API, Old-Features-Changed updated.

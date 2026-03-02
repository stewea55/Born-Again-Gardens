# Protecting Secrets in the Application

**Date:** 2025-02-17

**Summary:** Set up secrets protection so env vars are never committed, used correctly (server vs client), and documented for the team. Includes .gitignore, .env.example, and usage rules.

---

## Current state (at plan creation)

- .env.local exists with Supabase and Stripe keys (real values)
- No .gitignore — env files could be committed if git is used
- Docs expect .gitignore to cover .env*

---

## Implemented

1. **.gitignore** — Created with .env, .env.local, .env*.local entries so secrets are never committed.
2. **.env.example** — Template listing required env vars with no real values; safe to commit.
3. **Security-Checklist.md** — DB credentials item marked done.

---

## Env var usage rules (for when you write code)

| Variable | Where to use | Safe in browser? |
|----------|--------------|------------------|
| NEXT_PUBLIC_SUPABASE_URL | Client + server | Yes |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Client + server (anon client) | Yes (with RLS) |
| SUPABASE_SERVICE_ROLE_KEY | **Server only** | **No** |
| STRIPE_SECRET_KEY | **Server only** | **No** |
| NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY | Client (Stripe.js) | Yes |
| STRIPE_WEBHOOK_SECRET | **Server only** | **No** |
| NEXT_PUBLIC_API_URL | Client (fetch calls) | Yes |

**Rule:** Never use SUPABASE_SERVICE_ROLE_KEY, STRIPE_SECRET_KEY, or STRIPE_WEBHOOK_SECRET in client components or "use client" files.

---

## Future (when adding code)

- **lib/supabase:** Create client.ts (anon) and server.ts (service role). Server module never imported from "use client".
- **Stripe:** Secret key and webhook secret only on server.
- **Optional:** lib/env.ts to validate required server vars at startup.

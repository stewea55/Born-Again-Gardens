# Security Checklist

Use this file as a reference: checklist to tick off as we implement, "when to consider" for each measure, and quick leak-check questions. When adding a new table or API route, the security rule (`.cursor/rules/security.mdc`) requires checking this file for compliance.

---

## Checklist — implement in this order

- [ ] **Auth:** Supabase Google/Microsoft login; session and role available on every request.
- [ ] **Role-based access:** Every API route that returns sensitive data checks session and role before calling business layer.
- [ ] **RLS on sensitive tables:** Each of profiles, items, projects (and any other sensitive table) has RLS enabled and policies (by user_id, company_id, or admin).
- [x] **DB credentials:** Only on server, only in env; never in frontend or repo. .gitignore covers .env*.
- [ ] **HTTPS:** Enforced when we deploy (host default).
- [ ] **PII:** No raw PII in logs or error monitoring; RLS and no-log policy for any new PII field or API.
- [ ] **Account deletion:** Supported (user can request or perform deletion of account and associated data as required).
- [ ] **Audit:** Log sensitive actions (e.g. admin masquerade) when we implement those features.
- [ ] **Backups:** Quarterly (or agreed) DB export to safe storage before/at go-live.

---

## When to consider (reference)

- **Request context:** Can be **logged-in user** or **guest (one-time checkout)**; guests do not have a persistent identity. RLS and route checks must handle both (e.g. catalog readable by all; checkout history only for the owning user or backend). "Session and role available on every request" means this request context (user or guest).
- **Adding a new table** → Enable RLS and add policies before merging.
- **Existing RLS policies in Supabase** → Do not change, add, or remove them unless the user explicitly asks. See `.cursor/rules/supabase-rls.mdc`. If a change is needed, propose it explicitly and let the user approve.
- **Adding a new API route** → Auth + role check; if it returns PII, document in API.md and ensure no raw PII in logs.
- **Adding a new field** → If it could be PII, apply RLS and no-log policy.
- **Adding error reporting (e.g. Sentry)** → Never attach raw PII to events.
- **Deploying** → HTTPS, env vars on host, no secrets in repo.

---

## Quick leak-check questions (run anytime)

1. **PII/sensitive?** Does this table or API expose PII or sensitive data? → RLS on? No raw PII in logs?
2. **Auth + role?** Are we checking who's logged in and their role before returning data?
3. **Secrets?** Are any DB or API keys in the frontend or in Git?
4. **Bypass RLS?** If we're bypassing RLS (e.g. service role), is it one place and documented in API.md?
5. **Own data only?** Can users only see/edit/delete their own data (or only what we explicitly allow)?

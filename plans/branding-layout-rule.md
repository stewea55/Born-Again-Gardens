---
Date: 2026-02-24
Summary: Create an always-on branding/layout rule tied to the Layout and Branding Rules doc, and log this decision in Project-Decisions and Project-Simple-Decisions.
---

# Branding Rule Integration

## Context to anchor the rule

- Fonts, headings, and color palette are defined in `Word doc/Layout and Branding Rules.md`.

## Plan

- Create an always-apply Cursor rule at `.cursor/rules/branding-layout.mdc` that:
  - Requires referencing the branding/layout doc before writing or changing any copy, colors, typography, header/footer, or layout decisions.
  - Summarizes the key do-not-invent constraints (fonts, color palette, parchment background default, markup conventions for headings, links, buttons).
  - States that if the branding doc conflicts with a request, we must stop and ask the user to resolve the conflict.
- Record this as a locked-in decision in `organization/Project-Decisions.md` with today’s date, and add the matching simplified entry in `organization/Project-Simple-Decisions.md`.

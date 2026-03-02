# Plan: Conflict rule for markdown

**Date:** 2025-02-05  
**Summary:** Update Conflict.mdc so that on markdown conflicts the AI explains the conflict, does not guess/bypass/favor one file, asks you what changes you want, then proceeds from there.

---

## Current state

- [`.cursor/rules/Conflict.mdc`](.cursor/rules/Conflict.mdc) exists with `alwaysApply: true` but the body is incomplete (ends at "If there are conflicting").

## Change to make

**Complete and rewrite the rule** so it clearly states:

1. **When it applies:** Conflicts in markdown files (e.g. merge conflicts, or two versions of the same/similar content).
2. **What the AI must not do:** Guess, bypass the conflict, or give one file/side more weight than the other.
3. **What the AI must do:**
   - **Explain what the conflict is** (so you understand what’s differing and where).
   - Explicitly ask you what changes you would like to make.
   - Then proceed based on your answer.

## Suggested rule text

Keep the existing frontmatter (`alwaysApply: true`). Replace the incomplete sentence with:

- A short "when" clause (conflicts in markdown files).
- A clear instruction: do not guess, bypass, or favor one file.
- A requirement to **explain the conflict** (what differs, which sides/sources).
- A requirement to ask you what changes you want, then proceed from there.

Wording will be kept simple and direct.

## File to edit

- **Single file:** [`.cursor/rules/Conflict.mdc`](.cursor/rules/Conflict.mdc) — complete the rule body with the above behavior.

## Outcome

When the AI sees conflicts in markdown, it will:

When the AI sees conflicts in markdown, it will:
1. Explain what the conflict is.
2. Ask you how you want to resolve it (no guessing or favoring one file).
3. Proceed based on your answer.

**Implementation completed:** 2025-02-05. Rule body added to `.cursor/rules/Conflict.mdc`.

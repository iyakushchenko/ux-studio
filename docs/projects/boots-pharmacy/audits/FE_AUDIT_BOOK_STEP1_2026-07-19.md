# FE / UI / UX audit result

**Surface / slice:** Book Step 1 Location (React pilot) + shared NearMeCta tip  
**Date:** 2026-07-19  
**Auditor:** audit subagent (distrust / not the implementer)  
**Implementer handoff:** `412922f` (Make visual parity) + tip `2ea93a0` (NearMeCta unify); audited live at `668a6dd` on localhost:5173  
**Checklist:** [../FE_UI_UX_AUDIT.md](../../../product/FE_UI_UX_AUDIT.md)  
**Design delta:** [../BOOTS_BOOK_STEP1_DESIGN_DELTA.md](../BOOTS_BOOK_STEP1_DESIGN_DELTA.md)

---

## Verdict

| Field | Value |
|-------|-------|
| **Overall** | **PROVEN** |
| **PO green-light allowed?** | Yes |

---

## Summary

Live localhost audit of React Book Step 1 confirms the claimed fidelity ship: body white + decorative fill @ 0.31, content grid 1440 / 64 / 1312 with crumbs aligned to Boots logo (Δx = 0), card/progress/help 863px, near-me + Change share tertiary icon language with `nowrap`, search/near-me side-by-side, and interactions (booster, Learn more, Continue → Availability) work. Intentional delta opens (text crumb sep, Disclosure Learn more, Proto header/footer) remain as documented — not failures.

---

## Checklist results

### A. Visual fidelity

| # | Result | Evidence |
|---|--------|----------|
| A1 | **PASS** | React `.book-step-1` mounted (`data-studio-react-screen=book-step-1`); Make body/header/footer retired. H1 39/48, card white 24px radius, progress active navy 700 / bar `#c6e5e1`, checked booster `#afccca` — matches delta / live Make. |
| A2 | **PASS** | Delta covered: body fill img `6d60145a…` opacity 0.31 `object-position: 50% 100%`; crumbs white / no border / Home `#305854`; shell/inner split; NearMeCta tertiary. |
| A3 | **PASS** | Remaps scoped to `.book-step-1*` + shared `.studio-tertiary-cta` / `.proto-near-me-cta`; no accidental global wash observed on this path. |

### B. Layout / max-width / alignment

| # | Result | Evidence |
|---|--------|----------|
| B1 | **PASS** | `.book-step-1__shell` max-width **1440px**, padding-left/right **64px**; `.book-step-1__shell-inner` max-width **1312px**, pad **0**. Progress/card width **863px**. Viewport 1440×1100. |
| B2 | **PASS** | Boots logo left **64** = crumb Home left **64** (Δ = 0). Same shell/inner pattern as `.proto-footer__shell`. |
| B3 | **PASS** | `documentElement.scrollWidth` not exceeding client width; sticky footer mount present after host. |
| B4 | **PASS** | Desktop-first (`min-width: 1200px` host) intact at 1440; search + near-me side-by-side. |

### C. Icon + text CTAs — no wrap

| # | Result | Evidence |
|---|--------|----------|
| C1 | **PASS** | Change: `white-space: nowrap`. Near-me (`.proto-near-me-cta`): `nowrap`, iconTop === labelTop, `wraps: false`. |
| C2 | **PASS** | Near-me icon + label single horizontal line (h 32 compact tertiary). |
| C3 | **PASS** | Primary Continue pill single line; Change CTAs do not wrap at desktop width. |

### D. Hover / focus / active

| # | Result | Evidence |
|---|--------|----------|
| D1 | **PASS** | Change hover CSS → label black / icon `#012169`. Near-me via `.studio-tertiary-cta:hover` same language + img filter → navy. Search inset navy ring on hover/focus. |
| D2 | **PASS** | Explicit `:focus-visible` on crumb, Change, search, Learn more. Near-me/tertiary suppresses mouse `:focus` only (`:focus:not(:focus-visible)`); keyboard retains UA focus ring. |
| D3 | **PASS** | Booster checked `#afccca` + mark `#305854`; Continue hover/active navy darken in screen CSS. |
| D4 | **N/A** | No disabled primary on this empty-location path — Continue stays enabled and gates via Availability dialog (honest). |

### E. Behavior parity

| # | Result | Evidence |
|---|--------|----------|
| E1 | **PASS** | Booster toggles; Learn more Disclosure opens body; search/near-me/Continue open Availability Tool. |
| E2 | **PASS** | Continue without location → Choose Pharmacy dialog; phone `tel:` link present. |
| E3 | **PASS** | Controls are live buttons/inputs with handlers — not static chrome. |

### F. Control hierarchy / no zoo

| # | Result | Evidence |
|---|--------|----------|
| F1 | **PASS** | Change + near-me share tertiary mute → navy language; primary Continue navy pill only. |
| F2 | **PASS** | Near-me/Change quieter than Continue; progress labels secondary to H1. |
| F3 | **PASS** | Tip `2ea93a0` removed FilterChip near-me fork; single `NearMeCta` / `.studio-tertiary-cta`. |

### G. Nav chrome logic

| # | Result | Evidence |
|---|--------|----------|
| G1 | **N/A** | Book Step 1 body ship; Studio REC/play XOR not in scope of `412922f` / `2ea93a0`. |
| G2 | **N/A** | Same — not touched by this slice. |
| G3 | **N/A** | Same. |
| G4 | **N/A** | Same. |

### H. Regressions

| # | Result | Evidence |
|---|--------|----------|
| H1 | **PASS** | Proto sticky header + Footer remain; Make child-7 chrome hidden as designed. |
| H2 | **PASS** | No console errors on audited path after reload → Book Step 1. |
| H3 | **PASS** | Visual gates measured live — not inferred from unit/build alone. |

---

## Top findings (prove)

1. **Content grid + crumb/logo align** — 1440/64/1312; logo vs Home Δx = 0 at 1440 viewport.  
2. **Body fill restored** — decorative PNG @ 0.31, object-position bottom, loads (`naturalWidth > 0`).  
3. **Near-me = Change tertiary language** — shared `NearMeCta` / `.studio-tertiary-cta--compact`: `#5c5c5c` label, teal icon treatment, `nowrap`, no wash.  
4. **863px progress/card + live progress type** — 16px / 700 / `#012169` active.  
5. **Interactions live** — booster toggle, Learn more open, Continue → Availability when no store.

## Intentional non-blockers (from design delta)

- Breadcrumb delimiter is text `/` (not Make rotated bar).  
- Learn more uses UXDS Disclosure (closed by default) vs always-visible Make paragraph.  
- Proto sticky header / Footer vs Make absolute chrome.

---

## Follow-ups (if FAIL / BLOCKED)

| Item | Owner | Notes |
|------|-------|-------|
| — | — | None for PROVEN |

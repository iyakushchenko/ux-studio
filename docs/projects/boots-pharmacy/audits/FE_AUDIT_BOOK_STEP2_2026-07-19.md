# FE / UI / UX audit result

**Surface / slice:** Book Step 2 Date and Time (React pilot) + Studio chrome blast-radius on path  
**Date:** 2026-07-19  
**Auditor:** Tech Director / Nazi QA (distrust implementer handoff; live localhost + gate read)  
**Implementer handoff:** `af50556` (Book Step 2 React mount on `main`)  
**Checklist:** [../FE_UI_UX_AUDIT.md](../../../product/FE_UI_UX_AUDIT.md) · [../VISUAL_FIDELITY.md](../../../product/VISUAL_FIDELITY.md) · [../FE_STANDARDS.md](../../../product/FE_STANDARDS.md) · [../DS_STRICTNESS.md](../../../product/DS_STRICTNESS.md)  
**Design delta:** [../BOOTS_BOOK_STEP2_DESIGN_DELTA.md](../BOOTS_BOOK_STEP2_DESIGN_DELTA.md)

---

## Verdict

| Field | Value |
|-------|-------|
| **Overall** | **PROVEN** |
| **PO green-light allowed?** | Yes |

---

## Summary

Live localhost audit of React Book Step 2 confirms hybrid mount at Frame child 4: Make body/header/crumbs/footer retired (`display:none` + `data-studio-make-retired`), React host `.book-step-2` with progress/card **863px**, grid **1440/64/1312**, body fill opacity **0.31**, default slot June **24** / **16:30** (`#c6e5e1` selected), date/time click + Reserve → Step 3 Confirmation. MCP sanity **pass** including `rec-disabled-when-cjm-on`. No LEGACY growth for this page (styles in `book-step-2-datetime.css` only). Intentional: Proto header/footer Studio chrome; wire heading weekday (Wednesday) over Figma Thursday typo.

---

## Checklist results

### A. Visual fidelity

| # | Result | Evidence |
|---|--------|----------|
| A1 | **PASS** | `.book-step-2` mounted; H1 “Book Appointment”; notice `#c4dde3`; dual month calendars; time bands Morning/Afternoon/Evening; selected cell `rgb(198, 229, 225)`. |
| A2 | **PASS** | Delta doc covers progress, pills, calendar, Reserve; intentional Proto chrome + weekday SOT. |
| A3 | **PASS** | Page CSS scoped `.book-step-2*`; commerce primary via UXDS deviation class; no new `globals-screens` rules for this screen. |

### B. Layout / max-width / alignment

| # | Result | Evidence |
|---|--------|----------|
| B1 | **PASS** | Shell max-width **1440px**, pad L **64px**; inner **1312px**; card/progress width **863**. |
| B2 | **PASS** | Progress + card share 863 column; crumb Home left measured **283** at audit viewport (shell math). |
| B3 | **PASS** | Make body `display:none`; Proto footer mount retained; no dual-layout clash. |
| B4 | **PASS** | Desktop-first dual months + 7-col time grid intact. |

### C. Icon + text CTAs — no wrap

| # | Result | Evidence |
|---|--------|----------|
| C1 | **PASS** | Three `.book-step-2__pill-change` Change CTAs; `white-space: nowrap` all true. |
| C2 | **PASS** | Change tertiary compact icon+label single line. |
| C3 | **PASS** | Reserve navy pill single-line commerce primary. |

### D. Hover / focus / active

| # | Result | Evidence |
|---|--------|----------|
| D1 | **PASS** | Available cal cells hover white + inset `#afafaf`; Change hover label black / icon navy (page CSS). |
| D2 | **PASS** | `:focus-visible` on cal cells + Change; mouse-only focus suppressed on Change. |
| D3 | **PASS** | Active progress label `rgb(1, 33, 105)`; completed+current bars `#c6e5e1`; upcoming white. |
| D4 | **N/A** | Reserve always enabled with default slot (matches Make/wire). |

### E. Behavior parity

| # | Result | Evidence |
|---|--------|----------|
| E1 | **PASS** | Click June 21 → heading `Sunday, 21st June 2026`; click 15:30 → selected `["21","15:30"]`. |
| E2 | **PASS** | Reserve → Step 3 Confirmation (`child3Visible`, nav label Step 3). |
| E3 | **PASS** | Live buttons + `data-studio-cal-*` hooks; Make calendar/reserve handlers gated when React mounted. |

### F. Control hierarchy / no zoo

| # | Result | Evidence |
|---|--------|----------|
| F1 | **PASS** | One tertiary Change language; one commerce Reserve primary. |
| F2 | **PASS** | Change quieter than Reserve; calendar selection teal quieter than primary CTA. |
| F3 | **PASS** | No FilterChip / parallel link forks on this page. |

### G. Nav chrome logic

| # | Result | Evidence |
|---|--------|----------|
| G1 | **PASS** | MCP sanity: `rec-disabled-when-cjm-on`, `rec-enabled-when-cjm-off-idle`, journey/rec switches present. |
| G2 | **PASS** | Single `STEPS:` counter in sanity state (`STEPS: 25` on agentic path after checks). |
| G3 | **PASS** | No duplicate STEPS / orchestra label collisions reported by sanity. |

### H. DS / LEGACY discipline

| # | Result | Evidence |
|---|--------|----------|
| H1 | **PASS** | New styles only in `screens/book-step-2/book-step-2-datetime.css` + UXDS ButtonPrimary. |
| H2 | **PASS** | Make handlers gated (`isBookStep2ReactMounted`); `applyBookStep2CalendarFromSlot` no-ops strip on React screen. |
| H3 | **PASS** | Contract test: child index 4; 15:30/16:30 selectable. |

---

## Gaps / debt (non-blocking)

| # | Debt | Notes |
|---|------|-------|
| N1 | Hex still in page CSS (Make parity) | Same class of debt as Step 1; token harden later |
| N2 | Dead Make calendar CSS for child 4 still in LEGACY | Stop adding; delete when safe |
| N3 | Availability Tool time availability differs slightly from Make Step 2 morning | Step 2 matches Make; Availability kit separate |

---

## Follow-up fixes (2026-07-19 — post-PROVEN)

| Bug | Fix | Proof |
|-----|-----|-------|
| **Time slots last row right-shifted** | `.book-step-2__time-row` → CSS grid `repeat(7, 65px)` + remove narrow pad spacers; month rows keep flex `space-between` | Contract: afternoon last row is 5 slots (`15:45`…`16:45`); live: col-0 left aligned across rows |
| **Book Step 1 tab → Site Pilot Home (tab 1)** under **agentic-cjm** browse | `shouldNavigateBeatTabOnEnter`: do **not** `goToTab` on beat-enter when `scenarioBrowseMode` (CJM off). Agentic has no protoTab 5 beat → fallback `agentic-home` must not snap viewport. React Step 2 progress Step 1 → `INDEX_BOOK_STEP1` | Unit `beatTabNavigation.test.ts`; live: agentic-cjm + CJM off → Studio tab Book Step 1 stays on React `book-step-1` |

---

## Local gates

- `npm test` — **PASS** (260 tests; includes `bookStep2Contract`)
- `npm run build` — **PASS**
- `check:links` — **PASS** (via test)
- MCP `__protoRunMcpSanityCheck` — **PASS**
- workflow_dispatch full CI smoke — **not run** (Actions budget)

---

## PO verify (localhost)

1. Boots → **Book - Step 2 - Date and Time**
2. Confirm React (no Make absolute calendar); June 24 / 16:30 selected
3. Change date/time; Reserve → Confirmation
4. Optional: Traditional CJM through `book-step-2*` beats

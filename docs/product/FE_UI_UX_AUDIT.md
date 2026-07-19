# FE / UI / UX audit — verification checklist

**Status:** Locked (PO directive, 2026-07-19)  
**Audience:** Master / parent agents and **separate** audit subagents.  
**Doctrine:** [COMMAND_DOCTRINE.md](./COMMAND_DOCTRINE.md) §0 (Director + proactive) · §6–§7 (handoff + Nazi QA)  
**Always-on rule:** [`.cursor/rules/ux-studio-director.mdc`](../../.cursor/rules/ux-studio-director.mdc)  
**Report template:** [templates/FE_AUDIT_RESULT.md](./templates/FE_AUDIT_RESULT.md)

---

## 1. Purpose

**Strict (“Nazi QA”) interface audit.** Prove a UI-facing ship is done. Implementer “done” / “tests passed” is **BAD until this audit is PROVEN**. Master must not accept a UI handoff without it.

Use after any concept page, shell chrome, kit CSS, or layout/CTA change that affects what the user sees or clicks. Fail on drift, duplicates, slop, near-duplicate styles, layout gaps, and lost L&F.

---

## 2. How to run

1. Master spawns a **separate** audit pass (or performs it) — not the implementer’s self-signoff.  
2. Open the surface (localhost preferred) **and** read the gate JSX/CSS for chrome/mode logic.  
3. Fill every row below with **PASS** or **FAIL** (+ evidence).  
4. Copy results into [templates/FE_AUDIT_RESULT.md](./templates/FE_AUDIT_RESULT.md) (or paste the tables into the PR/handoff).  
5. Overall **PROVEN** only if every applicable row is PASS (or N/A with reason). Any FAIL → reopen/fix; do not green-light the PO.

### Evidence (required per FAIL; recommended per PASS)

- Screenshot path or short description of viewport  
- File:line or selector for the gate  
- Concept / Make reference when claiming fidelity  

---

## 3. Checklist (pass / fail)

Mark **N/A** only when the ship cannot touch that area (state why).

### A. Visual fidelity to concept

Refs: [VISUAL_FIDELITY.md](./VISUAL_FIDELITY.md) · [PAGE_BUILD_CONTRACT.md](./PAGE_BUILD_CONTRACT.md) §5

| # | Check | PASS / FAIL / N/A | Evidence |
|---|--------|-------------------|----------|
| A1 | Visible L&F matches source concept (chrome, radii, type, fills) — not a generic DS restyle | | |
| A2 | Design-delta covered for changed regions (bg, controls, type, layout) | | |
| A3 | Brand theme remap only where intended; no accidental global wash | | |

### B. Layout / max-width / alignment

Refs: [FE_STANDARDS.md](./FE_STANDARDS.md) §1–§3

| # | Check | PASS / FAIL / N/A | Evidence |
|---|--------|-------------------|----------|
| B1 | Content column max-width matches concept / project shell | | |
| B2 | Rows and primary CTAs align to a shared vertical edge | | |
| B3 | No accidental horizontal overflow; sticky/footer bars keep intended height | | |
| B4 | Desktop-first layout intact; mobile not broken | | |

### C. Icon + text CTAs — no wrap

Refs: [FE_STANDARDS.md](./FE_STANDARDS.md) §2

| # | Check | PASS / FAIL / N/A | Evidence |
|---|--------|-------------------|----------|
| C1 | Icon+label CTAs / chips stay on one line (`nowrap`) | | |
| C2 | Icon does not stack above label unless concept is stacked | | |
| C3 | Primary bar / inline actions do not wrap under normal desktop width | | |

### D. Hover / focus / active

Refs: [VISUAL_FIDELITY.md](./VISUAL_FIDELITY.md) · [INTERACTION_FIDELITY.md](./INTERACTION_FIDELITY.md)

| # | Check | PASS / FAIL / N/A | Evidence |
|---|--------|-------------------|----------|
| D1 | Live CTAs / chips / fields show hover parity with concept | | |
| D2 | `:focus-visible` (or equivalent) present on keyboard path | | |
| D3 | Active / pressed / selected states match control family | | |
| D4 | Disabled controls look and behave disabled | | |

### E. Behavior parity

Refs: [VISUAL_FIDELITY.md](./VISUAL_FIDELITY.md) §1.1 · [INTERACTION_FIDELITY.md](./INTERACTION_FIDELITY.md) · [PAGE_BUILD_CONTRACT.md](./PAGE_BUILD_CONTRACT.md)

| # | Check | PASS / FAIL / N/A | Evidence |
|---|--------|-------------------|----------|
| E1 | Prior Make/concept interactions still work (toggles, gating, search, crumbs, etc.) | | |
| E2 | CTAs/links go to real destinations or honest disabled states | | |
| E3 | No static shell that only “looks” interactive | | |

### F. Control hierarchy / no zoo

Refs: [VISUAL_FIDELITY.md](./VISUAL_FIDELITY.md) §2

| # | Check | PASS / FAIL / N/A | Evidence |
|---|--------|-------------------|----------|
| F1 | One active/inactive language within the surface | | |
| F2 | Secondary selectors are quieter / smaller than primary chrome | | |
| F3 | No competing pill/chip styles that read as a visual zoo | | |

### G. Nav chrome logic (Studio shell)

Refs: [COMMAND_DOCTRINE.md](./COMMAND_DOCTRINE.md) §6

| # | Check | PASS / FAIL / N/A | Evidence |
|---|--------|-------------------|----------|
| G1 | Mode XOR: record / play / idle do not leak into each other | | |
| G2 | Counters: correct label, visibility, no duplicates (e.g. double STEPS) | | |
| G3 | Panel XOR: at most one conflicting panel open as designed | | |
| G4 | REC vs play chrome labels/gates match JSX source of truth | | |
| G5 | **Studio chrome parity when AIR / browse:** while AIR (playback live), REC mode switch + recording controls are disabled/forced off the same way cassette step buttons / CJM switch lock — no REC usable during AIR | | |
| G6 | **REC ⊗ CJM:** when CJM (journey mode) is ON, REC switch is `disabled` (clear visual disabled) and cannot enter Rec mode; when REC is ON, CJM is off/disabled. Gate: `studioModeXor.ts` + MCP sanity `rec-disabled-when-cjm-on` | | |
| G7 | **Hybrid mount:** React host present; Make chrome hidden (`data-proto-make-retired`); Make wire gated; AIR hooks preserved (`data-name` / `data-proto-*`) | | |
| G8 | **Short grids left-aligned:** incomplete last rows of slot/chip grids share column 0 with full rows (no `space-between` + narrow pads) | | |
| G9 | **Step/tab targets:** in-page progress + Studio Book Step N navigate to `PROTO_INDEX_BOOK_STEP*` — never snap to Home/tab1 via beat fallback while browsing (`shouldNavigateBeatTabOnEnter`) | | |

### H. Regressions

| # | Check | PASS / FAIL / N/A | Evidence |
|---|--------|-------------------|----------|
| H1 | Adjacent screens / shared kits not obviously worse | | |
| H2 | No new console errors on the audited path (note if pre-existing) | | |
| H3 | Build/tests may be green — but visual FAIL still fails the audit | | |

### I. DS strictness / no near-duplicates

Refs: [DS_STRICTNESS.md](./DS_STRICTNESS.md) · [../uxds/DEVIATIONS.md](../uxds/DEVIATIONS.md)

| # | Check | PASS / FAIL / N/A | Evidence |
|---|--------|-------------------|----------|
| I1 | One pattern per control role on the surface (no parallel link/chip/CTA palettes) | | |
| I2 | Shared string/role uses one component (e.g. NearMeCta page↔popup) | | |
| I3 | Page CSS is layout/structure — not anonymous one-off color/hover forks | | |
| I4 | Intentional kit breaks are registered in DEVIATIONS.md | | |

---

## 4. Overall verdict

| Verdict | Meaning |
|---------|---------|
| **PROVEN** | All applicable rows PASS; master may tell PO the slice is good |
| **FAIL** | Any applicable FAIL; reopen/fix; do **not** green-light PO |
| **BLOCKED** | Cannot audit (no localhost, missing concept ref); say what is blocked — still not PROVEN |

Unit tests, `npm run build`, and lean smoke alone **never** equal PROVEN for visual work. **Cannot skip** this checklist for “tests passed.”

---

## 5. Related

- [COMMAND_DOCTRINE.md](./COMMAND_DOCTRINE.md) §0 · §7 — Director owns audit gate; proactive spotting does not replace PROVEN  
- [CSS_BASE_THEME.md](./CSS_BASE_THEME.md) — BASE → THEME → PANEL → LEGACY  
- [DS_STRICTNESS.md](./DS_STRICTNESS.md)  
- [FE_STANDARDS.md](./FE_STANDARDS.md)  
- [VISUAL_FIDELITY.md](./VISUAL_FIDELITY.md)  
- [INTERACTION_FIDELITY.md](./INTERACTION_FIDELITY.md)  
- [PAGE_BUILD_CONTRACT.md](./PAGE_BUILD_CONTRACT.md)  
- [templates/FE_AUDIT_RESULT.md](./templates/FE_AUDIT_RESULT.md)  
- Results store: [audits/](./audits/)  


# PAGE FINAL PASS — Appointment History (HARD-GREEN)

**Surface:** Boots Pharmacy Appointment History (`screenId: appointment-history`, Legacy child **2**)  
**Date:** 2026-07-22  
**Auditor:** Quinn (QA) MCP matrix · Uma (UI/UX) fidelity · Arch (Director) HARD-GREEN  
**Ship tip:** local prove on `95ccca7` tree · **v0.0.108**  
**Policy:** [PAGE_FINAL_PASS.md](../../../product/PAGE_FINAL_PASS.md) · manifest [PAGE_FINAL_PASS.json](./PAGE_FINAL_PASS.json) · criteria [QUINN_APPOINTMENT_HISTORY_PROBE_2026-07-22.md](./QUINN_APPOINTMENT_HISTORY_PROBE_2026-07-22.md)

---

## Verdict

| Field | Value |
|-------|-------|
| **PAGE FINAL PASS** | **HARD-GREEN** |
| **mcpFinalPass** | **HARD-GREEN** |
| **Quinn interaction matrix** | **PASS** 8/8 |
| **Uma fidelity** | **PROVEN** — [UMA_FIDELITY_APPOINTMENT_HISTORY_2026-07-22.md](./UMA_FIDELITY_APPOINTMENT_HISTORY_2026-07-22.md) |
| **PARITY_PROVEN `appointment-history`** | **proven** |
| **FE audit** | **PROVEN** — [FE_AUDIT_APPOINTMENT_HISTORY_2026-07-22.md](./FE_AUDIT_APPOINTMENT_HISTORY_2026-07-22.md) |
| **Details unblocked?** | **Yes** — sequence gate: History hard-green before Appointment Details React |

**Team check line:** `PAGE FINAL PASS — appointment-history — HARD-GREEN`

**Knowledge used:** PAGE_FINAL_PASS sequencing · Chat HARD-GREEN first · UMA no-invent · Legacy densify gate for React History · Quinn R11 `:5173` + overlay-arm · View Details → Legacy Details handoff · LESSONS false-PROVEN

---

## MCP evidence (Quinn · 2026-07-22)

**URL:** `http://localhost:5173/?project=boots-pharmacy&screen=appointment-history&persona=sarah-jenkins&cjm=off&experience=agentic`  
**Helper:** `await window.__studioRunMcpPageProbe({ screenId: "appointment-history", reload: false })`  
**Result:** `{ pass: true, screenId: "appointment-history" }` · **8/8** checks (re-proved after fidelity densify gate)

| Id | Pass |
|----|------|
| overlay-arm | PASS |
| appointment-history-host | PASS |
| appointment-history-legacy-retired | PASS |
| appointment-history-view-details-count | PASS |
| appointment-history-view-details-hover | PASS |
| appointment-history-view-details-click | PASS |
| appointment-history-return-after-details | PASS |
| url-screen | PASS |

**Overlay:** AGENT TESTING visible every step.  
**Handoff:** View Details → Legacy `appointment-details` → restore History for `url-screen`.  
**Teardown:** `reload: false`; stay `screen=appointment-history`.

---

## Structure contracts

- `<main class="appointment-history">` + `data-studio-react-screen="appointment-history"`
- Legacy retired via `retireLegacyUnderPage` (parked / detached)
- BEM root `appointment-history` / `appointment-history__*`
- `<header>` crumbs band present
- UXDS: `ButtonPrimary` commerce View Details + `.uxds-link` Ask/Discuss
- Selector HARD: `[data-studio-appointment-view-details="true"]`

---

## Fidelity close (Uma FAIL → PROVEN)

Prior FAIL (Uma History fidelity audit `d42a5ce0-22e6-47e6-9b9a-5f17104292ce`): card 20/20, info 20/`#ebebeb`, CTA 12, Cancel invent `#c96b6b`, title 20/28.  
**Fixed:** screen CSS Legacy values + densify `:not([data-studio-react-screen])` on History child-2 + invent hover removed.  
**Re-measure:** pad **32** · gap **56** · title **25/32** · info **32** / `#c3c3c3` · CTA **32**.

---

## Honest residual

| Id | Note |
|----|------|
| R1 | Show All / Load more non-interactive (P1 under-match) |
| R2 | Account nav routing not wired (P1 visual) |
| R3 | Breadcrumb Home / Account Overview affordance spans |
| R4 | Details remains Legacy this wave — React closed until this HARD-GREEN |
| R5 | Legacy densify still applies to Details child 1 |

---

## Interaction inventory

- Legacy baseline: [INTERACTION_INVENTORY_APPOINTMENT_HISTORY_LEGACY_BASELINE_2026-07-22.json](./INTERACTION_INVENTORY_APPOINTMENT_HISTORY_LEGACY_BASELINE_2026-07-22.json)
- React rematch: [INTERACTION_INVENTORY_APPOINTMENT_HISTORY_REACT_2026-07-22.json](./INTERACTION_INVENTORY_APPOINTMENT_HISTORY_REACT_2026-07-22.json) — `readinessPass` **true**, `invalid` **0**

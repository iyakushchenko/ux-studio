# FE / UI / UX audit — Appointment Details (PROVEN)

**Surface:** Boots Pharmacy Appointment Details (`screenId: appointment-details`, Frame child **1**)  
**Date:** 2026-07-22  
**Auditor:** Arch (Director) synthesis · Uma (UI/UX) fidelity · Quinn (QA) MCP  
**Tip:** local prove on `95ccca7` tree · **v0.0.108**  
**Checklist:** [FE_UI_UX_AUDIT.md](../../../product/FE_UI_UX_AUDIT.md) · [UMA_FIDELITY_NOTES.md](../../../product/UMA_FIDELITY_NOTES.md)  
**Uma:** [UMA_FIDELITY_APPOINTMENT_DETAILS_2026-07-22.md](./UMA_FIDELITY_APPOINTMENT_DETAILS_2026-07-22.md) — **PROVEN**  
**Quinn:** [QUINN_APPOINTMENT_DETAILS_PROBE_2026-07-22.md](./QUINN_APPOINTMENT_DETAILS_PROBE_2026-07-22.md) — **10/10 PASS** + terminal CTA hide

---

## Verdict

| Field | Value |
|-------|-------|
| **Overall** | **PROVEN** |
| **Uma fidelity** | **PROVEN** (densify 20/20 · no Cancel invent · Date/Time SSoT) |
| **Quinn MCP matrix** | **PASS** 10/10 |
| **Interaction inventory** | `readinessPass=true` · invalid 0 — [REACT rematch](./INTERACTION_INVENTORY_APPOINTMENT_DETAILS_REACT_2026-07-22.json) |
| **PO green-light (fidelity)** | **Yes** |
| **PAGE FINAL PASS** | See [FE_AUDIT_APPOINTMENT_DETAILS_PAGE_FINAL_PASS_2026-07-22.md](./FE_AUDIT_APPOINTMENT_DETAILS_PAGE_FINAL_PASS_2026-07-22.md) |

**MCP evidence:** `await window.__studioRunMcpPageProbe({ screenId: "appointment-details", reload: false })` → `{ pass: true }` on `http://localhost:5173/?project=boots-pharmacy&screen=appointment-details`

---

## Stable rows (FE_UI_UX_AUDIT)

| Id | Stamp | Evidence |
|----|-------|----------|
| A1–A3 | **PASS** | Uma densify card/info/CTA/title match Legacy live |
| B1–B4 | **PASS** | 1440/64/1312 · nav · summary/buyer bands |
| C1–C3 | **PASS** | Edit/Cancel icon+text nowrap |
| D1–D5 | **PASS** | Edit/Cancel under-match (no invent); crumb + Discuss `.uxds-link`; SearchField N/A |
| E1–E3 | **PASS** | History→Details entry · crumb→React History · terminal CTA hide |
| F1–F3 | **PASS** | Quiet icon CTAs; no View Details on page |
| G7 | **PASS** | React host + Legacy parked |
| G9 | **PASS** | URL `screen=appointment-details` |
| H1–H3 | **PASS** | densify gated; no LEGACY page CSS |
| J1 / J4 | **N/A** | Legacy LE none — honest |
| J2–J3 | **PASS** | DS + densify rhythm |
| J5–J6 | **PASS** | Quinn 10/10 · overlay-arm |

---

## Honest residual

- Vaccinations header-only (no invent accordion body).
- Buyer/payment static Legacy chrome (wire unbound).
- Hire Shipping omitted (under-match).
- Account chrome composed from History — extract shared kit residual.

**Knowledge used:** FE_UI_UX_AUDIT · PAGE_FINAL_PASS · Uma densify Details truth · Quinn R11 · LESSONS densify/false-PROVEN.

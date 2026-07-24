# Quinn — Appointment Details MCP probe

**Date:** 2026-07-22  
**screenId:** `appointment-details`  
**URL:** `http://localhost:5173/?project=boots-pharmacy&screen=appointment-details`  
**R11:** reused Studio tab (pageId 3) — `list_pages` → `select_page`; no `new_page`  
**Recipe:** `appointmentDetailsMcpProbeSteps.ts` via `__studioRunMcpPageProbe({ screenId: "appointment-details", reload: false })`

## Result

| Check | Result |
|-------|--------|
| overlay-arm | PASS |
| appointment-details-host | PASS |
| appointment-details-legacy-retired | PASS |
| appointment-details-url-screen | PASS |
| appointment-details-selected-card | PASS |
| appointment-details-edit-cancel-rules (non-terminal sample) | PASS |
| appointment-details-edit-hover | PASS |
| appointment-details-cancel-hover | PASS |
| appointment-details-vaccinations-toggle (UXDS Accordion) | PASS |
| appointment-details-crumb-back → History + restore | PASS |
| url-screen | PASS |
| **Overall** | **11/11 PASS** (Accordion toggle added 2026-07-22) |

**Evidence URL after probe:**  
`http://localhost:5173/?project=boots-pharmacy&screen=appointment-details&persona=sarah-jenkins&cjm=off&experience=agentic`

## Extra prove — terminal CTA hide (#8762341)

| Check | Result |
|-------|--------|
| History card `#8762341` → View Details | PASS |
| Details shows `Appointment #8762341` + Cancelled | PASS |
| Edit CTA absent | PASS |
| Cancel CTA absent | PASS |
| CTA host `[data-name="CTAs"]` omitted | PASS |
| Refund Pending row present | PASS |
| **Terminal CTA hide** | **PASS** |

Path: History URL → click `[data-studio-appointment-view-details]` on cancelled card → assert Details DOM (scroll-into-view before click).

## Contracts proved

- React host `main[data-studio-react-screen="appointment-details"]`
- Legacy parked via `isLegacyParkedForScreen("appointment-details")`
- Selected card fields match SSoT; View Details absent on Details
- Non-terminal: Edit + Cancel present + hoverable (`data-studio-appointment-edit` / `cancel`)
- Terminal (#8762341): Edit/Cancel + CTA host omitted
- Crumb `[data-studio-appointment-history-crumb]` → History; restore returns Details for `url-screen`
- overlay-arm BR panel visible for full probe (LESSONS overlay-every-step)

## Rematch inventory (optional)

- Post-React: [INTERACTION_INVENTORY_APPOINTMENT_DETAILS_REACT_2026-07-22.json](./INTERACTION_INVENTORY_APPOINTMENT_DETAILS_REACT_2026-07-22.json)
- vs Legacy baseline: `readinessPass` **false → true**; `invalid` **3 → 0**

## Final Pass

- PAGE FINAL PASS **HARD-GREEN** — [FE_AUDIT_APPOINTMENT_DETAILS_PAGE_FINAL_PASS_2026-07-22.md](./FE_AUDIT_APPOINTMENT_DETAILS_PAGE_FINAL_PASS_2026-07-22.md)
- `PARITY_PROVEN.json` `appointment-details` **proven**
- Uma fidelity **PROVEN** — [UMA_FIDELITY_APPOINTMENT_DETAILS_2026-07-22.md](./UMA_FIDELITY_APPOINTMENT_DETAILS_2026-07-22.md)

## Knowledge used

Quinn (QA): TEAM_KNOWLEDGE Quinn hat (RECORDING MCP + R11 reuse-tab) + LESSONS overlay-arm / scroll-into-view / false-PROVEN — applied: `__studioRunMcpPageProbe` 10/10 + terminal CTA hide; Final Pass stamped by Arch.

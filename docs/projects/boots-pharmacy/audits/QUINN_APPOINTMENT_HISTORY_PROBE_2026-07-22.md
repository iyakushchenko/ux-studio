# Quinn — Appointment History MCP probe criteria

**Date:** 2026-07-22  
**screenId:** `appointment-history`  
**URL:** `http://localhost:5173/?project=boots-pharmacy&screen=appointment-history`  
**Recipe:** `appointmentHistoryMcpProbeSteps.ts` via `__studioRunMcpPageProbe({ screenId: "appointment-history", reload: false })`

## Result

| Check | Result |
|-------|--------|
| overlay-arm | PASS |
| appointment-history-host | PASS |
| appointment-history-legacy-retired | PASS |
| appointment-history-view-details-count (4) | PASS |
| appointment-history-view-details-hover | PASS |
| appointment-history-view-details-click → `appointment-details` | PASS |
| appointment-history-return-after-details | PASS |
| url-screen | PASS |
| **Overall** | **8/8 PASS** (re-proved after Uma densify fidelity fix) |

## Contracts proved

- Playback selector `data-studio-appointment-view-details="true"` on React CTAs
- Legacy parked via `isLegacyParkedForScreen("appointment-history")`
- View Details routes to Legacy Details; restore returns to History for `url-screen`
- Uma fidelity PROVEN after densify gate (card 32/56 · CTA 32 · no Cancel invent)

## Final Pass

- PAGE FINAL PASS **HARD-GREEN** — [FE_AUDIT_APPOINTMENT_HISTORY_PAGE_FINAL_PASS_2026-07-22.md](./FE_AUDIT_APPOINTMENT_HISTORY_PAGE_FINAL_PASS_2026-07-22.md)
- `PARITY_PROVEN.json` `appointment-history` **proven**

## Not claimed

- Appointment Details React migration (next page; now unblocked)

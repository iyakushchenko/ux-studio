# Feature brief — Appointment History React migration

**Project:** `boots-pharmacy`  
**Callsigns:** Bea (BA) · Finn (FE) · Uma (UI/UX) · Quinn (QA) · Pax (PO sim) · Arch (Director)  
**Status:** ready (discovery complete · **DO NOT mount React this wave** until Arch opens build)  
**Updated:** 2026-07-22  
**Refs:** [APPOINTMENT_HISTORY_LEGACY_PARITY_REGISTER.md](./APPOINTMENT_HISTORY_LEGACY_PARITY_REGISTER.md) · [NEXT_STEPS.md](../../../product/NEXT_STEPS.md) §0f · [PAGE_FINAL_PASS.md](../../../product/PAGE_FINAL_PASS.md) · data SSoT [`appointments.ts`](../../../../src/projects/boots-pharmacy/data/appointments.ts) (`APPOINTMENTS` + `syncAppointmentHistory`)

---

## Context

Erase-Legacy next page after Chat **PAGE FINAL PASS HARD-GREEN**: migrate **Appointment History** (`screenId: appointment-history`, Frame child **2**, `left-[14747px]`) to React + UXDS. Legacy body is hire/order chrome rewritten at runtime to appointment copy (`rewriteAccountAppointmentCopy` + `syncAppointmentHistory`). **Appointment Details** (`screen=appointment-details`, child **1**) stays **Legacy** this wave — View Details must open the existing Legacy details screen. Details migration is **closed** until History is PAGE FINAL PASS hard-green.

## Business logic

| Rule | Behavior |
|------|----------|
| Data SSoT | **`APPOINTMENTS`** in `appointments.ts` — list length, fields, status, pricing totals, cancellation/refund notes. React must read this array (or shared getters); do **not** fork card copy. |
| Card count | Exactly `APPOINTMENTS.length` cards (Legacy exports 3; wire clones to 4 via `ensureHistoryCardCount`). |
| Status tones | Wire maps status → `active` / `completed` / `cancelled` CSS tone classes; terminal statuses hide Edit/Cancel. |
| View Details | Sets `setSelectedAppointmentId(appt.id)` then navigates to **existing Legacy** Appointment Details (`INDEX_APPOINTMENT_DETAILS` / `screen=appointment-details`). |
| Title link | Card title `Appointment #{id}` is also a details opener (same selection + navigate). |
| Edit / Cancel | Visible only for **non-terminal** appointments; wire converts Legacy “Edit Appointment” / “Cancel Appointment” to icon+text **Edit** / **Cancel**. **No** Legacy navigate/wire destination today — preserve presence + visibility rules; do not invent cancel flows. |
| Refund row | Cancelled + `refundPendingNote` → “Refund Pending - ” + **Discuss with Site Pilot** → Site Pilot Home with `getAppointmentRefundPilotQuery(appt)`. |
| Ask Site Pilot | Title help line → Site Pilot Home with `APPOINTMENT_PILOT_QUERY`. |
| Auth | Engine `studioAuthSession` / `isStudioLoggedIn` SSoT — no page-local auth flag. |
| Meta | Sorting label = `{N} Appointments displayed`; progress “You've viewed N of N appointments” + full-width Active bar (`syncHistoryMeta`). |

## Acceptance (Bea → Quinn)

- [x] React host mounts at child **2**; Legacy retired (`retireLegacyUnderPage` / parked)
- [x] Legacy wire `syncAppointmentHistory` early-returns when React mounted
- [x] URL `?project=boots-pharmacy&screen=appointment-history`
- [x] Cards render from **`APPOINTMENTS`** SSoT (4 demo rows; fields + status tones + conditional refund/cancel reason)
- [x] **HARD selector:** View Details control = `[data-studio-appointment-view-details="true"]` (not invented `data-studio-action="appointment-history-view-details"`)
- [x] Title click + View Details → **Legacy** `screen=appointment-details` with selected id preserved
- [ ] Traditional CJM `tabScript: "history-view-details"` + `runHistoryViewDetails` still find/click that selector — eyes-on residual (board 0d)
- [x] Ask Site Pilot + Discuss with Site Pilot handoffs preserved
- [x] No LEGACY growth for React path
- [x] Uma audit **PROVEN** + typical DS checks (buttons/links)
- [x] Quinn MCP `__studioRunMcpPageProbe({ screenId:"appointment-history" })` PASS
- [x] PAGE FINAL PASS hard-green for `appointment-history` before Details brief opens
- [x] Loading/empty/updating: honest **N/A** (Legacy has none) — **forbidden** invent spinner/empty

## Chrome / fidelity (Uma)

- [x] Concept L&F vs Legacy `Body1` + wired cards (grey card shell, white info block, CTA row)
- [x] Status color tones (active / completed / cancelled) match wire classes — no invent
- [x] Typical DS checks: View Details primary · Edit/Cancel icon+text · title/pilot links
- [x] Account nav + breadcrumbs + footer present as Legacy (or engine-owned per PAGE_BUILD_CONTRACT)
- [x] No invent empty/loader overlay

## Mount / FE notes (Finn)

- Mounted 2026-07-22 — `screens/appointment-history/*`; densify gate in `globals-chrome.css` for React History.
- Folder target: `src/projects/boots-pharmacy/screens/appointment-history/` (`screenId` = folder)
- Contract: childIndex **2**, `INDEX_APPOINTMENT_HISTORY`, public id `appointment-history`
- SSoT import: `APPOINTMENTS`, `getSelectedAppointmentId` / `setSelectedAppointmentId`, pilot query helpers from `data/appointments.ts`
- **Selector contract (HARD — playback):**

  | Control | Required attribute | Notes |
  |---------|-------------------|--------|
  | View Details | `data-studio-appointment-view-details="true"` | Used by `playback/traditional.ts` `findVisibleHistoryViewDetails` / `runHistoryViewDetails` |
  | Edit | `data-studio-appointment-edit="true"` | Wire already stamps this |
  | Cancel | `data-studio-appointment-cancel="true"` | Wire already stamps this |
  | Card clone marker (Legacy only) | `data-studio-appointment-card-clone="true"` | React N/A if rendering from array |
  | Refund pending row | `data-studio-refund-pending-row` | Conditional |
  | Cancellation reason row | `data-studio-cancellation-reason-row` | Conditional |

- **Forbidden:** `data-studio-action="appointment-history-view-details"` (invented; breaks Traditional prove).
- View Details route **this wave:** existing Legacy appointment-details (child 1) — same as today’s `setCurrent(INDEX_APPOINTMENT_DETAILS)`.
- Header/footer: follow PLP-style engine chrome; History uses full pharmacy footer per `footerConfig.ts`.

## Prove notes (Quinn)

- R11: `http://localhost:5173/` reuse tab only
- Probe: `__studioRunMcpPageProbe({ screenId:"appointment-history", reload:false })`
- Must click/hover ≥1 View Details (`[data-studio-appointment-view-details="true"]`) and assert URL/screen → `appointment-details`
- Traditional: beat `appointment-history` / script `history-view-details` PASS with React mounted
- Overlay eyes + scroll-into-view before interact
- Token-saving evidence pack: History landing · View Details · Details nav · PLAYBACK_DIAG tail · selector metadata · parity verdict

## Pax

- [ ] User-visible? → bump patch? **Y** on first visible React mount / fidelity ship (not discovery docs alone)
- [ ] Push? **Y** when coherent build ship (R12 batch) — discovery docs may land with wave
- [ ] Notes/CHANGELOG updated if bump

## Sequence gate (Arch)

1. **NOW:** History discovery brief + register (this doc) — no React mount.  
2. **NEXT:** History React build → Uma/Quinn → PAGE FINAL PASS hard-green.  
3. **CLOSED:** Appointment Details React brief/mount until History hard-green.

# Appointment History Legacy → React parity register

**Project:** `boots-pharmacy`  
**Callsigns:** Bea (BA) owns register truth · Quinn (QA) owns prove · Finn/Uma restore gaps  
**Updated:** 2026-07-22 (post-mount — React host live; Uma/Final Pass pending)  
**Overall proof status:** React mount ON · Quinn MCP **8/8 PASS** · PAGE FINAL PASS **NOT-GREEN** (do **not** stamp until Uma PROVEN + FE audit).  
**Register interpretation:** Legacy columns = Frame/wire inventory. React columns = mount-wave evidence (2026-07-22). Uma pixel/DS matrix still open — I9 stays **Partial** until Uma signs.  
**Legacy source:** Frame child **2** · wire `syncAppointmentHistory` · **`APPOINTMENTS`** in `data/appointments.ts` · playback `history-view-details`  
**Public `screenId`:** `appointment-history` · childIndex **2**  
**React target:** `src/projects/boots-pharmacy/screens/appointment-history/*` — **live** (`mountAppointmentHistoryScreen`; Legacy retired)  
**Refs:** [APPOINTMENT_HISTORY_REACT.md](./APPOINTMENT_HISTORY_REACT.md) · Quinn [../audits/QUINN_APPOINTMENT_HISTORY_PROBE_2026-07-22.md](../audits/QUINN_APPOINTMENT_HISTORY_PROBE_2026-07-22.md) · inventory baseline [../audits/INTERACTION_INVENTORY_APPOINTMENT_HISTORY_LEGACY_BASELINE_2026-07-22.md](../audits/INTERACTION_INVENTORY_APPOINTMENT_HISTORY_LEGACY_BASELINE_2026-07-22.md) · [PAGE_FINAL_PASS.md](../../../product/PAGE_FINAL_PASS.md)

**Status legend:** Present · Partial · Missing · Fixed · N/A  
**Priority:** **P0** = ship-blocking · **P1** = visual-only / under-match OK

**Data SSoT (HARD):** `APPOINTMENTS` in `appointments.ts` (4 rows).

**Selector contract (HARD):**

| Role | Selector |
|------|----------|
| View Details | `[data-studio-appointment-view-details="true"]` |
| Edit | `[data-studio-appointment-edit="true"]` |
| Cancel | `[data-studio-appointment-cancel="true"]` |
| Card host | `[data-name="boots-pharmacy.component.ma.acc.overview.recent.order"]` |
| Refund pending | `[data-studio-refund-pending-row]` |
| Cancellation reason | `[data-studio-cancellation-reason-row]` |

**Forbidden invent:** `data-studio-action="appointment-history-view-details"`.

**Sequence:** History only. View Details → **Legacy** `appointment-details`. Details React closed until History PAGE FINAL PASS hard-green.

---

## Layout (every Legacy band)

| # | Pri | Legacy behavior | Legacy | React status | Evidence |
|---|-----|---------------|------|--------------|----------|
| L1 | P0 | **1440 shell** | **Present** | **Present** | `appointment-history` shell |
| L2 | P0 | **Engine header** | **Present** | **N/A** (engine) | header mount kept |
| L3 | P0 | **Breadcrumbs** | **Present** | **Present** | React crumbs |
| L4 | P0 | **Body fill** | **Present** | **Present** | `<main class="appointment-history">` |
| L5 | P0 | **Account nav column** | **Present** | **Present** | left nav |
| L6 | P1 | **Nav menu items** | **Present** | **Present** | visual; no invent routing |
| L7 | P0 | **Title block** | **Present** | **Present** | H1 Appointment History |
| L8 | P0 | **Ask Site Pilot help** | **Present** | **Present** | help link → Site Pilot |
| L9 | P0 | **Sorting / count** | **Present** | **Present** | `APPOINTMENT_COUNT` label |
| L10 | P1 | **Show All dropdown** | **Present** | **Present** | visual only |
| L11 | P0 | **Card list host** | **Present** | **Present** | maps `APPOINTMENTS` |
| L12 | P0 | **Card title** link | **Present** | **Present** | → Details |
| L13 | P0 | **Card info block** | **Present** | **Partial** | rows present; Uma pixel pending |
| L14–L23 | P0 | **Detail rows** (number…total) | **Present** | **Present** | from `APPOINTMENTS` |
| L24 | P0 | **Refund pending** | **Present** | **Present** | cancelled card |
| L25 | P0 | **Cancellation reason** | **Present** | **Present** | cancelled card |
| L26 | P0 | **CTA row** | **Present** | **Present** | View Details + Edit/Cancel |
| L27 | P1 | **Load more band** | **Present** | **Present** | visual N of N |
| L28 | P0 | **Footer** | **Present** | **N/A** / engine | footer mount kept |
| L29 | P1 | **Customer service slot** | **Present** | **Present** | visual |

---

## Loading / empty / updating

| # | Pri | Legacy behavior | Legacy | React status | Evidence |
|---|-----|---------------|------|--------------|----------|
| LE1 | P0 | Page loader | **N/A** | **N/A** | no invent |
| LE2 | P0 | Empty list | **N/A** | **N/A** | no invent |
| LE3 | P0 | Updating overlay | **N/A** | **N/A** | no invent |
| LE4 | P1 | Card clone wire | **Present** | **N/A** | React maps array |

---

## Interactions / DS states

| # | Pri | Legacy behavior | Legacy | React status | Evidence |
|---|-----|---------------|------|--------------|----------|
| I1 | P0 | **View Details** + hard selector | **Present** | **Present** | Quinn MCP click PASS |
| I2 | P0 | **Title → Details** | **Present** | **Present** | same selection |
| I3 | P0 | **Edit** non-terminal | **Present** | **Present** | visual; no invent modal |
| I4 | P0 | **Cancel** non-terminal | **Present** | **Present** | visual; no invent modal |
| I5 | P0 | **Terminal CTA rule** | **Present** | **Present** | Completed/Cancelled |
| I6 | P0 | **Status tones** | **Present** | **Present** | screen CSS (Legacy tones) |
| I7 | P0 | **Ask Site Pilot** | **Present** | **Present** | link |
| I8 | P0 | **Discuss with Site Pilot** | **Present** | **Present** | refund |
| I9 | P0 | **Typical DS hover/focus** | **Present** | **Present** | Uma PROVEN · Quinn View Details hover |
| I10 | P0 | **Breadcrumb affordance** | **Present** | **Partial** | visual crumbs |
| I11 | P1 | **Load more** click | **Partial** | **Present** | visual only |
| I12 | P1 | **Show All** filter | **Partial** | **Present** | visual only |
| I13 | P0 | **Details = Legacy** this wave | **Present** | **Present** | MCP handoff PASS |

---

## Wire / mount gates

| # | Pri | Behavior | Legacy | React status | Evidence |
|---|-----|----------|------|--------------|----------|
| W1 | P0 | React host child 2 | — | **Present** | `mountAppointmentHistoryScreen` |
| W2 | P0 | Legacy retired / parked | — | **Present** | Quinn legacy-retired PASS |
| W3 | P0 | URL `screen=appointment-history` | **Present** | **Present** | registry |
| W4 | P0 | Wire early-return when mounted | **Present** | **Present** | `isAppointmentHistoryReactMounted()` |
| W5 | P0 | No LEGACY growth | — | **Present** | `appointment-history.css` |
| W6 | P0 | PAGE FINAL PASS stamp | — | **Missing** | Uma/FE audit pending |
| W7 | P0 | Details React closed | — | **N/A** | Arch sequence |
| W8 | P0 | `APPOINTMENTS` SSoT | **Present** | **Present** | React imports array |

---

## CJM / playback / URL

| # | Pri | Contract | Legacy / engine | React status | Evidence |
|---|-----|----------|---------------|--------------|----------|
| C1 | P0 | Traditional `history-view-details` | **Present** | **Partial** | selector preserved; full Play re-prove pending |
| C2 | P0 | Visible View Details first-match | **Present** | **Present** | 4 visible CTAs |
| C3 | P0 | Click → Details ready | **Present** | **Present** | MCP click PASS |
| C4 | P0 | Ask Site Pilot path | **Present** | **Present** | wired |
| C5 | P0 | URL navigable | **Present** | **Present** | URL.md |

---

## Demo data (`APPOINTMENTS`)

| # | Pri | Appointment | Status | CTA expectation | React |
|---|-----|-------------|--------|-----------------|-------|
| D1 | P0 | `#1411527` | confirmed | View + Edit + Cancel | **Present** |
| D2 | P0 | `#1090595` | Completed | View only | **Present** |
| D3 | P0 | `#990587` | confirmed | View + Edit + Cancel | **Present** |
| D4 | P0 | `#8762341` | Cancelled | View + refund + reason | **Present** |

---

## Remaining ship blockers

| Id | Note |
|----|------|
| B1 | **C1** — Traditional full Play re-prove eyes-on (scroll-reversal board 0d separate) |
| B2 | Details React — next page (History HARD-GREEN met) |

**Missing P0 inventory blockers:** **0** (Bea discovery).  
**Mount-wave P0s:** closed except Uma DS sign-off + Final Pass stamp.

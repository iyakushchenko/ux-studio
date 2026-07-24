# Appointment Details Legacy → React parity register

**Project:** `boots-pharmacy`  
**Callsigns:** Bea (BA) owns register truth · Quinn (QA) owns prove · Finn/Uma restore gaps  
**Updated:** 2026-07-22 (discovery — **React not mounted**)  
**Overall proof status:** React mount ON · Uma **PROVEN** · Quinn MCP **10/10 PASS** · PAGE FINAL PASS **HARD-GREEN**.  
**Register interpretation:** Legacy columns = Frame/wire inventory. React columns = mount + Final Pass evidence (2026-07-22).  
**React target:** `src/projects/boots-pharmacy/screens/appointment-details/*` — **live** (`mountAppointmentDetailsScreen`; Legacy retired)  
**Refs:** [APPOINTMENT_DETAILS_REACT.md](./APPOINTMENT_DETAILS_REACT.md) · Quinn [../audits/QUINN_APPOINTMENT_DETAILS_PROBE_2026-07-22.md](../audits/QUINN_APPOINTMENT_DETAILS_PROBE_2026-07-22.md) · Uma [../audits/UMA_FIDELITY_APPOINTMENT_DETAILS_2026-07-22.md](../audits/UMA_FIDELITY_APPOINTMENT_DETAILS_2026-07-22.md) · Final Pass [../audits/FE_AUDIT_APPOINTMENT_DETAILS_PAGE_FINAL_PASS_2026-07-22.md](../audits/FE_AUDIT_APPOINTMENT_DETAILS_PAGE_FINAL_PASS_2026-07-22.md) · inventory [../audits/INTERACTION_INVENTORY_APPOINTMENT_DETAILS_REACT_2026-07-22.json](../audits/INTERACTION_INVENTORY_APPOINTMENT_DETAILS_REACT_2026-07-22.json) · [PAGE_FINAL_PASS.md](../../../product/PAGE_FINAL_PASS.md)

**Status legend:** Present · Partial · Missing · Fixed · N/A  
**Priority:** **P0** = ship-blocking · **P1** = visual-only / under-match OK

**Data SSoT (HARD):** `APPOINTMENTS` + `getSelectedAppointmentId` / `setSelectedAppointmentId` in `appointments.ts`.

**Project wire truth (HARD):** Appointment copy over Legacy order chrome is **boots-pharmacy project content** — not UXDS domain remaps. Keep Legacy `data-name`s where playback/continuity needs them (`Info Blocks / Order Summary/NO`, card host, etc.).

**Selector contract (HARD):**

| Role | Selector |
|------|----------|
| Detail card host | `[data-name="boots-pharmacy.component.ma.acc.overview.recent.order"]` |
| Edit | `[data-studio-appointment-edit="true"]` |
| Cancel | `[data-studio-appointment-cancel="true"]` |
| View Details | `[data-studio-appointment-view-details="true"]` — **History entry only**; hidden/absent on Details |
| Refund pending | `[data-studio-refund-pending-row]` |
| Cancellation reason | `[data-studio-cancellation-reason-row]` |
| Booster line | `[data-studio-booster-line]` |
| Appointment Summary | `[data-name="Info Blocks / Order Summary/NO"]` |
| Vaccinations band | `[data-name="component.co.product.in.this.order"]` |
| Buyer / payment | `[data-name="component.co.buyer.info.static"]` |
| Breadcrumbs | `[data-name="component.breadcrumbs"]` |
| Account nav | `[data-name="module.ma.navigation"]` |
| CTA host | `[data-name="CTAs"]` |

**Forbidden invent:** `data-studio-action="appointment-details-…"`, invent loader/empty, invent Cancel hover, invent accordion body, invent Home routing, invent pharmacy shipping.

**Back-nav (HARD):** Breadcrumb “Appointment history” → React `appointment-history` (`INDEX_APPOINTMENT_HISTORY`). History is PAGE FINAL PASS live — do not invent.

**Reuse / extract-on-second-use:** Account nav · crumbs · Edit/Cancel icon+text · status tones · refund/Discuss Site Pilot · card shell · `.uxds-link` from History React — extract shared kits on second use.

---

## Layout (every Legacy band)

| # | Pri | Legacy behavior | Legacy | React status | Evidence |
|---|-----|---------------|------|--------------|----------|
| L1 | P0 | **1440 shell** | **Present** | **Missing** | Frame Details `w-[1440px]` |
| L2 | P0 | **Engine header** | **Present** | **N/A** (engine) | header mount kept |
| L3 | P0 | **Breadcrumbs** Home › Appointment history › Appointment Details | **Present** | **Missing** | Live crumbs rewritten; History crumb `role=link` |
| L4 | P0 | **Body fill** (`data-name="body"`) | **Present** | **Missing** | Legacy body + densify column rules |
| L5 | P0 | **Account nav column** `module.ma.navigation` | **Present** | **Missing** | Same 10 items as History; active = Appointment history |
| L6 | P1 | **Nav menu items** (visual; no invent routing) | **Present** | **Missing** | Labels match History contract |
| L7 | P0 | **Profile hello / avatar** | **Present** | **Missing** | Hello · Sarah · avatar |
| L8 | P0 | **H1 title** “Appointment Details” | **Present** | **Missing** | Right Column `> p` (rewritten from Order Details) |
| L9 | P0 | **Detail card shell** grey + border | **Present** | **Missing** | densify pad/gap **20/20** |
| L10 | P0 | **Card title** `Appointment #{id}` (static, not link) | **Present** | **Missing** | Wire strips link role |
| L11 | P0 | **White info block** | **Present** | **Missing** | densify inner pad **20** |
| L12 | P0 | **Row — Appointment number** | **Present** | **Missing** | SSoT `id` |
| L13 | P0 | **Row — Status** + tone | **Present** | **Missing** | `getAppointmentStatusTone` |
| L14 | P0 | **Row — Booked** | **Present** | **Missing** | `bookedAt` |
| L15 | P0 | **Row — Vaccine Service** | **Present** | **Missing** | Legacy label (≠ History “Vaccine”); value SSoT |
| L16 | P0 | **Row — Recipient** | **Present** | **Missing** | SSoT |
| L17 | P0 | **Row — Email** | **Present** | **Missing** | SSoT |
| L18 | P0 | **Row — Phone Number** | **Present** | **Missing** | Legacy label; value SSoT |
| L19 | P0 | **Row — Location** | **Present** | **Missing** | SSoT |
| L20 | P0 | **Row — Date and Time** | **Partial** | **Missing** | Legacy label Present; wire miss on value — React binds `appointmentDate` |
| L21 | P0 | **Row — Total** (`component.product.price`) | **Present** | **Missing** | SSoT `total` |
| L22 | P0 | **Refund pending row** (cancelled) | **Present** | **Missing** | `data-studio-refund-pending-row` |
| L23 | P0 | **Cancellation reason row** (cancelled) | **Present** | **Missing** | `data-studio-cancellation-reason-row` |
| L24 | P0 | **CTA row** Edit / Cancel (non-terminal) | **Present** | **Missing** | View Details hidden |
| L25 | P0 | **Vaccinations accordion header** | **Present** | **Missing** | “Vaccinations in this Appointment (1)” — header only |
| L26 | P1 | **Vaccinations accordion body** | **N/A** | **N/A** | Legacy has no body — no invent |
| L27 | P0 | **Appointment Summary** block | **Present** | **Missing** | `Info Blocks / Order Summary/NO` |
| L28 | P0 | **Summary — Subtotal** | **Present** | **Missing** | `syncDetailPricing` / SSoT |
| L29 | P0 | **Summary — Appointment Discount** | **Present** | **Missing** | `data-name="Order Discount"` + rewrite |
| L30 | P0 | **Summary — Sales Tax** | **Present** | **Missing** | SSoT / pricing |
| L31 | P0 | **Summary — Total** | **Present** | **Missing** | SSoT |
| L32 | P0 | **Summary — Booster line** (chickenpox path) | **Present** | **Missing** | `data-studio-booster-line` |
| L33 | P1 | **Hire Shipping / Shipping Discount residue** | **Present** | **N/A** (under-match omit) | Dead hire $850 — omit in React; no invent pharmacy shipping |
| L34 | P1 | **Contact Information / Payment Details** static | **Present** | **Missing** | Legacy static; do not invent new identity |
| L35 | P0 | **Footer** full pharmacy | **Present** | **N/A** / engine | `FOOTER_BY_CHILD[1]` |

---

## Loading / empty / updating

| # | Pri | Legacy behavior | Legacy | React status | Evidence |
|---|-----|---------------|------|--------------|----------|
| LE1 | P0 | Page loader / spinner | **N/A** | **N/A** | localhost: no loader chrome — **no invent** |
| LE2 | P0 | Empty detail state | **N/A** | **N/A** | Always falls back to `APPOINTMENTS[0]` — **no invent** empty |
| LE3 | P0 | Updating / refreshing overlay | **N/A** | **N/A** | Legacy has none — **no invent** |
| LE4 | P1 | “Selected missing id” recovery | **Present** | **Missing** | Wire: invalid → first appointment |

**Missing P0 loading/empty blockers:** **0** (honest N/A).

---

## Interactions / DS states

| # | Pri | Legacy behavior | Legacy | React status | Evidence |
|---|-----|---------------|------|--------------|----------|
| I1 | P0 | **Breadcrumb → History** | **Present** | **Missing** | `wireAppointmentDetailsBreadcrumbs` → React History |
| I2 | P1 | **Breadcrumb Home** | **Partial** | **Missing** | Visual underline only; no invent route |
| I3 | P0 | **Edit** non-terminal icon+text | **Present** | **Missing** | Visual; no invent modal |
| I4 | P0 | **Cancel** non-terminal icon+text | **Present** | **Missing** | Visual; no invent modal / hover invent |
| I5 | P0 | **Terminal CTA rule** (hide Edit/Cancel + CTA host) | **Present** | **Missing** | `isDetailsPage` + terminal |
| I6 | P0 | **View Details hidden** on Details | **Present** | **Missing** | `display:none` / omit in React |
| I7 | P0 | **Status tones** | **Present** | **Missing** | active / completed / cancelled |
| I8 | P0 | **Discuss with Site Pilot** | **Present** | **Missing** | Refund row → Site Pilot query |
| I9 | P0 | **Typical DS hover/focus** Edit/Cancel · links | **Present** | **Missing** | Uma signs; no invent Cancel color |
| I10 | P0 | **Title not clickable** | **Present** | **Missing** | Wire removes link affordance |
| I11 | P1 | **Vaccinations chevron** | **Partial** | **Missing** | Header present; no invent expand body |
| I12 | P0 | **Entry preserves selected id** | **Present** | **Missing** | History View Details already sets id |
| I13 | P0 | **Densify vs React page CSS** | **Present** (Legacy) | **Missing** | Gate child-1 densify like History |

---

## Wire / mount gates

| # | Pri | Behavior | Legacy | React status | Evidence |
|---|-----|----------|------|--------------|----------|
| W1 | P0 | React host child **1** | — | **Missing** | `mountAppointmentDetailsScreen` (Finn) |
| W2 | P0 | Legacy retired / parked | — | **Missing** | `retireLegacyUnderPage` |
| W3 | P0 | URL `screen=appointment-details` | **Present** | **Missing** | registry / screens.ts |
| W4 | P0 | Wire early-return when mounted | **Present** (History pattern) | **Missing** | Document: `childIndex===1` effect must skip `syncAppointmentDetails` + breadcrumbs when React mounted |
| W5 | P0 | No LEGACY growth | — | **Missing** | `appointment-details.css` only |
| W6 | P0 | Densify `:not([data-studio-react-screen])` on child 1 | **Partial** | **Missing** | History gated; Details still densifies Legacy — extend on mount |
| W7 | P0 | `APPOINTMENTS` + selected id SSoT | **Present** | **Missing** | `syncAppointmentDetails` today |
| W8 | P0 | PAGE FINAL PASS stamp | — | **Missing** | After Uma/Quinn |
| W9 | P0 | History HARD-GREEN sequence | **Present** | **Present** | Gate met — Details OPEN |

---

## CJM / playback / URL

| # | Pri | Contract | Legacy / engine | React status | Evidence |
|---|-----|----------|---------------|--------------|----------|
| C1 | P0 | Traditional beat `appointment-details` | **Present** | **Missing** | dwell after `history-view-details` |
| C2 | P0 | Entry via History View Details selector | **Present** | **Present** (History) | `[data-studio-appointment-view-details="true"]` |
| C3 | P0 | Selected id preserved across nav | **Present** | **Missing** | `setSelectedAppointmentId` |
| C4 | P0 | Crumb back → History React | **Present** | **Missing** | Must not hit Legacy History |
| C5 | P0 | URL navigable `screen=appointment-details` | **Present** | **Missing** | URL.md |
| C6 | P1 | Book Step 3 `data-studio-open-appointment` | **Present** | **N/A** (Step 3) | Entry to History, not Details |

---

## Demo data (`APPOINTMENTS` → Details)

| # | Pri | Appointment | Status | Details CTA / extras | React |
|---|-----|-------------|--------|----------------------|-------|
| D1 | P0 | `#1411527` | confirmed | Edit + Cancel; booster “Not included”; summary via `syncAccountOrderSummary` | **Missing** |
| D2 | P0 | `#1090595` | Completed | CTA host hidden; `pricing` fixed summary | **Missing** |
| D3 | P0 | `#990587` | confirmed | Edit + Cancel; `pricing` fixed | **Missing** |
| D4 | P0 | `#8762341` | Cancelled | CTA host hidden; refund + cancellation rows | **Missing** |

---

## Remaining ship blockers

| Id | Note |
|----|------|
| B1 | Extract shared account chrome (History + Details second use) |
| B2 | Traditional CJM eyes-on / board 0d scroll-reversal (separate) |
| B3 | Delete Book Step 1–3 Legacy children (board #8) after CJM/playback green |

**Missing P0:** **0** · PAGE FINAL PASS **HARD-GREEN**.

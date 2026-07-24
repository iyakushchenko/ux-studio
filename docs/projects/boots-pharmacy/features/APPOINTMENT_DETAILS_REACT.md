# Feature brief — Appointment Details React migration

**Project:** `boots-pharmacy`  
**Callsigns:** Bea (BA) · Finn (FE) · Uma (UI/UX) · Quinn (QA) · Pax (PO sim) · Arch (Director)  
**Status:** **PAGE FINAL PASS HARD-GREEN** 2026-07-22  
**Updated:** 2026-07-22  
**Refs:** [APPOINTMENT_DETAILS_LEGACY_PARITY_REGISTER.md](./APPOINTMENT_DETAILS_LEGACY_PARITY_REGISTER.md) · [APPOINTMENT_HISTORY_REACT.md](./APPOINTMENT_HISTORY_REACT.md) · [NEXT_STEPS.md](../../../product/NEXT_STEPS.md) · [PAGE_FINAL_PASS.md](../../../product/PAGE_FINAL_PASS.md) · data SSoT [`appointments.ts`](../../../../src/projects/boots-pharmacy/data/appointments.ts) (`APPOINTMENTS` + `getSelectedAppointmentId` / `setSelectedAppointmentId` + `syncAppointmentDetails`)

**Sequence gate (met):** History **PAGE FINAL PASS HARD-GREEN** — [FE_AUDIT_APPOINTMENT_HISTORY_PAGE_FINAL_PASS_2026-07-22.md](../audits/FE_AUDIT_APPOINTMENT_HISTORY_PAGE_FINAL_PASS_2026-07-22.md) · Uma [UMA_FIDELITY_APPOINTMENT_HISTORY_2026-07-22.md](../audits/UMA_FIDELITY_APPOINTMENT_HISTORY_2026-07-22.md) · Quinn [QUINN_APPOINTMENT_HISTORY_PROBE_2026-07-22.md](../audits/QUINN_APPOINTMENT_HISTORY_PROBE_2026-07-22.md) · `PAGE_FINAL_PASS.json` `appointment-history` HARD-GREEN. Details is **NOW OPEN**.

---

## Context

Erase-Legacy next page after History HARD-GREEN: migrate **Appointment Details** (`screenId: appointment-details`, Frame child **1**, Legacy `left-[16282px]`) to React + UXDS. Legacy body is hire/order chrome rewritten at runtime (`rewriteAccountAppointmentCopy` + `syncAppointmentDetails` + `wireAppointmentDetailsBreadcrumbs`). **Do not invent domain remaps as UXDS doctrine** — appointment copy over Legacy order chrome is **boots-pharmacy PROJECT wire truth**.

Entry already works from React History: View Details / title (`data-studio-appointment-view-details`) → `setSelectedAppointmentId` + `INDEX_APPOINTMENT_DETAILS`. Preserve selected id. Back / “Appointment history” crumb must land on **React History** (live), not invent a new path.

---

## Business logic

| Rule | Behavior |
|------|----------|
| Data SSoT | **`APPOINTMENTS`** + **`getSelectedAppointmentId()`** / **`setSelectedAppointmentId`**. React reads selected appointment via `getAppointment(id)` / selected id; do **not** fork detail copy. |
| Default selection | Wire: `getAppointment(id \|\| selected) ?? APPOINTMENTS[0]`; sync writes `selectedAppointmentId = appt.id`. |
| Single card | One detail card (not list). Host `data-name="boots-pharmacy.component.ma.acc.overview.recent.order"`. Title plain text `Appointment #{id}` — **not** a link (History titles are links; Details title is static). |
| Status tones | Same `getAppointmentStatusTone` → active / completed / cancelled. |
| Edit / Cancel | Visible only for **non-terminal**; wire converts Legacy “Edit Appointment” / “Cancel Appointment” → icon+text **Edit** / **Cancel** (`data-studio-appointment-edit` / `data-studio-appointment-cancel`). Terminal → hide Edit/Cancel **and** hide entire CTA host. **No** Legacy navigate destination — presence + visibility only; do not invent cancel/edit modals. |
| View Details | On Details page wire **hides** View Details (`display:none`). React: **do not show** View Details on this screen. |
| Refund / cancel reason | Same as History: cancelled + `refundPendingNote` / `cancellationReason` rows; Discuss with Site Pilot → `goSitePilotHome(getAppointmentRefundPilotQuery(appt))`. |
| Pricing summary | `syncDetailPricing`: if `appt.pricing` → Subtotal / Order Discount / Sales Tax / Total via `formatGbp`; else `syncAccountOrderSummary` (+ optional `data-studio-booster-line`). Copy rewrite: “Appointment Summary” / “Appointment Discount”. |
| Vaccinations band | UXDS `component.co.product.in.this.order` → compose shared **`Accordion`** kit (`component.gse.accordion`). Interactive expand/collapse required. Body = SSoT appointment fields (vaccine / recipient / date / location) until a dedicated product-row kit ships. **Forbidden:** dead non-interactive header. |
| Contact / payment | Legacy static hire chrome (`component.co.buyer.info.static`) — wire does **not** bind from `APPOINTMENTS`. Preserve as visual chrome; do not invent new billing identity. |
| Breadcrumb back | `wireAppointmentDetailsBreadcrumbs`: crumb matching `/^(appointment history\|order history)$/i` → `setCurrent(INDEX_APPOINTMENT_HISTORY)` (**React History**). Current crumb “Appointment Details” non-link. Home crumb visual (Legacy underline); no invent Home route unless engine already owns it. |
| Auth | Engine `studioAuthSession` / `isStudioLoggedIn` — no page-local auth flag. |
| Densify | Legacy child **1** densify in `globals-chrome.css` (20/20 pad/gap, CTA 12). On React mount: gate with `:not([data-studio-react-screen])` like History (LESSON 2026-07-22 densify). Do **not** invent Cancel hover colors. |

### Legacy wire gaps Finn must close via SSoT (honest, not invent)

| Gap | Legacy live | React contract |
|-----|-----------|----------------|
| **Date and Time** row | Label is “Date and Time”; wire `setRowValue(..., "appointment date", …)` **misses** → stale Legacy date | Bind **`APPOINTMENTS[].appointmentDate`** |
| Hire Shipping rows | “Standard Shipping $850” / “Shipping Discount -$150” still visible | Prefer **under-match omit** (PO: no dead BS chrome). Do **not** invent pharmacy shipping. |
| Row labels | Details Legacy: Vaccine Service · Phone Number · Date and Time (≠ History “Vaccine” / “Phone” / “Appointment date”) | Match **Details Legacy labels** for this screen; values from SSoT |

---

## Inheritance preflight (HARD)

**Law:** [PAGE_CREATE_INHERITANCE.md](../../../product/PAGE_CREATE_INHERITANCE.md) (retrofit stamp after Accordion reuse).

| # | UXDS / UXML source | Reuse / compose | Gap (new kit?) |
|---|--------------------|-----------------|---------------|
| P1 | `component.co.product.in.this.order` · account overview / buyer static · crumb / CTA icon+text | Map bands to inventory names | none |
| P2 | UXDS - Larkin Order Details `11920:238008` | Accordion + product-in-order composition | product-row kit later |
| P3 | `Accordion` (`component.gse.accordion`) · Button/link patterns · REACT_KIT_MAP | Shared Accordion (same as PDP) | none this ship |
| P4 | `screens/appointment-history` card/summary/CTA chrome | Compose sibling account shell | extract shared chrome on 2nd+ use |
| P5 | Vaccinations expandable = Accordion kit | Interactive expand/collapse | **forbidden** dead header |
| P6 | Boots `theme.css` brand remaps only | Copy/status from SSoT + Legacy intent | no layout/hover in theme |

---

## Acceptance (Bea → Quinn)

- [ ] React host mounts at child **1**; Legacy retired (`retireLegacyUnderPage` / parked)
- [ ] Legacy wire `syncAppointmentDetails` + `wireAppointmentDetailsBreadcrumbs` **early-return** when React mounted (`isAppointmentDetailsReactMounted()` pattern like History)
- [ ] URL `?project=boots-pharmacy&screen=appointment-details`
- [ ] Detail renders from **`APPOINTMENTS`** via **`getSelectedAppointmentId()`** (entry from History preserves id)
- [ ] Back / Appointment history crumb → **React** `screen=appointment-history` (not Legacy History)
- [ ] **HARD selectors** preserved (see table) — **forbidden** invented `data-studio-action=…`
- [ ] Terminal CTA rule + refund/cancel rows match wire
- [ ] Title is **not** a details link; View Details **absent** on this page
- [ ] No LEGACY growth for React path; densify gated off React host
- [ ] Uma audit **PROVEN** + typical DS checks (Edit/Cancel · crumbs/links · summary chrome)
- [ ] Quinn MCP `__studioRunMcpPageProbe({ screenId:"appointment-details" })` PASS
- [ ] Loading/empty/updating: honest **N/A** (Legacy has none) — **forbidden** invent spinner/empty
- [ ] PAGE FINAL PASS hard-green for `appointment-details` before any next page

## Chrome / fidelity (Uma)

- [ ] Concept L&F vs Legacy Details (Right Column) + densified card shell / white info / CTA row / summary / vaccinations header / buyer block
- [ ] Status tones match wire — no invent
- [ ] Typical DS checks: Edit/Cancel icon+text · breadcrumb / refund links (`.uxds-link`) · no invent hover
- [ ] Account nav + breadcrumbs + full pharmacy footer (`FOOTER_BY_CHILD[1]`)
- [ ] No invent empty/loader / accordion body / fuchsia Cancel

## Mount / FE notes (Finn)

- **DO NOT mount until Arch opens build.** Discovery only.
- Folder: `src/projects/boots-pharmacy/screens/appointment-details/` (`screenId` = folder) — mirror `appointment-history/*`
- Contract: childIndex **1**, `INDEX_APPOINTMENT_DETAILS`, public id `appointment-details`
- SSoT import: `APPOINTMENTS`, `getSelectedAppointmentId` / `setSelectedAppointmentId`, `getAppointment`, `getAppointmentStatusTone`, `isTerminalAppointmentStatus`, `getAppointmentRefundPilotQuery`, pricing helpers from `data/appointments.ts` / `orderPricing.ts`
- Wire (document for Finn): in `BootsPharmacyProjectView` when `childIndex === 1`, today runs `syncAppointmentDetails` + `wireAppointmentDetailsBreadcrumbs`. After mount: **early-return** when React mounted (same pattern as History `isAppointmentHistoryReactMounted()`).
- Densify: extend child-1 rules with `:not([data-studio-react-screen])` when React host stamps that attr.
- **Reuse History kits (extract-on-second-use):** account nav column · breadcrumbs · `ButtonPrimary` (if any primary appears) · `.uxds-link` · Edit/Cancel icon+text · status tone classes · refund/Discuss Site Pilot row · card shell patterns from `screens/appointment-history/`. Second use → extract shared account chrome; do not fork near-dups.
- Quality bar (PO): reusable interactive components; target-ready `data-name` / `data-studio-*`; no dead BS chrome; no invent hover/loader.

### Selector contract (HARD — playback / CJM)

| Control | Required attribute | Notes |
|---------|-------------------|--------|
| Detail card host | `data-name="boots-pharmacy.component.ma.acc.overview.recent.order"` | Prefer keep Legacy `data-name` for continuity |
| Edit | `data-studio-appointment-edit="true"` | Wire already stamps |
| Cancel | `data-studio-appointment-cancel="true"` | Wire already stamps |
| View Details | `data-studio-appointment-view-details="true"` | **History only** for click; Details must not show |
| Refund pending row | `data-studio-refund-pending-row` | Conditional cancelled |
| Cancellation reason row | `data-studio-cancellation-reason-row` | Conditional cancelled |
| Booster summary line | `data-studio-booster-line` | Chickenpox / `includeBooster` path |
| Appointment Summary | `data-name="Info Blocks / Order Summary/NO"` | Keep Legacy name (project wire truth) |
| Vaccinations band | `data-name="component.co.product.in.this.order"` | Header only |
| Buyer / payment | `data-name="component.co.buyer.info.static"` | Static Legacy chrome |
| Breadcrumbs | `data-name="component.breadcrumbs"` | History crumb → React History |
| Account nav | `data-name="module.ma.navigation"` | Same labels as History |
| CTA host | `data-name="CTAs"` | Hidden when terminal |

**Forbidden:** invented `data-studio-action="appointment-details-…"` (or any action invent that breaks Traditional CJM). Prefer existing wire attrs.

**Entry / exit (already live — preserve):**

| Flow | Contract |
|------|----------|
| History → Details | `[data-studio-appointment-view-details="true"]` + title → `setSelectedAppointmentId` + `screen=appointment-details` |
| Details → History | Breadcrumb “Appointment history” → `INDEX_APPOINTMENT_HISTORY` / React History |
| Traditional | Beat `appointment-details` (dwell); entry via `history-view-details` |

## Prove notes (Quinn)

- R11: `http://localhost:5173/` reuse tab only
- Probe: `__studioRunMcpPageProbe({ screenId:"appointment-details", reload:false })`
- Must prove: selected id from History View Details · crumb back → `appointment-history` React · Edit/Cancel hover on non-terminal · terminal CTA hide (cancelled) · overlay visible every step · scroll-into-view
- Traditional: beat `appointment-details` still lands after `history-view-details`
- Overlay eyes + no ghost Legacy clicks after `retireLegacyUnderPage`

## Pax

- [ ] User-visible? → bump patch? **Y** on first visible React mount / fidelity ship (not discovery docs alone)
- [ ] Push? **Y** when coherent build ship (R12 batch) — discovery docs may land with wave
- [ ] Notes/CHANGELOG updated if bump

## Sequence gate (Arch)

1. **DONE:** History PAGE FINAL PASS HARD-GREEN.  
2. **DONE:** Details discovery brief + register + Legacy inventory baseline.  
3. **NOW:** Finn mount (Arch opened build) → Uma/Quinn → PAGE FINAL PASS hard-green.  
4. **CLOSED:** next erase-Legacy page until Details hard-green.

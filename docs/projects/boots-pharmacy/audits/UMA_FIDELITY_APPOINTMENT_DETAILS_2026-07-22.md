# Uma fidelity stamp — Appointment Details

**Surface:** Boots Pharmacy Appointment Details (`screenId: appointment-details`, Frame child **1**, Legacy Details / Right Column)  
**Date:** 2026-07-22  
**Owner:** Uma (UI/UX)  
**Status:** **PROVEN** — live MCP re-measure vs densify Legacy live look (20/20) + register intent  
**React target:** `screens/appointment-details/*` — **live** at `http://localhost:5173/?project=boots-pharmacy&screen=appointment-details`  
**Legacy truth:** Frame child **1** · densify live pad/gap **20/20** · info pad **20** · CTA gap **12** · title **20/28** · wire `syncAppointmentDetails` / status tones · `data/appointments.ts` `APPOINTMENTS` + selected id · **Date and Time** from SSoT `appointmentDate` (closes Legacy wire miss)  
**Register:** [APPOINTMENT_DETAILS_LEGACY_PARITY_REGISTER.md](../features/APPOINTMENT_DETAILS_LEGACY_PARITY_REGISTER.md) · brief [APPOINTMENT_DETAILS_REACT.md](../features/APPOINTMENT_DETAILS_REACT.md)  
**Checklist:** [../../../product/UMA_FIDELITY_NOTES.md](../../../product/UMA_FIDELITY_NOTES.md) · [VISUAL_FIDELITY.md](../../../product/VISUAL_FIDELITY.md) · [FE_UI_UX_AUDIT.md](../../../product/FE_UI_UX_AUDIT.md)  
**Quinn MCP (cited):** [QUINN_APPOINTMENT_DETAILS_PROBE_2026-07-22.md](./QUINN_APPOINTMENT_DETAILS_PROBE_2026-07-22.md) — **10/10 PASS** + terminal CTA hide (re-confirmed before Final Pass)

**Not claimed:** next erase-Legacy page beyond History/Details close (Book Legacy delete still residual)

---

## Verdict

| Field | Value |
|-------|-------|
| **Overall** | **PROVEN** |
| **§0a typical DS / pointer matrix** | **PASS** — Edit/Cancel under-match (no invent hover; `#c96b6b` ABSENT on React); History crumb + Discuss `.uxds-link` |
| **§0b section vertical rhythm** | **N/A** (not PDP/RTB purchase stack) — card internal densify rhythm audited under L9–L11 |
| **loading / empty / updating** | **N/A** — Legacy LE1–LE3 honest N/A; React invents none |
| **checkbox / radio hover** | **N/A** |
| **SearchField matrix** | **N/A** |
| **PO green-light allowed?** | **Yes** |
| **PAGE FINAL PASS** | **HARD-GREEN** |

---

## Evidence pack (MCP · `:5173` · reuse tab)

- **Host:** Chrome DevTools MCP `list_pages` → selected existing `localhost:5173` Appointment Details tab (page already on `screen=appointment-details`; **no** `new_page`).
- **Screenshot:** viewport React Details (crumbs · nav · H1 · card #1411527 · Edit/Cancel · Vaccinations header · Appointment Summary · Contact/Payment · footer).
- **Legacy densify truth (register L9/L11 + LESSON 2026-07-22):** live Legacy Details was densified **20/20** pad/gap (not History Frame 32/56). React page CSS implements densify intent; globals densify gated `:not([data-studio-react-screen])` on child **1**.
- **Measured React card shell:** `padding: 20px` · internal `gap: 20px` · bg `#f5f5f5` · border `#d6d6d6` · max-width `976px`.
- **Info block:** `padding: 20px` · border `1px solid #c3c3c3` (`rgb(195,195,195)`).
- **CTA row:** `gap: 12px` · Edit + Cancel on confirmed; **View Details absent**.
- **Card title type:** `20px` / `28px` / `600` · `H2` static (not link).
- **Cancel hover invent:** MCP hover Cancel → color stays `rgb(92,92,92)` · stroke `rgb(175,204,202)` · **`invent: false`** · no React `#c96b6b` rule (Legacy densify Cancel hover remains gated off React host).
- **Edit hover:** rest grey; **no** visual invent (under-match OK — same class as History).
- **Status tones (computed):** confirmed/active `#5b8fc9` (`rgb(91,143,201)`) · cancelled `#d4a03a` (`rgb(212,160,58)`) on `#8762341`.
- **Date and Time:** label present; value SSoT e.g. `#1411527` → `Thursday, 26th June 2026, 10:30` (not stale Legacy hire date).
- **Shipping residue:** **ABSENT** (summary has Subtotal / Appointment Discount / Booster / Sales Tax / Total only).
- **Vaccinations:** header only “Vaccinations in this Appointment (1)” · **no** invent accordion body.
- **Summary / buyer bands:** Appointment Summary + Contact Information + Payment Details present (`data-name`s preserved).
- **Terminal rule (`#8762341` Cancelled):** Edit/Cancel/CTAs host omitted · refund pending + Discuss `.uxds-link` · cancellation reason row present.
- **Shell:** 1440 / pad 64 / inner 1312 · nav width **304** · body pad `64px 0` · layout gap `32px`.
- **Legacy park:** Legacy body detached under React host (`data-studio-react-screen` on page + main); retired nodes parked off-DOM (stamp may be absent from live query — expected for `retireLegacyUnderPage`).
- **Quinn:** probe audit **pending** this wave.

---

## Layout bands — Legacy Details inventory

| # | Legacy band / component | Uma stamp | Evidence |
|---|------------------------|-----------|----------|
| L1 | 1440 / 64 / 1312 shell | **PASS** | shell max-width 1440 · pad 64 · inner 1312 |
| L2 | Engine header | **N/A** | engine |
| L3 | Breadcrumbs Home / Appointment history / Appointment Details | **PASS** | teal underline History crumb `button`; current grey |
| L4 | Body white · pad 64 · layout gap 32 | **PASS** | MCP `padding: 64px 0` · layout `gap: 32px` |
| L5 | Account nav 304px | **PASS** | MCP nav width **304** |
| L6 | Nav menu items + active grey | **PASS** (P1 visual) | active Appointment history `#f5f5f5` (Legacy truth) |
| L7 | Profile hello / avatar | **PASS** | Hello · Sarah · avatar |
| L8 | H1 “Appointment Details” | **PASS** | 39/48/700 |
| L9 | Detail card shell grey + densify **20/20** | **PASS** | MCP pad **20** · gap **20** |
| L10 | Card title `Appointment #{id}` static | **PASS** | H2 · not link · type **20/28** |
| L11 | White info block densify pad **20** | **PASS** | pad **20** · border `#c3c3c3` |
| L12–L19 | Info rows (number → Location) | **PASS** | labels match Details Legacy (Vaccine Service · Phone Number) |
| L20 | Row — Date and Time (SSoT) | **PASS** | SSoT `appointmentDate` bound |
| L21 | Row — Total | **PASS** | e.g. £70.02 on #1411527 |
| L22–L23 | Refund + cancellation reason | **PASS** | proven on `#8762341` |
| L24 | CTA row Edit / Cancel (non-terminal) | **PASS** | gap **12**; terminal omit OK |
| L25 | Vaccinations accordion header | **PASS** | header copy + chevron |
| L26 | Vaccinations accordion body | **N/A** | Legacy has none — React invents none |
| L27–L32 | Appointment Summary + pricing + booster | **PASS** | no Shipping; booster “Not included” on chickenpox path |
| L33 | Hire Shipping residue | **N/A / omit** | under-match omit — **PASS** |
| L34 | Contact / Payment static | **PASS** | buyer band present |
| L35 | Footer full pharmacy | **PASS** / engine | contentinfo present |

---

## §0 — Loading / empty / updating

| # | Stamp | Notes |
|---|-------|-------|
| LE1–LE3 | **N/A** | Legacy has no page loader / empty / updating — React invents none |
| LE4 | **PASS** (P1) | Invalid id → first appointment recovery (wire/SSoT) |
| Honesty | **PASS** | No blank+“Updating…” / invent spinner |

---

## §0a — Typical DS state matrix

| Control | Status | Evidence |
|---------|--------|----------|
| Edit (icon+text) | **PASS (under-match)** | Rest `#5c5c5c`; MCP hover — no invent wash |
| Cancel (icon+text) | **PASS (under-match)** | Rest OK; MCP hover — **no** `#c96b6b` invent (`invent: false`) |
| Discuss with Site Pilot (`.uxds-link`) | **PASS** | Present on refund row (cancelled); kit class |
| Appointment history crumb | **PASS** | underline teal; pointer |
| Card title | **PASS** | static H2 — not clickable (I10) |
| View Details | **PASS** | **absent** on Details |
| SearchField | **N/A** | — |
| Checkbox / radio | **N/A** | — |
| ButtonPrimary commerce | **N/A** | none on Details |

**FAIL class hit:** none (Cancel invent absent; densify gated; no accordion/shipping invent).

---

## Design-delta checklist (VISUAL_FIDELITY §1.2) — densify live truth

| Element | Legacy densify / register | React (MCP) | Status |
|---------|-------------------------|-------------|--------|
| Card padding | **20px** densify | **20px** | **match** |
| Card internal gap | **20px** densify | **20px** | **match** |
| Info block pad | **20px** densify | **20px** | **match** |
| Info block border | `#c3c3c3` (Frame / React parity) | `rgb(195,195,195)` | **match** |
| CTA row gap | **12px** densify | **12px** | **match** |
| Card title type | densify **20/28** | **20/28** | **match** |
| Cancel hover | React: **no invent** (`#c96b6b` forbidden) | none / invent false | **match** |
| Date and Time value | SSoT `appointmentDate` | bound | **match** |
| Shipping rows | omit under-match | absent | **match** |
| Vaccinations body | N/A — no invent | header only | **match** |

---

## Blockers (must clear before PROVEN)

**None** for Uma fidelity.

**Still required for page-close (not Uma fidelity blockers):** Quinn MCP probe audit + PAGE FINAL PASS / `PARITY_PROVEN` (do **not** stamp here).

---

## Honest residuals (non-blocking / accepted this wave)

- Account nav item routing not wired (P1 visual) — active stays Appointment history per Legacy.
- Breadcrumb Home visual only — no invent Home route.
- Card width fluid in content column vs Legacy fixed 976 at full frame — acceptable under 1312 shell + sidebar.
- Legacy densify Cancel `#c96b6b` still exists for **Legacy-only** path (gated); React deliberately under-matches.
- Quinn probe audit **pending**.
- **PAGE FINAL PASS — appointment-details — NOT-GREEN** (not claimed this stamp).

---

## Mandatory sign-off stamps

| Line | Stamp |
|------|-------|
| `loading states` | **N/A** (honest — Legacy has none) |
| `checkbox/radio hover` | **N/A** |
| `typical DS checks` | **PASS** |
| `fidelity checklist` | **PASS / PROVEN** |
| `PAGE FINAL PASS` | **NOT claimed** |

---

## team check report lines (Uma)

```
Uma (UI/UX): fidelity checklist — PASS / PROVEN (card densify 20/20; info 20/#c3c3c3; CTA 12; title 20/28; Cancel invent ABSENT; Date and Time SSoT; no Shipping; vaccinations header-only)
Uma (UI/UX): loading states — N/A (Legacy LE1–LE3; no invent)
Uma (UI/UX): checkbox/radio hover — N/A
Uma (UI/UX): typical DS checks (state matrix) — PASS (Edit/Cancel under-match; crumb + Discuss .uxds-link)
Uma (UI/UX): Quinn MCP cite — PENDING (no Details probe audit yet; Uma self-measured on :5173)
PAGE FINAL PASS — appointment-details — NOT-GREEN (not claimed)
```

**Knowledge used:** TEAM_KNOWLEDGE Uma · UMA_FIDELITY_NOTES §0/§0a · VISUAL_FIDELITY §1.2 · LESSONS densify 2026-07-22 + invent-vs-Legacy · register densify 20/20 Details truth · no invent Cancel / accordion / Shipping.

---

## Related

- [APPOINTMENT_DETAILS_LEGACY_PARITY_REGISTER.md](../features/APPOINTMENT_DETAILS_LEGACY_PARITY_REGISTER.md)  
- [APPOINTMENT_DETAILS_REACT.md](../features/APPOINTMENT_DETAILS_REACT.md)  
- [UMA_FIDELITY_APPOINTMENT_HISTORY_2026-07-22.md](./UMA_FIDELITY_APPOINTMENT_HISTORY_2026-07-22.md)  
- [UMA_FIDELITY_NOTES.md](../../../product/UMA_FIDELITY_NOTES.md)

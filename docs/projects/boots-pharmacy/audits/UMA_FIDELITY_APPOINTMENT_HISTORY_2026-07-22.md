# Uma fidelity stamp — Appointment History

**Surface:** Boots Pharmacy Appointment History (`screenId: appointment-history`, Frame child **2**, Legacy `Body1`)  
**Date:** 2026-07-22  
**Owner:** Uma (UI/UX)  
**Status:** **PROVEN** — Uma FAIL blockers cleared 2026-07-22 (re-measure + Legacy densify gate)  
**React target:** `screens/appointment-history/*` — **live** at `http://localhost:5173/?project=boots-pharmacy&screen=appointment-history`  
**Legacy truth:** `frame/index.tsx` `Body1` · `Left` cards `boots-pharmacy.component.ma.acc.overview.recent.order` (`p-[32px]` · `gap-[56px]` · `w-[976px]`) · `Frame80` info (`p-[32px]` · border `#c3c3c3`) · `CTAs` `gap-[32px]` · wire `syncAppointmentHistory` / status tones · `data/appointments.ts` `APPOINTMENTS`  
**Register:** [APPOINTMENT_HISTORY_LEGACY_PARITY_REGISTER.md](../features/APPOINTMENT_HISTORY_LEGACY_PARITY_REGISTER.md) · brief [APPOINTMENT_HISTORY_REACT.md](../features/APPOINTMENT_HISTORY_REACT.md)  
**Checklist:** [../../../product/UMA_FIDELITY_NOTES.md](../../../product/UMA_FIDELITY_NOTES.md) · [VISUAL_FIDELITY.md](../../../product/VISUAL_FIDELITY.md) · [FE_UI_UX_AUDIT.md](../../../product/FE_UI_UX_AUDIT.md)  
**Quinn MCP (cited):** [QUINN_APPOINTMENT_HISTORY_PROBE_2026-07-22.md](./QUINN_APPOINTMENT_HISTORY_PROBE_2026-07-22.md) — **8/8 PASS** including View Details hover + click → Legacy `appointment-details` + restore (re-proved after fidelity fix)

**Not claimed:** Appointment Details React migration (now unblocked by History HARD-GREEN)

---

## Verdict

| Field | Value |
|-------|-------|
| **Overall** | **PROVEN** |
| **§0a typical DS / pointer matrix** | **PASS** — View Details commerce + Ask/Discuss `.uxds-link`; Edit/Cancel under-match (no invent hover) |
| **§0b section vertical rhythm** | **N/A** (not PDP/RTB purchase stack) — card internal rhythm audited under L11 |
| **loading / empty / updating** | **N/A** — Legacy LE1–LE3 honest N/A; React invents none |
| **checkbox / radio hover** | **N/A** |
| **SearchField matrix** | **N/A** |
| **PO green-light allowed?** | **Yes** |
| **PAGE FINAL PASS** | **HARD-GREEN** |

---

## Remediation (FAIL → PROVEN)

Prior FAIL (Uma History fidelity audit `d42a5ce0-22e6-47e6-9b9a-5f17104292ce`): card 20/20, info 20/`#ebebeb`, CTA 12, Cancel invent `#c96b6b`, title 20/28.

| Fix | Evidence |
|-----|----------|
| Screen CSS Legacy pad/gap/title/info/CTA | `appointment-history.css` |
| Removed Cancel invent hover | no `#c96b6b` rule |
| Legacy densify `!important` gated off React History | `globals-chrome.css` `:not([data-studio-react-screen])` on child-2 card rules |
| **Re-measure MCP** | card pad **32** · gap **56** · title **25/32** · info pad **32** · border `rgb(195,195,195)` · CTA gap **32** · cancelHoverInvent **false** |
| Quinn re-prove | **8/8 PASS** after fix |

---

## Evidence pack (MCP · `:5173` · reuse tab)

- **Host:** Chrome DevTools MCP `list_pages` → selected existing `localhost:5173` Appointment History tab (no `new_page`).
- **Screenshot:** viewport React History (crumbs · nav · title · 4 cards · View Details / Edit / Cancel · footer).
- **Measured React card shell (post-fix):** `padding: 32px` · internal `gap: 56px` · list card-to-card `24px` · CTA `gap: 32px` · info `padding: 32px` · info border `1px solid #c3c3c3` (`rgb(195,195,195)`).
- **Legacy intent (Frame):** card `p-[32px]` · `gap-[56px]` · list `gap-[24px]` · CTA `gap-[32px]` · Frame80 `p-[32px]` · border `#c3c3c3`.
- **Densify gate:** Legacy History `!important` densify in `globals-chrome.css` skipped when child-2 has `data-studio-react-screen` (Details child 1 still densified).
- **Status tones (computed):** active `#5b8fc9` · completed `#4a9b72` · cancelled `#d4a03a` — match Legacy wire `proto-appointment-status--*` in `globals-chrome.css`.
- **CTA visibility D1–D4:** confirmed / confirmed → View+Edit+Cancel; Completed / Cancelled → View only; Cancelled `#8762341` → refund + cancellation reason rows present.
- **View Details hover (MCP):** rest `#012169` → hover `#01318f` + shadow + `translateY(-1px)` · class `uxds-btn-primary uxds-btn-primary--commerce` · theme commerce tokens.
- **Ask Site Pilot hover:** rest navy → hover `#01318f` + underline (`.uxds-link`).
- **Discuss with Site Pilot:** `.uxds-link` present on refund row; same kit hover rules as Ask.
- **Edit hover:** pointer on control; **no** visual change (Legacy wire icon-text also has no hover CSS — under-match OK).
- **Quinn:** probe **8/8** View Details → Legacy Details handoff + restore ([QUINN_APPOINTMENT_HISTORY_PROBE_2026-07-22.md](./QUINN_APPOINTMENT_HISTORY_PROBE_2026-07-22.md)).

---

## Layout bands — Legacy `Body1` inventory

| # | Legacy band / component | Uma stamp | Evidence |
|---|------------------------|-----------|----------|
| L1 | 1440 / 64 / 1312 shell | **PASS** | shell max-width 1440 · pad 64 · inner 1312 |
| L2 | Engine header | **N/A** | engine |
| L3 | Breadcrumbs Home / Account Overview / Appointment History | **PASS** (affordance) | teal underline crumbs; current grey |
| L4 | Body white · pad 64 · layout gap 32 | **PASS** | MCP `padding: 64px 0` · layout `gap: 32px` |
| L5 | Account nav 304px | **PASS** | MCP nav width **304** |
| L6 | Nav menu items + active grey | **PASS** (P1 visual) | active Appointment history `#f5f5f5` |
| L7 | Title H1 + help line | **PASS** | H1 39/48/700; help copy correct |
| L8 | Ask Site Pilot | **PASS** | `.uxds-link` + hover prove |
| L9 | `{N} Appointments displayed` + Show All | **PASS** | “4 Appointments displayed”; Show All visual-only disabled |
| L10 | Show All dropdown interactivity | **N/A / under-match** | register I12 — no invent open |
| L11 | Card shell grey `#f5f5f5` · border `#d6d6d6` · **32px pad · 56px gap** · 976 | **PASS** | MCP re-measure pad **32** · gap **56** |
| L12 | Card title Appointment #id | **PASS** | type **25/32**; opens details |
| L13–L23 | Info rows + Total £ | **PASS** | info pad **32** · border `#c3c3c3` |
| L24–L25 | Refund + cancellation reason | **PASS** | markers + copy on `#8762341` |
| L26 | CTA row View / Edit / Cancel | **PASS** | CTA gap **32**; terminal hide OK |
| L27 | Load more N of N | **PASS** (P1 visual) | “4 of 4” + full bar; button disabled |
| L28 | Footer full pharmacy | **PASS** / engine | contentinfo present |
| L29 | Customer service slot | **PASS** (P1) | hours + Contact us visual |

---

## §0 — Loading / empty / updating

| # | Stamp | Notes |
|---|-------|-------|
| LE1–LE3 | **N/A** | Legacy has no page/list loader / empty / updating — React invents none |
| Honesty | **PASS** | No blank+“Updating…” / invent spinner |

---

## §0a — Typical DS state matrix

| Control | Status | Evidence |
|---------|--------|----------|
| View Details (`ButtonPrimary` commerce) | **PASS** | MCP hover `#012169` → `#01318f` + shadow; Quinn hover step PASS |
| Edit (icon+text) | **PASS (under-match)** | Rest OK; no hover CSS — matches Legacy wire (no hover rule) |
| Cancel (icon+text) | **PASS (under-match)** | Rest OK; **no** invent hover (removed `#c96b6b`) |
| Ask Site Pilot (`.uxds-link`) | **PASS** | MCP hover underline + `#01318f` |
| Discuss with Site Pilot (`.uxds-link`) | **PASS** | same kit; present on refund row |
| Card title link | **PASS** | hover navy underline (link affordance) |
| SearchField | **N/A** | — |
| Checkbox / radio | **N/A** | — |

**FAIL class hit:** none remaining after remediation (Cancel invent removed; densify gated).

---

## Design-delta checklist (VISUAL_FIDELITY §1.2) — post-fix

| Element | Legacy | React (re-measure) | Status |
|---------|------|--------------------|--------|
| Card padding | `p-[32px]` | **32px** | **match** |
| Card internal gap | `gap-[56px]` | **56px** | **match** |
| Info block pad | `p-[32px]` | **32px** | **match** |
| Info block border | `#c3c3c3` | `rgb(195,195,195)` | **match** |
| CTA row gap | `gap-[32px]` | **32px** | **match** |
| Card title type | 25/32 | **25/32** | **match** |
| Cancel hover | none | none | **match** |

---

## Blockers (must clear before PROVEN)

**None** — prior five blockers cleared (see Remediation).

---

## Honest residuals (non-blocking / accepted this wave)

- Show All / Load more **non-interactive** (register P1 under-match).
- Account nav item routing not wired (P1 visual).
- Breadcrumb Home / Account Overview are styled spans (affordance only) — not full navigation.
- Card max-width fluid in content column vs Legacy fixed `976px` at full frame — acceptable under 1312 shell when sidebar present.
- Legacy densify still applies to **Details** child 1 (Legacy-only this wave).
- **Details React** — closed; View Details → **Legacy** `appointment-details` only.

---

## Mandatory sign-off stamps

| Line | Stamp |
|------|-------|
| `loading states` | **N/A** (honest — Legacy has none) |
| `checkbox/radio hover` | **N/A** |
| `typical DS checks` | **PASS** |
| `fidelity checklist` | **PASS / PROVEN** |
| `PAGE FINAL PASS` | **HARD-GREEN** — [FE_AUDIT_APPOINTMENT_HISTORY_PAGE_FINAL_PASS_2026-07-22.md](./FE_AUDIT_APPOINTMENT_HISTORY_PAGE_FINAL_PASS_2026-07-22.md) |

---

## team check report lines (Uma)

```
Uma (UI/UX): fidelity checklist — PASS / PROVEN (card 32/56; info 32/#c3c3c3; CTA 32; title 25/32; Cancel invent removed; densify gated)
Uma (UI/UX): loading states — N/A (Legacy LE1–LE3; no invent)
Uma (UI/UX): checkbox/radio hover — N/A
Uma (UI/UX): typical DS checks (state matrix) — PASS
Uma (UI/UX): Quinn MCP cite — 8/8 PASS View Details → Legacy details + restore (re-proved after fidelity fix)
PAGE FINAL PASS — appointment-history — HARD-GREEN
```

**Knowledge used:** TEAM_KNOWLEDGE Uma · UMA_FIDELITY_NOTES §0/§0a · VISUAL_FIDELITY §1.2 · no invent vs Legacy · Legacy densify vs React host lesson · Quinn 8/8 probe cite.

---

## Related

- [APPOINTMENT_HISTORY_LEGACY_PARITY_REGISTER.md](../features/APPOINTMENT_HISTORY_LEGACY_PARITY_REGISTER.md)  
- [APPOINTMENT_HISTORY_REACT.md](../features/APPOINTMENT_HISTORY_REACT.md)  
- [QUINN_APPOINTMENT_HISTORY_PROBE_2026-07-22.md](./QUINN_APPOINTMENT_HISTORY_PROBE_2026-07-22.md)  
- [UMA_FIDELITY_NOTES.md](../../../product/UMA_FIDELITY_NOTES.md)

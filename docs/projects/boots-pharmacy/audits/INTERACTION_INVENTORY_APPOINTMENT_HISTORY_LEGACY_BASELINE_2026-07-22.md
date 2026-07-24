# Appointment History — Legacy interaction baseline (2026-07-22)

**Quinn (QA)** · Legacy-only · **not** React done

## Artifact

[`INTERACTION_INVENTORY_APPOINTMENT_HISTORY_LEGACY_BASELINE_2026-07-22.json`](./INTERACTION_INVENTORY_APPOINTMENT_HISTORY_LEGACY_BASELINE_2026-07-22.json)

Captured via `await window.__studioMapCurrentInteractions()` on  
`http://localhost:5173/?project=boots-pharmacy&screen=appointment-history` while the screen was still Legacy-hosted.

## Totals (class)

| Class | Count |
|---|---:|
| `ready-target` | 0 |
| `semantic-ready` | 38 |
| `visual-candidate` | 25 |
| `disabled` | 0 |
| `invalid` | 8 |
| **items** | **71** |

`pass=true` (no traversal errors) · `readinessPass=false` (**expected on Legacy** — duplicate CTAs / missing unique Studio hooks).

## View Details

- DOM selector: `[data-studio-appointment-view-details="true"]`
- Count: **4** × `BUTTON.proto-avail-btn-primary.proto-avail-btn-primary--sm` · label `View Details`
- Inventory targetIds: `button-4`, `button-6`, `button-8`, `button-11` · all `semantic-ready` / `missing-stable-target`
- Mapper cannot emit a unique `ready-target` selector for these (attr not in stableSelector set; 4 matches would fail uniqueness anyway)

## Card structure

- Legacy `data-name`: `boots-pharmacy.component.ma.acc.overview.recent.order`
- Clone marker: `data-studio-appointment-card-clone="true"` (cancelled card `#8762341`)
- CTA row siblings typically: **View Details** + Edit + Cancel (Edit/Cancel often `visual-candidate` nested divs; Studio hooks `[data-studio-appointment-edit="true"]` / `[data-studio-appointment-cancel="true"]` present on wired cards)
- Extra on cancelled: `.proto-appointment-refund-pilot-link` · “Discuss with Site Pilot”
- “Load more” appears as stacked `visual-candidate` layers

## How to reconcile post-React

1. ~~Mount React host~~ — **done** 2026-07-22 (`mountAppointmentHistoryScreen`).
2. Same URL → `await window.__studioMapCurrentInteractions()`.
3. Saved: [INTERACTION_INVENTORY_APPOINTMENT_HISTORY_REACT_2026-07-22.json](./INTERACTION_INVENTORY_APPOINTMENT_HISTORY_REACT_2026-07-22.json).
4. Diff vs this baseline: `readinessPass` **false → true**; `invalid` **8 → 0**; View Details still **4**.
5. Primary hooks keep `data-studio-appointment-view-details` (Quinn MCP 8/8). Unique `ready-target` per card still optional polish.
6. Unexplained target loss → blocks PAGE FINAL PASS.
7. Legacy `readinessPass=false` remains baseline evidence only.

## Blockers noted at capture

- Vite process (pid from long-running `npm run dev`) became unresponsive to fresh TCP connects mid-session; existing Chrome tab at `:5173` still had a live Legacy page and helpers — map was taken from that tab.
- No empty page; 4 appointment cards + View Details CTAs visible.
- `reactHost=false` confirmed.

**Knowledge used:** Quinn TEAM_KNOWLEDGE (MCP/inventory prove + fixed localhost) · INTERACTION_INVENTORY.md · PROOF_ROUTER.md.

# Appointment Details — Legacy interaction baseline (2026-07-22)

**Quinn (QA)** · Legacy-only · **not** React done · **not** PROVEN

## Artifact

[`INTERACTION_INVENTORY_APPOINTMENT_DETAILS_LEGACY_BASELINE_2026-07-22.json`](./INTERACTION_INVENTORY_APPOINTMENT_DETAILS_LEGACY_BASELINE_2026-07-22.json)

Captured via `await window.__studioMapCurrentInteractions()` on  
`http://localhost:5173/?project=boots-pharmacy&screen=appointment-details` while the screen was still Legacy-hosted.

Selection: appointment **#1411527** (History → View Details / deep-link with live Legacy content).

## Totals (class)

| Class | Count |
|---|---:|
| `ready-target` | 0 |
| `semantic-ready` | 29 |
| `visual-candidate` | 10 |
| `disabled` | 0 |
| `invalid` | 3 |
| **items** | **42** |

`pass=true` (no traversal errors) · `readinessPass=false` (**expected on Legacy** — Edit/Cancel missing unique Studio ready-target selectors).

## Host state

- `hostState`: **Legacy (no React host for appointment-details)**
- `reactHost=false` · `reactMigrationClaim=false`
- Surface: `appointment-details`

## Key CTAs / selectors

| Role | Selector / target | Notes |
|---|---|---|
| **Edit** | `[data-studio-appointment-edit="true"]` | 1× live `DIV` · `data-name="component.input.button"` · inventory layers `div-33` / `div-36` / `p-37` · `visual-candidate` / `missing-stable-target` |
| **Cancel** | `[data-studio-appointment-cancel="true"]` | 1× live `DIV` · same Legacy button shell · inventory `div-38` / `div-40` / `p-41` · `visual-candidate` |
| **Back** | breadcrumb **Appointment history** | inventory `p-2` · `semantic-ready` · `role=link` · no stable `data-studio-*` selector |
| **View Details** | `[data-studio-appointment-view-details="true"]` | **0 live** on Details · **1 ghost** `BUTTON.proto-avail-btn-primary--sm` `display:none` (History leftover) |
| Ask Site Pilot | — | **absent** on #1411527 Details |

### playbackSelectors

```json
{
  "edit": "[data-studio-appointment-edit=\"true\"]",
  "cancel": "[data-studio-appointment-cancel=\"true\"]",
  "viewDetails": "[data-studio-appointment-view-details=\"true\"]",
  "backBreadcrumbName": "Appointment history"
}
```

## detailsRelevantTargets (page-relevant)

- Boots Pharmacy home · Home · Appointment history (back)
- `1411527` (appt id visual-candidate)
- Edit ×3 nested layers · Cancel ×3 nested layers

Invalids (3): unnamed Edit icon shell (`div-34`, `svg-35`) + `[data-name="icon=cancel"]`.

## Ghosts

- **1** History `View Details` button with `data-studio-appointment-view-details="true"` remains in DOM at `display:none` / 0×0 — **do not** count as Details CTA (Legacy-ghost lesson).

## How to reconcile post-React

1. Mount React host for `appointment-details` with a selected appointment.
2. Same URL → `await window.__studioMapCurrentInteractions()`.
3. Save React map beside this baseline with dated filename.
4. Diff totals + named CTAs: Edit / Cancel / Appointment history back / breadcrumbs / Ask Site Pilot if present.
5. Require `readinessPass=true` for primary Studio hooks.
6. Unexplained target loss or missing Edit/Cancel → blocks PAGE FINAL PASS.
7. Legacy `readinessPass=false` remains baseline evidence only — **not** a React FAIL and **not** PROVEN.

## Blockers noted at capture

- None for inventory download. Vite `:5173` live tab reused (R11).
- Details content confirmed (#1411527 + Edit/Cancel visible).
- No React mount performed.

**Knowledge used:** Quinn TEAM_KNOWLEDGE (MCP/inventory prove + fixed localhost R11) · INTERACTION_INVENTORY.md · LESSONS overlay eyes / Legacy ghosts / false PROVEN without MCP.

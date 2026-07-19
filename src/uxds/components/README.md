# UXDS React components

Visual modules mapped to UXDS `component.*` / `module.*` names. Grow by use — do not mirror the whole Figma library.

| Module | UXDS name | Notes |
|--------|-----------|-------|
| `ButtonPrimary` | `component.input.button` | Token-backed primary CTA + Make hover/active lift (`button-primary.css`) |
| `SearchField` | `component.input.field` | Pill search/text field — label/hint, icon `start`\|`end`, single clear (`search-field.css`) |
| `BookAppointmentProgress` | `component.book.appointment.progress` | Shared 3-step booking progress (Steps 1–3) |
| `AppointmentSummaryPill` | `Week Schedule` + Change tertiary | Summary rows; optional Change icon+text |
| Filter chip styles | `uxds.interaction.filter-chip` | Baseline chip chrome + hover in `filter-chip.css` (screens remap) |
| Text link | `.uxds-link` | Regular navy links — underline on hover (`text-link.css`); aliases `.proto-avail-link` |

Pair with behavior kits under `../interactions/`. See [docs/uxds/COMPONENTS.md](../../../docs/uxds/COMPONENTS.md).

Kit CSS stays small and co-imported from `src/styles/index.css` — not a per-screen Make monster sheet.

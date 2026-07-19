# Book Step 2 — Make vs React design delta

**Status:** Pilot ship (2026-07-19)  
**Source of truth:** Make Frame child **4** (`Body3` / `ComponentAppointmentSummary1`) + live wire calendar CSS in `globals-screens.css`.  
**React:** `src/projects/boots-pharmacy/screens/book-step-2/`  
**Rule:** Visual fidelity > inventing UXDS-looking backgrounds. See [VISUAL_FIDELITY.md](../../product/VISUAL_FIDELITY.md) §1.2.

---

## Page template

Same Boots content grid as Step 1: shell **1440 / 64** → inner **1312**; body fill white + decorative PNG @ **0.31**; card/progress **863px**.

---

## Parity table (summary)

| Element | Make / wire | React | Status |
|---------|-------------|-------|--------|
| Progress | Step 1 completed teal; Step 2 active navy; Step 3 white | Same + wire step-back on “Choose Location” | **match** |
| Summary pills | Vaccine / Recipient / Location + Change tertiary | Same kits language as Step 1 | **match** |
| Notice | `#c4dde3` 28-day message | Same | **match** |
| Month calendars | June + July side-by-side, 32px cells | Same grid + `data-studio-cal-*` | **match** |
| Today (12 Jun) | Wire `data-studio-cal-today` grey ring | Same + tooltip | **match** |
| Selected date/time | `#c6e5e1` + bold 13px | Page CSS (not LEGACY) | **match** |
| Time bands | Morning / Afternoon / Evening | Make availability (15:15+) | **match** |
| Date heading | `Wednesday, 24th June 2026` (wire SOT; Figma said Thursday) | `formatBookStep2Heading` | **match** (wire) |
| Reserve CTA | Navy commerce pill | `ButtonPrimary` + `--commerce` | **match** |
| Proto header/footer | Studio mounts | Intentional (same as Step 1) | **intentional** |
| Figma cursor demos | Removed by wire | Not rendered | **intentional** |

---

## Studio hooks preserved

- `calendar. date. cell` + `data-studio-cal-kind|value|month|selected|available|unavailable|today`
- `component.book.appointment.progress` (+ wire `data-studio-book-step-back` on step 1)
- `component.input.button` (Change / Reserve)
- `component.appointment.summary`, `Week Schedule`, breadcrumbs
- Host `[data-studio-react-screen="book-step-2"]`

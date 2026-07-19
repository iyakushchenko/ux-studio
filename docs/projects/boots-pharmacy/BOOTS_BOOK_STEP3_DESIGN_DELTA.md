# Book Step 3 — Make vs React design delta

**Status:** Pilot ship (2026-07-19)  
**Source of truth:** Make Frame child **3** (`Body2` / `ComponentAppointmentSummary`) + wire Advantage / Open Appointments patches.  
**React:** `src/projects/boots-pharmacy/screens/book-step-3/`  
**Rule:** Visual fidelity > inventing UXDS-looking backgrounds. See [VISUAL_FIDELITY.md](../../product/VISUAL_FIDELITY.md) §1.2.

---

## Page template

Same Boots content grid as Steps 1–2: shell **1440 / 64** → inner **1312**; body fill white + decorative PNG @ **0.31**; card/progress **863px**.

---

## Parity table (summary)

| Element | Make / wire | React | Status |
|---------|-------------|-------|--------|
| Progress | All three bars teal; step 3 bold; no back-nav | Same; `pointer-events: none` | **match** |
| Headline + OK accent | “Appointment reserved!” + yellow circle check | Same | **match** |
| Email notice | `#c4dde3` banner | Same | **match** |
| Summary rows | Vaccine / Recipient / Location / Date and Time (no Change) | Props from wire state | **match** |
| Order summary | Subtotal / discount / booster / delivery / tax / total | `computeOrderPricing` | **match** |
| Contact / pay meta | Static Sarah demo copy | Contract constants | **match** |
| Advantage Card | Wire-patched rows + card image | Built-in layout (no LEGACY) | **match** |
| Explore / Calendar CTAs | Navy commerce pills | `ButtonPrimary` + `--commerce` | **match** (Calendar inert as Make) |
| Open Appointments | Tertiary icon+label; AIR `data-studio-open-appointment` | Same hook | **match** |
| Proto header/footer | Studio mounts | Intentional | **intentional** |

---

## Studio hooks preserved

- `component.appointment.summary`, `component.co.order.summary`, `component.book.appointment.progress`
- `data-studio-open-appointment="true"` (playback `confirmation-open-appointments`)
- `component.input.button` (Explore / Calendar)
- Host `[data-studio-react-screen="book-step-3"]`

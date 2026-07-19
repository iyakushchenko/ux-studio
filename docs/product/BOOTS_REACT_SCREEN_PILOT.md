# Boots React screen pilot — Book Step 1 (Location)

**Status:** Shipped (commander, mode B — from what we have)  
**Date:** 2026-07-19  
**Screen:** Book — Step 1 — Location (`PROTO_SCREENS` tab 5, Frame child index **7**)

---

## Why this screen

| Criterion | Rationale |
|-----------|-----------|
| CJM path | On Sarah **Traditional CJM** (`choose-location` / `book-location-pick`) |
| Proof value | First full-page React + UXDS replacement in the booking funnel |
| Feasible scope | Search, near-me chip, chosen store, CTAs, booster, progress — no calendar |
| Sprawl cut | Retires Make DOM cloning of Guide map / store card for this step |

Agentic CJM still lands on Book Step 2 after Availability Tool; this pilot proves the traditional booking entry and shared Studio wiring.

---

## What was reused

- UXDS tokens + Boots `styleguide/theme.css`
- `ButtonPrimary`, `FilterChip` / `FilterChipGroup`, `Disclosure`
- Existing `AvailabilityTool` for location pick (unchanged overlay)
- Vaccine / recipient popups (same wire state)
- Sticky Proto header + ProtoFooter mounts
- Stable `data-name` hooks for playback (`component.input.field`, `.proto-chosen-slot`, Continue button, progress)

---

## Make vs React (current)

| Screen | Stack |
|--------|--------|
| **Book Step 1 — Location** | **React + UXDS** (Make HTML hidden for this child only) |
| **Book Step 2 — Date and Time** | **React + UXDS** (Make HTML hidden for Frame child **4** only) |
| **Book Step 3 — Confirmation** | **React + UXDS** (Make HTML hidden for Frame child **3** only) |
| All other Boots screens | Make wire (+ overlays/popups as before) |
| Availability Tool | React overlay (prior enrichment) |

---

## Parity table — Make Book Step 1 → React (2026-07-19)

Status: **OK** = matches Make; **Partial** = works with known delta; **Gap** = still missing.

### Behaviors / scripts

| Make behavior | React status | Notes |
|---------------|--------------|-------|
| Search opens Availability (list) | OK | `onOpenSearch` → `openPickLocations("list")` |
| Near-me opens Availability (map) | OK | `onOpenNearMe` → `openPickLocations("nearMe")` |
| Continue gated: no store → Availability + `locationRequired` | OK | `onContinue` checks `chosenLocationRef` |
| Continue with store → Book Step 2 | OK | `setCurrent(5)` |
| Change vaccine / recipient | OK | Opens existing pickers |
| Change location (chosen card) | OK | Re-opens Availability list |
| Booster checkbox toggle | OK | React state; `data-proto-react-owned` skips Make mutators |
| Learn more disclosure | OK | UXDS `Disclosure` kit |
| Breadcrumb Home → Site Pilot Home | OK | Wire click delegation on crumbs |
| Availability choose store → chosen card + map | OK | Existing overlay callback |
| Chosen map drag / pin (Make page map) | Partial | Static chosen map image on React; full map UX stays in Availability Tool |

### Visual L&F

| Make chrome | React status | Notes |
|-------------|--------------|-------|
| Progress 16px + teal/#fff bars | OK | `book-step1__progress*` |
| Pill search 360 / `#c3c3c3` | OK | `book-step1__search` |
| Summary pills + Change | OK | Vaccine / Recipient |
| Near-me tertiary control | OK | FilterChip remapped to tertiary look |
| Chosen store tile + map asset | OK | `.proto-chosen-slot` class kept |
| Booster checkbox 24px Make colors | OK | Unchecked `#c3c3c3`; hover `#c6e5e1`; checked `#afccca` / mark `#305854` |
| Continue navy primary | OK | `ButtonPrimary` + Boots theme |
| Help footer links | OK | Tel + hours copy |

### Hover / focus / active

| Control | React status | Migrated treatment |
|---------|--------------|--------------------|
| Primary Continue | OK | UXDS `button-primary.css`: darken `#01318f`, lift shadow, active `#011a5c` |
| Search field | OK | Inset navy ring (same as Make / `.proto-avail-field`) |
| Near-me | OK | Tertiary: no wash; label → black; pin → navy filter |
| Change / Change location | OK | Tertiary: no wash; label → black; edit glyph → navy |
| Booster checkbox | OK | Unchecked hover mint fill; checked stays `#afccca` |
| Crumb Home / Learn more / help links | OK | Crumb: teal `#305854` (own crumb language). Learn more + help tel: `.uxds-link` footer-like (navy, no underline rest → underline hover) |
| Availability Tool CTAs / chips / List\|Map / fields | OK | Already in `globals-screens.css` `.proto-avail-*` (+ chip hover mint language) |

### Studio wiring (`data-name` / hooks)

| Hook | React status |
|------|--------------|
| `component.input.field` (search) | OK |
| `component.input.button` (CTAs / Change / near-me) | OK |
| `component.input.checkbox` + `data-proto-booster` + `data-proto-react-owned` | OK |
| `component.book.appointment.progress` | OK |
| `.proto-chosen-slot` / store block | OK |
| `module.breadcrumbs` / `component.breadcrumbs` | OK |
| `data-proto-change-loc` | OK |
| Host `[data-proto-react-screen="book-step-1"]` | OK |

---

## Visual fidelity (required for pilots)

Unless PO explicitly asks to upgrade the look, React screen pilots must stay **visually close to the source concept / Make page** being replaced — layout, type, colors, radii, progress, inputs, CTAs. Prefer matching the computed Make+wire look over inventing a cleaner “DS” treatment.

Book Step 1 targets (child 7):

- Progress = Make `component.book.appointment.progress` instance (16px labels; active navy bold + `#c6e5e1` flat bar; inactive white bar)
- Search = Make pill field (`border-radius: 360px`, `#c3c3c3` border, icon right, wire placeholder)
- Near-me / summary pills / Continue = Make spacing and colors as-is

---

## PO verify on localhost

1. `npm run dev` → http://localhost:5173/
2. Open **Boots Pharmacy** → nav tab **Book - Step 1 - Location** (or Traditional CJM → after PDP/login).
3. Confirm React card matches Make look (progress teal underline, pill search, near-me, Continue); Make absolute layout gone for this tab.
4. Search or Near me → Availability Tool → choose Covent Garden → chosen card + map.
5. Continue → Book Step 2 (React) — pick date/time → Reserve → Step 3 (Make).
6. Optional: play Traditional CJM through `choose-location` / `book-step2*` beats.

---

## Code

- `src/projects/boots-pharmacy/screens/book-step1/BookStep1LocationScreen.tsx`
- `src/projects/boots-pharmacy/screens/book-step1/mountBookStep1Screen.tsx`
- `src/projects/boots-pharmacy/screens/book-step2/BookStep2DateTimeScreen.tsx`
- `src/projects/boots-pharmacy/screens/book-step2/mountBookStep2Screen.tsx`
- Wire mount in `BootsPharmacyProjectView.tsx`

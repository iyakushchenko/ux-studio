# Interaction fidelity — recording prerequisite & shared behavior library

**Status:** Locked (Product Owner directive, 2026-07-19)  
**Audience:** Every agent building or enriching concept pages; Product Owner for the product rule.  
**Commander decision (code home):** Shared interaction kit lives at **`src/uxds/interactions/`** (behavior kits) composed with visual modules under **`src/uxds/components/`** as those land. See §5.

---

## 1. Product rule (KEY)

**Recording depends on page fidelity.**

Recording can only capture what the page can actually do. If a screen lacks interactive components, the Product Owner **cannot** record a meaningful journey on it.

Before anyone expects to record:

1. Pages need the **interactive logic** the scenario requires — where links/CTAs lead, on-page controls that work (e.g. PLP filters with substantial internal logic even when they do not navigate elsewhere).
2. The agent builds that interactivity **before** treating recording as ready.
3. PO will rely heavily on **agentic workflow** to enrich pages (new concepts **and** pages already in place, including Boots Legacy wire when those screens are touched).

```
Page context (± CJM deck later)
        ↓
Agent: anticipated interactivity (shared kit + UXDS modules)
        ↓
Playable page fidelity
        ↓
Recording / replay / CJM proof
```

---

## 2. What the agent must build before recording

### 2.1 From page context (always)

Infer planned user actions from the frame / existing wire:

| Signal | Build |
|--------|--------|
| Links, CTAs, nav items | Destinations (screen registry / in-app routes) or honest disabled/placeholder states — never dead clicks that look live |
| Filters, sorts, accordions, tabs | Working on-page state (fake data OK) |
| Forms, steppers, modals | Open/close, validation light-touch, step advance |
| Sticky bars, drawers, flyouts | Show/hide + primary actions wired |

Hypothesis proof does **not** require real backends ([SOLUTION_REQUIREMENTS.md](./SOLUTION_REQUIREMENTS.md) §2.3). It **does** require controls that respond like a site.

### 2.2 From CJM deck later (when PO points at one)

When the PO supplies a CJM deck, treat it as **requirements input**:

- Derive the user actions the journey will need.
- Turn those into solid dev requirements for scripts/behaviors **and** for page interactivity gaps.
- Prefer filling gaps with the **shared interaction library** (§4), not one-off screen scripts.

Until a CJM deck is attached, page context alone is enough to anticipate the happy-path controls.

### 2.3 Enrichment applies to existing pages

Same rule when enriching Boots Legacy wire or any in-place screen: if we touch it for recording or journey work, raise interaction fidelity toward the shared kit — do not pile more permanent one-off imperative scripts.

### 2.4 React rebuild = behavior parity (locked — PO)

When a Legacy / concept screen is rebuilt in React, **migrate every interaction that already worked** on the prior page (checkbox/booster toggle, Continue gating, search + near-me openers, Change links, breadcrumbs, etc.).

- Do **not** ship a static visual shell that drops handlers.
- Prefer React props + `src/uxds/interactions/` kits; mark React-owned rows (`data-studio-react-owned` / host `[data-studio-react-screen]`) so Legacy global input mutators do not fight React state.
- Retire a behavior only when the PO explicitly asks.
- **Also migrate hover / focus / active** from Legacy CSS (`:hover`, transitions, underline/fill changes) into kit CSS (`src/uxds/components/`) or co-located screen CSS — flat dead controls fail interaction fidelity even when click handlers work.

Visual L&F + this parity rule: [VISUAL_FIDELITY.md](./VISUAL_FIDELITY.md) §1.1. Book Step 1 checklist: [BOOTS_REACT_SCREEN_PILOT.md](../projects/boots-pharmacy/BOOTS_REACT_SCREEN_PILOT.md).

---

## 3. Anti-sprawl (main engineering concern)

**Gigantic custom scripts must not grow exponentially.**

| Prefer | Avoid |
|--------|--------|
| Typical library for common website scenarios | Per-screen reinvented accordion / dropdown / filter |
| React state + UXDS / internal modules | Large imperative DOM scripts duplicated per page |
| Shared behavior kits (open/close, select, filter apply) | Copy-paste handlers that diverge per concept |
| Grow the kit when a gap appears | One-off “just for this PLP” monsters |

**Anti-pattern:** one-off imperative scripts per screen that duplicate design-system behavior (accordions, selects, form fields, modals, etc.). That path does not scale across concepts.

---

## 4. Shared interaction library strategy

### 4.1 Stack

- **React** interactivity and motion for common patterns.
- **UXDS** Figma masters (`component.*` / `module.*`) for visual + semantic slots — see [../uxds/COMPONENTS.md](../uxds/COMPONENTS.md).
- **Internal ready React modules** under `src/uxds/` — thin, grown by use ([SOLUTION_REQUIREMENTS.md](./SOLUTION_REQUIREMENTS.md) §2.7).
- Project brand stays in `styleguide/theme.css` ([PROJECT_STYLEGUIDE.md](./PROJECT_STYLEGUIDE.md)).

### 4.2 Catalog of typical patterns (grow as needed)

| Pattern | Notes |
|---------|--------|
| Accordion / disclosure | Expand/collapse; optional single-open |
| Select / dropdown | Open list, choose, close; keyboard later |
| Tabs | Panel switch with stable ids |
| Modals / drawers / flyouts | Open/close, focus trap light-touch later |
| Form fields | Controlled inputs, light validation |
| Filters (PLP-class) | Facet state, apply/clear, list refresh (in-memory) |
| Sticky bars / CTAs | Show on scroll or step; primary action wired |
| Steppers / wizards | Step index + next/back |
| Toast / inline feedback | Non-blocking confirmations |

Pages **compose** these kits; they do not reimplement them.

### 4.3 Relationship to Studio wiring

Shared modules still expose stable hooks for recording/playback:

- `data-name`, `data-studio-*` as in [../shell/RECORDING.md](../shell/RECORDING.md)
- Screen registry + journey beats per [PAGE_BUILD_CONTRACT.md](./PAGE_BUILD_CONTRACT.md)
- Native/ARIA action semantics (`button`, `a[href]`, roles) and observable state (`checked`, `aria-checked`, `aria-selected`, stable state hooks). A large decorative wrapper is not a target merely because it has a box.
- Idempotent selected options (current date/time/tab/radio) are not valid targets. Toggle controls remain actionable because off/on is a real state transition.
- Stateful clicks pass only when state changes. Cursor-on-target without checkbox/radio/selection change is a hard diagnostic failure.

---

## 5. Target code home (commander decision)

| Path | Role |
|------|------|
| **`src/uxds/interactions/`** | **Shared behavior kits** — React hooks/components for typical patterns (§4.2). Start here for accordion, select, filters, etc. |
| **`src/uxds/components/`** | Visual React modules mapped 1:1 to UXDS `component.*` / `module.*` as screens need them |
| `src/projects/<id>/` | Page composition, project-only glue, brand `styleguide/` — **not** a dumping ground for duplicate DS behavior |

**Landed (thin):** accordion, disclosure, filter-chip kits under `src/uxds/interactions/` — first consumer: Boots Availability Tool (hours disclosure + list filter chips). Grow as pages need more patterns.

Engine-only bridges (`src/app/`) remain for playback/recording — not for reinventing site UI patterns.

---

## 6. When this applies

| Situation | Expectation |
|-----------|-------------|
| **New concepts** | Build anticipated interactivity as part of page intake ([CONCEPT_INTAKE.md](./CONCEPT_INTAKE.md)) |
| **Enriching in-place pages** | Same fidelity bar before calling recording “ready” |
| **Boots Legacy wire** | When touching a screen, prefer shared kit / React path over growing Legacy-era scripts |
| **Recording session** | Blocked (product sense) until required controls work — see [../shell/RECORDING.md](../shell/RECORDING.md) |

---

## 7. Relationship to other doctrine

| Doc | Relationship |
|-----|----------------|
| [COMMAND_DOCTRINE.md](./COMMAND_DOCTRINE.md) | Standing tech: shared interaction kit; agent builds fidelity without asking PO to pick libraries |
| [SOLUTION_REQUIREMENTS.md](./SOLUTION_REQUIREMENTS.md) | Locked default §2.3 + readiness: interactivity before record |
| [PAGE_BUILD_CONTRACT.md](./PAGE_BUILD_CONTRACT.md) | Page checklist includes interaction + library reuse |
| [VISUAL_FIDELITY.md](./VISUAL_FIDELITY.md) | Kits must **look** like the concept — same active language, control hierarchy; no visual zoo |
| [CONCEPT_INTAKE.md](./CONCEPT_INTAKE.md) | Enrichment / fidelity gap is part of intake craft |
| [PROJECT_STYLEGUIDE.md](./PROJECT_STYLEGUIDE.md) | Brand delta only — behavior kits stay in `src/uxds/interactions/` |
| [../shell/RECORDING.md](../shell/RECORDING.md) | Prerequisite: page interactivity first |
| [../uxds/COMPONENTS.md](../uxds/COMPONENTS.md) | Components carry **behavior**, not just visuals |
| [PRODUCT_OWNER_BRIEF.md](./PRODUCT_OWNER_BRIEF.md) | PO-facing note + decisions log |

---

## 8. Agent checklist (before “ready to record”)

1. List actions a PO would click/type on this screen for the hypothesis (or CJM deck).  
2. Map each action → shared kit pattern or gap to add to `src/uxds/interactions/`.  
3. Wire CTAs/links to real Studio destinations or explicit non-interactive treatment.  
4. Prefer React + UXDS modules over new imperative screen scripts.  
5. Confirm browse + at least the happy-path controls respond.  
6. Run **Map current page interactions**; resolve invalid contracts and explicitly classify decorative candidates ([INTERACTION_INVENTORY.md](./INTERACTION_INVENTORY.md)). For Legacy → React work, compare against the pre-migration inventory and reject unexplained target loss.
7. Then record / ask PO to record.

---

## Related

- [PAGE_BUILD_CONTRACT.md](./PAGE_BUILD_CONTRACT.md)  
- [VISUAL_FIDELITY.md](./VISUAL_FIDELITY.md)  
- [CONCEPT_INTAKE.md](./CONCEPT_INTAKE.md)  
- [SOLUTION_REQUIREMENTS.md](./SOLUTION_REQUIREMENTS.md)  
- [../shell/RECORDING.md](../shell/RECORDING.md)  
- [../uxds/COMPONENTS.md](../uxds/COMPONENTS.md)

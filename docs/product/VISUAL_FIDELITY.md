# Visual fidelity — concept L&F is mandatory

**Status:** Locked (Product Owner directive, 2026-07-19)  
**Audience:** Every agent rebuilding or enriching concept UI.  
**Companion:** Interaction behavior → [INTERACTION_FIDELITY.md](./INTERACTION_FIDELITY.md). This doc is **look & feel**; rebuilds also require **behavior parity** (§1.1).  
**DS craft:** [DS_STRICTNESS.md](./DS_STRICTNESS.md) — no near-duplicate styles; pages use UXDS + theme only; deviations registered.

---

## 1. Product rule (KEY)

**Source concept look & feel is mandatory** for rebuilt and enriched UI.

Placement, hierarchy, control families, radii, spacing, and active/inactive treatments must follow the source concept (Legacy / live wire / PO frame). Aesthetic “upgrades” toward a cleaner generic design-system look are **not** allowed unless the PO explicitly asks.

```
Source concept (Legacy / live CSS / PO frame)
        ↓
Measure original chrome (colors, sizes, hierarchy)
        ↓
React + UXDS structure under the hood (tokens / kits)
        ↓
Project theme remaps brand colors (optional)
        ↓
Visible UI still reads as THAT concept
```

UXDS is for **structure and reuse**. Brand may remap UXDS **color tokens** via the project theme. Neither licenses a redesign of chrome. **One pattern per role** — do not invent parallel selected/hover languages for the same control on different screens ([DS_STRICTNESS.md](./DS_STRICTNESS.md)).

### 1.1 Behavior parity (locked — PO)

**Screen rebuild = visual fidelity + behavior parity** with the prior Legacy / concept page.

| Must migrate | Must not |
|--------------|----------|
| Every scripted interaction that already worked (checkbox toggle, Continue gating, search open, near-me, Change links, breadcrumbs, etc.) | Ship a prettier/static React shell that drops click/toggle/enable behavior |
| Wire equivalent handlers on the React screen (props + shared kits) | Assume Legacy DOM listeners still cover a retired Legacy body |
| Skip Legacy global input mutators for React-owned rows (`data-studio-react-owned` / `[data-studio-react-screen]`) | Let Legacy `ensureCheckboxRow` / capture-click handlers fight React state |

Retire a behavior only when the PO explicitly asks. See [INTERACTION_FIDELITY.md](./INTERACTION_FIDELITY.md) §2.3 and [PAGE_BUILD_CONTRACT.md](./PAGE_BUILD_CONTRACT.md) §5–6.

### 1.2 Design-delta checklist (locked — PO)

**Every React / UXDS rebuild PR must include a written design-delta checklist** (table or equivalent) comparing Legacy / live wire **computed** styles to the rebuild — **before or with the PR**, not after ship.

| In scope (must not slip) | Examples |
|--------------------------|----------|
| **Page / section background fills** | Solid colors, gradients, decorative images, opacity, object-position, full-bleed bands |
| Header / body / footer region fills | Navy header, white crumbs, dark footer, body wash |
| Control chrome | Radii, borders, shadows, active/inactive fills, hover/focus |
| Type + spacing | Family, size, weight, color, line-height, padding, max-widths, gaps |
| Layout structure | Side-by-side vs stacked, alignment, sticky mounts |
| **Page template / content column** | Shell max-width, side padding, logo-edge alignment for crumbs + main ([FE_STANDARDS.md](./FE_STANDARDS.md) §2) |
| **Icon+text CTAs** | Single-line nowrap; label must not wrap under icon ([FE_STANDARDS.md](./FE_STANDARDS.md) §1) |
| **Tertiary icon language** | Sibling icon+text CTAs share one treatment; pick a baseline control when merging ([FE_STANDARDS.md](./FE_STANDARDS.md) §1.1) |

**Details must not slip through cracks.** Flat white substituting for a concept fill image is a **defect**, not an acceptable “simpler DS” choice. Prefer matching Legacy computed styles exactly; do not invent UXDS-looking backgrounds.

Minimum checklist columns: **Element | Legacy (value/source) | React (current) | Status (match / gap / intentional) | Fix plan**.

Reference example: [BOOTS_BOOK_STEP1_DESIGN_DELTA.md](../projects/boots-pharmacy/BOOTS_BOOK_STEP1_DESIGN_DELTA.md).

---

## 2. No visual zoo

Within a surface, **reuse the same active/inactive language** for similar controls.

| Do | Do not |
|----|--------|
| Match mint/teal active fill already used on that surface (inspect original CSS) | Invent a parallel selected style (`#afccca` badge vs `#c6e5e1` toggle on the same header) |
| One family of borders, hover washes, radii for a control class | Mix pill radii, fills, and borders that compete on one strip |
| Override UXDS defaults when they diverge from concept chrome | Ship default UXDS chip/badge colors when the concept already defined the language |

**Anti-pattern:** List/Map uses concept mint active; secondary filter pills use a different selected fill from UXDS badge tokens → mismatched “zoo.”

---

## 3. Open to new ideas — join the language

New elements and enrichment are welcome when the page needs them (filters, toggles, feedback). They must:

1. **Join** the existing visual language (same active mint, borders, hover wash, type scale family).
2. **Not compete** with primary chrome (no louder fill, heavier weight, or novel accent ramp).
3. Be measured from concept CSS / sibling controls on the same surface — do not invent a third palette.

---

## 4. Control hierarchy

| Tier | Role | Visual weight |
|------|------|----------------|
| **Primary chrome** | View mode, main nav within the tool (e.g. List \| Map) | Stronger: larger hit area, fuller active fill, higher contrast label |
| **Secondary selectors** | Facet / quick filters (e.g. All locations / Slots available) | More **mini**, **lower contrast** inactive text/border; same active **color language**, lighter typographic weight |

Hierarchy: **primary chrome > secondary filters**. Secondary controls must not out-shout primary ones.

---

## 5. Brand vs chrome

| Allowed | Not allowed |
|---------|-------------|
| Remap UXDS semantic **colors** in `styleguide/theme.css` (variables only) so badges/buttons carry brand teal/navy | Redesign radii, progress bars, search pills, toggle families to “look more DS” |
| Shared components consume `var(--uxds-…)` so theme-off still uses UXDS baselines | Hardcoded brand hex inside shared kit CSS (except UXDS `:root` baselines) |
| Document PO-approved visual deltas / registered deviations | Quietly “improve” concept chrome or anonymous page color forks |

**Theme off:** remove `data-studio-project` and/or skip project `theme.css` import — UI must still look correct on UXDS defaults. See [DS_STRICTNESS.md](./DS_STRICTNESS.md) §3.

See [PROJECT_STYLEGUIDE.md](./PROJECT_STYLEGUIDE.md) and Boots [styleguide/README.md](../../src/projects/boots-pharmacy/styleguide/README.md).

---

## 6. Agent checklist (before calling a rebuild “done”)

1. Identify source concept controls **and page fills** on the surface (Legacy / live wire CSS).  
2. Write the **§1.2 design-delta checklist** (backgrounds/fills explicitly inventoried).  
3. List active/inactive colors, hover, radii, sizes for **primary** chrome.  
4. Any new or UXDS-wrapped control uses that **same active language** — not a default badge/chip palette.  
5. Secondary selectors are smaller / quieter than primary chrome.  
6. No competing pill styles on the same strip.  
7. Brand theme remaps colors only; chrome shape/hierarchy still matches concept.  
8. Close every **gap** row or mark **intentional** with PO rationale — do not leave silent omissions.  
7. Migrate Legacy `:hover` / `:focus-visible` / `:active` (and transitions) into kit or co-located screen CSS — do not leave flat CTAs/inputs/chips.  
8. Record Legacy → React status in a parity table for the pilot screen (see [BOOTS_REACT_SCREEN_PILOT.md](../projects/boots-pharmacy/BOOTS_REACT_SCREEN_PILOT.md)).

---

## 7. Relationship to other doctrine

| Doc | Relationship |
|-----|----------------|
| [PAGE_BUILD_CONTRACT.md](./PAGE_BUILD_CONTRACT.md) §5 | Points here for the full visual rule |
| [CONCEPT_INTAKE.md](./CONCEPT_INTAKE.md) | Intake craft preserves concept L&F while upgrading structure |
| [INTERACTION_FIDELITY.md](./INTERACTION_FIDELITY.md) | Behavior kits work; **this doc** covers how they look |
| [PROJECT_STYLEGUIDE.md](./PROJECT_STYLEGUIDE.md) | Brand color/logo delta only |
| [DS_STRICTNESS.md](./DS_STRICTNESS.md) | No near-duplicates; theme optional; deviations registry |
| [PRODUCT_OWNER_BRIEF.md](./PRODUCT_OWNER_BRIEF.md) | Decisions log |

---

## Related

- [FE_STANDARDS.md](./FE_STANDARDS.md)  
- [PAGE_BUILD_CONTRACT.md](./PAGE_BUILD_CONTRACT.md)  
- [INTERACTION_FIDELITY.md](./INTERACTION_FIDELITY.md)  
- [CONCEPT_INTAKE.md](./CONCEPT_INTAKE.md)  
- [BOOTS_BOOK_STEP1_DESIGN_DELTA.md](../projects/boots-pharmacy/BOOTS_BOOK_STEP1_DESIGN_DELTA.md)

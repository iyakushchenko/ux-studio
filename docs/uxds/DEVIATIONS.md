# UXDS deviations registry

**Status:** Locked format (Product Owner, 2026-07-19)  
**Rule:** Anonymous page hacks are forbidden. If a screen needs chrome outside the standard kit, register a **named, reusable** class here (or in the project styleguide README for brand-only facts).  
**Doctrine:** [../product/DS_STRICTNESS.md](../product/DS_STRICTNESS.md)

---

## When to register

Register when you introduce:

- A new control **variant** (modifier class) that is not already in `src/uxds/components/`
- An intentional break from “one pattern per role” approved by PO
- Concept-only chrome that cannot yet be a pure token remap

Do **not** register ordinary layout CSS or token remaps in `styleguide/theme.css`.

---

## Entry format

Copy this block for each deviation:

```md
### `<class-or-token-name>`

| Field | Value |
|-------|--------|
| **ID** | `DEV-YYYYMMDD-<short-slug>` |
| **Status** | proposed / approved / retired |
| **Surfaces** | e.g. Book Step 1, Availability Tool |
| **Why** | One sentence — concept requirement or gap |
| **Canonical class** | `.uxds-…` or `.proto-…` |
| **Tokens used** | `--uxds-…` |
| **Not for** | Roles that must keep using the standard pattern |
| **Owner doc** | Link to FE_STANDARDS / styleguide / pilot note |
```

---

## Registry

### `.uxds-filter-chip--strong`

| Field | Value |
|-------|--------|
| **ID** | `DEV-20260719-filter-chip-strong` |
| **Status** | approved |
| **Surfaces** | Availability Tool secondary pills (All locations / Slots available) |
| **Why** | Secondary list filters use **brand primary fill + inverse text** when selected — not the default mint/badge selected language used by List/Map-style chips |
| **Canonical class** | `.uxds-filter-chip.uxds-filter-chip--strong` |
| **Tokens used** | `--uxds-filter-chip-surface-selected-strong`, `--uxds-filter-chip-surface-selected-strong-hover`, `--uxds-filter-chip-text-on-selected-strong`, `--uxds-filter-chip-surface-hover` |
| **Not for** | Default facet chips that should keep mint/badge selected |
| **Owner doc** | [../product/FE_STANDARDS.md](../product/FE_STANDARDS.md) §1.3 · [../product/DS_STRICTNESS.md](../product/DS_STRICTNESS.md) |

### `.uxds-btn-primary--commerce`

| Field | Value |
|-------|--------|
| **ID** | `DEV-20260719-btn-commerce` |
| **Status** | approved |
| **Surfaces** | Boots Book Step 1 Continue (and other navy commerce CTAs) |
| **Why** | Boots concept primary booking CTAs are **commerce navy**, while UXDS `--uxds-input-button-surface-surface-primary-solid` stays brand teal for DS primary |
| **Canonical class** | `.uxds-btn-primary.uxds-btn-primary--commerce` |
| **Tokens used** | `--uxds-input-button-surface-surface-commerce-solid`, `-hover`, `-active` |
| **Not for** | Teal DS primary buttons that should follow `surface-primary-solid` |
| **Owner doc** | Boots [styleguide/README.md](../../src/projects/boots-pharmacy/styleguide/README.md) · [../product/DS_STRICTNESS.md](../product/DS_STRICTNESS.md) |

### `.studio-tertiary-cta--soft`

| Field | Value |
|-------|--------|
| **ID** | `DEV-20260719-tertiary-soft` |
| **Status** | approved |
| **Surfaces** | Boots PDP GP promo “Find out more” (Make Frame104 mint pill) |
| **Why** | Promo CTA needs **soft mint fill + ring** while still using the shared tertiary icon+text kit (`TertiaryCta`); default tertiary stays transparent |
| **Canonical class** | `.studio-tertiary-cta.studio-tertiary-cta--soft` (`TertiaryCta soft`) |
| **Tokens used** | `--uxds-surface-accent-soft`, `--project-brand-cta-navy`, `--project-brand-cta-navy-hover`, `--project-brand-primary-light` (+ Make mint `#e0fbf8` / ring `#d4fef8`) |
| **Not for** | Transparent tertiary links (Change location, Reset filters, near-me) |
| **Owner doc** | [../product/FE_STANDARDS.md](../product/FE_STANDARDS.md) §1 · [../product/DS_STRICTNESS.md](../product/DS_STRICTNESS.md) |

---

## Retired

_None yet._

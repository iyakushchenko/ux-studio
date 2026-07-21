# UXDS variables structure

**Exhaustive list:** [inventory/variables.json](./inventory/variables.json) (assembled from Figma; see [UXDS_MAP.md](./UXDS_MAP.md)).

**Source:** live local variables in `myqzp3KRc1pxKDOv8RfTsl` (2026-07-19).  
**Total:** 995 variables across 6 collections.

Agent rule: **preserve UXDS names** in the CSS bridge (slash → kebab or keep path segments). Do not invent parallel token names.

---

## Collections (map)

| Collection | Modes | Count | Role for UX Studio |
|------------|-------|------:|--------------------|
| **`design`** | Concept · Prototype · Dark Mode | 101 | **Primary semantic UI colors** (`uxds-*`) for React concept chrome |
| **`primitives (color)`** | Primitive A | 41 | Raw palette (`color/neutral/*`, `color/accent/*`) — alias targets only |
| **`screen & fonts`** | small · medium · large | 154 | Type, space, gap, radius, grid — **responsive modes** |
| **`setup`** | Mode 1 | 598 | Content / project blood: `IA/*`, `persona/*`, `project/*`, `brand/*` |
| **`decks & slides`** | Value | 98 | X-Suite deck/slide/XE tokens — **not** for Boots commerce screens |
| **`auth`** | Guest · User | 3 | Auth boolean modes (`guest` / `user`) |

---

## Layer model (how to think)

```
primitives (color)     →  raw hex / named accents
        ↑ aliases
design (uxds-*)        →  semantic roles (text, surface, border, input, icon, badge)
screen & fonts         →  type / space / gap / radius / grid (by viewport mode)
setup                  →  content + brand strings + IA tree (not CSS chrome)
decks & slides         →  evaluation / deck UI (X-Suite) — separate lane
auth                   →  guest vs user mode switch
```

For **concept page CSS**, implement in this order:

1. Bridge `primitives (color)` only if needed as `--color-*` primitives.  
2. Bridge **`design`** `uxds-*` as semantic CSS (`--uxds-text-text-primary`, etc.).  
3. Bridge **`screen & fonts`** `font/*`, `space/*`, `gap/*`, `radius/*`, `grid/*` with mode = **medium** default (toggle later).  
4. Treat **`setup`** as **data** (JSON/content store), not stylesheet tokens — except `brand/*` strings used in chrome copy.  
5. Ignore **`decks & slides`** for Boots Pharmacy screens.

---

## `design` — semantic UI (`uxds-*`)

| Folder | ~Count | Examples |
|--------|-------:|----------|
| `uxds-input/` | 29 | `uxds-input/button/surface/surface-primary-solid` |
| `uxds-surface/` | 21 | `uxds-surface/neutral`, `…/error`, `…/success` |
| `uxds-icon/` | 17 | `uxds-icon/icon-primary`, `size-s` / `size-m` |
| `uxds-text/` | 12 | `uxds-text/text-primary`, `link/link-dark` |
| `uxds-border/` | 8 | `uxds-border/border-default`, `border-focus` |
| `uxds-badge/` | 8 | `uxds-badge/surface/variant-1` … |
| `uxds-logo/` | 4 | `uxds-logo/logo-accent` |

**Sample resolved (Concept mode):**

| Token | Concept |
|-------|---------|
| `uxds-text/text-primary` | `#3a3a3a` |
| `uxds-surface/neutral` | `#ffffff` |
| `uxds-border/border-default` | `#d6d6d6` |
| `uxds-input/button/surface/surface-primary-solid` | `#305854` |
| `uxds-icon/icon-primary` | `#5c5c5c` |

Modes: prefer **Concept** for early Studio rebuilds; **Prototype** / **Dark Mode** later.

---

## `primitives (color)`

Under `color/neutral/*`, `color/accent/*` (e.g. Turquoise, Cinnamon, Yellow). Semantic `design` tokens alias into these. Do not style screens from primitives directly.

---

## `screen & fonts`

| Folder | Role |
|--------|------|
| `font/*` | Weights, sizes, line-heights for btn / input / type roles |
| `space/*` | Body margins, content padding, form/rhythm |
| `gap/*` | `gap/space-xs` … `gap/space-3xl` |
| `radius/*` | `none`, `xs`, `s`, `m (base)`, `lg`, `full`, `input`, `checkbox` |
| `grid/*` | Container width, cols, gutter, margin |
| `product masonry/*`, `tile product image/*` | PLP/tile layout metrics |

Modes **small / medium / large** = viewport density. Studio default bridge: **medium**.

---

## `setup` — content bloodstream (X-Suite / organism)

| Folder | ~Count | Notes |
|--------|-------:|-------|
| `IA/*` | 449 | Menu, product, alias, subsystem, parked — see below |
| `persona/*` | 95 | Persona A/B/C profile fields |
| `project/*` | 45 | Dates, status, `uxds-version`, etc. |
| `brand/*` | 9 | `brand-name`, email, phone, currency, hours, … |

### `IA/` breakdown (depth 2)

| Path | ~Count | Written by |
|------|-------:|------------|
| `IA/product/*` | 190 | Place Product Data Model (Summarizer) |
| `IA/alias/*` | 183 | Selection layer (mega menu, PLP ribbon, main product, footer, …) |
| `IA/menu/*` | 41 | Place Navigation Model |
| `IA/subsystem/*` | 16 | Named subsystem labels |
| `IA/json/*` | 14 | Snapshots / shuffle |
| `IA/_parked variables/*` | 5 | Archive on replace |

Studio does **not** re-implement Place gestures. Later integration: import Summarizer/X-Suite exports that already fill these slots → seed journeys/personas.

Full organism narrative: `E:\UX\Summarizer\docs\UXDS_ORGANISM_OVERVIEW.md`.

---

## `decks & slides` + `auth`

- **decks & slides:** `deck/*`, `XE/*`, `slide/*`, `doc/*`, `deck primitives/*` — Experience Evaluation / X-Suite UI. Keep out of Boots concept CSS.  
- **auth:** boolean modes Guest/User for conditional chrome in Figma.

---

## Naming conventions (agent must match)

1. Path separators in Figma = `/`. CSS bridge may use `--uxds-text-text-primary` (folder + leaf) — document mapping in [TOKEN_BRIDGE.md](./TOKEN_BRIDGE.md).  
2. Components use **dot paths**: `component.*`, `module.*` (see [COMPONENTS.md](./COMPONENTS.md)).  
3. Folders marked `DO NOT EDIT` are markers — ignore.  
4. Summarizer naming audit rules live in `E:\UX\Summarizer\docs\AGENT_UXDS_NAMING.md` — reuse when renaming, never invent a second taxonomy.

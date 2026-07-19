# UXDS → CSS token bridge (plan)

**Status:** Thin hand-mapped bridge landed under `src/uxds/tokens/` (Concept + medium samples). Full dump/regenerate later.  
**Default Figma modes for v1:** `design` = **Concept** · `screen & fonts` = **medium**  
**Strictness:** [../product/DS_STRICTNESS.md](../product/DS_STRICTNESS.md) — baseline → optional project remap; shared components use `var(--uxds-…)`.

---

## CSS naming

| Figma path | CSS custom property |
|------------|---------------------|
| `uxds-text/text-primary` | `--uxds-text-text-primary` |
| `uxds-input/button/surface/surface-primary-solid` | `--uxds-input-button-surface-surface-primary-solid` |
| `gap/space-m` | `--gap-space-m` |
| `radius/m (base)` | `--radius-m-base` (strip parentheses / spaces → `-`) |

Rules:

- `/` → `-`
- Lowercase
- Collapse runs of non-alphanumerics to single `-`
- Never invent synonyms (`--color-primary` ❌ if UXDS has `uxds-input/.../surface-primary-solid`)

**Project brand delta** (multi-brand Studio): each project ships a small `styleguide/theme.css` that **only remaps CSS variables** under `[data-studio-project="<id>"]` — see [../product/PROJECT_STYLEGUIDE.md](../product/PROJECT_STYLEGUIDE.md). Theme is optional; without it, UI uses UXDS `:root` baselines (correct and consistent, not “broken”).

### Studio-extended roles (hand-mapped)

Used by shared kits; brands remap in `theme.css`:

| Token | Role |
|-------|------|
| `--uxds-text-link-link` / `-hover` | Body text links (`.uxds-link`) |
| `--uxds-text-link-link-dark` | Crumb / teal links |
| `--uxds-surface-accent-soft` | Soft accent wash (progress, checkbox hover) |
| `--uxds-icon-icon-accent-soft` | Tertiary CTA icon rest |
| `--uxds-input-button-surface-surface-commerce-*` | Commerce / navy CTA variant |
| `--uxds-filter-chip-surface-selected-strong*` | Strong filter-pill selected |

---

## File layout (target)

```
src/uxds/
  tokens/
    primitives.css      # from primitives (color) — optional
    design.css          # uxds-* semantic (Concept mode dump) — BASELINE values
    screen.css          # font/space/gap/radius/grid (medium)
  index.css             # imports layers

src/projects/<id>/styleguide/
  README.md             # brand delta notes
  theme.css             # variable remaps only under [data-studio-project]
  assets/               # logos
```

Import order (`src/styles/index.css`): **BASE** (UXDS tokens + kits) → **THEME** (project `theme.css`) → **PANEL** (engine chrome) → **LEGACY** (Make `globals*.css`). Full map: [../product/CSS_BASE_THEME.md](../product/CSS_BASE_THEME.md).

### Turn theme off

1. Remove `data-studio-project` from the host, and/or  
2. Do not import the project `theme.css`.  

Shared components must still look correct on UXDS defaults. Do **not** grow LEGACY for new React pages — use BASE / THEME / PANEL / colocated page CSS.

---

## What not to bridge into CSS

| Collection / folder | Why |
|---------------------|-----|
| `setup` / `IA/*`, `persona/*` | Content data → TS/JSON stores |
| `decks & slides` | X-Suite deck UI |
| `auth` | Mode flags → React context later |

---

## Export path (later)

1. Script or MCP dump: variable name + resolved value for chosen modes.  
2. Generate `design.css` / `screen.css`.  
3. Commit generated files; regenerate when UXDS versions bump (`project/uxds-version`).

Until the dump exists, agents may hand-map tokens used by the **current** screen only — still using exact UXDS names.

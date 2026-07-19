# UXDS → CSS token bridge (plan)

**Status:** Contract defined; implementation deferred until first React+UXDS screen pilot.  
**Default Figma modes for v1:** `design` = **Concept** · `screen & fonts` = **medium**

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

**Project brand delta** (required for multi-brand Studio): each project ships a small `styleguide/theme.css` that remaps UXDS roles to that concept’s primary colors / logos — see [../product/PROJECT_STYLEGUIDE.md](../product/PROJECT_STYLEGUIDE.md). Without it, every project looks like the same generic UXDS brand.

---

## File layout (target)

```
src/uxds/
  tokens/
    primitives.css      # from primitives (color) — optional
    design.css          # uxds-* semantic (Concept mode dump)
    screen.css          # font/space/gap/radius/grid (medium)
  index.css             # imports layers

src/projects/<id>/styleguide/
  README.md             # brand delta notes
  theme.css             # small per-brand remap helper
  assets/               # logos
```

Concept pages import `src/uxds/index.css` **then** the active project’s `styleguide/theme.css`.

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

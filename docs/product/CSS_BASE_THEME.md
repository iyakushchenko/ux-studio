# CSS architecture — BASE / THEME / PANEL / LEGACY

**Status:** Locked (architect mandate, 2026-07-19)  
**Entry:** `src/styles/index.css`  
**Audience:** Every agent touching styles. No CSS dump. No whack-a-mole.  
**Doctrine:** [COMMAND_DOCTRINE.md](./COMMAND_DOCTRINE.md) §0 — Director owns layer discipline; proactive forecasting must catch layer violations on every task.

---

## 1. Locked global layers

| Layer | Path ownership | Rule |
|-------|----------------|------|
| **BASE** | `src/uxds/**/*.css` | Tokens + shared components/kits only |
| **THEME** | `src/projects/<id>/styleguide/theme.css` | Variable remaps only; optional; off = BASE |
| **PANEL** | `src/app/nav/**/*.css` (+ future `src/app/shell/**/*.css` if extracted) | Engine chrome only — REC / CJM / cassette |
| **LEGACY** | Legacy globals under `src/styles/globals*.css` | Quarantine; **no NEW React page styles here** |

**Theme = delta only (HARD):** Keep UXDS / UXML BASE as mutual as possible across projects. Project `theme.css` remaps brand facts (primary/accent/logo/font) under `[data-studio-project]` — **not** layout, hover forks, or component anatomy. Page create must inherit kits first — [PAGE_CREATE_INHERITANCE.md](./PAGE_CREATE_INHERITANCE.md) · [PROJECT_STYLEGUIDE.md](./PROJECT_STYLEGUIDE.md).

**Global entry import order (mandatory):** BASE → THEME → PANEL → LEGACY.  
Enforced in [`src/styles/index.css`](../../src/styles/index.css).

This order describes the global entry barrel, not every stylesheet emitted by Vite. React
screen components import their colocated CSS from TSX, so that CSS participates in the
bundle through the component graph and may be emitted after the global barrel. Treat
screen CSS as **COMPOSITION ownership**, not as a fifth global layer. It must be scoped to
its screen root and must not rely on beating a broad LEGACY selector by source order.
When LEGACY leaks into a migrated screen, narrow/exclude the LEGACY selector or move the
shared role into BASE; do not add `!important` or a later anonymous override.

Preamble (fonts, Tailwind, `src/styles/theme.css` shadcn tokens) loads first for tooling. That file is **not** project THEME.

---

## 2. Exact path map

### BASE

| Path | Owns |
|------|------|
| `src/uxds/index.css` | Token import barrel |
| `src/uxds/tokens/primitives.css` | Primitive scales |
| `src/uxds/tokens/design.css` | Semantic UXDS tokens (`:root`) |
| `src/uxds/tokens/screen.css` | Screen / layout tokens |
| `src/uxds/components/*.css` | Shared kit CSS (button, filter-chip, text-link, …) |

### THEME

| Path | Owns |
|------|------|
| `src/projects/boots-pharmacy/styleguide/theme.css` | Boots remaps under `[data-studio-project="boots-pharmacy"]` only |
| Future: `src/projects/<id>/styleguide/theme.css` | Same contract per project |

Theme off = remove `data-studio-project` and/or skip the theme import → UXDS BASE remains.

### PANEL

| Path | Owns |
|------|------|
| `src/app/nav/studioNavPanel.css` | Studio nav / REC / CJM / cassette deck chrome |
| Future: `src/app/shell/**/*.css` | Extracted engine shell (wire mount, scroll host) when pulled out of LEGACY |

PANEL is imported from `index.css` (not only from components) so it sits **before** LEGACY.

### LEGACY (quarantine)

| Path | Owns today | Growth rule |
|------|------------|-------------|
| `src/styles/globals.css` | Barrel → hub / chrome / screens | Do not add new React page rules |
| `src/styles/globals-hub.css` | Hub / tour surfaces | Retire as hub moves to React |
| `src/styles/globals-chrome.css` | Mixed Legacy + engine wire/scroll | No new React page styles; eventual PANEL/shell extract |
| `src/styles/globals-screens.css` | Legacy screen monster CSS | Retire screen-by-screen |

### React page CSS — COMPOSITION ownership (not a global layer)

| Path | Owns |
|------|------|
| `src/projects/<id>/screens/**/*.css` | Colocated layout/structure for React screens (e.g. `book-step-1-location.css`) |

Imported by the owning React component, not by `src/styles/index.css`. Allowed for
screen-scoped measured layout, structure, and concept composition. **Forbidden:** global
selectors, parallel palettes, near-duplicate control roles, source-order fights with
LEGACY, or dumping into LEGACY. Deviations →
[`docs/uxds/DEVIATIONS.md`](../uxds/DEVIATIONS.md).

---

## 3. Where new work lands

| Work | Layer | Path |
|------|-------|------|
| New shared control / kit | BASE | `src/uxds/components/` (+ tokens if needed) |
| Brand color / logo remap | THEME | `src/projects/<id>/styleguide/theme.css` |
| REC / CJM / cassette / nav chrome | PANEL | `src/app/nav/**/*.css` |
| New React concept page | COMPOSITION or BASE/THEME | Component-imported `src/projects/<id>/screens/**`; scope under the screen root — **never** `globals-*.css` |
| Touching unmigrated Legacy screen | LEGACY only if unavoidable | Prefer migrate that screen; do not grow the monster for React |

---

## 4. Migration delta (current HEAD)

| Surface | Status | Layer now | Target |
|---------|--------|-----------|--------|
| UXDS tokens (`src/uxds/tokens/*`) | Done | BASE | Stay |
| Kit CSS (button / chip / link) | Done | BASE | Stay; grow here |
| Boots `styleguide/theme.css` | Done | THEME | Stay (remaps only) |
| `studioNavPanel.css` (nav / REC / CJM) | Done | PANEL | Stay; all new chrome here |
| Book Step 1 React screen CSS | Done | Page (`screens/book-step-1/`) | Stay; next screens same pattern |
| Hub Legacy CSS (`globals-hub.css`) | Legacy | LEGACY | Retire with hub React |
| Wire / scroll / playback shield (`globals-chrome.css`) | Mixed | LEGACY (engine bits) | Extract → `src/app/shell/**` (PANEL) |
| Legacy screen dump (`globals-screens.css`) | Legacy | LEGACY | Retire screen-by-screen |
| Remaining Legacy screens in wire | Legacy | LEGACY | React + page CSS / BASE kits |
| `src/styles/theme.css` (shadcn) | Tooling preamble | Preamble | Not project THEME |

### Inventory (approx sizes at checkpoint)

| Bucket | Paths | ~bytes |
|--------|-------|--------|
| LEGACY | `globals-screens.css` + `globals-chrome.css` + `globals-hub.css` | ~200 KB |
| BASE | `src/uxds/**/*.css` | ~9 KB |
| THEME | `boots-pharmacy/styleguide/theme.css` | ~2 KB |
| PANEL | `src/app/nav/studioNavPanel.css` | (nav chrome) |
| Page (React) | `book-step-1-location.css` | ~13 KB |

**Readiness verdict:** **Architecture ready now** (BASE + THEME + PANEL locked and imported). **LEGACY retirement is phased** — do not big-bang rewrite the Legacy monster; retire screen-by-screen as surfaces move to React. New work must land in BASE / THEME / PANEL / page CSS only.

---

## 5. CI hygiene (line endings)

Tailwind v4 fails the production build with `Invalid declaration: `` ` when a CSS file contains **double CR** line endings (`\r\r\n` / CRCRLF). Root cause of failed main runs around `3e7dd92` (`text-link.css`). Rewrite to LF (or clean CRLF) before push. Prefer `.gitattributes` `*.css text eol=lf`.

---

## 6. Architect rules (non-negotiable)

1. **No CSS dump** — one concern per file/layer.  
2. **No whack-a-mole** — fix ownership, then style once in the right layer.  
3. **LEGACY is quarantine** — do not add styles for new React pages there.  
4. **PANEL isolated from Boots Legacy** — engine chrome does not live in `globals-screens.css`.  
5. **Deviations registered** — [`DS_STRICTNESS.md`](./DS_STRICTNESS.md) + [`../uxds/DEVIATIONS.md`](../uxds/DEVIATIONS.md).

---

## Related

- [`COMMAND_DOCTRINE.md`](./COMMAND_DOCTRINE.md) §0 — Director + proactive (spot layer dump early)  
- [`DS_STRICTNESS.md`](./DS_STRICTNESS.md) — no near-duplicates; no React growth in LEGACY  
- [`FE_UI_UX_AUDIT.md`](./FE_UI_UX_AUDIT.md) — audit gate before PO  
- [`PROJECT_STYLEGUIDE.md`](./PROJECT_STYLEGUIDE.md)  
- [`../uxds/TOKEN_BRIDGE.md`](../uxds/TOKEN_BRIDGE.md)  
- [`../../AGENTS.md`](../../AGENTS.md)  
- [`../../.cursor/rules/ux-studio-director.mdc`](../../.cursor/rules/ux-studio-director.mdc)

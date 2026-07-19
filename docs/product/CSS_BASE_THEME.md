# CSS architecture — BASE / THEME / PANEL / LEGACY

**Status:** Locked (architect mandate, 2026-07-19)  
**Entry:** `src/styles/index.css`  
**Audience:** Every agent touching styles. No CSS dump. No whack-a-mole.  
**Doctrine:** [COMMAND_DOCTRINE.md](./COMMAND_DOCTRINE.md) §0 — Director owns layer discipline; proactive forecasting must catch layer violations on every task.

---

## 1. Locked layers

| Layer | Path ownership | Rule |
|-------|----------------|------|
| **BASE** | `src/uxds/**/*.css` | Tokens + shared components/kits only |
| **THEME** | `src/projects/<id>/styleguide/theme.css` | Variable remaps only; optional; off = BASE |
| **PANEL** | `src/app/nav/**/*.css` (+ future `src/app/shell/**/*.css` if extracted) | Engine chrome only — REC / CJM / cassette |
| **LEGACY** | Make globals under `src/styles/globals*.css` | Quarantine; **no NEW React page styles here** |

**Import order (mandatory):** BASE → THEME → PANEL → LEGACY  
Enforced in [`src/styles/index.css`](../../src/styles/index.css).

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
| `src/projects/boots-pharmacy/styleguide/theme.css` | Boots remaps under `[data-proto-project="boots-pharmacy"]` only |
| Future: `src/projects/<id>/styleguide/theme.css` | Same contract per project |

Theme off = remove `data-proto-project` and/or skip the theme import → UXDS BASE remains.

### PANEL

| Path | Owns |
|------|------|
| `src/app/nav/protoNavPanel.css` | Studio nav / REC / CJM / cassette deck chrome |
| Future: `src/app/shell/**/*.css` | Extracted engine shell (wire mount, scroll host) when pulled out of LEGACY |

PANEL is imported from `index.css` (not only from components) so it sits **before** LEGACY.

### LEGACY (quarantine)

| Path | Owns today | Growth rule |
|------|------------|-------------|
| `src/styles/globals.css` | Barrel → hub / chrome / screens | Do not add new React page rules |
| `src/styles/globals-hub.css` | Hub / tour surfaces | Retire as hub moves to React |
| `src/styles/globals-chrome.css` | Mixed Make + engine wire/scroll | No new React page styles; eventual PANEL/shell extract |
| `src/styles/globals-screens.css` | Make screen monster CSS | Retire screen-by-screen |

### React page CSS (not LEGACY)

| Path | Owns |
|------|------|
| `src/projects/<id>/screens/**/*.css` | Colocated layout/structure for React screens (e.g. `book-step1-location.css`) |

Allowed for measured layout/structure. **Forbidden:** parallel palettes, near-duplicate control roles, dumping into LEGACY. Deviations → [`docs/uxds/DEVIATIONS.md`](../uxds/DEVIATIONS.md).

---

## 3. Where new work lands

| Work | Layer | Path |
|------|-------|------|
| New shared control / kit | BASE | `src/uxds/components/` (+ tokens if needed) |
| Brand color / logo remap | THEME | `src/projects/<id>/styleguide/theme.css` |
| REC / CJM / cassette / nav chrome | PANEL | `src/app/nav/**/*.css` |
| New React concept page | Page CSS or BASE/THEME | `src/projects/<id>/screens/**` — **never** `globals-*.css` |
| Touching unmigrated Make screen | LEGACY only if unavoidable | Prefer migrate that screen; do not grow the monster for React |

---

## 4. Migration delta (current HEAD)

| Surface | Status | Layer now | Target |
|---------|--------|-----------|--------|
| UXDS tokens (`src/uxds/tokens/*`) | Done | BASE | Stay |
| Kit CSS (button / chip / link) | Done | BASE | Stay; grow here |
| Boots `styleguide/theme.css` | Done | THEME | Stay (remaps only) |
| `protoNavPanel.css` (nav / REC / CJM) | Done | PANEL | Stay; all new chrome here |
| Book Step 1 React screen CSS | Done | Page (`screens/book-step1/`) | Stay; next screens same pattern |
| Hub Make CSS (`globals-hub.css`) | Legacy | LEGACY | Retire with hub React |
| Wire / scroll / playback shield (`globals-chrome.css`) | Mixed | LEGACY (engine bits) | Extract → `src/app/shell/**` (PANEL) |
| Make screen dump (`globals-screens.css`) | Legacy | LEGACY | Retire screen-by-screen |
| Remaining Make screens in wire | Legacy | LEGACY | React + page CSS / BASE kits |
| `src/styles/theme.css` (shadcn) | Tooling preamble | Preamble | Not project THEME |

### Inventory (approx sizes at checkpoint)

| Bucket | Paths | ~bytes |
|--------|-------|--------|
| LEGACY Make | `globals-screens.css` + `globals-chrome.css` + `globals-hub.css` | ~200 KB |
| BASE | `src/uxds/**/*.css` | ~9 KB |
| THEME | `boots-pharmacy/styleguide/theme.css` | ~2 KB |
| PANEL | `src/app/nav/protoNavPanel.css` | (nav chrome) |
| Page (React) | `book-step1-location.css` | ~13 KB |

**Readiness verdict:** **Architecture ready now** (BASE + THEME + PANEL locked and imported). **LEGACY retirement is phased** — do not big-bang rewrite the Make monster; retire screen-by-screen as surfaces move to React. New work must land in BASE / THEME / PANEL / page CSS only.

---

## 5. CI hygiene (line endings)

Tailwind v4 fails the production build with `Invalid declaration: `` ` when a CSS file contains **double CR** line endings (`\r\r\n` / CRCRLF). Root cause of failed main runs around `3e7dd92` (`text-link.css`). Rewrite to LF (or clean CRLF) before push. Prefer `.gitattributes` `*.css text eol=lf`.

---

## 6. Architect rules (non-negotiable)

1. **No CSS dump** — one concern per file/layer.  
2. **No whack-a-mole** — fix ownership, then style once in the right layer.  
3. **LEGACY is quarantine** — do not add styles for new React pages there.  
4. **PANEL isolated from Boots Make** — engine chrome does not live in `globals-screens.css`.  
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

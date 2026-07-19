# Naming conventions — UX Studio

**Status:** Locked (Tech Director, 2026-07-19)  
**Scope:** New files + applied engine renames. **No big-bang** rename of every Make dump class.  
**Audience:** Every agent creating or renaming files.  
**Map:** [ARCHITECTURE.md](./ARCHITECTURE.md) · [HYGIENE.md](./HYGIENE.md)

---

## Hard forbid: `proto*` as product identity

This product is **UX Studio**, not a prototype nickname.

| Rule | Detail |
|------|--------|
| **No new `proto*` / `Proto*` filenames** | Use domain names (`recording`, `nav`, `studio`, `scenario`, `journey`) or short role names. |
| **No new `.proto-*` CSS classes** | PANEL/chrome → `.studio-nav-*`, `.studio-*`, `.studio-agent-testing-*`. Concept Make leftovers may remain in LEGACY until that screen retires. |
| **No new `data-proto-*` attributes** | Use `data-studio-*` (+ `dataset.studio*`). |
| Prefer window APIs | `window.__studio*`. Keep `__proto*` as **stable aliases**. |
| Journey beat field | `protoTab` may remain until a beat-schema migration. |

### Applied migration map

| Old | New | Notes |
|-----|-----|--------|
| `src/app/proto/*` | `src/app/scenario/*` | Scenario domain |
| `ProtoNav*` / `protoRecording*` / … | `StudioNav*` / `recording*` / … | Filename phase 1 |
| `.proto-nav-*`, `.proto-studio-*`, shell chrome | `.studio-nav-*`, `.studio-*`, … | CSS phase 2 |
| `data-proto-*` | `data-studio-*` | Attr phase 2 (clean cut) |
| `proto-demo-click` / `proto-retreat-sync` | `studio-demo-click` / `studio-retreat-sync` | Events |
| `proto-nav:` / `proto-hub:` session keys | `studio-nav:` / `studio-hub:` | Legacy keys read once then dropped |
| `scripts/proto-*-smoke.mjs` | `scripts/*-smoke.mjs` | Smoke |

**Still intentional `proto`:**

- `window.__proto*` aliases  
- Beat field `protoTab`  
- Concept LEGACY classes (`.proto-footer`, `.proto-chat-*`, avail cards, wire helpers) until screen retirement  
- Historical storage keys `boots-vaccine-proto-*` (read-migrate only)

**Filename leftovers (2026-07-19):** `src/` + `scripts/` + `docs/` basenames starting with `proto`/`Proto` = **0**. Smoke reports use `smoke-report.json` / `step-forward-report.json` (not `proto-*-report.json`). Enforced by `npm run check:felonies`.

---

## Rule of thumb

| Kind | Convention | Example |
|------|------------|---------|
| React components | `PascalCase.tsx` | `BookStep1LocationScreen.tsx`, `StudioNavPanel.tsx` |
| Hooks | `use` + Pascal → file `useCamelCase.ts` | `useStudio.ts` |
| Modules | **`camelCase.ts`** | `studioUrl.ts`, `bookStep1Contract.ts` |
| Screen folders | **kebab = `screenId`** | `screens/book-step-1/` |
| Colocated CSS | **`kebab-case.css`** | `book-step-1-location.css` |
| BEM block (page) | Prefer **`screenId`** | `.book-step-1__title` |
| PANEL BEM | `.studio-nav-*` / `.studio-*` | `.studio-nav-scenario__counter` |
| Product docs | **`SCREAMING_SNAKE.md`** | `NAMING.md`, `HYGIENE.md` |
| Scripts | **`kebab-case.mjs`** | `check-file-hygiene.mjs` |
| Vitest | `*.test.ts` in `__tests__/` | preferred |
| `screenId` / project id | **kebab-case** | `book-step-2`, `boots-pharmacy` |

**Hard rule:** folder name **equals** `PROJECT_SCREENS[].screenId` (and `data-studio-react-screen`).

---

## CSS layers ↔ file homes

| Layer | Home | Naming |
|-------|------|--------|
| BASE | `src/uxds/**/*.css` | kebab kit files |
| THEME | `src/projects/<id>/styleguide/theme.css` | fixed; keyed by `data-studio-project` |
| PANEL | `src/app/**` | `.studio-nav-*` / `.studio-*` |
| LEGACY | `src/styles/globals-*.css` | **no new React page CSS** |
| Page | `screens/<screenId>/` | kebab CSS; host `.studio-react-screen-host` |

---

## Docs layout

| Tree | What |
|------|------|
| `docs/product/` | Engine doctrine |
| `docs/projects/<id>/` | Deltas, pilots, FE audits |
| `docs/uxds/` | Larkin inventory |
| `docs/shell/` | URL, recording, playback |

Old paths may keep thin stubs.

---

## Related

- [ARCHITECTURE.md](./ARCHITECTURE.md) · [HYGIENE.md](./HYGIENE.md) · [COMMAND_DOCTRINE.md](./COMMAND_DOCTRINE.md) · [../../AGENTS.md](../../AGENTS.md)

# Design-system strictness (pages)

**Status:** Locked (Product Owner directive, 2026-07-19)  
**Audience:** Every agent building or restyling concept UI.  
**Companions:** [COMMAND_DOCTRINE.md](./COMMAND_DOCTRINE.md) §0 (Director + proactive) · [CSS_BASE_THEME.md](./CSS_BASE_THEME.md) · [FE_STANDARDS.md](./FE_STANDARDS.md) · [VISUAL_FIDELITY.md](./VISUAL_FIDELITY.md) · [PROJECT_STYLEGUIDE.md](./PROJECT_STYLEGUIDE.md) · [../uxds/TOKEN_BRIDGE.md](../uxds/TOKEN_BRIDGE.md) · [../uxds/DEVIATIONS.md](../uxds/DEVIATIONS.md)

---

## 1. Product rules (STRICT)

1. **No near-duplicate styles anywhere.** One pattern per role (text link, tertiary icon+text CTA, filter pill active, primary CTA, etc.). Do not invent parallel colors/hover for the “same” control on different screens.
2. **Proper DS, strict on pages.** Page work uses UXDS components / tokens / kits + the project brand theme only. **No custom one-off CSS** unless absolutely needed.
3. **Deviations must be registered.** If a page needs something the kit does not cover, add a **named, documented, reusable** DS class/deviation — not an anonymous page hack. Registry: [../uxds/DEVIATIONS.md](../uxds/DEVIATIONS.md).
4. **Brand theme is optional.** Shared components must look correct on **UXDS baseline** colors when the project theme is off. Theme files only **remap** CSS variables; they must not be the only place raw brand values live for shared chrome.

---

## 2. CSS layers + token stack (mandatory)

**Architect rule:** styles land in the correct layer — no dump, no whack-a-mole.  
Full map: [CSS_BASE_THEME.md](./CSS_BASE_THEME.md). Import order in `src/styles/index.css`: **BASE → THEME → PANEL → LEGACY**.

| Layer | Path | Owns | Forbidden |
|-------|------|------|-----------|
| **BASE** | `src/uxds/**/*.css` | Tokens + shared kits | Project-only hex; engine chrome |
| **THEME** | `src/projects/<id>/styleguide/theme.css` | Variable remaps under `[data-proto-project]` | Component rules, hover forks, layout |
| **PANEL** | `src/app/nav/**/*.css` (+ future `src/app/shell/`) | Engine chrome (REC / CJM / cassette) | Boots Make page rules |
| **LEGACY** | `src/styles/globals*.css` | Quarantined Make monster | **Any NEW React page styles** |
| **Page CSS** | `src/projects/<id>/screens/**/*.css` | Layout / structure for React screens | Parallel palettes; dumping into LEGACY |

```
BASE (:root in src/uxds/tokens/*.css + kits)
        ↓ remapped by
THEME ([data-proto-project="<id>"] in styleguide/theme.css)
        ↓ consumed by
Shared components / kits + PANEL chrome
        ↓ composed by
Page screens (structure + layout; no parallel palettes)
        ↓ (unmigrated only)
LEGACY Make globals — retire screen-by-screen; do not grow for React
```

---

## 3. How to turn brand theme off

| Method | Effect |
|--------|--------|
| Remove / do not set `data-proto-project` on the host | Project remap selectors no longer match |
| Do not import `src/projects/<id>/styleguide/theme.css` | No brand overrides load |

**Verify:** Shared controls (`.uxds-link`, `.uxds-filter-chip`, `.uxds-btn-primary`, tertiary CTA) still render with UXDS `:root` defaults — readable, consistent, no missing colors.

Boots import order (see `src/styles/index.css`): BASE (`src/uxds/`) → THEME (`boots-pharmacy/styleguide/theme.css`) → PANEL (`src/app/nav/protoNavPanel.css`) → LEGACY (`globals*.css`).

---

## 4. One pattern per role (examples)

| Role | Canonical pattern | Do not |
|------|-------------------|--------|
| Regular text link | `.uxds-link` → `--uxds-text-link-link` (rest **no** underline, hover underline — footer-like; same contract as `.proto-link`) | Per-screen `#012169` / always-underline Learn more forks; competing rest-underline rules |
| Crumb / teal link | `--uxds-text-link-link-dark` (or registered crumb class) | Reuse body-link navy for crumbs |
| Tertiary icon+text CTA | `.proto-tertiary-cta` / `NearMeCta` | FilterChip restyles or pencil one-offs |
| Filter chip (default) | `.uxds-filter-chip` mint/badge selected | Parallel selected fills on the same family |
| Filter chip (strong / secondary pills) | `.uxds-filter-chip--strong` | Anonymous `.proto-avail-*` hex |
| Commerce / navy primary CTA | `.uxds-btn-primary--commerce` or commerce tokens | Page-only `#012169` Continue |

---

## 5. When page CSS is allowed

Allowed without a deviation entry:

- Layout (shell 1440/64/1312, flex/grid, sticky mounts)
- Concept structure that does not redefine a shared control’s color/hover language
- Temporary Make bridge CSS in LEGACY while a screen is not yet React (retire screen-by-screen — **do not add React page rules to LEGACY**)
- Trivial one-property CSS transitions (hover color/opacity) — **not** UI enter/exit/layout motion

Requires a **registered deviation** ([../uxds/DEVIATIONS.md](../uxds/DEVIATIONS.md)):

- New control family or intentional break from an existing role
- Concept chrome that cannot yet be expressed as a token remap
- Any new hex that will be reused on more than one surface
- Bespoke `@keyframes` / custom animation systems (default UI motion is **`framer-motion`** — [FE_STANDARDS.md](./FE_STANDARDS.md) §9)

---

## 6. Agent checklist

1. Reuse an existing role/pattern — do not fork colors.  
2. Consume `var(--uxds-…)` in shared CSS; put brand hex only in `theme.css` (or UXDS baseline).  
3. If inventing a class: name it, document it, register if it is a deviation.  
4. Spot-check with theme off (no `data-proto-project` / theme import) — baselines still work.  
5. Do not big-bang Make `globals-*.css`; migrate surfaces as they are touched.  
6. **Never grow LEGACY for new React work** — use BASE / THEME / PANEL / page CSS ([CSS_BASE_THEME.md](./CSS_BASE_THEME.md)).

---

## Related

- [COMMAND_DOCTRINE.md](./COMMAND_DOCTRINE.md) §0 — composite Director role; proactive style-zoo / layer forecasting  
- [CSS_BASE_THEME.md](./CSS_BASE_THEME.md) — BASE → THEME → PANEL → LEGACY  
- [FE_UI_UX_AUDIT.md](./FE_UI_UX_AUDIT.md) — Nazi QA before PO  
- [FE_STANDARDS.md](./FE_STANDARDS.md)  
- [VISUAL_FIDELITY.md](./VISUAL_FIDELITY.md)  
- [PROJECT_STYLEGUIDE.md](./PROJECT_STYLEGUIDE.md)  
- [../uxds/TOKEN_BRIDGE.md](../uxds/TOKEN_BRIDGE.md)  
- [../uxds/DEVIATIONS.md](../uxds/DEVIATIONS.md)

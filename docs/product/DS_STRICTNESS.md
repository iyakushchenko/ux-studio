# Design-system strictness (pages)

**Status:** Locked (Product Owner directive, 2026-07-19)  
**Audience:** Every agent building or restyling concept UI.  
**Companions:** [FE_STANDARDS.md](./FE_STANDARDS.md) · [VISUAL_FIDELITY.md](./VISUAL_FIDELITY.md) · [PROJECT_STYLEGUIDE.md](./PROJECT_STYLEGUIDE.md) · [../uxds/TOKEN_BRIDGE.md](../uxds/TOKEN_BRIDGE.md) · [../uxds/DEVIATIONS.md](../uxds/DEVIATIONS.md)

---

## 1. Product rules (STRICT)

1. **No near-duplicate styles anywhere.** One pattern per role (text link, tertiary icon+text CTA, filter pill active, primary CTA, etc.). Do not invent parallel colors/hover for the “same” control on different screens.
2. **Proper DS, strict on pages.** Page work uses UXDS components / tokens / kits + the project brand theme only. **No custom one-off CSS** unless absolutely needed.
3. **Deviations must be registered.** If a page needs something the kit does not cover, add a **named, documented, reusable** DS class/deviation — not an anonymous page hack. Registry: [../uxds/DEVIATIONS.md](../uxds/DEVIATIONS.md).
4. **Brand theme is optional.** Shared components must look correct on **UXDS baseline** colors when the project theme is off. Theme files only **remap** CSS variables; they must not be the only place raw brand values live for shared chrome.

---

## 2. Token stack (mandatory)

```
UXDS baseline (:root in src/uxds/tokens/*.css)
        ↓ remapped by
Project theme ([data-proto-project="<id>"] in styleguide/theme.css)
        ↓ consumed by
Shared components / kits (var(--uxds-…), var(--gap-…), …)
        ↓ composed by
Page screens (structure + layout; no parallel palettes)
```

| Layer | Owns | Forbidden |
|-------|------|-----------|
| **UXDS baseline** | Semantic token **names** + default Concept values | Project-only hex living only in page CSS |
| **Project `theme.css`** | Remap `--uxds-*` (and `--project-*` brand facts) under `[data-proto-project]` | Component rules, hover forks, layout hacks |
| **Shared components** | Anatomy + states via `var(--uxds-…)` | Hardcoded Boots (or any brand) hex |
| **Page CSS** | Layout, grid, concept structure measured from Make | Inventing a second link/chip/CTA palette |

---

## 3. How to turn brand theme off

| Method | Effect |
|--------|--------|
| Remove / do not set `data-proto-project` on the host | Project remap selectors no longer match |
| Do not import `src/projects/<id>/styleguide/theme.css` | No brand overrides load |

**Verify:** Shared controls (`.uxds-link`, `.uxds-filter-chip`, `.uxds-btn-primary`, tertiary CTA) still render with UXDS `:root` defaults — readable, consistent, no missing colors.

Boots import order (see `src/styles/index.css`): UXDS tokens → UXDS component CSS → `boots-pharmacy/styleguide/theme.css` → globals.

---

## 4. One pattern per role (examples)

| Role | Canonical pattern | Do not |
|------|-------------------|--------|
| Regular text link | `.uxds-link` → `--uxds-text-link-link` | Per-screen `#012169` / underline forks |
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
- Temporary Make bridge CSS while a screen is not yet React (retire screen-by-screen)
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

---

## Related

- [FE_STANDARDS.md](./FE_STANDARDS.md)  
- [VISUAL_FIDELITY.md](./VISUAL_FIDELITY.md)  
- [PROJECT_STYLEGUIDE.md](./PROJECT_STYLEGUIDE.md)  
- [COMMAND_DOCTRINE.md](./COMMAND_DOCTRINE.md)  
- [../uxds/TOKEN_BRIDGE.md](../uxds/TOKEN_BRIDGE.md)  
- [../uxds/DEVIATIONS.md](../uxds/DEVIATIONS.md)

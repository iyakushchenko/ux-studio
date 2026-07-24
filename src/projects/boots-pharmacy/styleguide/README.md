# Boots Pharmacy — project styleguide (brand delta)

**Project id:** `boots-pharmacy`  
**Scope:** `[data-studio-project="boots-pharmacy"]` via `theme.css`  
**Contract:** `theme.css` **remaps CSS variables only** — no component rules. See [DS_STRICTNESS.md](../../../../docs/product/DS_STRICTNESS.md).

**Rule:** Visual L&F of the source concept is mandatory; brand may override UXDS color tokens in `theme.css`. Rebuilds also require **behavior parity** with prior Legacy interactions ([VISUAL_FIDELITY.md](../../../../docs/product/VISUAL_FIDELITY.md) §1.1).

### Turn theme off

Remove `data-studio-project="boots-pharmacy"` and/or skip importing this `theme.css`. Shared UXDS controls fall back to Concept baselines in `src/uxds/tokens/design.css`.

## Brand facts

| Role | Value | Notes |
|------|-------|--------|
| Primary teal | `#467672` | Brand mid → `--project-brand-primary` |
| Primary darkest | `#305854` | Remaps UXDS primary solid |
| Primary light | `#AFCCCA` | Secondary borders, badges |
| Primary soft | `#c6e5e1` | Progress / checkbox hover → `--uxds-surface-accent-soft` |
| Commerce navy CTA | `#012169` | Remaps commerce + body-link tokens (not UXDS primary solid) |

## Concept visual fidelity (locked)

Rebuilds must **look like the existing Legacy / concept pages**, not a cleaner generic DS restyle. Remap UXDS colors via this theme; do not redesign chrome. **No visual zoo** — same mint active language as sibling controls on a surface (e.g. Availability List/Map `#c6e5e1`); secondary filters stay mini / lower contrast.

| Control | Source look (Book Step 1 Legacy) | Do not |
|---------|--------------------------------|--------|
| **Search / text fields** | Pill: `border-radius: 360px`, border `#c3c3c3` | Sharp / `border-radius: 0`, inventing a new radius |
| **Progress stepper** | Flat 8px bars — active `#c6e5e1`, inactive `#ffffff`; ~560px row; 10px labels | UXDS-styled track with radius/border |
| **Checkbox** | 24×24, `border-radius: 2px`; unchecked white/`#afafaf`; checked fill `#c6e5e1` + mark `#3A3A3A`; **must toggle** `includeBoosterDose` | Native OS checkbox / DS accent-color restyle / static non-interactive shell |
| **Primary CTA** | Navy pill `#012169`, `border-radius: 360px`; Continue gated on location | Teal-only “DS primary” restyle |

Measure from Legacy classes / live wire CSS. Document PO-approved deltas here only.

## Files

| File | Role |
|------|------|
| `theme.css` | **Variable remaps only** → Boots brand under `[data-studio-project]` |
| `assets/` | Logos (add when needed) |

## Agent rule

Build with UXDS structure + this delta. Shared components use `var(--uxds-…)`, not hardcoded Boots hex. Visible styling follows the Boots concept source. Migrate Legacy interactions onto React screens. Do not hardcode Boots teal into other projects. Deviations → [DEVIATIONS.md](../../../../docs/uxds/DEVIATIONS.md). See [DS_STRICTNESS.md](../../../../docs/product/DS_STRICTNESS.md), [VISUAL_FIDELITY.md](../../../../docs/product/VISUAL_FIDELITY.md), [PROJECT_STYLEGUIDE.md](../../../../docs/product/PROJECT_STYLEGUIDE.md), and [PAGE_BUILD_CONTRACT.md](../../../../docs/product/PAGE_BUILD_CONTRACT.md) §5.

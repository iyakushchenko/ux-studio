# Frontend standards — React concept screens

**Status:** Locked (Product Owner, 2026-07-19)  
**Audience:** Every agent building or rebuilding concept UI in `src/projects/*`.  
**Companions:** [DS_STRICTNESS.md](./DS_STRICTNESS.md) · [VISUAL_FIDELITY.md](./VISUAL_FIDELITY.md) · [PAGE_BUILD_CONTRACT.md](./PAGE_BUILD_CONTRACT.md) · [INTERACTION_FIDELITY.md](./INTERACTION_FIDELITY.md) · [FE_UI_UX_AUDIT.md](./FE_UI_UX_AUDIT.md)

**DS strictness (PO):** No near-duplicate styles; pages use UXDS + project theme only; deviations must be registered — [DS_STRICTNESS.md](./DS_STRICTNESS.md) · [../uxds/DEVIATIONS.md](../uxds/DEVIATIONS.md).

---

## 1. Icon + text CTAs (CRITICAL)

Short CTAs with an icon beside a label **must stay on one line**.

| Do | Do not |
|----|--------|
| `display: inline-flex`, `flex-wrap: nowrap`, `align-items: center`, `gap` | Let the label wrap under the icon |
| `white-space: nowrap` on the control (and label span if needed) | `flex-wrap: wrap` on short tertiary CTAs / chips / pills |
| `flex-shrink: 0` on the icon | Shrink the icon so text reflows awkwardly |

Applies to: “See what’s available near me”, Change / Change location, and any similar tertiary icon+text control unless the **source concept** is explicitly multi-line.

### 1.1 One tertiary icon language (CRITICAL)

Sibling **tertiary icon+text** CTAs on the same surface must share **one** icon treatment.

| Rule | Expectation |
|------|-------------|
| **Pick a baseline** | When merging siblings, pick one control as the visual merge target (Book Step 1 Change / pencil: `--uxds-icon-icon-accent-soft` → `--uxds-text-link-link` hover) |
| **Match baseline** | Rest fill/stroke color, size (e.g. 16×16), weight (simple line/glyph — **not** a filled dark circular badge), hover color shift |
| **Same string/role → one component** | Identical CTA copy that appears on multiple surfaces must share **one** component — do not fork FilterChip vs tertiary markup |

### 1.2 Near-me CTA (CRITICAL)

**“See what’s available near me”** — Book Step 1 search row **and** Availability Tool search row — **must** use shared `NearMeCta` (`src/projects/boots-pharmacy/chrome/NearMeCta.tsx`).

| Rule | Expectation |
|------|-------------|
| **Source of truth** | Availability popup / Legacy tertiary beside search (`.studio-tertiary-cta--compact` + 16×16 map-pin + nowrap) — **not** a FilterChip restyle and **not** a Change-pencil one-off fork |
| **Placement** | Right of the search field when the concept shows side-by-side (Legacy `Frame209` / `.proto-avail-search-row`) |
| **Shared class** | `.proto-near-me-cta` on top of tertiary compact chrome — typography, color, icon, hover stay in sync |

Search-field glyphs inside inputs are a **different** family (field chrome) — do not force them onto the tertiary CTA palette unless the concept ties them together.

### 1.3 Availability list filter pills

Secondary pills (**All locations** / **Slots available**): use **`.uxds-filter-chip--strong`** (registered). Inactive = quiet outline/neutral; **selected** = `--uxds-filter-chip-surface-selected-strong` + inverse text (Boots theme → `var(--project-brand-primary)` / `#467672`, **not** UXDS `:root` `#305854`). Keep mini vs List/Map hierarchy. Do **not** use mint / badge selected for this role. **Gate:** `npm run check:theme-brand` (Auto-Rule `theme-brand-active`).

---

## 2. Regular text links (CRITICAL)

Body + footer-style text links (**Learn more**, **Show on map**, FAQs, help tel, forgot-password) **must** share **one** pattern. Do not invent per-screen link colors or underline forks.

| Token | Value |
|-------|--------|
| **Class** | `.uxds-link` (`src/uxds/components/text-link.css`) |
| **Tokens** | `--uxds-text-link-link` / `--uxds-text-link-link-hover` |
| **UXDS baseline** | Teal Concept (`#305854` / darker hover) |
| **Boots theme** | Remaps to commerce navy (`#012169` / `#01318f`) |
| **States** | Rest: **no** underline; hover: **underline**; focus-visible: 2px outline in link color |

Legacy aliases (same rule block — not near-dups): `.proto-avail-link`, `.proto-recipient-picker__link`.  
Legacy `.proto-link` / footer links share this **same** underline contract (no underline rest → underline hover). Migrated React surfaces use `.uxds-link` + tokens; do **not** ship a second “always underlined” Learn more.

**Guard:** `npm run check:links` (`scripts/check-text-link-contract.mjs`) — fails if Book Step 1 Learn more / `.uxds-link` diverge from the footer-like contract. Wired into `npm test`.

| Family | Do not force into `.uxds-link` |
|--------|--------------------------------|
| Tertiary icon+text CTAs | Change location, near-me — §1 |
| Breadcrumb Home | Teal `--uxds-text-link-link-dark` crumb chrome (Legacy; own underline language) |


---

## 3. Content column / logo alignment

Boots (and matching Studio chrome) use:

```
full-bleed band
  → shell: max-width 1440px, margin auto, padding-left/right 64px
  → inner: max-width 1312px, width 100%, margin auto
```

Same grid as header logo container and `Footer` (`.proto-footer__shell` / `__shell-inner`).

**Do not** put horizontal `padding: 64px` on the **1312px** inner — that double-insets crumbs and content past the logo edge.

---

## 4. Visual fidelity

Concept L&F is mandatory. See [VISUAL_FIDELITY.md](./VISUAL_FIDELITY.md).

- Rebuilds require a **written design-delta checklist** (§1.2) including **background fills**.
- Prefer Legacy **computed** styles (live wire CSS) over inventing UXDS-looking backgrounds.

---

## 5. Behavior parity

Screen rebuild = visual + behavior. Migrate every Legacy interaction that already worked. See [VISUAL_FIDELITY.md](./VISUAL_FIDELITY.md) §1.1 and [INTERACTION_FIDELITY.md](./INTERACTION_FIDELITY.md).

---

## 6. Hover / focus / active

Migrate Legacy `:hover`, `:focus-visible`, and `:active` (and short transitions) into kit or **co-located screen CSS**. Do not ship flat CTAs/inputs/chips that only paint the resting state.

---

## 7. Scoped CSS

| Do | Do not |
|----|--------|
| Co-locate screen CSS next to the React screen (e.g. `book-step-1-location.css`) for **layout** | Grow monster global sheets for one screen’s chrome |
| Consume `var(--uxds-…)` for shared control colors | Hardcode brand hex in page/shared CSS (put remaps in `theme.css`) |
| Register a named deviation when a new variant is required | Anonymous page hacks / parallel hover palettes |
| Keep UXDS kit CSS lean and valid (no empty declarations) | Paste Figma export noise / blank rule bodies into shared kits |

See [DS_STRICTNESS.md](./DS_STRICTNESS.md).


---

## 8. Short labels & pills

Use `nowrap` for short CTAs, chips, crumb current labels, and tertiary pills unless the concept shows multi-line text.

---

## 9. UI motion — `framer-motion` (NON-NEGOTIABLE)

**Default library:** [`framer-motion`](https://www.npmjs.com/package/framer-motion) (direct `package.json` dependency). Import from `@/uxds/motion` (see [MOTION.md](./MOTION.md)).

| Do | Do not |
|----|--------|
| `motion.*` + `AnimatePresence` for mount/unmount, layout, panel swaps | Invent parallel CSS `@keyframes` zoos for UI chrome |
| Shared timings in `src/app/nav/studioMotion.ts` for shell | Hand-roll width/opacity JS without the library |
| Register a DS deviation if a bespoke animation is truly required | Claim “we use framer-motion” without importing it |

**Allowed without deviation:** trivial one-property CSS transitions (e.g. hover `color` / `opacity`); Legacy-parity ports while a screen is still bridged.

**Honesty (2026-07-19):** Before this checkpoint, `package.json` listed unused `motion` (no `src/` imports). Touchpoint label resize was custom CSS (`width 0.34s ease`); Playback↔Rec swapped with a hard mount/unmount. Now: direct dependency `framer-motion@12.42.2` is imported and used for panel swap + touchpoint label width. Studio LED blink keyframes in `studioNavPanel.css` remain CSS until migrated (register if expanded).

**Shell reference:** `StudioNavScenarioControls` — `AnimatePresence mode="wait"` on `.studio-nav-scenario__panel-swap`.

---

## Agent checklist (FE)

1. Content shell matches logo column (1440 / 64 / 1312).  
2. Icon+text CTAs are single-line (`inline-flex` + `nowrap`).  
3. Sibling tertiary CTAs share one icon language (baseline chosen and applied).  
4. Same CTA string/role → one shared component (near-me → `NearMeCta`).  
5. Availability secondary filters use `.uxds-filter-chip--strong` (not mint selected).  
6. Regular text links use `.uxds-link` + link tokens (§2) — footer-like underline (rest off / hover on); `npm run check:links`.  
7. Hover/focus/active ported from Legacy.  
8. Design-delta table written (fills in scope).  
9. Behavior parity verified.  
10. No near-duplicate control styles; deviations registered if needed.  
11. CSS scoped to the screen/kit — build still passes.  
12. UI motion uses `framer-motion` (§9) — no new keyframe zoos.

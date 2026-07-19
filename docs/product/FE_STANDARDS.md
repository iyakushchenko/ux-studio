# Frontend standards — React concept screens

**Status:** Locked (Product Owner, 2026-07-19)  
**Audience:** Every agent building or rebuilding concept UI in `src/projects/*`.  
**Companions:** [VISUAL_FIDELITY.md](./VISUAL_FIDELITY.md) · [PAGE_BUILD_CONTRACT.md](./PAGE_BUILD_CONTRACT.md) · [INTERACTION_FIDELITY.md](./INTERACTION_FIDELITY.md) · [FE_UI_UX_AUDIT.md](./FE_UI_UX_AUDIT.md)

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
| **Pick a baseline** | When merging siblings, pick one control as the visual merge target (Book Step 1: **Change** / pencil) |
| **Match baseline** | Rest fill/stroke color, size (e.g. 16×16), weight (simple line/glyph — **not** a filled dark circular badge), hover color shift |
| **Book Step 1 baseline** | Change: `#AFCCCA` at rest → `#012169` on hover; label `#5c5c5c` → `#000` on hover; transparent hit area |
| **Normalize outliers** | If Make near-me used navy icons, still normalize to the Change baseline when PO asks for one language |

Search-field glyphs inside inputs are a **different** family (field chrome) — do not force them onto the tertiary CTA palette unless the concept ties them together.

---

## 2. Content column / logo alignment

Boots (and matching Studio chrome) use:

```
full-bleed band
  → shell: max-width 1440px, margin auto, padding-left/right 64px
  → inner: max-width 1312px, width 100%, margin auto
```

Same grid as header logo container and `ProtoFooter` (`.proto-footer__shell` / `__shell-inner`).

**Do not** put horizontal `padding: 64px` on the **1312px** inner — that double-insets crumbs and content past the logo edge.

---

## 3. Visual fidelity

Concept L&F is mandatory. See [VISUAL_FIDELITY.md](./VISUAL_FIDELITY.md).

- Rebuilds require a **written design-delta checklist** (§1.2) including **background fills**.
- Prefer Make **computed** styles (live wire CSS) over inventing UXDS-looking backgrounds.

---

## 4. Behavior parity

Screen rebuild = visual + behavior. Migrate every Make interaction that already worked. See [VISUAL_FIDELITY.md](./VISUAL_FIDELITY.md) §1.1 and [INTERACTION_FIDELITY.md](./INTERACTION_FIDELITY.md).

---

## 5. Hover / focus / active

Migrate Make `:hover`, `:focus-visible`, and `:active` (and short transitions) into kit or **co-located screen CSS**. Do not ship flat CTAs/inputs/chips that only paint the resting state.

---

## 6. Scoped CSS

| Do | Do not |
|----|--------|
| Co-locate screen CSS next to the React screen (e.g. `book-step1-location.css`) | Grow monster global sheets for one screen’s chrome |
| Override UXDS defaults **under a screen host** when concept chrome differs | Rewrite UXDS baselines for a one-off look |
| Keep UXDS kit CSS lean and valid (no empty declarations) | Paste Figma export noise / blank rule bodies into shared kits |

---

## 7. Short labels & pills

Use `nowrap` for short CTAs, chips, crumb current labels, and tertiary pills unless the concept shows multi-line text.

---

## Agent checklist (FE)

1. Content shell matches logo column (1440 / 64 / 1312).  
2. Icon+text CTAs are single-line (`inline-flex` + `nowrap`).  
3. Sibling tertiary CTAs share one icon language (baseline chosen and applied).  
4. Hover/focus/active ported from Make.  
5. Design-delta table written (fills in scope).  
6. Behavior parity verified.  
7. CSS scoped to the screen/kit — build still passes.

# Page build contract — React + UXDS

**Status:** Locked direction (Product Owner, 2026-07-19)  
**Applies to:** Concept UI inside `src/projects/<project-id>/`  
**Ready to consume a concept frame?** Yes — first frame also stands up `src/uxds/` token bridge + React module pattern. Existing Boots Legacy wire stays until replaced screen-by-screen.  
**Intake:** PO feeds are often early/messy; agent upgrades — [CONCEPT_INTAKE.md](./CONCEPT_INTAKE.md).  
**Inheritance (HARD):** Before any new/migrated page — [PAGE_CREATE_INHERITANCE.md](./PAGE_CREATE_INHERITANCE.md) P1–P6 (UXDS map → similar frame → existing UXML kits/pages → theme delta only).

---

## 1. North star

Every client-facing concept screen in Studio is **React** expressed through **UXDS** (tokens + closest modules) — even when the Figma source was rough.

```
Early concept (messy OK)  →  Agent: React + UXDS upgrade  →  Project screens  →  Journeys / recording
```

Figma Legacy / static strips are **intent only**. Not the architecture we grow.

**Page create law:** Check existing UXML + similar UXDS page first; inherit kits/structure; project theme = brand/copy delta only — [PAGE_CREATE_INHERITANCE.md](./PAGE_CREATE_INHERITANCE.md).

---

## 2. What “full fledged design system” means here

| Concern | Expectation |
|---------|-------------|
| **Variables** | UXDS semantic names for structure; **project theme** remaps brand colors/logos ([PROJECT_STYLEGUIDE.md](./PROJECT_STYLEGUIDE.md)) |
| **Components** | Buttons, inputs, cards, modals, nav patterns as reusable React modules — not per-screen copy-paste |
| **Interaction** | Anticipated controls must work before recording is expected — shared kits under `src/uxds/interactions/` ([INTERACTION_FIDELITY.md](./INTERACTION_FIDELITY.md)) |
| **Reuse** | Maximize UXDS + internal ready components + interaction kits; when PO asks for a page “from what we have,” compose — don’t invent ([CONCEPT_INTAKE.md](./CONCEPT_INTAKE.md) §5 mode B) |
| **Patterns** | Styleguide patterns reused across projects; brand identity stays in the project delta |
| **Wiring for Studio** | Semantic native controls plus stable `data-name` / `data-studio-*` / screen registry so playback + recording keep working. Preserve action identity and state (`aria-selected` / `aria-checked` / stable selection hooks), not layout coordinates. |
| **DOM/HTML structure** | Design2code / code2design traceability with the UXDS component/module — not just "the right tokens/classNames appear somewhere on the page." See §2a. |

### 2a. Design2code / code2design traceability (PO, 2026-07-24, refined same day)

Using the right UXDS token or component name is not sufficient on its own, but the bar is **traceability, not literal DOM-nesting parity**:

- **design2code:** given a UXDS component's real definition, the code's structure and semantic roles should be derivable from it — same composition intent (card → header → content → footer, wrapper → media → body → actions), even if the literal element tree differs.
- **code2design:** given the code, every element should trace back to a real UXDS component/token/role — no invented structure, no renamed roles, no orphaned markup that doesn't map to anything in the design system.

**Discrepancies are fine** where they exist *because* code has different, legitimate constraints than a Figma layer tree — e.g. dropping a Figma layout-only wrapper div that has no semantic purpose in HTML, or using a real `<button>` where Figma has a rectangle+text. What's **not** fine is drift that breaks the mapping either direction: a component that looks right but isn't actually built from the UXDS piece it claims to be, or code structure a designer couldn't map back to the source component if asked.

Why this matters beyond visuals: traceability is what makes CSS cascade/layer correctness ([DS_STRICTNESS.md](./DS_STRICTNESS.md) §2's BASE→THEME→PANEL→LEGACY order) and a future FE handoff ([CX_CONVEYOR.md](./CX_CONVEYOR.md) Stage 5) trustworthy — a page an FE team can implement *against*, not just look at.

Look up the real structure before composing: [UXDS_MAP.md](../uxds/UXDS_MAP.md) → `inventory/components.json` / [COMPONENTS.md](../uxds/COMPONENTS.md) for the component's actual layer tree. Do not infer structure from a flat Legacy/concept frame.

---

## 3. Engine vs project pages

| Surface | Stack | Design system |
|---------|-------|---------------|
| **Studio shell** (`src/app/`) | React | Lean chrome OK; may adopt UXDS tokens later for consistency |
| **Concept pages** (`src/projects/*`) | React | UXDS structure + **project styleguide delta** for brand |

Playback, orchestra, and recording attach to **stable selectors and screen ids**, not to Make’s absolute positioning quirks.

---

## 4. Boots today vs target

| Today (test rabbit) | Target |
|---------------------|--------|
| Large Legacy-derived wire / DOM overlays | React screens composed from UXDS components |
| Imperative DOM scripts for many interactions | React state + **shared interaction kits** (`src/uxds/interactions/`); small DOM bridges only where Studio needs them — not per-screen script sprawl |
| Fast demo value | Same demo value **plus** maintainable, design-system-aligned UI |

Boots remains the **first rabbit**: we prove the rebuild pipeline on Boots, then apply it to the next project.

---

## 5. Visual fidelity (locked — PO)

**Full doctrine:** [VISUAL_FIDELITY.md](./VISUAL_FIDELITY.md).  
**FE craft rules:** [FE_STANDARDS.md](./FE_STANDARDS.md) · [DS_STRICTNESS.md](./DS_STRICTNESS.md) (one pattern per role; UXDS + theme only; deviations registered).

**Visual look & feel of the source concept is mandatory.** Aesthetic DS “upgrades” are not.

- Stick to the previous concept look (Legacy / live wire) — progress, search, buttons, checkboxes, spacing, radii — even if it feels “shitty.”
- Do **not** restyle toward a cleaner generic DS look.
- UXDS is for **structure and reuse under the hood**; **visible chrome must match the source page** (measure from original CSS / Legacy — do not invent).
- **No visual zoo** — reuse the same active/inactive language within a surface; secondary selectors are mini / lower contrast vs primary chrome.
- **Behavior parity** — rebuilds must keep every Legacy/concept interaction that already worked (checkbox, Continue gating, search/near-me, Change, crumbs, etc.) unless the PO retires it. See [VISUAL_FIDELITY.md](./VISUAL_FIDELITY.md) §1.1 and [INTERACTION_FIDELITY.md](./INTERACTION_FIDELITY.md) §2.4.
- **Content column** — crumbs/main share the header logo grid (shell max **1440** + **64px** side pad → inner max **1312**). Never pad the 1312 inner horizontally.
- **Icon+text CTAs** — single line (`inline-flex` + `white-space: nowrap`); label must not wrap under the icon.
- **Brand may remap UXDS color tokens** via the project theme (`styleguide/theme.css` — **variables only**) so semantic roles carry Boots/concept colors — that is expected, not a license to redesign chrome. Theme is optional; without it, UXDS baselines apply.
- **No near-duplicate styles** — one pattern per role; page one-offs forbidden unless registered ([DS_STRICTNESS.md](./DS_STRICTNESS.md), [../uxds/DEVIATIONS.md](../uxds/DEVIATIONS.md)).
- Document intentional deltas only when the PO asks to change the concept look.

---

## 6. Build order for a screen (agent checklist)

1. Open PO concept URL; classify early strip vs structured page ([CONCEPT_INTAKE.md](./CONCEPT_INTAKE.md)).
2. Extract intent (flow, hypothesis) — do not require DS-perfect source.
3. Run the project interaction inventory before composition; reuse established target/component conventions. For a Legacy → React migration, save the current page map as the parity baseline ([INTERACTION_INVENTORY.md](./INTERACTION_INVENTORY.md)).
4. Map regions → UXDS tokens + closest `component.*` / `module.*`.
5. Compose React screen; **match concept visuals**; use UXDS for structure/reuse, not a visual redesign. Apply [FE_STANDARDS.md](./FE_STANDARDS.md) (shell/logo column, icon+text nowrap, scoped CSS).
6. **Audit prior Legacy/concept handlers** on that screen; migrate each to React props / shared kits (behavior parity). Mark React-owned controls so Legacy DOM mutators skip them.
7. **Build anticipated interactivity** from page context (and CJM deck when provided) via shared kits — CTAs, filters, accordions, forms, etc. ([INTERACTION_FIDELITY.md](./INTERACTION_FIDELITY.md)). Prefer library reuse over one-off scripts.
8. Register screen + stable semantic action/state hooks for cursor, touchpoints, and recording. A migration may redesign layout, but it must preserve screen ids, action intent, modal ownership, and observable selected/checked state; never leave a visual-only wrapper as the replay target.
9. Run **Map current page interactions**. Fix `invalid`; review every `semantic-ready`/`visual-candidate`; compare migrations against the legacy baseline and explain any retired target.
10. Wire journey beats / scripts as needed (thin; not duplicate DS behavior).
11. Smoke: browse + happy-path controls respond (including migrated Legacy behaviors) + existing recorded playback paths that hit the screen. No silent target skip: a removed/renamed action requires an explicit compatibility migration or PO retirement.
12. Only then treat the page as **record-ready**; attach/download the inventory result in the page handoff.

---

## 7. What we will not do

- Grow new concept features as permanent Legacy HTML.
- Invent a second parallel design system in code that ignores UXDS names.
- Refuse a concept because Figma “isn’t on the DS yet” — **filling that gap is the job**.
- “Improve” concept visuals with generic DS polish (rounded cards, sharper inputs, new color ramps) unless the PO asks.
- Rebuild to React and drop prior Legacy interactions (static shell) — visual + behavior parity are both required.
- Grow gigantic custom imperative scripts per screen that duplicate accordion/dropdown/filter/modal behavior — extend `src/uxds/interactions/` instead.
- Expect recording on pages that lack the interactive components the scenario needs.
- Block **engine** work on a full Boots rewrite.

---

## 8. CSS architecture (PO answer — locked)

**Direction: yes — React screens get scoped / co-located CSS (or small kit CSS under `src/uxds/`), not a growing Legacy-style monster stylesheet per screen.**

| Layer | Where | Role |
|-------|--------|------|
| **UXDS tokens** | `src/uxds/tokens/` | Shared structure / semantic roles |
| **Kit CSS** | `src/uxds/components/*.css` (+ interaction kit styles as needed) | Reusable control chrome + **hover/focus/active** defaults |
| **Screen CSS** | Co-located next to the React screen (e.g. `screens/book-step-1/book-step-1-location.css`) | Layout + concept-specific overrides only |
| **Project theme** | `src/projects/<id>/styleguide/theme.css` | Brand color / logo remaps — not a second DS |
| **Legacy wire CSS** | `src/styles/globals-*.css` | Unmigrated screens + shared overlays until replaced |

**How monster CSS goes away:** screen by screen. When a Legacy page is rebuilt in React, its rules move into kit + co-located screen CSS; the global Legacy sheet shrinks for that surface. We do **not** rewrite `globals-screens.css` overnight.

**Interaction states travel with the kit/screen CSS** — `:hover` / `:focus-visible` / `:active` / transitions from Legacy must land in the React path (not left as flat dead controls). See [INTERACTION_FIDELITY.md](./INTERACTION_FIDELITY.md) and Book Step 1 parity table in [BOOTS_REACT_SCREEN_PILOT.md](../projects/boots-pharmacy/BOOTS_REACT_SCREEN_PILOT.md).

---

## Related

- [FE_STANDARDS.md](./FE_STANDARDS.md) — icon+text nowrap, content column, scoped CSS
- [CONCEPT_INTAKE.md](./CONCEPT_INTAKE.md) — business intake logic
- [VISUAL_FIDELITY.md](./VISUAL_FIDELITY.md) — concept L&F, no visual zoo, control hierarchy
- [INTERACTION_FIDELITY.md](./INTERACTION_FIDELITY.md) — recording prerequisite + shared behavior library
- [UXDS_ACCESS.md](./UXDS_ACCESS.md)
- [PRODUCT_OWNER_BRIEF.md](./PRODUCT_OWNER_BRIEF.md)
- [../shell/PROJECTS.md](../shell/PROJECTS.md)

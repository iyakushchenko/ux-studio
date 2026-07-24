# Project styleguide (brand delta)

**Status:** Locked (Product Owner, 2026-07-19)  
**Why:** Concepts often bring their **own** primary colors, logos, accent ramps, etc. Without a per-project delta, every Studio project would look like the same generic UXDS brand — awful for discovery and client proofing.  
**Strictness:** Theme is **optional**; shared UI must work on UXDS baselines — [DS_STRICTNESS.md](./DS_STRICTNESS.md).

---

## 1. Two layers

```
┌─────────────────────────────────────────┐
│  UXDS / UXML BASE  (src/uxds/)          │
│  Shared structure, roles, type, space   │
│  Kits + semantic names + :root defaults │
│  Keep as mutual as possible across      │
│  projects (refapp quality bar)          │
└─────────────────────────────────────────┘
                    ↑ remapped by (optional)
┌─────────────────────────────────────────┐
│  PROJECT styleguide / theme (delta)     │
│  src/projects/<id>/styleguide/          │
│  Brand primary, logos, accents, fonts   │
│  Concept copy cues from coarse Legacy     │
│  CSS variables ONLY under               │
│  [data-studio-project="<id>"]            │
│  Small helper — not a second DS         │
└─────────────────────────────────────────┘
```

| Layer | Owns | Does not own |
|-------|------|--------------|
| **UXDS / UXML BASE** | Roles, spacing, kit anatomy, hover/focus, Accordion/Button/link | Client brand identity |
| **Project delta** | Remap `--uxds-*` brand facts + logos/fonts from coarse concepts | Component rules, hover forks, layout hacks, reinventing buttons |

**HARD:** Page create must inherit BASE kits first — [PAGE_CREATE_INHERITANCE.md](./PAGE_CREATE_INHERITANCE.md). Theme grows only when the concept brings a real brand fact.

### When theme applies vs when direct UXDS parity is required (PO, 2026-07-24)

**Default:** every project page adheres to **its own project theme** (brand delta above BASE) — this is the normal case for a client brand concept (e.g. `boots-pharmacy`).

**Exception:** a page built **for UXDS itself** (the reference project, `label: "UXDS - Larkin"`, `id: "puma"` in the registry — see [PROJECT_CONTRACT.md](./PROJECT_CONTRACT.md)) gets **no brand delta at all**. Theme stays off; the page must match UXDS **exactly** — structure, naming, tokens, variables — with zero remap. The whole point of that project is to be the undiluted UXDS reference, not another brand skin. Do not add a `theme.css` for it, do not set project-brand tokens, do not treat UXDS "defaults" as just another project's palette.

If it's unclear which case applies: is this page proving a **client concept**, or is it proving **UXDS itself**? The former gets a theme; the latter gets 1:1 parity.

---

## 2. What goes in the project styleguide

Capture from the PO concept (even if messy):

- Brand / project display name  
- Logo(s) — light/dark/mark as needed  
- Primary, secondary, accent (and light/dark variants if present)  
- Optional: link color, focus ring, success/warning if concept redefines them  
- Optional: brand font family override  
- Notes: “Boots teal `#467672` / darkest `#305854`” etc.

Document in markdown + express in a **small CSS theme file**.

---

## 3. Target files (per project)

```
src/projects/<project-id>/
  styleguide/
    README.md           # human: brand delta notes + source Figma
    theme.css           # small helper — CSS variables that override/remap UXDS roles
    assets/             # logos, brand marks (optional)
```

Example `theme.css` shape (illustrative):

```css
/* boots-pharmacy brand delta — remaps UXDS semantic roles */
[data-studio-project="boots-pharmacy"] {
  --project-brand-primary: #467672;
  --project-brand-primary-darkest: #305854;
  --project-brand-primary-light: #afccca;

  /* Remap shared UXDS roles used by components */
  --uxds-input-button-surface-surface-primary-solid: var(--project-brand-primary-darkest);
  --uxds-icon-icon-accent-strong: var(--project-brand-primary);
}
```

Scope theme under the project root attribute (or equivalent) so **projects never leak brand into each other**.

---

## 4. Agent obligations on concept intake

When building pages from a PO concept:

1. Extract brand delta (colors, logos, fonts) even if the frame is not UXDS-bound.  
2. Create/update `styleguide/README.md` + `theme.css` for that project.  
3. Build React with **UXDS structure/reuse** + **project theme** for brand — **visual L&F of the source concept is mandatory**; do not restyle toward a cleaner generic DS look.  
4. **Brand may remap UXDS color tokens** in `theme.css` to match the concept; measure radii/chrome/checkboxes from source CSS — do not invent.  
5. Never hardcode a second project’s Boots teal into a new brand project.  
6. Never force every project to use UXDS default Concept palette as the visible brand.

See [PAGE_BUILD_CONTRACT.md](./PAGE_BUILD_CONTRACT.md) §5 (visual fidelity).

---

## 5. What “small CSS helper” means

- Prefer **dozens of lines**, not a parallel design system.  
- Override / remap existing UXDS semantic variables **only** — no selectors that style components.  
- Add `--project-*` only for brand facts (logo sizes, brand fonts, raw brand hex).  
- Do **not** copy-paste a full token dump per project.  
- Do **not** be the only place raw values live for shared components — baselines stay in `src/uxds/tokens/`.

---

## 6. Turning brand theme off

| Method | Effect |
|--------|--------|
| Remove `data-studio-project="<id>"` from the host | Remap block does not match |
| Skip importing `styleguide/theme.css` | No brand overrides load |

Shared components (`.uxds-link`, `.uxds-filter-chip`, `.uxds-btn-primary`, tertiary CTA) must still render correctly on UXDS `:root` defaults. Verify when changing kit CSS.

---

## Related

- [DS_STRICTNESS.md](./DS_STRICTNESS.md)  
- [CONCEPT_INTAKE.md](./CONCEPT_INTAKE.md)  
- [PAGE_BUILD_CONTRACT.md](./PAGE_BUILD_CONTRACT.md)  
- [../uxds/TOKEN_BRIDGE.md](../uxds/TOKEN_BRIDGE.md)  
- [../uxds/DEVIATIONS.md](../uxds/DEVIATIONS.md)  
- [../shell/PROJECTS.md](../shell/PROJECTS.md)

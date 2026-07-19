# Project styleguide (brand delta)

**Status:** Locked (Product Owner, 2026-07-19)  
**Why:** Concepts often bring their **own** primary colors, logos, accent ramps, etc. Without a per-project delta, every Studio project would look like the same generic UXDS brand — awful for discovery and client proofing.

---

## 1. Two layers

```
┌─────────────────────────────────────────┐
│  UXDS base  (src/uxds/)                 │
│  Shared structure, roles, type, space   │
│  Semantic names: uxds-text/*, gap/*, …  │
└─────────────────────────────────────────┘
                    ↑ remapped by
┌─────────────────────────────────────────┐
│  PROJECT styleguide / theme (delta)     │
│  src/projects/<id>/styleguide/          │
│  Brand primary, logos, accents, fonts   │
│  Small CSS helper — not a second DS     │
└─────────────────────────────────────────┘
```

| Layer | Owns | Does not own |
|-------|------|--------------|
| **UXDS base** | Roles, spacing scale, component anatomy, semantic token **names** | Client brand identity |
| **Project delta** | Primary/secondary colors, logo assets, brand typeface overrides, accent ramps, any concept-specific tokens | Reinventing buttons/spacing from scratch |

Screens compose **UXDS structure** + **project brand values**.

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
[data-proto-project="boots-pharmacy"] {
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
3. Build React with **UXDS component patterns** + **project theme** for brand.  
4. Never hardcode a second project’s Boots teal into a new brand project.  
5. Never force every project to use UXDS default Concept palette as the visible brand.

---

## 5. What “small CSS helper” means

- Prefer **dozens of lines**, not a parallel design system.  
- Override / remap existing UXDS semantic variables.  
- Add `--project-*` only for brand facts (logo sizes, brand fonts).  
- Do **not** copy-paste a full token dump per project.

---

## Related

- [CONCEPT_INTAKE.md](./CONCEPT_INTAKE.md)  
- [PAGE_BUILD_CONTRACT.md](./PAGE_BUILD_CONTRACT.md)  
- [../uxds/TOKEN_BRIDGE.md](../uxds/TOKEN_BRIDGE.md)  
- [../shell/PROJECTS.md](../shell/PROJECTS.md)

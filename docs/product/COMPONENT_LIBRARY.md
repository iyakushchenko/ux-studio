# Component library — architect plan

**Status:** Locked direction (2026-07-19)  
**Audience:** Agents building / migrating concept pages.  
**Companions:** [PAGE_BUILD_CONTRACT.md](./PAGE_BUILD_CONTRACT.md) · [DS_STRICTNESS.md](./DS_STRICTNESS.md) · [CSS_BASE_THEME.md](./CSS_BASE_THEME.md) · [FE_STANDARDS.md](./FE_STANDARDS.md)

---

## 1. What “library” means here

Migrated concept pages are built from **real React components**, not Make HTML dumps treated as reusable units.

| Layer | Path | Role |
|-------|------|------|
| **UXDS components** | `src/uxds/components/` | Shared presentational kits (button, text-link, filter-chip, …) |
| **UXDS interactions** | `src/uxds/interactions/` | Shared behavior (disclosure, accordion, filter-chip toggle, …) |
| **Project chrome** | `src/projects/<id>/chrome/` | Brand/shell pieces (footer, near-me CTA, header mounts) |
| **Project screens** | `src/projects/<id>/screens/` | Page composition — wires kits + chrome |

**BASE + THEME:** Kit CSS lives in UXDS BASE (`src/uxds/`). Brand remaps only in project `styleguide/theme.css` (THEME). No anonymous page color forks ([CSS_BASE_THEME.md](./CSS_BASE_THEME.md)).

---

## 2. Hard rules for migrated pages

1. **Semantic HTML** — use real `<button>`, `<a>`, `<label>`, `<input>` (etc.) for interactive roles. Decorative wrappers are fine; fake clickable `<div>`/`<span>` for primary actions are not.
2. **Stable `data-name`** — keep Studio / Make-aligned `data-name` hooks on meaningful nodes so recording, MCP, and audits can target the same surface across rebuilds.
3. **Reuse across projects** — prefer UXDS kits + theme remaps. Project chrome only when the brand/shell truly differs.
4. **No Make HTML slop as the reusable unit** — Figma Make / wire HTML is bootstrap or LEGACY quarantine only. Do not extract Make markup into a “shared component” and ship it as the library. Rebuild into React + UXDS.
5. **One pattern per role** — [DS_STRICTNESS.md](./DS_STRICTNESS.md). Near-duplicate link/chip/CTA styles are defects.

---

## 3. Roadmap (grow by migration — not a big-bang false library)

Do **not** invent a large unused component catalog ahead of pages.

| Phase | What happens |
|-------|----------------|
| **Now** | Book Steps 1–3 React + shared kits: `BookAppointmentProgress`, `AppointmentSummaryPill` (+ ButtonPrimary / Availability / Login); PDP `PromoMessageStrip` (logo + copy + TertiaryCta slot) |
| **Next extract** | Only when a second screen needs it (e.g. breadcrumbs) — no speculative catalog |
| **Ongoing** | Each migration adds 0–N real, used components — library grows as a **byproduct of shipping pages** |
| **Never** | “Scaffold 40 unused DS components” as a milestone |

Success metric: a second project can theme + reuse kits without copying Boots page CSS.

---

## 4. Agent checklist (page migration)

- [ ] Interactive controls are semantic (`button` / `a` / form fields)
- [ ] `data-name` preserved or intentionally remapped (document if remapped)
- [ ] Shared role → existing UXDS kit or project chrome (no one-off fork)
- [ ] Colors via `var(--uxds-…)` + theme remap
- [ ] Make wire left in LEGACY or deleted — not re-exported as “library”
- [ ] FE audit checklist + blast-radius chrome scan ([FE_UI_UX_AUDIT.md](./FE_UI_UX_AUDIT.md))

---

## Related

- [PAGE_BUILD_CONTRACT.md](./PAGE_BUILD_CONTRACT.md)
- [INTERACTION_FIDELITY.md](./INTERACTION_FIDELITY.md)
- [../uxds/COMPONENTS.md](../uxds/COMPONENTS.md)
- [../uxds/DEVIATIONS.md](../uxds/DEVIATIONS.md)

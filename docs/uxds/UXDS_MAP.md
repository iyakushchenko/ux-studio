# UXDS map — HARD contract (Studio)

**Status:** HARD — agents must follow the **full** UXDS structure and names, not a sample subset.  
**Source file:** `[UX] UXDS - Larkin` · fileKey `myqzp3KRc1pxKDOv8RfTsl`  
**Machine inventory:** [inventory/](./inventory/) (regenerated 2026-07-21 via Figma Plugin API)

| Artifact | Path | What it is |
|----------|------|------------|
| Variables (exhaustive) | [inventory/variables.json](./inventory/variables.json) | All **995** local variable paths by collection |
| Components (exhaustive) | [inventory/components.json](./inventory/components.json) | All `component.*` / `module.*` / icon sets + orphans on `↳  01 Components` |
| React kit map | [inventory/react-kit-map.json](./inventory/react-kit-map.json) · [REACT_KIT_MAP.md](./REACT_KIT_MAP.md) | Shipped Studio React ↔ Figma name |
| Human summaries | [VARIABLES.md](./VARIABLES.md) · [COMPONENTS.md](./COMPONENTS.md) · [TOKEN_BRIDGE.md](./TOKEN_BRIDGE.md) | Layer model + bridge rules (not a substitute for inventory) |
| Naming law (Summarizer) | `E:\UX\Summarizer\docs\AGENT_UXDS_NAMING.md` | Dot-path / icon slash rules |

**CI gate:** `npm run check:uxds-inventory` (in `npm test` / `test:gates`). Missing or under-floor inventory = FAIL.

---

## Agent law (do not skip)

0. **Page create:** [PAGE_CREATE_INHERITANCE.md](../product/PAGE_CREATE_INHERITANCE.md) P1–P6 — inventory + similar UXDS frame + existing UXML kits/pages + theme delta only.  
1. **Before inventing a control or token**, look it up in `inventory/variables.json` / `inventory/components.json`. Prefer the existing Figma path name.
2. **One Figma `component.*` / `module.*` → one React module** under `src/uxds/` (or project `ui/` only when truly brand-specific). Record the mapping in `react-kit-map.json` when you ship a kit.
3. **Reuse first** — compose from existing React kits + inventory names. Do not clone Legacy HTML or invent parallel CSS token names ([../product/DS_STRICTNESS.md](../product/DS_STRICTNESS.md) · [../product/CONCEPT_INTAKE.md](../product/CONCEPT_INTAKE.md) mode B).
4. **Preserve names** in the CSS bridge (slash → kebab). Do not invent `--proto-*` / anonymous page tokens for DS roles.
5. **Incomplete React coverage is OK** — the inventory is the map of the *design system*, not a claim that every master is already coded. Gaps are “not yet bridged,” not “free to rename.”
6. **Regenerate** inventory when UXDS Figma changes materially (variable count / Components page). Update `atIso` + floors in `scripts/check-uxds-inventory.mjs` only when the library intentionally grows/shrinks.

---

## Regenerating inventory

1. Open UXDS in Figma (fileKey above).  
2. Via Figma MCP `use_figma` (skill `figma-use`): dump `getLocalVariablesAsync` names by collection + walk `↳  01 Components` for COMPONENT_SET / COMPONENT names.  
3. Write `docs/uxds/inventory/variables.json` and `components.json` (same shape as today).  
4. Run `npm run check:uxds-inventory`.  
5. If counts drop below floors, either restore inventory or consciously lower floors with a LESSONS note.

---

## Snapshot (2026-07-21)

| Surface | Count |
|---------|------:|
| Local variables | 995 |
| Collections | 6 (`design`, `primitives (color)`, `screen & fonts`, `setup`, `decks & slides`, `auth`) |
| Component sets (incl. icons/modules) | 222 |
| Orphan components | 344 |
| Prefix mix (approx.) | `component*` ~366 · `module*` ~126 · icons ~73 |

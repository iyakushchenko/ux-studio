# UXDS — source of truth for UX Studio concept pages

**HARD map (names, inventory, agent law):** [UXDS_MAP.md](./UXDS_MAP.md)

**File:** `[UX] UXDS - Larkin`  
**fileKey:** `myqzp3KRc1pxKDOv8RfTsl`  
**Inspected / inventory regenerated:** 2026-07-21 via Figma Plugin API (`995` local variables, `6` collections, `222` component sets, `344` orphan components) — see [inventory/](./inventory/)

| Surface | URL |
|---------|-----|
| **Styleguide** | https://www.figma.com/design/myqzp3KRc1pxKDOv8RfTsl/-UX--UXDS---Larkin?node-id=12336-192215 (`↳  02 Style Guide`) |
| **Components library** | https://www.figma.com/design/myqzp3KRc1pxKDOv8RfTsl/-UX--UXDS---Larkin?node-id=12336-188269 (`↳  01 Components`) |

**Deep organism model (IA + modules):** mirrored from Summarizer — see `E:\UX\Summarizer\docs\UXDS_ORGANISM_OVERVIEW.md` and [X_SUITE_INTEGRATION.md](../product/X_SUITE_INTEGRATION.md).

**Studio contracts:** [VARIABLES.md](./VARIABLES.md) · [COMPONENTS.md](./COMPONENTS.md) · [TOKEN_BRIDGE.md](./TOKEN_BRIDGE.md) · [DEVIATIONS.md](./DEVIATIONS.md) · [../product/CSS_BASE_THEME.md](../product/CSS_BASE_THEME.md) (BASE → THEME → PANEL → LEGACY) · [../product/DS_STRICTNESS.md](../product/DS_STRICTNESS.md) · [../product/INTERACTION_FIDELITY.md](../product/INTERACTION_FIDELITY.md) (behavior kits)

**Code home:** `src/uxds/` (tokens + `interactions/` kits + thin `components/`). Project brand delta: `src/projects/<id>/styleguide/theme.css` (**variable remaps only**; optional — UI falls back to UXDS `:root` baselines).

---

## What UXDS is (for Studio)

UXDS is not a flat styleguide PDF. It is an **organism**:

- **Components page** = mothership masters (`component.*` / `module.*`)
- **Variables** = blood (tokens + IA/persona/project content)
- **Screen pages** = instances bound to those variables
- **Summarizer / X-Suite** = brain that authors personas, CJMs, IA into the same variable bloodstream

UX Studio will eventually **consume** X-Suite artefacts as baselines for agentic CJMs. Until then, UXDS is the **visual + naming contract** for React concept pages.

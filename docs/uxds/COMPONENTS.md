# UXDS Components library

**Exhaustive list:** [inventory/components.json](./inventory/components.json) (assembled from Figma; see [UXDS_MAP.md](./UXDS_MAP.md)).

**Page:** `↳  01 Components` · node `12336:188269`  
**URL:** https://www.figma.com/design/myqzp3KRc1pxKDOv8RfTsl/-UX--UXDS---Larkin?node-id=12336-188269

---

## Mental model

| Layer | Naming | Meaning |
|-------|--------|---------|
| **component.*** | Atomic / reusable UI piece | Buttons, tiles, badges, form bits |
| **module.*** | Composed block / section | Header, PLP listing, cart flyout, PDP RTB |
| **Screen pages** | Instances of modules | HP, CLP, PLP, PDP, Cart, Checkout, Booking, … |

Masters on this page carry **variable bindings**. Detach on a master → every screen instance follows. That is why React rebuilds must preserve the same **semantic slots** (and eventually the same content keys from `setup` / `IA/*`).

**Components carry behavior, not just visuals.** In Studio, a mapped React module should open, select, filter, expand, or submit as the pattern implies — via shared kits under `src/uxds/interactions/` — so pages are recordable. See [../product/INTERACTION_FIDELITY.md](../product/INTERACTION_FIDELITY.md).

Canonical naming rules (Summarizer): `E:\UX\Summarizer\docs\AGENT_UXDS_NAMING.md`.

---

## Domain sections observed (sample)

Library is organized by commerce domain sections, e.g.:

- **Shopping Cart** — `component.cart.*`, `module.cart.*`, minicart, bonuses, summary RTB  
- **Reviews / GSE** — `component.gse.feefo.*`, `component.gse.google.*`, `module.reviews*`  
- (plus PDP, PLP, header, footer, booking, MA, support — full inventory grows as we rebuild screens)

Variants often encode viewport: `screen=small` / `screen=large`, or boolean props (`collapsed=true`).

---

## React mapping rule (commander)

1. One Figma `component.*` / `module.*` → one React module under `src/uxds/components/` (or project `ui/` only when truly project-specific).  
2. Keep the **dot-path name** in code identifiers where practical (`ModuleCartProductListing`).  
3. Pair visuals with **shared interaction kits** (`src/uxds/interactions/`) for typical patterns — accordion, select, filters, tabs, modals, fields — not per-screen imperative scripts.  
4. Wire Studio playback hooks (`data-name`, touchpoints) on the React root of the module — not on anonymous wrappers.  
5. Prefer composing modules over cloning Make HTML.  
6. **Reuse first** — when PO asks for a page “from what we already have,” assemble from existing UXDS + internal React modules; extend the shared library instead of copy-paste ([../product/CONCEPT_INTAKE.md](../product/CONCEPT_INTAKE.md) §5 mode B).

---

## Styleguide page

**Page:** `↳  02 Style Guide` · node `12336-192215`  
Documents type scale (rem), typography samples, color ramps, pattern usage. Use it when bridging tokens; use **Components** when implementing interactive UI.

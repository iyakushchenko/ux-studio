# FE audit — PDP vs PLP conventions

**Date:** 2026-07-19  
**Callsigns:** Finn (structure) · Uma (DS) · Arch (verdict)  
**Scope:** Naming, file layout, `data-studio-*`, BEM, UXDS/theme, mount, probes  
**Verdict:** **gaps fixed** (this ship) · residual listed below

---

## Aligned (already matched PLP)

| Convention | PLP | PDP |
|------------|-----|-----|
| Screen folder = `screenId` | `screens/plp/` | `screens/pdp/` |
| Contract + mount twins | `plpContract.ts` / `mountPlpScreen.tsx` | `pdpContract.ts` / `mountPdpScreen.tsx` |
| Scoped CSS | `plp.css` | `pdp.css` |
| BEM block | `.plp` / `plp__*` | `.pdp` / `pdp__*` |
| React root stamp | `data-studio-react-screen="plp"` | `data-studio-react-screen="pdp"` |
| Make retire | `data-studio-make-retired=plp` | `data-studio-make-retired=pdp` |
| Host class | `studio-react-screen-host` | same |
| Commerce primary | UXDS `ButtonPrimary` | same |
| Theme remaps | `styleguide/theme.css` | same (no page-local brand fork) |
| Probe below-fold | compact stamp | `[data-studio-probe-below-fold]` on content title |

---

## Gaps found → fixed this ship

| Gap | Fix |
|-----|-----|
| FAQ band was static DOM (B1) — not UXDS Accordion like PLP filters | Wired `<Accordion>` kit; `check:page-final-pass` now **requires** Accordion on PDP |
| Download / GP CTAs were `<span>` shells — no hover/focus (dead vs PLP tertiary) | Real `<button>` + `.pdp__pill` tertiary/mint hover/focus/disabled |
| Probe matrix lacked accordion expand + CTA hover | Added `pdp-faq-accordion-*` + `pdp-download-cta-hover` |
| Register still said B1 static accepted | B1 **CLOSED**; I17/I18 Present |

---

## Residual gaps (cheap defer / honest)

| Residual | Why not fixed now |
|----------|-------------------|
| No journey URL for download / Find out more clicks | Make had none — decorative until PO wires assets |
| Five FAQ panels have no body copy | Make export has headers only — no invent copy |
| A few Make-parity hexes in `pdp.css` (leaflet border `#c7e4ff`, mint `#e0fbf8`) | Same class as PLP Make-parity leftovers; not a second brand system |
| Final Pass hardGreen demoted | Interaction surface changed — Quinn must re-prove (not false-PROVEN) |

---

## Naming / proto* check

- No new `proto-*` classes on PDP React path.
- Action probes use `data-studio-action` / `data-studio-accordion-*` (PLP-style studio hooks).
- Accordion kit keeps `data-uxds-kit="accordion"`; Make `data-name` preserved on band/items.

**Team check line:** `PAGE FINAL PASS — pdp — NOT-GREEN` (Quinn MCP matrix PASS @ `d6e4951` / v0.0.27; HARD-GREEN awaits Uma §0a + Arch)

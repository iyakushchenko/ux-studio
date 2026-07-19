# Feature brief — PDP React migration

**Project:** `boots-pharmacy`  
**Callsigns:** Bea (BA) · Finn (FE) · Uma (UI/UX) · Quinn (QA) · Pax (PO sim) · Arch (Director)  
**Status:** L1–L20 mounted · FAQ bodies **6/6** · TertiaryCta soft Find out more · Accordion kit motion + muted chevrons · PAGE FINAL PASS **NEEDS-REPROVE**  
**Updated:** 2026-07-19  
**Refs:** [BOOTS_REACT_SCREEN_PILOT.md](../BOOTS_REACT_SCREEN_PILOT.md) · [PDP_MAKE_PARITY_REGISTER.md](./PDP_MAKE_PARITY_REGISTER.md) · [PLP_REACT.md](./PLP_REACT.md) · [PAGE_FINAL_PASS.md](../../../product/PAGE_FINAL_PASS.md) · [NEXT_STEPS.md](../../../product/NEXT_STEPS.md) · Uma [../audits/UMA_FIDELITY_PDP_2026-07-19.md](../audits/UMA_FIDELITY_PDP_2026-07-19.md) · Quinn Final Pass [../audits/FE_AUDIT_PDP_PAGE_FINAL_PASS_2026-07-19.md](../audits/FE_AUDIT_PDP_PAGE_FINAL_PASS_2026-07-19.md) · Convention [../audits/FE_AUDIT_PDP_PLP_CONVENTIONS_2026-07-19.md](../audits/FE_AUDIT_PDP_PLP_CONVENTIONS_2026-07-19.md)

---

## Context

Erase-Make **closed for PDP** after PLP HARD-GREEN. Vaccine PDP (`screenId: pdp`, Frame child **8**) is the Traditional CJM bridge between PLP and Book Step 1. Make truth: chickenpox single-SKU RTB + below-fold education bands. React mount follows Book Step 1 / PLP pilot pattern — UXDS + scoped CSS, Make child retired from view, no new LEGACY growth.

**Gate:** PAGE FINAL PASS **NEEDS-REPROVE** after FAQ/CTA/Accordion polish (prior HARD-GREEN @ `c6e8931` demoted). Quinn + Uma must re-prove before hardGreen. **Home waits PO `+`.**

## Business logic

| Rule | Behavior |
|------|----------|
| Entry | PLP Book now / tile title → PDP (`screen=pdp`) |
| List price display | `£75.00` + “Single dose price” (static row) |
| Booster checkbox | Toggles shared `includeBoosterDose` (default **on**) |
| Book now label price | `£150` when booster on · `£75` when off (`orderPricing.ts`) |
| Book now click | Logged in → Book Step 1 · else → Login popup |
| Check availability | Opens Availability Tool (browse intent) — no login gate; logged-out → **Find Pharmacy** first screen; logged-in / chosen location → Choose Date |
| Myself / Someone else | Visual toggle only on PDP; default Myself |
| Account CTAs | Quick Sign In / Create Boots Account → Login popup; block hidden when logged in |
| Wishlist | `PDP_WISHLIST_ID` (`chickenpox`) — shared with Quick View + header |
| Breadcrumb Vaccination | → PLP |
| Loading / empty | **None** on Make — static page; do not invent loader |
| Accordion | UXDS Accordion; default open “Who is at risk?”; 3 Make-sourced bodies; 3 residual static headers; no focus ring |

## Acceptance (Bea → Quinn)

- [x] React host mounts at child 8; Make direct children retired (`data-studio-make-retired=pdp`)
- [x] Make wire effects for PDP (CTAs, booster, toggle, hearts, login links, crumb) early-return when React mounted
- [x] URL `?project=boots-pharmacy&screen=pdp` restores tab; recording `kind: "screen"` `pdp` unchanged
- [x] No new styles in `globals-screens` LEGACY for React path — `screens/pdp/*.css` + UXDS + theme only
- [x] Scaffold P0 bands L1–L13 + interactions I5–I12, I8–I10 per register
- [x] Below-fold P0 bands L14–L20 (interactive Accordion; download/GP CTAs live + DS hover)
- [x] Modal URL sync: `login`, `choose-pharmacy` from PDP CTAs ([URL.md](../../../shell/URL.md)) — wire reuses existing modals
- [x] Quinn MCP: `__studioRunMcpPageProbe` 23/23 PASS ([FE_AUDIT_PDP_MCP_2026-07-19.md](../audits/FE_AUDIT_PDP_MCP_2026-07-19.md))
- [x] PAGE FINAL PASS: Arch HARD-GREEN ([FE_AUDIT_PDP_PAGE_FINAL_PASS_2026-07-19.md](../audits/FE_AUDIT_PDP_PAGE_FINAL_PASS_2026-07-19.md))
- [x] `npm test` green on L14–L20 contract; Uma audit **PROVEN** ([UMA_FIDELITY_PDP_2026-07-19.md](../audits/UMA_FIDELITY_PDP_2026-07-19.md))
- [x] Honest residual: Make Frame child 8 in DOM until delete phase; 3 FAQ panels still lack Make Description (no invented copy)

## Chrome / fidelity (Uma)

- [x] Concept L&F vs Make child 8 — RTB 50/50, Advantage mint bar, specs table, accordion kit + download tertiary hover
- [x] 1440/64/1312 grid; icon+text nowrap on secondary CTAs
- [x] Studio chrome XOR / counters intact
- [x] DS state matrix §0a: Book now, Check availability, checkbox, toggle, heart / share — **no invent hover**; share Make flip proven
- [x] Loading/empty/updating §0: **N/A** documented — fail if spinner invented

## Mount / FE notes (Finn)

- Folder = `screenId`: `src/projects/boots-pharmacy/screens/pdp/`
- Contract: `PDP_CHILD_INDEX = 8`, `PDP_REACT_SCREEN_ID = "pdp"`
- Mount: mirror `mountPlpScreen` — hide **all** Make direct children under child 8
- Reuse: `orderPricing.ts`, `PDP_WISHLIST_ID`, shared booster state with Book Step 1
- Quick View: keep `pdpRtb.ts` clone path on Make until QV React rewrite
- Wire gate: `isPdpReactMounted()` on `BootsPharmacyProjectView` PDP effects
- Deferred: delete Make child 8 (erase-Make sequence end)

## Prove notes (Quinn)

- **MCP matrix** — prior PASS @ `d6e4951` / 22/22 **stale** after FAQ body + CTA + focus ship; Quinn must re-prove (now includes `pdp-faq-help-body` + matched download CTAs)
- Quinn MCP **PASS** (23/23) — Arch HARD-GREEN restored @ `c6e8931`
- Register: [PDP_MAKE_PARITY_REGISTER.md](./PDP_MAKE_PARITY_REGISTER.md)

## Pax

- [x] User-visible? → bump patch **Y** (this polish)
- [x] Push? **Y** (this ship)
- [ ] Notes/CHANGELOG when bump
- [x] Resolve B1 accordion — PO go interactive (2026-07-19)
- [x] Quinn re-prove MCP matrix (FAQ bodies / CTA unify / focus-none)
- [x] Uma §0a re-PROVEN after polish
- [x] Arch PAGE FINAL PASS HARD-GREEN — Home still waits PO `+`

## Honest residual (expected)

| Residual | Why OK |
|----------|--------|
| Make Frame child 8 in bundle | Hidden + wire-gated until delete phase |
| `globals-screens` child-8 rules | Dead while React mounted; shrink on Make delete |
| FAQ NHS / already-have / personal-data | No Make Description after search — static headers; **no invented copy** |
| Download / GP CTAs | Matched tertiary (+ mint GP); no file URL journey wire |
| Single chickenpox SKU | CJM scope |

**Parity P0 for full page L&F:** L1–L20 bands + journey CTAs + booster/price + wishlist + modals URL + no invented loader — see register.

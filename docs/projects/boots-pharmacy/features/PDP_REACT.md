# Feature brief — PDP React migration

**Project:** `boots-pharmacy`  
**Callsigns:** Bea (BA) · Finn (FE) · Uma (UI/UX) · Quinn (QA) · Pax (PO sim) · Arch (Director)  
**Status:** scaffold mounted (not PROVEN / not Final Pass)  
**Updated:** 2026-07-19  
**Refs:** [BOOTS_REACT_SCREEN_PILOT.md](../BOOTS_REACT_SCREEN_PILOT.md) · [PDP_MAKE_PARITY_REGISTER.md](./PDP_MAKE_PARITY_REGISTER.md) · [PLP_REACT.md](./PLP_REACT.md) · [PAGE_FINAL_PASS.md](../../../product/PAGE_FINAL_PASS.md) · [NEXT_STEPS.md](../../../product/NEXT_STEPS.md) · Uma [../audits/UMA_FIDELITY_PDP_2026-07-19.md](../audits/UMA_FIDELITY_PDP_2026-07-19.md) · Quinn [../audits/QUINN_PDP_PROBE_CRITERIA_2026-07-19.md](../audits/QUINN_PDP_PROBE_CRITERIA_2026-07-19.md)

---

## Context

Erase-Make **next page after PLP HARD-GREEN**. Vaccine PDP (`screenId: pdp`, Frame child **8**) is the Traditional CJM bridge between PLP and Book Step 1. Make truth: chickenpox single-SKU RTB + below-fold education bands. React mount follows Book Step 1 / PLP pilot pattern — UXDS + scoped CSS, Make child retired from view, no new LEGACY growth.

**Gate:** PLP PAGE FINAL PASS **HARD-GREEN** satisfied (2026-07-19). React scaffold L1–L13 mounted; below-fold + Quinn MCP + Uma PROVEN still open.

## Business logic

| Rule | Behavior |
|------|----------|
| Entry | PLP Book now / tile title → PDP (`screen=pdp`) |
| List price display | `£75.00` + “Single dose price” (static row) |
| Booster checkbox | Toggles shared `includeBoosterDose` (default **on**) |
| Book now label price | `£150` when booster on · `£75` when off (`orderPricing.ts`) |
| Book now click | Logged in → Book Step 1 · else → Login popup |
| Check availability | Opens Availability Tool (browse intent) — no login gate on Make wire |
| Myself / Someone else | Visual toggle only on PDP; default Myself |
| Account CTAs | Quick Sign In / Create Boots Account → Login popup; block hidden when logged in |
| Wishlist | `PDP_WISHLIST_ID` (`chickenpox`) — shared with Quick View + header |
| Breadcrumb Vaccination | → PLP |
| Loading / empty | **None** on Make — static page; do not invent loader |
| Accordion | Make = **static** Figma (one FAQ body visible); no wire — PO clarify before interactive |

## Acceptance (Bea → Quinn)

- [x] React host mounts at child 8; Make direct children retired (`data-studio-make-retired=pdp`)
- [x] Make wire effects for PDP (CTAs, booster, toggle, hearts, login links, crumb) early-return when React mounted
- [x] URL `?project=boots-pharmacy&screen=pdp` restores tab; recording `kind: "screen"` `pdp` unchanged
- [x] No new styles in `globals-screens` LEGACY for React path — `screens/pdp/*.css` + UXDS + theme only
- [x] Scaffold P0 bands L1–L13 + interactions I5–I12, I8–I10 per register
- [x] Modal URL sync: `login`, `choose-pharmacy` from PDP CTAs ([URL.md](../../../shell/URL.md)) — wire reuses existing modals
- [ ] PAGE FINAL PASS: landmarks `header`+`main`, BEM=`pdp` present in scaffold; stamp + `check:page-final-pass` after Quinn MCP
- [x] `npm test` green on scaffold; Uma audit **not PROVEN** until full matrix + below-fold bands
- [ ] Honest residual: Make Frame child 8 in DOM until delete phase; accordion B1 if static-only; L14–L20 missing

## Chrome / fidelity (Uma)

- [ ] Concept L&F vs Make child 8 — RTB 50/50, Advantage mint bar, specs table, accordion static layout
- [ ] 1440/64/1312 grid; icon+text nowrap on secondary CTAs
- [ ] Studio chrome XOR / counters intact
- [ ] DS state matrix §0a: Book now, Check availability, checkbox, toggle, heart — **no invent hover**
- [ ] Loading/empty/updating §0: **N/A** documented — fail if spinner invented

## Mount / FE notes (Finn)

- Folder = `screenId`: `src/projects/boots-pharmacy/screens/pdp/`
- Contract: `PDP_CHILD_INDEX = 8`, `PDP_REACT_SCREEN_ID = "pdp"`
- Mount: mirror `mountPlpScreen` — hide **all** Make direct children under child 8
- Reuse: `orderPricing.ts`, `PDP_WISHLIST_ID`, shared booster state with Book Step 1
- Quick View: keep `pdpRtb.ts` clone path on Make until QV React rewrite
- Wire gate: `isPdpReactMounted()` on `BootsPharmacyProjectView` PDP effects
- Deferred: delete Make child 8 (erase-Make sequence end)

## Prove notes (Quinn)

- Localhost: mount + Make leak=0; PLP→PDP; Book now login gate; Check availability modal URL
- Booster price swap; heart hover matrix; scroll-into-view for below-fold bands
- MCP page probe recipe TBD after scaffold — overlay-arm + overlay-eyes mandatory
- Register prove matrix: [PDP_MAKE_PARITY_REGISTER.md](./PDP_MAKE_PARITY_REGISTER.md)

## Pax

- [ ] User-visible? → bump patch? **Y** (when React page ships)
- [ ] Push? **Arch call**
- [ ] Notes/CHANGELOG when bump
- [ ] Resolve B1 accordion static vs interactive before accepting FAQ behavior

## Honest residual (expected)

| Residual | Why OK for scaffold |
|----------|---------------------|
| Make Frame child 8 in bundle | Hidden + wire-gated until delete phase |
| `globals-screens` child-8 rules | Dead while React mounted; shrink on Make delete |
| Accordion no wire (B1) | Match static Figma until PO says otherwise |
| Download / share CTAs | Decorative in Make — P1 |
| Single chickenpox SKU | CJM scope |

**Parity P0 for first ship:** RTB mount, journey CTAs, booster + price, wishlist, modals URL, no invented loader — see register journey-critical table.

# Feature brief — PLP React migration

**Project:** `boots-pharmacy`  
**Callsigns:** Bea (BA) · Finn (FE) · Uma (UI/UX) · Quinn (QA) · Pax (PO sim) · Arch (Director)  
**Status:** done (+ Legacy parity restore `v0.0.5`)  
**Updated:** 2026-07-19  
**Refs:** [BOOTS_REACT_SCREEN_PILOT.md](../BOOTS_REACT_SCREEN_PILOT.md) · [PLP_LEGACY_PARITY_REGISTER.md](./PLP_LEGACY_PARITY_REGISTER.md) · [NEXT_STEPS.md](../../../product/NEXT_STEPS.md) erase-Legacy program · audit [../audits/FE_AUDIT_PLP_2026-07-19.md](../audits/FE_AUDIT_PLP_2026-07-19.md)

---

## Context

Erase-Legacy program **NOW = PLP**. Vaccinations listing (`screenId: plp`, Frame child **9**) is the Traditional CJM entry before PDP/login. Must match Book Step pilot mount pattern: React + UXDS, Legacy chrome retired from view, no LEGACY growth, URL + recording screen events.

## Business logic

| Rule | Behavior |
|------|----------|
| By Type = Individual jabs | Show jab tiles; default on load |
| By Type = Bundles | Show bundle tiles from catalog |
| Age / disease / region / country filters | Narrow visible tiles; results count updates |
| Filter search (disease / country) | Narrow checkbox lists in that section |
| Reset filters | Returns defaults; clears dirty |
| Book now / tile title | → PDP (`screen=pdp`) |
| Quick View | Opens existing RTB Quick View popup |
| Add to Bookmarks | Toggles wishlist via shared header wishlist API (`plp-tile-N`) |
| Breadcrumb Home | → Site Pilot Home (wire / existing crumb handlers) |

## Acceptance (Bea → Quinn)

- [x] React host mounts at child 9; Legacy direct children retired (`data-studio-legacy-retired=plp`)
- [x] Legacy wire effects for PLP (Book now / Quick View / title links / filter DOM sync / hearts) early-return when React mounted
- [x] URL `?project=boots-pharmacy&screen=plp` restores tab; recording `kind: "screen"` `plp` already in engine
- [x] No new styles in `globals-screens` LEGACY for React path — screen CSS / UXDS / theme only
- [x] `npm test` + build green; Uma audit **PROVEN**
- [x] Honest residual documented (Legacy Frame child still in DOM until delete phase)

## Chrome / fidelity (Uma)

- [x] Concept L&F preserved vs Legacy PLP (hero teal band, 304px filters, tile row, navy Book now, tertiary Quick View / Bookmarks)
- [x] 1440/64/1312 content grid; icon+text nowrap on tertiary CTAs
- [x] Studio chrome XOR / counters intact
- [x] No near-dup zoo; Accordion kit reused (not a second accordion CSS)

## Mount / FE notes (Finn)

- Folder = `screenId`: `src/projects/boots-pharmacy/screens/plp/`
- Contract: `PLP_CHILD_INDEX = 9`, `PLP_REACT_SCREEN_ID = "plp"`
- Mount: `mountPlpScreen` / deferred `unmount` — hides **all** Legacy direct children (PLP has no `body` wrapper)
- Wire: `BootsPharmacyProjectView` `useLayoutEffect` on child 9; radio Legacy-mutation gated in `inputControls`
- Catalog: React-owned jab + bundle data (does not scrape hidden Legacy DOM)
- Deferred: delete Legacy child 9 (end of erase-Legacy sequence)

## Prove notes (Quinn)

- Localhost: mount + Legacy leak=0; Book→PDP; Quick View; Bundles=7; chip `v0.0.3`/`alpha`
- `npm test` 323 + build OK; CI tip after push

## Pax

- [x] User-visible? → bump patch? **Y** (new React page)
- [x] Push? **Y**
- [x] Notes/CHANGELOG updated if bump

## Honest residual (after parity restore)

| Residual | Why OK for DONE |
|----------|-----------------|
| Legacy Frame child 9 still in bundle | Hidden + wire-gated; delete after History/Details + Book Legacy delete phase |
| `globals-screens` `.proto-plp-*` rules for Legacy child 9 | Dead while React mounted; shrink when Legacy child deleted — do not grow |
| Advantage banner / AI promo / View all / catalog ~10 vs ~21 | Register L5–L6 / I6 / L14 — not journey-critical for PLP→PDP |
| Traditional CJM tile scrape | Hits React tiles via same `data-name` hooks |

**Parity P0 fixed this ship:** page bg fill, hero shadow, listing wrapper, listing preloader + stagger, active filter chips — see register.

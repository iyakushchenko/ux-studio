# PLP Make → React parity register

**Project:** `boots-pharmacy`  
**Callsigns:** Bea (BA) owns register truth · Quinn (QA) owns prove · Finn/Uma restore gaps  
**Updated:** 2026-07-19 (PO rage fidelity pass — corrected Wrongly marked OK)  
**Make source:** Frame child **9** (`Product - Vaccination Listing Page`) + `globals-screens` `.proto-plp-*` + `data/plpListing.ts` wire  
**React target:** `src/projects/boots-pharmacy/screens/plp/*`  
**Refs:** [PLP_REACT.md](./PLP_REACT.md) · audit [../audits/FE_AUDIT_PLP_2026-07-19.md](../audits/FE_AUDIT_PLP_2026-07-19.md)  
**Uma checklist:** [../../../product/UMA_FIDELITY_NOTES.md](../../../product/UMA_FIDELITY_NOTES.md)

**Status legend:** Present · Partial · Missing · Fixed · N/A

**Bea rule:** List **every** Make band/component **before** Finn codes. Whole-component misses (e.g. Advantage Card bar) = ship fail.

---

## Layout (every Make band)

| # | Make behavior | React status | Evidence |
|---|---------------|--------------|----------|
| L1 | **Page bg fill** — white base + decorative PNG @ opacity **0.41** | **Fixed** | `.plp__body-fill` |
| L2 | **Category title / hero** — teal band 296px + lift shadow | **Fixed** | `.plp__hero` shadow |
| L3 | **Listing wrapper** — white `rounded-[24px]` + drop-shadow | **Fixed** | `.plp__listing` |
| L4 | **Product list preloader** — filter change ~450ms + stagger | **Fixed** | `listingPhase` + loader |
| L5 | **Advantage Card points banner** — mint `#c4dde3` system message above filters/listing: “Collect 3 points for every £1 you spend with Boots Advantage Card‡” | **Was Missing (Wrongly left residual) → Fixed** | Make `ModuleLaptopSpecs` L11375–11384. Restored `.plp__advantage` / `component.gse.system.message`. **Example of whole-component miss.** |
| L6 | **AI Assistant promo strip** below listing | **Missing** | Marketing residual (not CJM) |
| L7 | **Filters column** 304px accordion | **Present** | UXDS Accordion |
| L8 | **Filter search** (disease / country) + clear | **Present** | `FilterSearch` |
| L9 | **Results summary** count + chips + Reset Filters | **Fixed** | Chips + icon+text Reset |
| L10 | **Service tiles** — title, subtitle, desc, price, Book now, Bookmarks, Quick View; **no tile border** (Make borderless) | **Was Partial (border invent) → Fixed** | Removed `.plp__tile` `1px` border; pad 16px retained |
| L11 | **Empty state** | **Present** | `.plp__empty` |
| L12 | **1440 / 64 / 1312** content grid | **Present** | `.plp__shell` |
| L13 | **Breadcrumbs** Home → Vaccinations | **Present** | `module.breadcrumbs` |
| L14 | **Catalog depth** ~21 Make vs React curated | **Partial** | Residual expand if CJM needs |

---

## Interactions

| # | Make behavior | React status | Evidence |
|---|---------------|--------------|----------|
| I1 | By Type radios | **Present** | |
| I2 | By Age | **Present** | |
| I3 | Disease / region / country | **Present** | |
| I4 | Active filter chips | **Fixed** | Removable chips |
| I5 | **Reset filters** — icon+text tertiary (trash + label), not text-only link | **Was Wrong (text-only) → Fixed** | `TertiaryCta` + trash glyph; sidebar + summary |
| I6 | View all on long lists | **Missing** | Residual |
| I7 | Sort control | **N/A** | Not in Make |
| I8 | Tile title / Book now → PDP | **Present** | |
| I8b | **Book now hover** — same as UXDS `ButtonPrimary` commerce / primary CTA tokens (navy → hover lift), not mint secondary one-off | **Was Wrong (LEGACY tile catch-all) → Fixed** | LEGACY excludes `.uxds-btn-primary`; commerce hover tokens win |
| I9 | Quick View → RTB | **Present** | |
| I10 | **Wishlist / Bookmarks heart** — immediate filled/color on **hover and click** (optimistic) | **Was Wrong (laggy / weak feedback) → Fixed** | Hover + pointerdown optimistic fuchsia `#e91e8c` |
| I11 | Bundles mode | **Present** | |
| I12–I13 | Listing load + stagger | **Fixed** | |
| I14 | Scroll | **Present** | |
| I15 | Near me | **N/A** | Book Step 1 only |
| I16 | Keyboard / a11y basics | **Present** | |
| I17 | Accordion open/close | **Present** | |

---

## Wire / CJM hooks

| # | Hook | React status | Evidence |
|---|------|--------------|----------|
| W1–W9 | Mount, retire Make, URL, REC, tiles, dirty, wishlist IDs, footer, chat | **Present** | Unchanged this pass |

---

## Journey-critical / PO restore set (this ship)

| Priority | Item | Outcome |
|----------|------|---------|
| P0 | L5 Advantage Card bar | **Fixed** (was wrongly residual) |
| P0 | L10 tile border invent | **Fixed** |
| P0 | I5 Reset filters icon+text | **Fixed** |
| P0 | I8b Book now CTA hover tokens | **Fixed** |
| P0 | I10 heart hover+click optimistic | **Fixed** |
| P2 | L6 AI promo strip | Residual |
| P2 | I6 View all | Residual |
| P2 | L14 catalog count | Residual |

---

## Prove matrix (Quinn) — cannot PASS with unchecked P0s

| Item | Localhost | Interaction |
|------|-----------|-------------|
| L5 Advantage bar visible + copy | Required | Visual |
| L10 no tile border | Required | Visual |
| I5 Reset Filters trash+label | Required | Hover icon→navy |
| I8b Book now hover = commerce navy lift | Required | Hover/active |
| I10 heart fuchsia on hover + click | Required | Hover + click |
| I8 / I9 / I11 / W1 | Required | Book→PDP, QV, Bundles, no Make leak |

**Fail ship if:** any P0 above unchecked, Uma fidelity checklist fail, or Quinn interaction matrix fail.

# PLP Make → React parity register

**Project:** `boots-pharmacy`  
**Callsigns:** Bea (BA) owns register truth · Quinn (QA) owns prove · Finn/Uma restore gaps  
**Updated:** 2026-07-19 (PO rage #2 — real Make preloader + checkbox hover)  
**Make source:** Frame child **9** (`Product - Vaccination Listing Page`) + `globals-screens` `.proto-plp-*` + `data/plpListing.ts` wire  
**React target:** `src/projects/boots-pharmacy/screens/plp/*`  
**Refs:** [PLP_REACT.md](./PLP_REACT.md) · audit [../audits/FE_AUDIT_PLP_2026-07-19.md](../audits/FE_AUDIT_PLP_2026-07-19.md)  
**Uma checklist:** [../../../product/UMA_FIDELITY_NOTES.md](../../../product/UMA_FIDELITY_NOTES.md)

**Status legend:** Present · Partial · Missing · Fixed · N/A

**Bea rule:** List **every** Make band/component **before** Finn codes — including **loading / empty / updating** as **P0** rows. Whole-component misses (e.g. Advantage Card bar) = ship fail. Wrong preloader mechanism = ship fail.

---

## Layout (every Make band)

| # | Make behavior | React status | Evidence |
|---|---------------|--------------|----------|
| L1 | **Page bg fill** — white base + decorative PNG @ opacity **0.41** | **Fixed** | `.plp__body-fill` |
| L2 | **Category title / hero** — teal band 296px + lift shadow | **Fixed** | `.plp__hero` shadow |
| L3 | **Listing wrapper** — white `rounded-[24px]` + drop-shadow | **Fixed** | `.plp__listing` |
| L4 | **Product list preloader (P0)** — see accurate Make scenario below | **Was Wrong (opacity-0 tiles → overlay below fold / text-only feel) → Fixed** | `listingPhase` + `display:none` tiles + `.plp__listing-loader` |
| L5 | **Advantage Card points banner** — mint `#c4dde3` system message above filters/listing: “Collect 3 points for every £1 you spend with Boots Advantage Card‡” | **Was Missing (Wrongly left residual) → Fixed** | Make `ModuleLaptopSpecs` L11375–11384. Restored `.plp__advantage` / `component.gse.system.message`. **Example of whole-component miss.** |
| L6 | **AI Assistant promo strip** below listing | **Missing** | Marketing residual (not CJM) |
| L7 | **Filters column** 304px accordion | **Present** | UXDS Accordion |
| L8 | **Filter search** (disease / country) + clear | **Present** | `FilterSearch` |
| L9 | **Results summary** count + chips + Reset Filters; during load count = “Updating results…” + pulse | **Fixed** | Chips + icon+text Reset + `--loading` pulse |
| L10 | **Service tiles** — title, subtitle, desc, price, Book now, Bookmarks, Quick View; **no tile border** (Make borderless) | **Was Partial (border invent) → Fixed** | Removed `.plp__tile` `1px` border; pad 16px retained |
| L11 | **Empty state (P0)** — zero-match copy in listing host | **Present** | `.plp__empty` |
| L12 | **1440 / 64 / 1312** content grid | **Present** | `.plp__shell` |
| L13 | **Breadcrumbs** Home → Vaccinations | **Present** | `module.breadcrumbs` |
| L14 | **Catalog depth** ~21 Make vs React curated | **Partial** | Residual expand if CJM needs |

### L4 — Accurate Make preloader (screenshot notes)

**Source:** `beginPlpListingLoading` / `hideAllPlpTiles` in `data/plpListing.ts` + `.proto-plp-listing-loader*` in `globals-screens.css` (child 9).

| Beat | Make behavior |
|------|----------------|
| Trigger | Any filter change after first sync (`simulateLoad`, ~**450ms** `PLP_LISTING_LOAD_MS`) |
| Tiles | **Hidden** — `display: none` (not dimmed, not skeleton shimmer) |
| Host | `.proto-plp-tiles-host` `position: relative`, loading `min-height: 220px` |
| Overlay | Absolute `inset: 0`, `rgba(255,255,255,0.82)`, radius 8px, flex center |
| Spinner | 44×44 SVG: track stroke `#c4dde3`, arc `#012169`, rotate + dash animations |
| Copy | **ONE** overlay text **“Updating results…”** under spinner (13/24, `#3a3a3a`). Count line keeps prior results — **no** duplicate / pulsed count-line copy |
| Host height | Lock to prior band height while tiles hidden (min 220px) — no collapse jump |
| Exit | Loader hide → tiles visible → stagger `proto-plp-tile-in` (50ms × index, max 8) |

**FAIL class:** blank listing + lone count “Updating results…” without in-band spinner; **or** duplicate “Updating results…” in count + overlay; **or** layout jump from host collapse.

---

## Interactions

| # | Make behavior | React status | Evidence |
|---|---------------|--------------|----------|
| I1 | By Type radios | **Present** | |
| I1b | **Checkbox/radio hover (P0)** — unchecked mint `#c6e5e1` fill+border on row hover (Make `globals-chrome`); checked stays `#afccca` | **Was Missing (React `.plp__checkbox` had no hover; Make targets `[data-name=box]`) → Fixed** | `.plp__option-row:hover .plp__checkbox:not(.is-on)` |
| I2 | By Age | **Present** | |
| I3 | Disease / region / country | **Present** | |
| I4 | Active filter chips | **Fixed** | Removable chips |
| I5 | **Reset filters** — icon+text tertiary (trash + label), not text-only link | **Was Wrong (text-only) → Fixed** | `TertiaryCta` + trash glyph; sidebar + summary |
| I6 | View all on long lists | **Missing** | Residual |
| I7 | Sort control | **N/A** | Not in Make |
| I8 | Tile title / Book now → PDP | **Present** | |
| I8b | **Book now hover** — same as UXDS `ButtonPrimary` commerce / primary CTA tokens (navy → hover lift), not mint secondary one-off | **Was Wrong (LEGACY tile catch-all) → Fixed** | LEGACY excludes `.uxds-btn-primary`; commerce hover tokens win |
| I9 | Quick View → RTB | **Present** | |
| I10 | **Wishlist / Bookmarks heart** — Make tertiary: empty rest `#afccca`, empty hover **navy link**, filled `#c8247e`, favourited hover deepen; click-optimistic fill only | **Was Wrong (invented fuchsia-on-empty hover) → Fixed** | CSS empty≠fuchsia; `is-active` only when favourited |
| I10b | **Bookmark link copy (PO)** — not bookmarked: **"Add to Bookmarks"**; bookmarked default **"In your Bookmarks"** / hover **"Remove from Bookmarks"** (PLP tiles; QV heart is icon-only PDP clone) | **Fixed** | `PlpScreen` label swap + `aria-label` |
| I11 | Bundles mode | **Present** | |
| I12–I13 | Listing load + stagger — real Make overlay (see L4), not text-only | **Was Wrong → Fixed** | `data-studio-plp-listing-phase` / loader |
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
| P0 | L4 Real Make preloader (spinner + **one** label; no count duplicate; no jump) | **Re-fixed** (PO rage #3) |
| P0 | I1b Checkbox/radio mint hover | **Fixed** |
| P0 | L5 Advantage Card bar | **Fixed** (prior) |
| P0 | L10 tile border invent | **Fixed** (prior) |
| P0 | I5 Reset filters icon+text | **Fixed** (prior) |
| P0 | I8b Book now CTA hover tokens | **Fixed** (prior) |
| P0 | I10 heart empty hover navy / filled fuchsia (no invent) | **Re-fixed** (PO rage #3) |
| P2 | L6 AI promo strip | Residual |
| P2 | I6 View all | Residual |
| P2 | L14 catalog count | Residual |

---

## Prove matrix (Quinn) — cannot PASS with unchecked P0s

| Item | Localhost | Interaction |
|------|-----------|-------------|
| L4 Filter change → spinner **in-band**, **one** “Updating results…” (overlay only), **no jump**, then results | Required | MCP: count text stays; loader text once; host height stable |
| I1b Unchecked checkbox/radio mint hover | Required | Hover sidebar filter row |
| L5 Advantage bar visible + copy | Required | Visual |
| L10 no tile border | Required | Visual |
| I5 Reset Filters trash+label | Required | Hover icon→navy |
| I8b Book now hover = commerce navy lift | Required | Hover/active |
| I10 empty heart hover **navy** (not fuchsia); click/filled fuchsia | Required | MCP computed styles |
| I8 / I9 / I11 / W1 | Required | Book→PDP, QV, Bundles, no Make leak |
| Version chip = package.json | Required | MCP |

**Fail ship if:** any P0 above unchecked, Uma fidelity checklist fail (incl. loading + checkbox hover lines), or Quinn interaction matrix fail.

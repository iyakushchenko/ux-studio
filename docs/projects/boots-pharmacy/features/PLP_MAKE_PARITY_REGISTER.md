# PLP Make → React parity register

**Project:** `boots-pharmacy`  
**Callsigns:** Bea (BA) owns register truth · Quinn (QA) owns prove · Finn/Uma restore gaps  
**Updated:** 2026-07-19 (PO — filter cascade: region → countries lost on React)  
**Make source:** Frame child **9** (`Product - Vaccination Listing Page`) + `globals-screens` `.proto-plp-*` + `data/plpListing.ts` wire  
**React target:** `src/projects/boots-pharmacy/screens/plp/*`  
**Refs:** [PLP_REACT.md](./PLP_REACT.md) · audit [../audits/FE_AUDIT_PLP_2026-07-19.md](../audits/FE_AUDIT_PLP_2026-07-19.md)  
**Uma checklist:** [../../../product/UMA_FIDELITY_NOTES.md](../../../product/UMA_FIDELITY_NOTES.md)  
**Tip context:** `b172316` / `bc14a94` (rage#5 count hide) — cascade gap excavated below (Bea)

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
| L8 | **Filter search** (disease / country) — magnifier **RIGHT**, one clear, UXDS `SearchField` | **Was Wrong (icon left + type=search double X + bespoke) → Fixed** | UXDS `SearchField` `iconPosition="end"` |
| L9 | **Results summary** count + chips + Reset Filters; during load **hide count** (no stale jab totals); spinner holds the only “Updating results…” | **Was Wrong (stale “N jabs available” during refresh) → Fixed** | `data-studio-plp-results-loading` + empty count; chips + icon+text Reset |
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
| Copy | **ONE** overlay text **“Updating results…”** under spinner (13/24, `#3a3a3a`). Count line **hidden / empty** during load — **no** stale jab totals, **no** duplicate / pulsed count-line copy |
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
| I3 | Disease / region / country checkboxes | **Partial** | I3b cascade **Fixed**; I3c disable residual — see [I3 cascade](#i3--filter-cascade-make-wire-truth) |
| I3b | **Region → countries list cascade (P0)** — selecting region(s) rebuilds By Country options to that region’s travel set only; clears prior country checks when the candidate key changes | **Was Missing → Fixed** | `collectPlpCountryFilterLabels` + `togglePlpFilterValue(regions)` clears countries; wire `getPlpCountryCandidates` |
| I3c | **Dependent facet counters + zero-count disable** — leave-one-out counts; count `0` → disable row + auto-uncheck | **Partial** | React has `countPlpFacetOption` display only; no disable/auto-clear |
| I3d | **Disease list rebuild** — availability-scored, cap 10 (Make scrapes tiles; React may keep curated list if scores match) | **Partial** | Make dynamic; React static `PLP_DISEASE_OPTIONS` |
| I4 | Active filter chips | **Fixed** | Removable chips |
| I5 | **Reset filters** — icon+text tertiary (trash + label), not text-only link | **Was Wrong (text-only) → Fixed** | `TertiaryCta` + trash glyph; sidebar + summary |
| I6 | **View all** + **10-item cap** — filled View all resets field (wire) | **Was Missing → Fixed** | `PLP_FILTER_LIST_MAX` + `data-studio-plp-view-all` |
| I6b | **Filter option counters** next to options | **Was Missing → Fixed** | `countPlpFacetOption` / `data-studio-plp-option-count` |
| I6c | **No invented filter separator** (hr / border between accordion bands) | **Was Wrong → Fixed** | Removed `.plp__filter-section` border-bottom |
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
| P0 | L8 Filter search icon end + single clear + UXDS | **Fixed** (PO rage #4) |
| P0 | I6 View all + 10-cap + filled reset | **Fixed** (PO rage #4) |
| P0 | I6b Filter option counters | **Fixed** (PO rage #4) |
| P0 | I6c No invented filter separator | **Fixed** (PO rage #4) |
| P0 | L9 Count hidden during refresh (no stale jab totals) | **Fixed** (PO rage #5) |
| P0 | I3b Region → countries cascade + clear country checks | **Fixed** (Finn) |
| P0 | I3c Zero-count disable + auto-uncheck on dependent facets | **Missing** — Finn restore |
| P2 | I3d Disease list availability rebuild | Residual / match Make if CJM needs |
| P2 | L6 AI promo strip | Residual |
| P2 | L14 catalog count | Residual |

---

## I3 — Filter cascade (Make wire truth)

**Source of truth:** `src/projects/boots-pharmacy/data/plpListing.ts` (Make Frame child 9 wire).  
**Entry:** every listing sync calls `ensurePlpFilterLists` then `syncPlpFilterCounts` inside `syncPlpListingResults` (L1129–1130, L1177–1180 / L1194–1197).  
**User trigger:** `syncPlpListingFilters` (L1220–1222) ← filter change / chip remove / reset.

**React (I3b restored):** `PlpScreen` uses `collectPlpCountryFilterLabels(filters)` (candidates via exported `getPlpCountryCandidates`, score > 0, sort). Region toggle clears `countries` (Make L737–738). View all / search cap stays in UI (no silent cut of counters). Residual: I3c zero-count disable; `jabCoversCountry` map fallback for empty-country tiles.

### A. Region → countries list (PO lost behavior)

| Step | Exact logic | File:line |
|------|-------------|-----------|
| 1 | Map region label → up to 10 travel countries | `PLP_TRAVEL_COUNTRIES_BY_REGION` `plpListing.ts` **L142–215** (keys = `PLP_REGION_OPTIONS`) |
| 2 | Candidate pool: if **any** region checked → **union** of countries for those regions only; else → union of **all** regions’ countries | `getPlpCountryCandidates` **L535–553** |
| 3 | Score each candidate with current filters (country facet leave-one-out + that country applied); drop `score === 0` | `collectPlpCountryFilterLabels` **L640–657** → `countCountryAvailability` **L1364–1382** |
| 4 | Sort score DESC, then locale name; **slice(0, 10)** (`PLP_FILTER_LIST_MAX`) | **L652–657**, const **L121** |
| 5 | If `regions.join("|")::labels.join("|")` key changed vs `dataset.studioPlpCountryLabelsKey` → **clear all country checkboxes** | `ensurePlpFilterLists` **L734–742** → `clearCountryFilterSelections` **L660–667** |
| 6 | Rewrite By Country checkbox rows to new labels (extra rows hidden; checked on hidden → unchecked) | `ensurePlpFilterCheckboxList` **L669–717**, applied **L743** |

**Acceptance (Quinn):** check **South-East Asia** → By Country shows only SEA set (Thailand…Brunei per map), not France/Kenya/etc.; prior country checks outside new set are cleared; multi-region = union.

### B. Country match when filtering tiles (depends on selected regions)

| Rule | Exact logic | File:line |
|------|-------------|-----------|
| Explicit countries on tile | `meta.countries.includes(country)` → match | `jabCoversCountry` **L555–560** |
| Tile has countries but not this one | no match | **L561** |
| Tile has **empty** countries | match if country ∈ `PLP_TRAVEL_COUNTRIES_BY_REGION[region]` for some region in (`selectedRegions` if any, else `meta.regions`) **and** tile has that region | **L563–570** |
| Listing apply | country facet uses `jabCoversCountry(..., filters.regions)` | `jabTileMatches` **L1353–1359** |
| Bundles | direct `item.countries` / `item.regions` string match (no travel-map fallback) | `bundleItemMatches` **L1385–1396**; `bundleHasFacetValue` **L817–834** |

**React gap:** `filterPlpCatalog` / `itemMatchesFacet` (`plpCatalog.ts` L339–341, L419–420) only check `item.countries` — no `jabCoversCountry` map fallback.

### C. Dependent counters (type + facets)

| Facet | Exact logic | File:line |
|-------|-------------|-----------|
| **By Type** | Count jabs / bundles with **type cleared** (`showBundles` forced false in `filtersWithoutFacet`, then count each mode) | `syncPlpByTypeFilterCounts` **L882–905**; `filtersWithoutFacet` **L774–789** |
| **Age / Disease / Region / Country** | For each checkbox: count = results if this facet cleared + this value held, other facets kept; mode = jabs vs bundles from By Type | `countJabFacetValue` **L852–862**; `countBundleFacetValue` **L865–879**; `syncPlpCheckboxFacetFilterCounts` **L907–936**; orchestrator `syncPlpFilterCounts` **L938–981** |
| Country count uses regions | `jabHasFacetValue(..., "country", …, filters.regions)` → `jabCoversCountry` | **L812–813**, **L860** |
| **Zero count** | Set count label; `disabled`; if was checked → uncheck; returns `selectionCleared` | `setFilterCheckboxItemState` **L746–765** |
| **Re-apply after clear** | If any facet auto-cleared, re-read filters, re-apply tile visibility, sync counts again | `syncPlpListingResults` finalize / no-load paths **L1177–1180**, **L1194–1197** |
| React counters (display only) | Same leave-one-out idea | `countPlpFacetOption` / `countPlpTypeOption` `plpCatalog.ts` **L428–453** — **no** disable/auto-uncheck |

### D. Disease list rebuild (related cascade, not region-gated)

| Step | Exact logic | File:line |
|------|-------------|-----------|
| 1 | Collect disease labels from jab tile meta + title infer + bundle text | `collectPlpDiseaseFilterLabels` **L613–637** |
| 2 | Score = jab hits + bundle hits; drop 0; sort DESC; cap 10 | `countCatalogDisease` **L589–611**; slice **L636** |
| 3 | Write into By Disease checkbox list | `ensurePlpFilterLists` **L729–732** |

Disease candidates are **not** narrowed by selected region; region still affects **counts** (and thus disable) via C.

### E. Search + View all (orthogonal; already registered I6 / L8)

| Behavior | File:line |
|----------|-----------|
| Search only hides rows by label substring (disease + country sections) | `syncFilterSectionListSearch` **L378–392**; `reapplyPlpFilterListSearch` **L394–397** |
| Re-applied after every listing finalize | **L1186**, **L1205** |
| View all with filled search → clear field | `handlePlpFilterViewAllClick` **L1564–1572** |

### Finn restore notes

1. **P0 I3b:** **Done** — `collectPlpCountryFilterLabels` + region toggle clears countries; shared wire `getPlpCountryCandidates` / `PLP_TRAVEL_COUNTRIES_BY_REGION`.
2. **P0 I3c:** When `countPlpFacetOption` / type count is `0`, disable row and drop that value from state; if any drop, re-filter listing (mirror Make double-pass). **Still open.**
3. **P0 match:** Port or share `jabCoversCountry` for jab country filtering/counts when `item.countries` empty. **Still open** (React curated items all have countries today).
4. **Do not** invent a second region→country map — reuse `PLP_TRAVEL_COUNTRIES_BY_REGION` from wire.
5. Wire path remains authoritative until Make child 9 delete; React must match these rules for CJM demos.

---

## Prove matrix (Quinn) — cannot PASS with unchecked P0s

| Item | Localhost | Interaction |
|------|-----------|-------------|
| L4 Filter / Reset → spinner **in-band**, **one** “Updating results…” (overlay only), **count hidden**, **no jump**, then **real** count | Required | MCP: `plp-reset-filters` empty count mid-load; `plp-reset-count-ready`; loader once |
| I3b Region → countries cascade | Required | Check South-East Asia → country list SEA-only; prior country checks cleared; counters remain |
| I1b Unchecked checkbox/radio mint hover | Required | Hover sidebar filter row |
| L5 Advantage bar visible + copy | Required | Visual |
| L10 no tile border | Required | Visual |
| I5 Reset Filters trash+label | Required | Hover icon→navy |
| I8b Book now hover = commerce navy lift | Required | Hover/active |
| I10 empty heart hover **navy** (not fuchsia); click/filled fuchsia | Required | MCP computed styles |
| I8 / I9 / I11 / W1 | Required | Book→PDP, QV, Bundles, no Make leak |
| I3b Region check → By Country list = that region only; orphan country checks cleared | Required | Check South-East Asia; assert no Europe/Africa countries in list |
| I3c Zero-count facet row disabled + auto-uncheck | Required | Drive filters until a country/disease hits 0 |
| Version chip = package.json | Required | MCP |

**Fail ship if:** any P0 above unchecked (incl. **I3b/I3c** once Finn ships), Uma fidelity checklist fail (incl. loading + checkbox hover lines), or Quinn interaction matrix fail.

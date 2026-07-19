# FE / UI / UX audit result

**Surface / slice:** PLP Vaccinations — PO rage #4 (filter/search Make + wire parity)  
**Date:** 2026-07-19  
**Auditor:** Uma (UI/UX) + Quinn (QA) + Finn (FE) + Bea (BA) — MCP localhost  
**Prior tip (distrusted):** `1ca5cba` / prior PROVEN on filter search **INVALID**  
**Ship tip:** _(fill after commit)_  
**Version:** `0.0.12`

**Checklist:** [../../../product/FE_UI_UX_AUDIT.md](../../../product/FE_UI_UX_AUDIT.md) · [UMA_FIDELITY_NOTES.md](../../../product/UMA_FIDELITY_NOTES.md)  
**Register:** [../features/PLP_MAKE_PARITY_REGISTER.md](../features/PLP_MAKE_PARITY_REGISTER.md)

---

## Verdict

| Field | Value |
|-------|-------|
| **Overall** | **PROVEN** (MCP evidence below — prior filter-search PROVEN revoked) |
| **PO green-light allowed?** | Yes for filter/search parity + sitrep countdown |
| **Uma fidelity checklist** | **PASS** |
| **Uma loading states** | **PASS** (unchanged; not this ship) |
| **Uma checkbox/radio hover** | **PASS** |
| **Bea register P0s** | **Complete — L8 / I6 / I6b / I6c Fixed** |
| **Quinn interaction matrix** | **PASS** — `__studioRunMcpPageProbe({ screenId: "plp" })` |
| **Arch MCP gate** | **PASS** |

---

## Root causes (honest)

1. **Two X icons** — `type="search"` native cancel + custom clear.  
2. **Search icon LEFT** — prior ship followed static Make DOM order; PO + Availability/Book wire = **RIGHT** (`end`).  
3. **View all / 10-cap / filled reset** — wire `PLP_FILTER_LIST_MAX` + `handlePlpFilterViewAllClick` never ported to React.  
4. **Option counters** — Make `setFilterRowCount` / facet counts cut from React checkbox rows.  
5. **Invented separator** — `.plp__filter-section { border-bottom }` not in Make.  
6. **Bespoke input** — not UXDS kit with full states.

---

## Restored from Make / wire scripts

| Source | Ported behavior |
|--------|-----------------|
| `plpListing.ts` `PLP_FILTER_LIST_MAX = 10` | Cap disease/country lists |
| `handlePlpFilterViewAllClick` / `clearPlpFilterSectionSearch` | Filled **View all** resets field |
| `setFilterRowCount` / `countJabFacetValue` | Option counters via `countPlpFacetOption` |
| `locationSearch` / Availability icon-end actions | Magnifier **end** + single clear |
| Make `component.plp.filter.view-all` | Always-present View all links |

---

## Quinn + Ben — MCP real-user matrix (localhost:5173)

**Session:** Chrome DevTools MCP · `http://127.0.0.1:5173/?project=boots-pharmacy&screen=plp`  
**Helper:** `__studioRunMcpPageProbe({ screenId: "plp", reload: false })`  
**FINAL:** **PASS**

| Step | Result | Evidence |
|------|--------|----------|
| plp-host | **PASS** | React PLP host |
| plp-search-icons | **PASS** | 2 icons, `data-studio-search-icon-pos="end"`, `type=text` |
| plp-filter-view-all | **PASS** | ≥2 View all links |
| plp-filter-option-counters | **PASS** | 33 rows with numeric counts |
| Preflight filter hr | **PASS** | `.plp__filter-section` borderBottomWidth `0px` |
| plp-checkbox-filter / reset | **PASS** | recipe green |
| plp-quick-view + overlay eyes | **PASS** | refuse under-click |
| url-screen | **PASS** | stay on `screen=plp` |

---

## Process harden this ship

- Ratchets **1b–1f** (icon-pos, single-clear, view-all, filter-counters, no-filter-hr)
- UXDS `SearchField` kit
- LESSONS / UMA / TEAM / PARITY_RATCHETS / register updated
- Sitrep: `Done — auto-closes in Xs` + dismiss robo-cursor on clear

## Honest residual

| Item | Status |
|------|--------|
| AI Assistant promo strip (L6) | Missing — residual |
| Catalog depth vs Make (L14) | Partial |

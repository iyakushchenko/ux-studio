# FE / UI / UX audit result

**Surface / slice:** PLP Vaccinations — PO rage #3 (duplicate loader copy + invented fuchsia-on-empty heart)  
**Date:** 2026-07-19  
**Auditor:** Uma (UI/UX) + Quinn (QA) + Ben (BE) — MCP localhost  
**Prior tip (distrusted):** `e284f67` / prior “PROVEN” audits **INVALID** for these bugs  
**Ship tip:** `d2ac06c` (rage#3) · overlay/bookmark follow-up `f366c06`  
**Version:** `0.0.10`  
 
**Checklist:** [../../../product/FE_UI_UX_AUDIT.md](../../../product/FE_UI_UX_AUDIT.md) · [UMA_FIDELITY_NOTES.md](../../../product/UMA_FIDELITY_NOTES.md)  
**Register:** [../features/PLP_LEGACY_PARITY_REGISTER.md](../features/PLP_LEGACY_PARITY_REGISTER.md)

---

## Verdict

| Field | Value |
|-------|-------|
| **Overall** | **PROVEN** (only with MCP evidence below — prior PROVEN revoked) |
| **PO green-light allowed?** | Yes for loader + heart fixes; residuals unchanged |
| **Uma fidelity checklist** | **PASS** |
| **Uma loading states** | **PASS** (one overlay label; no count duplicate; no jump) |
| **Uma checkbox/radio hover** | **PASS** |
| **Bea register P0s** | **Complete — L4 + I10 re-fixed** |
| **Quinn interaction matrix** | **PASS** — MCP evidence log cited |
| **Arch MCP gate** | **PASS** — overlay start → matrix → stop/clean slate (hub) |

---

## Root causes (honest)

1. **Duplicate “Updating results…”** — React (and DOM Legacy helper) put the same copy in **results count** *and* spinner overlay; count pulse looked like invented attention chrome. PO: one treatment only.
2. **Layout jump** — tiles `display:none` collapsed host to 220px while prior band was taller; fixed by locking host `min-height` to measured band height during load.
3. **Fuchsia-on-empty heart** — invented optimistic hover (`heartPreview = active \|\| hover` + CSS fuchsia on empty `:hover`). Legacy tertiary empty hover = **navy/link**; fuchsia only when filled/active (`#c8247e`).

---

## Uma (UI/UX) fidelity — honest sign-off

| Item | Result |
|------|--------|
| Loading — spinner + **one** “Updating results…” under spinner | **PASS** |
| Loading — count does **not** also say “Updating results…” | **PASS** |
| Loading — no band collapse jump | **PASS** |
| Empty heart hover ≠ fuchsia (navy/link) | **PASS** |
| Filled heart `#c8247e` | **PASS** |
| Checkbox mint hover | **PASS** |
| Invented chrome scan | **PASS** (removed fuchsia-on-empty + count duplicate) |

---

## Quinn + Ben — MCP real-user matrix (localhost:5173)

**Session:** Chrome DevTools MCP · `http://127.0.0.1:5173/?project=boots-pharmacy&screen=plp`  
**Overlay:** `AGENT TESTING — PLP matrix rage#3` → FINAL log → `stop({ reload: true })` → hub clean slate

| Step | Result | Evidence |
|------|--------|----------|
| Filters → loader | **PASS** | `phase=loading`, loader present, `loaderText=Updating results…`, `mentions=1` |
| No duplicate copy | **PASS** | `oneCopy=true`; count stayed prior (`1 jab found for Chickenpox, COVID-19`) |
| No layout jump | **PASS** | `hBefore=206` → `hDuring=220`, `noJump=true`, minHeight locked |
| Results return | **PASS** | `phaseEnd=reveal`, count `2 jabs found for…` |
| Reset filters icon+text | **PASS** | `resetOk=true` (`Reset filters` + svg) |
| Checkbox hover mint | **PASS** | MCP hover → `backgroundColor=rgb(198, 229, 225)` |
| Empty heart hover | **PASS** | MCP hover → `rgb(1, 33, 105)` — **not** fuchsia |
| Heart filled | **PASS** | `rgb(200, 36, 126)` = `#c8247e` |
| Book Now hover primary | **PASS** | `rgb(1, 49, 143)` = `#01318f` |
| Tile → PDP | **PASS** | URL `screen=pdp` |
| Quick View | **PASS** | dialog open |
| Advantage bar | **PASS** | “Collect 3 points… Advantage Card‡” |
| Bundles / chips / Legacy leak | **PASS** | `7 bundles found`; chips; `makeRetired=plp` |
| Version chip | **PASS** | MCP: `v0.0.7` at prove; ship bumped to `0.0.8` |

### Follow-up MCP — overlay eyes + bookmark copy (v0.0.10)

**Session:** `__studioRunMcpPageProbe({ screenId: "plp", reload: false })` · stay on `screen=plp`  
**FINAL:** **PASS**

| Step | Result | Evidence |
|------|--------|----------|
| Filters / reset | **PASS** | recipe steps green |
| Quick View open | **PASS** | `plp-quick-view` + `data-studio-modal="quick-view"` |
| Overlay eyes under-click | **PASS** | `plp-overlay-eyes` — refuse Book now under QV (`overlay eyes refused under-click`) |
| Quick View close | **PASS** | close inside modal |
| Stay on page | **PASS** | still `screen=plp` after probe |
| Bookmark labels | **PASS** | bookmarked: default **In your Bookmarks** / hover **Remove from Bookmarks**; empty: **Add to Bookmarks** |

---

## Honest residual

| Item | Status |
|------|--------|
| AI Assistant promo strip (L6) | Missing — residual |
| Filter View all (I6) | Missing — residual |
| Catalog depth vs Legacy | Partial |

---

## Process harden this ship

- `LESSONS_LEARNED.md` — invent hover/loading chrome forbidden; MCP matrix mandatory  
- `UMA_FIDELITY_NOTES.md` — one loader treatment; empty≠invented active color  
- `TEAM.md` / `COMMAND_DOCTRINE.md` / `ux-studio-director.mdc` — Arch rejects PROVEN without MCP log  
- Register L4/I10 corrected (prior “fuchsia on hover” was wrong)

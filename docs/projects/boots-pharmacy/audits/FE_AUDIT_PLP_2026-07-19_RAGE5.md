# FE / UI / UX audit result

**Surface / slice:** PLP Vaccinations — PO rage #5 (stale jab count during Reset refresh)  
**Date:** 2026-07-19  
**Auditor:** Quinn (QA) + Finn (FE) + Uma (UI/UX) — MCP localhost  
**Prior tip (distrusted for this class):** `f909b97` / rage#4 PROVEN did **not** cover count-hide-during-load  
**Ship tip:** `bc14a94`  
**Version:** `0.0.13`

**Checklist:** [../../../product/FE_UI_UX_AUDIT.md](../../../product/FE_UI_UX_AUDIT.md) · [UMA_FIDELITY_NOTES.md](../../../product/UMA_FIDELITY_NOTES.md)  
**Register:** [../features/PLP_MAKE_PARITY_REGISTER.md](../features/PLP_MAKE_PARITY_REGISTER.md)

---

## Verdict

| Field | Value |
|-------|-------|
| **Overall** | **PROVEN** (MCP evidence below) |
| **PO green-light allowed?** | Yes for Reset/refresh count hide |
| **Uma fidelity checklist** | **PASS** |
| **Uma loading states** | **PASS** — count empty/hidden while loader; real count after |
| **Uma checkbox/radio hover** | **PASS** (unchanged) |
| **Bea register P0s** | **Complete — L9 Fixed** |
| **Quinn interaction matrix** | **PASS** — `__studioRunMcpPageProbe({ screenId: "plp" })` |
| **Arch MCP gate** | **PASS** |

---

## Root cause

During filter Reset / refresh (`listingPhase === "loading"`), results count kept prior `displayItems` text (e.g. **“3 jabs available”**) while tiles hid and spinner showed “Updating results…”. PO rejects any numeric jab total that isn’t post-load truth.

---

## Fix

| Beat | Behavior |
|------|----------|
| Load start | Count children `null`; `data-studio-plp-results=""`; `data-studio-plp-results-loading="true"`; `.plp__results-count--loading` `visibility: hidden` |
| Overlay | Still **one** “Updating results…” under spinner |
| Load end | Real `${n} jabs available` only |

---

## Quinn + Ben — MCP real-user matrix (localhost:5173)

**Session:** Chrome DevTools MCP · `http://127.0.0.1:5173/?project=boots-pharmacy&screen=plp`  
**Helper:** `__studioRunMcpPageProbe({ screenId: "plp", reload: false })`  
**FINAL:** **PASS**

| Step | Result | Evidence |
|------|--------|----------|
| plp-host … option-counters | **PASS** | prior recipe |
| plp-checkbox-filter / plp-reset-visible | **PASS** | Reset appears after filter |
| **plp-reset-filters** | **PASS** | mid-load: `phase=loading`, count text empty, `results-loading=true`, loader present — **no jab-count text** |
| **plp-reset-count-ready** | **PASS** | real numeric `N jabs available` after load |
| plp-quick-view + overlay eyes | **PASS** | refuse under-click |
| url-screen | **PASS** | stay on `screen=plp` |

---

## Process harden this ship

- Ratchet **count-hide-load** (#9) in `check:parity-ratchets`
- Probe steps `plp-reset-filters` (mid-load) + `plp-reset-count-ready`
- LESSONS / PARITY_RATCHETS / register L9 updated

## Honest residual

- Catalog depth / AI promo strip still residual (not this ship)

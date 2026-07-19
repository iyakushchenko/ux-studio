# Quinn (QA) — PDP MCP prove

**Surface:** PDP Vaccine Details (`screenId: pdp`)  
**Date:** 2026-07-19  
**Auditor:** Quinn (QA) — Chrome DevTools MCP localhost  
**Ship tip (prove):** `1dc7f28` · base tip `2bd6941` · **v0.0.22**  
**Policy:** [QUINN_PDP_PROBE_CRITERIA_2026-07-19.md](./QUINN_PDP_PROBE_CRITERIA_2026-07-19.md) · [RECORDING.md](../../../shell/RECORDING.md) · recipe `12a0423`

---

## Verdict

| Field | Value |
|-------|-------|
| **Quinn MCP matrix** | **PASS** |
| **PROVEN / PAGE FINAL PASS HARD-GREEN?** | **No** — Uma §0a fidelity still **IN PROGRESS**; `pdp` not stamped in `PAGE_FINAL_PASS.json` / `PARITY_PROVEN.json` |
| **PO green-light?** | **No** until Uma PROVEN + Final Pass gates |

**Team check line:** `Quinn MCP — pdp — PASS` (interaction matrix only)

**Knowledge used:** QUINN_PDP_PROBE_CRITERIA · RECORDING.md (overlay + scroll-into-view + overlay-eyes) · PAGE_FINAL_PASS.md (refuse HARD-GREEN without Uma) · UMA_FIDELITY_PDP (IN PROGRESS) · playbackScroll `isDemoTargetInPrototypeView` full-rect rule

---

## MCP evidence

**Session:** Chrome DevTools MCP · `http://127.0.0.1:5186/?project=boots-pharmacy&screen=pdp`  
**Version chip:** `v0.0.22`  
**Helper:** `await window.__studioRunMcpPageProbe({ screenId: "pdp", reload: false })`  
**Result:** `{ pass: true, screenId: "pdp" }`  
**Overlay:** AGENT TESTING armed (`overlay-arm`) and visible through matrix including below-fold reveal  
**Prep (mandatory for honest logged-out / empty-heart):** header Sign Out (Make Sarah clone seeds logged-in); wishlist `["probe-dummy"]` so chickenpox empty (empty-set re-seeds `chickenpox`)

### Full matrix

| Step | Result | Detail |
|------|--------|--------|
| overlay-arm | **PASS** | BR panel visible |
| pdp-host | **PASS** | React host + `data-studio-make-retired=pdp` (leak=0) |
| pdp-landmarks | **PASS** | `header` + `main` + BEM `.pdp` |
| pdp-advantage | **PASS** | Collect 3 points… |
| pdp-no-loader | **PASS** | no invented spinner / Updating… |
| pdp-booster-price-on | **PASS** | Book now **£150** (booster checked) |
| pdp-booster-uncheck | **PASS** | Book now **£75** + mint hover CSS rule |
| pdp-booster-recheck | **PASS** | Book now **£150** |
| pdp-heart-hover | **PASS** | empty heart not fuchsia; navy + mint wash CSS |
| pdp-book-logged-out | **PASS** | `&modal=login` |
| pdp-overlay-eyes-login | **PASS** | refuse under-click |
| pdp-login-close | **PASS** | modal cleared; stay `screen=pdp` |
| pdp-check-avail | **PASS** | `&modal=choose-pharmacy` |
| pdp-overlay-eyes-avail | **PASS** | refuse under-click |
| pdp-avail-close | **PASS** | modal cleared; stay `screen=pdp` |
| pdp-crumb-plp | **PASS** | Vaccination → `screen=plp` |
| plp-to-pdp | **PASS** | PLP Book now → React PDP |
| pdp-below-fold-scroll | **PASS** | scroll-into-view + overlay visible (**not** soft-skip) |
| url-screen | **PASS** | ends `screen=pdp` |

---

## Fix applied during prove (Finn-shaped)

**Issue:** `data-studio-probe-below-fold` was on tall `.pdp__below` (~1868px). `isDemoTargetInPrototypeView` requires the **full** target rect inside the prototype pane → geometry **impossible** → `pdp-below-fold-scroll` FAIL.

**Fix:** stamp moved to compact `.pdp__content-title` (h2) inside below-fold — mirrors PLP compact-button pattern. Matrix re-run → **PASS**.

---

## Final Pass still blocked

| Gate | Status |
|------|--------|
| Quinn MCP interaction matrix | **PASS** (this audit) |
| Uma fidelity §0a / PROVEN | **IN PROGRESS** — [UMA_FIDELITY_PDP_2026-07-19.md](./UMA_FIDELITY_PDP_2026-07-19.md) |
| `PAGE_FINAL_PASS.json` `pdp` + `mcpFinalPass` HARD-GREEN | **Not stamped** |
| `PARITY_PROVEN.json` `pdp` | **Not required / not stamped** |
| `check:page-final-pass` for Home unblock | **Blocked** until above |

---

## Prep notes for future Quinn runs

1. Open logged-out PDP; Sign Out if header shows Sarah (Make header clone prefers Sarah).  
2. Empty chickenpox heart before probe (`aria-label="Add to wishlist"`); avoid empty wishlist array (reseeds chickenpox).  
3. Do not claim PAGE FINAL PASS HARD-GREEN from this matrix alone.

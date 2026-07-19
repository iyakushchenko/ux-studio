# Quinn (QA) — PDP MCP prove

**Surface:** PDP Vaccine Details (`screenId: pdp`)  
**Date:** 2026-07-19  
**Auditor:** Quinn (QA) — Chrome DevTools MCP localhost  
**Ship tip (prove):** `cbbd97d` · RTB vertical rhythm (LEGACY gap isolation) · **v0.0.24**  
**Prior prove (superseded tip stamp):** `eaf9aa3` / audit SHA `03687d3` · **v0.0.22**  
**Policy:** [QUINN_PDP_PROBE_CRITERIA_2026-07-19.md](./QUINN_PDP_PROBE_CRITERIA_2026-07-19.md) · [RECORDING.md](../../../shell/RECORDING.md) · recipe `12a0423`

---

## Verdict

| Field | Value |
|-------|-------|
| **Quinn MCP matrix** | **PASS** (re-prove on `cbbd97d` / v0.0.24) |
| **PROVEN / PAGE FINAL PASS HARD-GREEN?** | **No** — Uma §0a fidelity still **IN PROGRESS** / **NOT PASS**; `pdp` not stamped in `PAGE_FINAL_PASS.json` / `PARITY_PROVEN.json` |
| **PO green-light?** | **No** until Uma PROVEN + Final Pass gates |

**Team check line:** `Quinn MCP — pdp — PASS` (interaction matrix only; tip `cbbd97d`)

**Knowledge used:** QUINN_PDP_PROBE_CRITERIA · RECORDING.md (overlay + scroll-into-view + overlay-eyes) · PAGE_FINAL_PASS.md (refuse HARD-GREEN without Uma §0a) · UMA_FIDELITY_PDP (§0b rhythm measured; §0a NOT PASS) · playbackScroll `isDemoTargetInPrototypeView` full-rect rule

---

## MCP evidence (re-prove · `cbbd97d` / v0.0.24)

**Session:** Chrome DevTools MCP · `http://127.0.0.1:5186/?project=boots-pharmacy&screen=pdp`  
**Version chip:** `v0.0.24`  
**Helper:** `await window.__studioRunMcpPageProbe({ screenId: "pdp", reload: false })`  
**Result:** `{ pass: true, screenId: "pdp" }`  
**Overlay:** AGENT TESTING armed (`overlay-arm`) and visible through matrix including below-fold reveal  
**Prep (mandatory for honest logged-out / empty-heart):** header Sign Out (Make Sarah clone seeds logged-in); wishlist `["probe-dummy"]` so chickenpox empty (empty-set re-seeds `chickenpox`); confirm booster default **checked** + Book now **£150** before probe (dirty prior-run booster state → false FAIL)

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
| pdp-below-fold-scroll | **PASS** | scroll-into-view + overlay visible (**still green** post-RTB tip) |
| url-screen | **PASS** | ends `screen=pdp` |

**Overlay / below-fold note:** `overlay-arm`, both `pdp-overlay-eyes-*`, and `pdp-below-fold-scroll` remain **PASS** after RTB vertical-rhythm tip — no regression.

---

## Prior prove (kept for history)

Earlier tip `eaf9aa3` / v0.0.22 also matrix **PASS**; compact below-fold stamp fix (`.pdp__content-title`) documented there. Re-prove required because tip advanced to `cbbd97d` (RTB rhythm / LEGACY isolation).

---

## Final Pass still blocked

| Gate | Status |
|------|--------|
| Quinn MCP interaction matrix | **PASS** (this re-prove · `cbbd97d`) |
| Uma fidelity §0a / PROVEN | **IN PROGRESS / NOT PASS** — [UMA_FIDELITY_PDP_2026-07-19.md](./UMA_FIDELITY_PDP_2026-07-19.md) |
| `PAGE_FINAL_PASS.json` `pdp` + `mcpFinalPass` HARD-GREEN | **Not stamped** (Uma §0a incomplete) |
| `PARITY_PROVEN.json` `pdp` | **Not required / not stamped** |
| `check:page-final-pass` for Home unblock | **Blocked** until above |

---

## Prep notes for future Quinn runs

1. Open logged-out PDP; Sign Out if header shows Sarah (Make header clone prefers Sarah).  
2. Empty chickenpox heart before probe (`aria-label="Add to wishlist"`); avoid empty wishlist array (reseeds chickenpox).  
3. Confirm booster default checked + £150 **before** `__studioRunMcpPageProbe` — leftover unchecked state from a prior run fails the price steps.  
4. Do not claim PAGE FINAL PASS HARD-GREEN from this matrix alone.

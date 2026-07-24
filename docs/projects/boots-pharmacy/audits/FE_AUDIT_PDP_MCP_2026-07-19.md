# Quinn (QA) — PDP MCP prove

**Surface:** PDP Vaccine Details (`screenId: pdp`)  
**Date:** 2026-07-19  
**Auditor:** Quinn (QA) — Chrome DevTools MCP localhost  
**Ship tip (latest prove):** `f5f004f` · **v0.0.38** — PromoMessageStrip + tip-stable robo-cursor (re-prove after NEEDS-REPROVE)  
**Prior prove (superseded stamp):** `5c1d90f` · **v0.0.37** — Accordion Motion height  
**Uma §0a:** **PROVEN** @ tip `76e2433` / v0.0.30 — still valid; PromoMessageStrip kit extract does not reopen FAQ copy / TertiaryCta §0a  
**Policy:** [QUINN_PDP_PROBE_CRITERIA_2026-07-19.md](./QUINN_PDP_PROBE_CRITERIA_2026-07-19.md) · [RECORDING.md](../../../shell/RECORDING.md) · recipe `studioMcpPageProbe.ts`  
**Final Pass audit:** [FE_AUDIT_PDP_PAGE_FINAL_PASS_2026-07-19.md](./FE_AUDIT_PDP_PAGE_FINAL_PASS_2026-07-19.md) — Quinn MCP **PASS**; Arch **HARD-GREEN** restored

---

## Verdict

| Field | Value |
|-------|-------|
| **Quinn MCP matrix** | **PASS** — **23/23** |
| **Teardown** | **Clean** — `modal` null; `screen=pdp`; overlay `forceClear`; `__studioAssertAgentTeardownClean` PASS |
| **Hang / travel residual** | **None observed** on full matrix (~27s). PromoMessageStrip + tip-stable cursor did not regress probe. |
| **Uma fidelity §0a** | **PROVEN** — [UMA_FIDELITY_PDP_2026-07-19.md](./UMA_FIDELITY_PDP_2026-07-19.md) @ `76e2433` |
| **PAGE FINAL PASS HARD-GREEN?** | **HARD-GREEN** (`mcpFinalPass: HARD-GREEN`; `hardGreen: true`) |
| **PO green-light / Home?** | **Blocked** — wait PO `+` (HARD-GREEN alone does not open Home) |

**Team check line:** `Quinn MCP — pdp — PASS` · `PAGE FINAL PASS — pdp — HARD-GREEN`

**Knowledge used:** QUINN_PDP_PROBE_CRITERIA · RECORDING.md (overlay + scroll-into-view + overlay-eyes + teardown + `reload:false`) · PAGE_FINAL_PASS.md · TEAM_KNOWLEDGE Quinn § · STUDIO_AUTO_RULES R11 (reuse `:5173` tab) · LESSONS crash-safe probe · strip `mode=traditional-cjm` before matrix · Uma §0a PROVEN @ 76e2433

---

## MCP evidence (v0.0.38 re-prove · `f5f004f`)

**Session:** Chrome DevTools MCP · reuse tab **70** · `http://localhost:5173/?project=boots-pharmacy&screen=pdp` (canonical; no `new_page`)  
**Version tip:** `f5f004f` / **v0.0.38**  
**Helper:** `await window.__studioRunMcpPageProbe({ screenId: "pdp", reload: false })`  
**Result:** `{ pass: true, screenId: "pdp" }` · `failed: []` · **23/23** checks · **~27242 ms**  
**Overlay:** AGENT TESTING armed (`overlay-arm`) and visible through matrix including below-fold reveal  
**Prep:** `__studioSetLoggedIn(false)`; empty wishlist heart; Book now **£150**; strip CJM `mode`/`persona` before probe  
**Teardown:** login + choose-pharmacy closes clear `modal`; end `screen=pdp`; `forceClear` overlay removed; `__studioAssertAgentTeardownClean` PASS  

### Full matrix

| Step | Result | Detail |
|------|--------|--------|
| overlay-arm | **PASS** | BR panel visible |
| pdp-host | **PASS** | React host + legacy-retired |
| pdp-landmarks | **PASS** | `header` + `main` + BEM `.pdp` |
| pdp-advantage | **PASS** | Collect 3 points… |
| pdp-no-loader | **PASS** | no invented spinner / Updating… |
| pdp-booster-price-on | **PASS** | Book now **£150** |
| pdp-booster-uncheck | **PASS** | Book now **£75** |
| pdp-booster-recheck | **PASS** | Book now **£150** |
| pdp-heart-hover | **PASS** | empty heart hover |
| pdp-book-logged-out | **PASS** | `&modal=login` |
| pdp-overlay-eyes-login | **PASS** | refuse under-click |
| pdp-login-close | **PASS** | modal cleared; stay `screen=pdp` (teardown clean) |
| pdp-check-avail | **PASS** | `&modal=choose-pharmacy` (logged-out) |
| pdp-overlay-eyes-avail | **PASS** | refuse under-click |
| pdp-avail-close | **PASS** | modal cleared; stay `screen=pdp` (teardown clean) |
| pdp-crumb-plp | **PASS** | Vaccination → `screen=plp` |
| plp-to-pdp | **PASS** | PLP Book now → React PDP |
| pdp-below-fold-scroll | **PASS** | already in view + overlay visible |
| pdp-faq-accordion-toggle | **PASS** | Who is at risk? |
| pdp-faq-accordion-reopen | **PASS** | reopen |
| pdp-faq-help-body | **PASS** | How can Boots help? |
| pdp-download-cta-hover | **PASS** | tertiary `.pdp__pill` |
| url-screen | **PASS** | ends `screen=pdp` |

---

## Prior proves (kept for history)

| Tip | Version | Matrix | Note |
|-----|---------|--------|------|
| `5c1d90f` | v0.0.37 | **PASS** 23/23 | Accordion Motion; superseded by v0.0.38 re-prove |
| `57775a3` | v0.0.36 | **PASS** 23/23 | playback panel + cursor lock |
| `7c7c9e1` | v0.0.32 | **PASS** 23/23 | Motion travel |
| `7bce2b3` | v0.0.31 | **PASS** 23/23 | hang guards |
| `76e2433` | v0.0.30 | **PASS** 23/23 | FAQ 6/6 + Accordion (CSS-era) |
| `bf59041` | v0.0.28 | **PASS** 23/23 | superseded |

---

## Final Pass gate status

| Gate | Status |
|------|--------|
| Quinn MCP interaction matrix | **PASS** (this re-prove · 23/23 · `f5f004f` / v0.0.38) |
| Uma §0a | **PROVEN** (`76e2433`) |
| `PAGE_FINAL_PASS.json` `mcpFinalPass` | **HARD-GREEN** @ `53da33f` (Arch restore; prove `f5f004f`) |
| `hardGreen` | **true** |

---

## Prep notes for future Quinn runs

1. Open logged-out PDP; `__studioSetLoggedIn(false)` if header shows Sarah account (persona label ≠ logged-in).  
2. Empty chickenpox heart before probe (`aria-label="Add to wishlist"`).  
3. Confirm booster default checked + £150 **before** `__studioRunMcpPageProbe`.  
4. Strip `mode=traditional-cjm` (and journey persona) before matrix — CJM mid-probe navigation = FAIL.  
5. Re-prove after any tip that lands after the last MCP stamp with user-visible shell/PDP interaction.  
6. Probe always `{ reload: false }`; teardown with `forceClear` if overlay lingers.  
7. Do not stamp `hardGreen: true` from Quinn alone — Arch stamps after PASS + Uma §0a.  
8. Never run unbounded robo prove that navigates away.  
9. Canonical URL only `http://localhost:5173/` — `list_pages` → reuse Studio tab (R11).

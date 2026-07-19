# Quinn (QA) — PDP MCP prove

**Surface:** PDP Vaccine Details (`screenId: pdp`)  
**Date:** 2026-07-19  
**Auditor:** Quinn (QA) — Chrome DevTools MCP localhost  
**Ship tip (latest prove):** `5c1d90f` · **v0.0.37** — Accordion Motion height (`data-studio-accordion-motion="height"`)  
**Prove docs tip:** `cdf5c5f`  
**Prior prove (superseded stamp):** `57775a3` · **v0.0.36** — playback panel + on-target cursor lock  
**Uma §0a:** **PROVEN** @ tip `76e2433` / v0.0.30 — still valid; Motion height ship does not reopen FAQ copy / TertiaryCta §0a  
**Policy:** [QUINN_PDP_PROBE_CRITERIA_2026-07-19.md](./QUINN_PDP_PROBE_CRITERIA_2026-07-19.md) · [RECORDING.md](../../../shell/RECORDING.md) · recipe `studioMcpPageProbe.ts`  
**Final Pass audit:** [FE_AUDIT_PDP_PAGE_FINAL_PASS_2026-07-19.md](./FE_AUDIT_PDP_PAGE_FINAL_PASS_2026-07-19.md) — Quinn MCP **PASS**; Arch HARD-GREEN pending

---

## Verdict

| Field | Value |
|-------|-------|
| **Quinn MCP matrix** | **PASS** — **23/23** |
| **Teardown** | **Clean** — `modal` null; `screen=pdp`; overlay `forceClear`; `__studioAssertAgentTeardownClean` PASS |
| **Hang / travel residual** | **None observed** on full matrix (~29s). Accordion Motion tip did not regress probe. No unbounded robo. |
| **Spot — FAQ Accordion Motion height** | **PASS** — 6× `data-studio-accordion-motion="height"`; mid-tween sampled `0 → ~111px → 144px` (closed→mid→open) |
| **Uma fidelity §0a** | **PROVEN** — [UMA_FIDELITY_PDP_2026-07-19.md](./UMA_FIDELITY_PDP_2026-07-19.md) @ `76e2433` |
| **PAGE FINAL PASS HARD-GREEN?** | **Pending Arch** (`mcpFinalPass: PASS`; `hardGreen: false` until Arch restore) |
| **PO green-light / Home?** | **Blocked** — wait Arch HARD-GREEN + PO `+` |

**Team check line:** `Quinn MCP — pdp — PASS` · `PAGE FINAL PASS — pdp — NOT-GREEN` (await Arch HARD-GREEN)

**Knowledge used:** QUINN_PDP_PROBE_CRITERIA · RECORDING.md (overlay + scroll-into-view + overlay-eyes + teardown + `reload:false`) · PAGE_FINAL_PASS.md · TEAM_KNOWLEDGE Quinn § · STUDIO_AUTO_RULES R11 (reuse `:5173` tab) · LESSONS crash-safe probe · Accordion Motion contract · Uma §0a PROVEN @ 76e2433

---

## MCP evidence (v0.0.37 re-prove · `5c1d90f`)

**Session:** Chrome DevTools MCP · reuse tab **70** · `http://localhost:5173/?project=boots-pharmacy&screen=pdp` (canonical; no `new_page`)  
**Version tip:** `5c1d90f` / **v0.0.37**  
**Helper:** `await window.__studioRunMcpPageProbe({ screenId: "pdp", reload: false })`  
**Result:** `{ pass: true, screenId: "pdp" }` · `failed: []` · **23/23** checks · **~28686 ms**  
**Overlay:** AGENT TESTING armed (`overlay-arm`) and visible through matrix including below-fold reveal  
**Prep:** `__studioSetLoggedIn(false)`; Book now **£150** before probe  
**Teardown:** login + choose-pharmacy closes clear `modal`; end `screen=pdp`; `forceClear` overlay removed; `__studioAssertAgentTeardownClean` PASS  
**Spot Accordion Motion:** contract attr on 6 panels; tween `hClosed=0` → `hMid≈110.8` → `hOpen=144` on first FAQ trigger

### Full matrix

| Step | Result | Detail |
|------|--------|--------|
| overlay-arm | **PASS** | BR panel visible |
| pdp-host | **PASS** | React host + make-retired |
| pdp-landmarks | **PASS** | `header` + `main` + BEM `.pdp` |
| pdp-advantage | **PASS** | Collect 3 points… |
| pdp-no-loader | **PASS** | no invented spinner / Updating… |
| pdp-booster-price-on | **PASS** | Book now **£150** |
| pdp-booster-uncheck | **PASS** | Book now **£75** + mint hover CSS |
| pdp-booster-recheck | **PASS** | Book now **£150** |
| pdp-heart-hover | **PASS** | empty heart not fuchsia; navy + mint wash CSS |
| pdp-book-logged-out | **PASS** | `&modal=login` |
| pdp-overlay-eyes-login | **PASS** | refuse under-click |
| pdp-login-close | **PASS** | modal cleared; stay `screen=pdp` (teardown clean) |
| pdp-check-avail | **PASS** | `&modal=choose-pharmacy` + Find Pharmacy / `start` (logged-out) |
| pdp-overlay-eyes-avail | **PASS** | refuse under-click |
| pdp-avail-close | **PASS** | modal cleared; stay `screen=pdp` (teardown clean) |
| pdp-crumb-plp | **PASS** | Vaccination → `screen=plp` |
| plp-to-pdp | **PASS** | PLP Book now → React PDP |
| pdp-below-fold-scroll | **PASS** | already in view + overlay visible |
| pdp-faq-accordion-toggle | **PASS** | Who is at risk? collapsed |
| pdp-faq-accordion-reopen | **PASS** | reopen + Make body |
| pdp-faq-help-body | **PASS** | How can Boots help? Make RTB blurb |
| pdp-download-cta-hover | **PASS** | both tertiary `.pdp__pill`; no `--bordered` |
| url-screen | **PASS** | ends `screen=pdp` |

---

## Prior proves (kept for history)

| Tip | Version | Matrix | Note |
|-----|---------|--------|------|
| `57775a3` | v0.0.36 | **PASS** 23/23 | playback panel + cursor lock; superseded by Accordion Motion re-prove |
| `7c7c9e1` | v0.0.32 | **PASS** 23/23 | Motion travel |
| `7bce2b3` | v0.0.31 | **PASS** 23/23 | hang guards |
| `76e2433` | v0.0.30 | **PASS** 23/23 | FAQ 6/6 + Accordion (CSS-era) |
| `bf59041` | v0.0.28 | **PASS** 23/23 | superseded |

---

## Final Pass gate status

| Gate | Status |
|------|--------|
| Quinn MCP interaction matrix | **PASS** (this re-prove · 23/23 · `5c1d90f` / v0.0.37) |
| Accordion Motion height spot | **PASS** (mid-tween assertable) |
| Uma §0a | **PROVEN** (`76e2433`) |
| `PAGE_FINAL_PASS.json` `mcpFinalPass` | **PASS** @ `5c1d90f` (Arch HARD-GREEN next) |
| `hardGreen` | **false** until Arch stamp |

---

## Prep notes for future Quinn runs

1. Open logged-out PDP; `__studioSetLoggedIn(false)` if header shows Sarah account (persona label ≠ logged-in).  
2. Empty chickenpox heart before probe (`aria-label="Add to wishlist"`).  
3. Confirm booster default checked + £150 **before** `__studioRunMcpPageProbe`.  
4. Re-prove after any tip that lands after the last MCP stamp with user-visible shell/PDP interaction.  
5. Probe always `{ reload: false }`; teardown with `forceClear` if overlay lingers.  
6. Do not stamp `hardGreen: true` from Quinn alone — Arch stamps after PASS + Uma §0a.  
7. Never run unbounded robo prove that navigates away.  
8. Canonical URL only `http://localhost:5173/` — `list_pages` → reuse Studio tab (R11).

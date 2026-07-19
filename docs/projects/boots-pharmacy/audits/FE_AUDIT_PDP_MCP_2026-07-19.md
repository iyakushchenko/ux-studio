# Quinn (QA) — PDP MCP prove

**Surface:** PDP Vaccine Details (`screenId: pdp`)  
**Date:** 2026-07-19  
**Auditor:** Quinn (QA) — Chrome DevTools MCP localhost  
**Ship tip (latest prove):** `d6e4951` · **v0.0.27** (FAQ Accordion interactive + download CTA DS hover)  
**Prior prove (superseded):** `d7ce01c` · **v0.0.24** (pre–FAQ/CTA interaction — Final Pass HARD-GREEN then demoted NEEDS-REPROVE)  
**Earlier tips (history):** `cbbd97d` / `87c0fc8` · `eaf9aa3` / `03687d3`  
**Policy:** [QUINN_PDP_PROBE_CRITERIA_2026-07-19.md](./QUINN_PDP_PROBE_CRITERIA_2026-07-19.md) · [RECORDING.md](../../../shell/RECORDING.md) · recipe `studioMcpPageProbe.ts`  
**Final Pass audit:** [FE_AUDIT_PDP_PAGE_FINAL_PASS_2026-07-19.md](./FE_AUDIT_PDP_PAGE_FINAL_PASS_2026-07-19.md) — Arch restored **HARD-GREEN** @ tip `828ab2b` (Quinn does not stamp HARD-GREEN)

---

## Verdict

| Field | Value |
|-------|-------|
| **Quinn MCP matrix** | **PASS** (re-prove on tip `d6e4951` / v0.0.27) |
| **New steps** | `pdp-faq-accordion-toggle` · `pdp-faq-accordion-reopen` · `pdp-download-cta-hover` — all **PASS** |
| **Uma fidelity §0a (FAQ/CTA extras)** | **PROVEN** — [UMA_FIDELITY_PDP_2026-07-19.md](./UMA_FIDELITY_PDP_2026-07-19.md) tip `d6e4951` / v0.0.27 |
| **PAGE FINAL PASS HARD-GREEN?** | **HARD-GREEN** (Arch stamp tip `828ab2b` — Quinn matrix PASS cited; Quinn does not stamp) |
| **PO green-light / Home?** | **Sequencing unblocked** — Home still waits PO `+` |

**Team check line:** `Quinn MCP — pdp — PASS` (interaction matrix; tip `d6e4951` / v0.0.27)

**Knowledge used:** QUINN_PDP_PROBE_CRITERIA · RECORDING.md (overlay + scroll-into-view + overlay-eyes + teardown) · PAGE_FINAL_PASS.md (Quinn does not stamp HARD-GREEN) · TEAM_KNOWLEDGE Quinn § · FE_AUDIT_PDP_PLP_CONVENTIONS (new probe steps)

---

## MCP evidence (FAQ/CTA re-prove · `d6e4951` / v0.0.27)

**Session:** Chrome DevTools MCP · `http://127.0.0.1:5188/?project=boots-pharmacy&screen=pdp`  
**Version chip:** `v0.0.27`  
**Helper:** `await window.__studioRunMcpPageProbe({ screenId: "pdp", reload: false })`  
**Result:** `{ pass: true, screenId: "pdp" }` · `failed: []` · **22/22** checks  
**Overlay:** AGENT TESTING armed (`overlay-arm`) and visible through matrix including below-fold reveal  
**Prep (mandatory for honest logged-out / empty-heart):** `__studioSetLoggedIn(false)` → `loggedIn === false`; wishlist `["probe-dummy"]` so chickenpox empty; Book now **£150** (booster default on) before probe

### Landmarks / host (spot-check)

| Check | Result |
|-------|--------|
| `.pdp[data-studio-react-screen=pdp]` + `header`/`main` | **PASS** |
| `data-studio-make-retired=pdp` | **PASS** (5 retired children) |
| FAQ “Who is at risk?” Accordion present | **PASS** (post-probe `aria-expanded=true` after reopen) |
| Download CTA `.pdp__pill` Chickenpox Guide | **PASS** |

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
| pdp-faq-accordion-toggle | **PASS** | Who is at risk? → `aria-expanded=false`; body unmounted |
| pdp-faq-accordion-reopen | **PASS** | click again → `aria-expanded=true` + Make body copy |
| pdp-download-cta-hover | **PASS** | `.pdp__pill:hover` CSS present (stylesheet rule) |
| url-screen | **PASS** | ends `screen=pdp` |

---

## Prior proves (kept for history)

| Tip | Version | Matrix | Note |
|-----|---------|--------|------|
| `d7ce01c` | v0.0.24 | **PASS** | Final Pass HARD-GREEN then demoted after FAQ/CTA ship — **superseded** |
| `cbbd97d` / `87c0fc8` | v0.0.24 | **PASS** | RTB rhythm — superseded |
| `eaf9aa3` / `03687d3` | v0.0.22 | **PASS** | compact below-fold stamp |

---

## Final Pass gate status

| Gate | Status |
|------|--------|
| Quinn MCP interaction matrix | **PASS** (this re-prove · `d6e4951` / v0.0.27) |
| Uma §0a extras (Accordion + download hover) | **PROVEN** (`c037d19`) |
| `PAGE_FINAL_PASS.json` `mcpFinalPass` HARD-GREEN | **HARD-GREEN** — Arch stamp tip `828ab2b` |
| `hardGreen` | **true** |

---

## Prep notes for future Quinn runs

1. Open logged-out PDP; `__studioSetLoggedIn(false)` if header shows Sarah.  
2. Empty chickenpox heart before probe (`aria-label="Add to wishlist"`); avoid empty wishlist array (reseeds chickenpox).  
3. Confirm booster default checked + £150 **before** `__studioRunMcpPageProbe`.  
4. Re-prove after any tip that lands after the last MCP stamp.  
5. Do not stamp `PAGE_FINAL_PASS.json` HARD-GREEN from Quinn — Arch after Uma §0a.

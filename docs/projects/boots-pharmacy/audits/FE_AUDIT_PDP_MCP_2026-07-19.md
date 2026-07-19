# Quinn (QA) — PDP MCP prove

**Surface:** PDP Vaccine Details (`screenId: pdp`)  
**Date:** 2026-07-19  
**Auditor:** Quinn (QA) — Chrome DevTools MCP localhost  
**Ship tip (latest prove):** `76e2433` · **v0.0.30** — FAQ 6/6 + Accordion CSS 0fr↔1fr + TertiaryCta soft + muted closed chevrons (+ tip includes robo R10 from `85d7c81`)  
**Probe stamp:** this commit (`PENDING_COMMIT`) — Full Pass re-prove after Final Pass **NEEDS-REPROVE**  
**Uma §0a:** **PROVEN** @ tip `76e2433` / v0.0.30 (docs tip `331998b`)  
**Prior prove (superseded):** `bf59041` · **v0.0.28** (prove `67a5b7c`)  
**Policy:** [QUINN_PDP_PROBE_CRITERIA_2026-07-19.md](./QUINN_PDP_PROBE_CRITERIA_2026-07-19.md) · [RECORDING.md](../../../shell/RECORDING.md) · recipe `studioMcpPageProbe.ts`  
**Final Pass audit:** [FE_AUDIT_PDP_PAGE_FINAL_PASS_2026-07-19.md](./FE_AUDIT_PDP_PAGE_FINAL_PASS_2026-07-19.md) — Quinn MCP **PASS**; Arch HARD-GREEN still pending

---

## Verdict

| Field | Value |
|-------|-------|
| **Quinn MCP matrix** | **PASS** — **23/23** |
| **v0.0.30 steps** | FAQ 6/6 (0 residual) + Accordion grid motion CSS + TertiaryCta soft Find out more + muted closed chevron tokens |
| **Spot: accordion / chevron** | **PASS** — `.uxds-accordion-content` `grid-template-rows: 0fr` ↔ `1fr` + `__clip` span; soft/strong icon tokens differ (`rgb(175,204,202)` vs `rgb(70,118,114)`) |
| **Spot: robo cursor R10** | **PASS** — `__studioProveRoboCursorFeedback(".proto-avail-header .proto-popup-close")` |
| **Uma fidelity §0a** | **PROVEN** — [UMA_FIDELITY_PDP_2026-07-19.md](./UMA_FIDELITY_PDP_2026-07-19.md) @ `76e2433` |
| **PAGE FINAL PASS HARD-GREEN?** | **No yet** — `mcpFinalPass: PASS`; `hardGreen: false` until Arch restore |
| **PO green-light / Home?** | **Blocked** — wait Arch HARD-GREEN then PO `+` |

**Team check line:** `Quinn MCP — pdp — PASS` · `PAGE FINAL PASS — pdp — NOT-GREEN` (Arch stamp pending)

**Knowledge used:** QUINN_PDP_PROBE_CRITERIA · RECORDING.md (overlay + scroll-into-view + overlay-eyes + teardown) · PAGE_FINAL_PASS.md · TEAM_KNOWLEDGE Quinn § · STUDIO_AUTO_RULES R10 robo-cursor · Uma §0a PROVEN @ 76e2433

---

## MCP evidence (v0.0.30 re-prove · `76e2433`)

**Session:** Chrome DevTools MCP · `http://127.0.0.1:5188/?project=boots-pharmacy&screen=pdp`  
**Version chip:** `v0.0.30` (UI `v0.0.30alpha`)  
**Helper:** `await window.__studioRunMcpPageProbe({ screenId: "pdp", reload: false })`  
**Result:** `{ pass: true, screenId: "pdp" }` · `failed: []` · **23/23** checks  
**Overlay:** AGENT TESTING armed (`overlay-arm`) and visible through matrix including below-fold reveal  
**Prep:** `__studioSetLoggedIn(false)`; chickenpox heart empty (`Add to wishlist`); Book now **£150** (booster default on) before probe  
**Teardown:** login + choose-pharmacy closes clear `modal`; end `screen=pdp`

### Landmarks / host (spot-check)

| Check | Result |
|-------|--------|
| `.pdp[data-studio-react-screen=pdp]` + `header`/`main` | **PASS** |
| `data-studio-make-retired=pdp` | **PASS** |
| FAQ Accordion 6/6 (0 residual) | **PASS** (toggle/reopen + NHS expandable) |
| FAQ “How can Boots help?” body | **PASS** (Make RTB blurb + focus-none CSS) |
| Find out more `TertiaryCta soft` | **PASS** — `.studio-tertiary-cta--soft`; no `.pdp__pill--mint` |
| Accordion CSS 0fr↔1fr + clip | **PASS** — kit CSSOM + `.uxds-accordion-content__clip` |
| Muted closed chevrons | **PASS** — closed `--uxds-icon-icon-accent-soft` ≠ open `--uxds-icon-icon-accent-strong` |
| Download CTAs both `.pdp__pill` | **PASS** |
| Robo cursor R10 (avail close) | **PASS** |

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
| pdp-faq-accordion-toggle | **PASS** | Who is at risk? → `aria-expanded=false`; content `data-state=closed` |
| pdp-faq-accordion-reopen | **PASS** | reopen + Make body; **0** residual; NHS trigger present |
| pdp-faq-help-body | **PASS** | How can Boots help? Make RTB blurb + accordion focus-none CSS |
| pdp-download-cta-hover | **PASS** | both tertiary `.pdp__pill`; no `--bordered` / mint |
| url-screen | **PASS** | ends `screen=pdp` |

---

## Prior proves (kept for history)

| Tip | Version | Matrix | Note |
|-----|---------|--------|------|
| `bf59041` | v0.0.28 | **PASS** 23/23 | superseded by v0.0.30 FAQ 6/6 + Accordion motion |
| `d6e4951` | v0.0.27 | **PASS** 22/22 | stale after v0.0.28 polish |
| `d7ce01c` | v0.0.24 | **PASS** | Final Pass then demoted — **superseded** |

---

## Final Pass gate status

| Gate | Status |
|------|--------|
| Quinn MCP interaction matrix | **PASS** (this re-prove · 23/23 · `76e2433` / v0.0.30) |
| Uma §0a (FAQ 6/6 + Accordion motion + TertiaryCta soft) | **PROVEN** (`76e2433` / docs `331998b`) |
| `PAGE_FINAL_PASS.json` `mcpFinalPass` | **PASS** (this stamp) |
| `hardGreen` | **false** — Arch restore next |

---

## Prep notes for future Quinn runs

1. Open logged-out PDP; `__studioSetLoggedIn(false)` if header shows Sarah.  
2. Empty chickenpox heart before probe (`aria-label="Add to wishlist"`); avoid empty wishlist array (reseeds chickenpox).  
3. Confirm booster default checked + £150 **before** `__studioRunMcpPageProbe`.  
4. Re-prove after any tip that lands after the last MCP stamp.  
5. Download CTA assert compares **product** `pdp__*` classes only (demo hover adds `proto-chat-cta--hover`).  
6. Do not stamp `hardGreen: true` from Quinn — Arch stamps after PASS + Uma §0a.  
7. Robo R10: prefer `__studioProveRoboCursorFeedback(".proto-avail-header .proto-popup-close")` (soft TertiaryCta may not change bg/color).

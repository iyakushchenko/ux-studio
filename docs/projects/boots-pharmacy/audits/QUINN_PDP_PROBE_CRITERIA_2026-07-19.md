# Quinn (QA) — PDP MCP prove criteria

**Status:** MCP matrix **PASS** @ tip `76e2433` / v0.0.30 — evidence [FE_AUDIT_PDP_MCP_2026-07-19.md](./FE_AUDIT_PDP_MCP_2026-07-19.md).  
**PAGE FINAL PASS:** Quinn `mcpFinalPass: PASS` — Arch HARD-GREEN pending (`hardGreen: false`). Uma §0a PROVEN @ `76e2433`.  
**Updated:** 2026-07-19 (FAQ 6/6 + Accordion grid motion + TertiaryCta soft + muted chevrons)  
**Screen:** `pdp` (Frame child 8)  
**Register:** [../features/PDP_MAKE_PARITY_REGISTER.md](../features/PDP_MAKE_PARITY_REGISTER.md)  
**Refs:** [RECORDING.md](../../../shell/RECORDING.md) · LESSONS overlay/scroll · PLP probe pattern in `studioMcpPageProbe.ts`

---

## Hard refuse rules

- **No false PROVEN** — Vitest/build green alone = BAD.
- Unchecked register **scaffold P0** = cannot PASS.
- Overlay missing / not visible on any step = FAIL.
- Click-through under open modal = felony FAIL.
- Invented PDP loader/spinner = FAIL (LE1–LE3 N/A).
- Soft-skip on `pdp-below-fold-scroll` = **not** fidelity PROVEN for Body7 (hook must be present + reveal PASS).

---

## Probe entry

```js
await window.__studioRunMcpPageProbe?.({ screenId: "pdp", reload: false })
// aliases: __protoRunMcpPageProbe — same
// Open ?screen=pdp first (logged-out) so Book now → login.
```

**Recipe:** `src/app/shell/studioMcpPageProbe.ts` (`pdpProbeSteps`).  
**Below-fold hook:** compact `[data-studio-probe-below-fold="true"]` on `.pdp__content-title` (not tall `.pdp__below` — full-rect in-view rule).

**Prep:** Sign Out / `__studioSetLoggedIn(false)` if header Sarah; empty chickenpox wishlist heart (empty `proto-wishlist` reseeds chickenpox).

---

## Matrix (scaffold ship + FAQ/CTA)

| # | Step id | Action | Pass if | Notes |
|---|---------|--------|---------|-------|
| 0 | `overlay-arm` | assert BR panel | Agent testing overlay visible before clicks | mandatory |
| 1 | `pdp-host` | assert | `[data-studio-react-screen="pdp"]` present; Make leak=`data-studio-make-retired=pdp` on retired children | |
| 2 | `pdp-landmarks` | assert | `header` + `main` inside React host; BEM root `.pdp` | |
| 3 | `pdp-advantage` | assert | Advantage bar copy visible (Collect 3 points…) | |
| 4 | `pdp-no-loader` | assert | No listing/page spinner / “Updating…” invent | |
| 5 | `pdp-booster-price-on` | assert | Book now shows **£150** when booster checked (default) | |
| 6 | `pdp-booster-uncheck` | click checkbox | Book now → **£75**; unchecked mint hover CSS rule present | computed `:hover` via stylesheet (demo cursor ≠ CSS :hover) |
| 7 | `pdp-booster-recheck` | click | Book now → **£150** | |
| 8 | `pdp-heart-hover` | hover empty heart | Rest color not fuchsia; navy + mint wash hover CSS | |
| 9 | `pdp-book-logged-out` | click Book now | `&modal=login` | |
| 9b | `pdp-overlay-eyes-login` | refuse-click | under-modal click refused | mandatory overlay-eyes |
| 10 | `pdp-login-close` | close login | `modal` cleared; stay `screen=pdp` | teardown clean |
| 11 | `pdp-check-avail` | click Check availability (logged-out) | `&modal=choose-pharmacy` + **Find Pharmacy** (`data-studio-avail-step="start"`) — FAIL if Choose Date | |
| 11b | `pdp-overlay-eyes-avail` | refuse-click | under-modal click refused | mandatory overlay-eyes |
| 12 | `pdp-avail-close` | close | modal cleared; stay `screen=pdp` | teardown clean |
| 13 | `pdp-crumb-plp` | click Vaccination crumb | `screen=plp` (React PLP) | |
| 14 | `plp-to-pdp` | Book now from PLP | returns `screen=pdp` React host | |
| 15 | `pdp-below-fold-scroll` | `reveal` | Scroll-into-view + overlay visible | **HARD** — compact below-fold stamp required |
| 16 | `pdp-faq-accordion-toggle` | click Who is at risk? | `aria-expanded=false`; body unmounted / content closed | UXDS Accordion |
| 17 | `pdp-faq-accordion-reopen` | click again | `aria-expanded=true` + Make body; **0** residual headers (FAQ 6/6) | |
| 18 | `pdp-faq-help-body` | click How can Boots help? | Make RTB service blurb body; focus-none CSS | |
| 19 | `pdp-download-cta-hover` | hover Chickenpox Guide | both CTAs same product `.pdp__pill` classes; no `--bordered` / mint; ignore demo `proto-chat-cta--hover` | |
| — | `url-screen` | assert | ends on `screen=pdp` | auto after recipe |

Logged-in Book now → `screen=book-step-1` — prove in a second session or after login helper (document in evidence log).

**Optional spot (v0.0.30):** Accordion CSSOM `0fr`↔`1fr` + `__clip`; Find out more `.studio-tertiary-cta--soft`; `__studioProveRoboCursorFeedback(".proto-avail-header .proto-popup-close")` for R10.

---

## Evidence required for PROVEN / Final Pass later

1. Localhost tip SHA + version chip match `package.json`. ✅ `76e2433` / v0.0.30  
2. MCP panel step log (PASS/FAIL) or probe JSON with overlay-arm + overlay-eyes — **done:** [FE_AUDIT_PDP_MCP_2026-07-19.md](./FE_AUDIT_PDP_MCP_2026-07-19.md) (**23/23**).  
3. Register scaffold P0 rows marked Fixed/Present.  
4. Uma fidelity §0a DS matrix **PASS** for FAQ Accordion + download CTA hover — **done** @ `76e2433`.  
5. Arch team check with **Knowledge used** per role + PAGE FINAL PASS HARD-GREEN stamp — **pending** (Quinn PASS unblocks Arch).

**Final Pass:** Arch stamps `PAGE FINAL PASS — pdp — HARD-GREEN` (Home still waits PO `+`).

# Quinn (QA) — PDP MCP prove criteria

**Status:** **MCP matrix PASS** (2026-07-19) — see [FE_AUDIT_PDP_MCP_2026-07-19.md](./FE_AUDIT_PDP_MCP_2026-07-19.md).  
**Not** PAGE FINAL PASS HARD-GREEN / Uma §0a PROVEN.  
**Updated:** 2026-07-19 (Quinn MCP localhost prove)  
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

**Recipe:** `src/app/shell/studioMcpPageProbe.ts` (`pdpProbeSteps`, Ben `12a0423`).  
**Below-fold hook:** compact `[data-studio-probe-below-fold="true"]` on `.pdp__content-title` (not tall `.pdp__below` — full-rect in-view rule).

**Prep:** Sign Out if header Sarah; empty chickenpox wishlist heart (empty `proto-wishlist` reseeds chickenpox).

---

## Matrix (scaffold ship)

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
| 10 | `pdp-login-close` | close login | `modal` cleared; stay `screen=pdp` | |
| 11 | `pdp-check-avail` | click Check availability | `&modal=choose-pharmacy` | |
| 11b | `pdp-overlay-eyes-avail` | refuse-click | under-modal click refused | mandatory overlay-eyes |
| 12 | `pdp-avail-close` | close | modal cleared; stay `screen=pdp` | |
| 13 | `pdp-crumb-plp` | click Vaccination crumb | `screen=plp` (React PLP) | |
| 14 | `plp-to-pdp` | Book now from PLP | returns `screen=pdp` React host | |
| 15 | `pdp-below-fold-scroll` | `reveal` | Scroll-into-view + overlay visible | **HARD** — compact below-fold stamp required |
| — | `url-screen` | assert | ends on `screen=pdp` | auto after recipe |

Logged-in Book now → `screen=book-step-1` — prove in a second session or after login helper (document in evidence log).

---

## Evidence required for PROVEN / Final Pass later

1. Localhost tip SHA + version chip match `package.json`.
2. MCP panel step log (PASS/FAIL) or probe JSON with overlay-arm + overlay-eyes — **done:** [FE_AUDIT_PDP_MCP_2026-07-19.md](./FE_AUDIT_PDP_MCP_2026-07-19.md).
3. Register scaffold P0 rows marked Fixed/Present.
4. Uma fidelity §0a DS matrix **PASS** (still open).
5. Arch team check with **Knowledge used** per role + PAGE FINAL PASS stamp.

**Until Uma + Final Pass:** interaction matrix may be **PASS**; page status remains **NOT PAGE FINAL PASS HARD-GREEN**.

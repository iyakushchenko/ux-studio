# Quinn (QA) — PDP MCP prove criteria (prep)

**Status:** PREP only — **do not stamp PROVEN / HARD-GREEN** until MCP localhost matrix PASS after Finn mount.  
**Updated:** 2026-07-19 (Arch kickoff)  
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

---

## Probe entry

```js
await window.__studioRunMcpPageProbe?.({ screenId: "pdp" })
// aliases: __protoRunMcpPageProbe — same
```

Recipe to add in `studioMcpPageProbe.ts` once Finn stamps probe hooks (`data-studio-*`). Until recipe lands, Quinn may drive manual MCP steps against the criteria below and log evidence — still **no PROVEN**.

---

## Matrix (scaffold ship)

| # | Step id (proposed) | Action | Pass if |
|---|--------------------|--------|---------|
| 0 | `overlay-arm` | assert BR panel | Agent testing overlay visible before clicks |
| 1 | `pdp-host` | assert | `[data-studio-react-screen="pdp"]` present; Make leak=`data-studio-make-retired=pdp` on retired children |
| 2 | `pdp-landmarks` | assert | `header` + `main` inside React host; BEM root `.pdp` |
| 3 | `pdp-advantage` | assert | Advantage bar copy visible (Collect 3 points…) |
| 4 | `pdp-no-loader` | assert | No listing/page spinner / “Updating…” invent |
| 5 | `pdp-booster-price-on` | assert | Book now shows **£150** when booster checked (default) |
| 6 | `pdp-booster-uncheck` | click checkbox | Book now → **£75**; unchecked mint hover verified (computed) |
| 7 | `pdp-booster-recheck` | click | Book now → **£150** |
| 8 | `pdp-heart-hover` | hover empty heart | Navy / mint wash — **not** fuchsia on empty |
| 9 | `pdp-book-logged-out` | click Book now | `&modal=login`; overlay-eyes refuse under-modal click |
| 10 | `pdp-login-close` | close login | `modal` cleared; stay `screen=pdp` |
| 11 | `pdp-check-avail` | click Check availability | `&modal=choose-pharmacy`; overlay visible; overlay-eyes |
| 12 | `pdp-avail-close` | close | modal cleared; stay `screen=pdp` |
| 13 | `pdp-crumb-plp` | click Vaccination crumb | `screen=plp` (React PLP) |
| 14 | `plp-to-pdp` | Book now from PLP | returns `screen=pdp` React host |
| 15 | Below-fold (post-scaffold) | `reveal` | Scroll-into-view before interact; overlay still visible |

Logged-in Book now → `screen=book-step-1` — prove in a second session or after login helper (document in evidence log).

---

## Evidence required for PROVEN later

1. Localhost tip SHA + version chip match `package.json`.
2. MCP panel step log (PASS/FAIL) or probe JSON with overlay-arm + overlay-eyes.
3. Register scaffold P0 rows marked Fixed/Present.
4. Uma fidelity kickoff notes cited; §0a DS matrix not skipped.
5. Arch team check with **Knowledge used** per role.

**Until then:** status = **NOT PROVEN**.

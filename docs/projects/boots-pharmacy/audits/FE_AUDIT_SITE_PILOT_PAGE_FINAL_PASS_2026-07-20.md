# PAGE FINAL PASS — Site Pilot / Home (HARD-GREEN)

**Surface:** Agentic Site Pilot Home (`screenId: site-pilot`, Legacy child 11)  
**Date:** 2026-07-20  
**Auditor:** Quinn (QA) MCP matrix · Uma (UI/UX) fidelity · Arch (Director) HARD-GREEN  
**Ship tip:** _(stamped at commit)_ · **v0.0.59**  
**Policy:** [PAGE_FINAL_PASS.md](../../../product/PAGE_FINAL_PASS.md) · manifest [PAGE_FINAL_PASS.json](./PAGE_FINAL_PASS.json) · criteria [QUINN_HOME_PROBE_CRITERIA_2026-07-19.md](./QUINN_HOME_PROBE_CRITERIA_2026-07-19.md)

---

## Verdict

| Field | Value |
|-------|-------|
| **PAGE FINAL PASS** | **HARD-GREEN** |
| **mcpFinalPass** | **HARD-GREEN** |
| **Quinn interaction matrix** | **PASS** 15/15 |
| **Uma fidelity** | **PROVEN** — [UMA_FIDELITY_HOME_2026-07-19.md](./UMA_FIDELITY_HOME_2026-07-19.md) |
| **PARITY_PROVEN `site-pilot`** | **proven** |
| **Chat unblocked?** | **Yes** — sequence gate: Site Pilot hard-green before Chat Final Pass |

**Team check line:** `PAGE FINAL PASS — site-pilot — HARD-GREEN`

**Knowledge used:** PAGE_FINAL_PASS sequencing · UMA no-invent (no footer/crumbs/Advantage) · Quinn R11 `:5173` + overlay-arm · auth SSoT `isStudioLoggedIn` · LESSONS false-PROVEN

---

## MCP evidence (Quinn · 2026-07-20)

**URL:** `http://127.0.0.1:5173/?project=boots-pharmacy&screen=site-pilot&persona=sarah-jenkins&cjm=off&experience=agentic`  
**Helper:** `await window.__studioRunMcpPageProbe({ screenId: "site-pilot", reload: false })`  
**Result:** `{ pass: true, screenId: "site-pilot" }` · **15/15** checks  

| Id | Pass |
|----|------|
| overlay-arm | PASS |
| site-pilot-host | PASS |
| site-pilot-legacy-retired | PASS |
| site-pilot-landmarks | PASS |
| site-pilot-heading-logged-out | PASS |
| site-pilot-heading-logged-in | PASS |
| site-pilot-query | PASS |
| site-pilot-ds-hover-send | PASS |
| site-pilot-ds-hover-mic | PASS |
| site-pilot-ds-hover-chip | PASS |
| site-pilot-send-to-chat | PASS |
| site-pilot-return-after-send | PASS |
| site-pilot-chip-to-chat | PASS |
| site-pilot-return-after-chip | PASS |
| url-screen | PASS |

**Overlay:** AGENT TESTING visible every step.  
**Auth:** heading personalization via `__studioSetLoggedIn` / `isStudioLoggedIn` SSoT (HomeScreen `useSyncExternalStore`).  
**DS:** Legacy hover CSS present for mic / send / chip (no invent).  
**Teardown:** restored `screen=site-pilot` after send/chip nav; `reload: false`.

---

## Structure contracts

- `<main class="site-pilot home">` + `data-studio-react-screen="site-pilot"`
- Legacy retired: `data-studio-legacy-retired="site-pilot"`
- BEM root includes `site-pilot` (folder residual `home__*` OK — honest)
- No in-page `<header>` crumbs (Legacy Body10 has none — engine chrome) — check script `HEADER_LANDMARK_OPTIONAL`
- UXDS: shared `SitePilotComposer` (Legacy `component.input.button`) — ButtonPrimary N/A

---

## Honest residual

| Id | Note |
|----|------|
| R1 | Element BEM still `home__*` under dual root class — optional rename later |
| R2 | Decorative Legacy PNG atmosphere under-matched by gradient (signed under-match) |
| R3 | Mic remains visual no-op (Legacy parity) |
| R4 | PDP HARD-GREEN unchanged — not demoted |

# FE / UI / UX audit — Overlay pre-arm + PASS/FAIL sitrep + force clear

**Surface / slice:** AGENT TESTING overlay lifecycle (pre-arm → probe → green/red sitrep → hard clear) + QV close re-prove  
**Date:** 2026-07-19  
**Auditor:** Quinn (QA) — Chrome DevTools MCP `http://127.0.0.1:5185`  
**Ship tip:** `de2edf0` / **v0.0.20** (overlay) · Knowledge stamp `c497589` · QV close tip `1624f79` / **v0.0.19**  
**Policy:** [RECORDING.md](../../../shell/RECORDING.md) · [URL.md](../../../shell/URL.md) · LESSONS overlay / MCP probe

**Knowledge used:** TEAM_KNOWLEDGE Quinn · RECORDING MCP page probe · LESSONS overlay eyes + stale overlay · prior FAIL [FE_AUDIT_QV_MODAL_URL_2026-07-19.md](./FE_AUDIT_QV_MODAL_URL_2026-07-19.md)

---

## Verdict

| Field | Value |
|-------|-------|
| **Overall** | **PROVEN** |
| **PO green-light allowed?** | **Yes** — for overlay lifecycle + QV close |
| **Quinn interaction matrix** | **PASS** — 16/16 PLP probe steps |

---

## Lifecycle claims (MCP eyes)

| # | Claim | Result | Evidence |
|---|-------|--------|----------|
| 1 | Overlay appears **before** first probe step (preparing) | **PASS** | Samples t=0…2000ms: title `AGENT TESTING — preparing…`, hint `Preparing — starting in Ns`, log `pre-arm: preparing…`; first `PASS plp-*` log @ **2400ms** |
| 2 | End shows green **PASS** or red **FAIL** clearly | **PASS** | Sitrep after probe: `data-result=pass`, badge **PASS** `rgb(61, 214, 140)`, title `AGENT DONE — PASS` green. Synthetic fail stop: badge **FAIL** `rgb(255, 107, 107)`, title `AGENT DONE — FAIL` |
| 3 | After auto-close, overlay + robo **GONE** (no stale) | **PASS** | Waited `settleMs(5000)+2000`; DOM: `#agent-testing-overlay` absent, `.proto-chat-demo-cursor` absent, `html[data-studio-agent-testing]` cleared |
| 4 | QV close (prior FAIL) | **PASS** | `plp-quick-view-close` PASS on tip `1624f79` bridge suppress (re-prove on v0.0.20) |

**Chip:** `v0.0.20alpha` · Helper: `__studioRunMcpPageProbe({ screenId:"plp", reload:false, settleMs:5000, preArmMs:2500 })`  
**Probe result:** `{ pass: true, screenId: "plp" }`

---

## Full PLP matrix

| Step | Result | Detail |
|------|--------|--------|
| overlay-arm | **PASS** | BR panel visible |
| plp-host | **PASS** | |
| plp-book-now | **PASS** | |
| plp-search-icons | **PASS** | |
| plp-filter-view-all | **PASS** | |
| plp-filter-option-counters | **PASS** | |
| plp-checkbox-filter | **PASS** | |
| plp-reset-visible | **PASS** | |
| plp-reset-filters | **PASS** | |
| plp-reset-count-ready | **PASS** | |
| plp-quick-view-ready | **PASS** | |
| plp-below-fold-scroll | **PASS** | scroll-into-view + overlay visible |
| plp-quick-view | **PASS** | |
| plp-overlay-eyes | **PASS** | refuse under-click |
| plp-quick-view-close | **PASS** | prior URL re-open race fixed |
| url-screen | **PASS** | |

---

## Notes

- Pre-arm countdown is visible on the BR panel before robo clicks; first probe step logs only after prepare window.
- Sitrep stamps `result: pass|fail` into title + badge colors (not ambiguous text-only).
- `forceClear` / ensure-clear after settle removes overlay DOM + dismisses demo cursor — no stale panel after wait.
- Supersedes close verdict in [FE_AUDIT_QV_MODAL_URL_2026-07-19.md](./FE_AUDIT_QV_MODAL_URL_2026-07-19.md) (was FAIL on tip `43c1ec8`).

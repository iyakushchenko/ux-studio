# FE / UI / UX audit — Quick View modal URL (v0.0.18)

**Surface / slice:** PLP Quick View → `&modal=quick-view` open/close + overlay eyes  
**Date:** 2026-07-19  
**Auditor:** Quinn (QA) — Chrome DevTools MCP localhost:5185  
**Ship tip:** `43c1ec8` (Knowledge stamp) · feature tip `0afb33d` / **v0.0.18**  
**Policy:** [URL.md](../../../shell/URL.md) · [RECORDING.md](../../../shell/RECORDING.md) · TEAM modal URL registry HARD FAIL

**Knowledge used:** TEAM_KNOWLEDGE Quinn + URL.md modal table + LESSONS overlay eyes + RECORDING MCP page probe

---

## Verdict

| Field | Value |
|-------|-------|
| **Overall** | **FAIL** *(superseded)* → **PROVEN** on tip `1624f79` / v0.0.19 — re-prove [FE_AUDIT_OVERLAY_PREARM_SITREP_2026-07-19.md](./FE_AUDIT_OVERLAY_PREARM_SITREP_2026-07-19.md) |
| **PO green-light allowed?** | **Yes** after `1624f79` (was No on tip `43c1ec8`) |
| **Quinn interaction matrix** | Was **FAIL** `plp-quick-view-close` → **PASS** on re-prove |

---

## MCP evidence

**Session:** `http://localhost:5185/?project=boots-pharmacy&screen=plp&persona=sarah-jenkins&mode=agentic-cjm`  
**Helper:** `await window.__studioRunMcpPageProbe({ screenId: "plp", reload: false })`  
**Result:** `{ pass: false, screenId: "plp" }` · chip `v0.0.18`

### Full matrix

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
| plp-quick-view | **PASS** | open writes `&modal=quick-view`; stay `screen=plp` |
| plp-overlay-eyes | **PASS** | refuse under-click |
| plp-quick-view-close | **FAIL** | Quick View still open after close |
| url-screen | **PASS** | stay on `screen=plp` |

### Focus claims

| Claim | Result | Evidence |
|-------|--------|----------|
| Open → `&modal=quick-view` | **PASS** | probe assert + URL after open |
| Jab id in URL | **N/A** | URL.md: optional `&jab=` later (multi-SKU) |
| Overlay eyes refuse under-tile | **PASS** | `plp-overlay-eyes` |
| Close clears modal + dismisses overlay | **FAIL** | see race below |
| Stay on `screen=plp` | **PASS** | |

### Close race (native click timeline)

After Close button `click()`, samples (ms):

| t | `modal` | dialog present |
|---|--------|----------------|
| 80 | `null` | true |
| 160+ | `quick-view` | true |

URL briefly clears, then `&modal=quick-view` returns and dialog stays. Escape does not dismiss.

**Root cause (Quinn):** `useStudioModalUrlBridge` deep-link effect re-opens from stale URL when `wireTick` fires on close — `modalId` still `quick-view` while `live` already cleared → `applyModalFromUrl("quick-view")` reopens before/while URL sync settles.

---

## Blockers for Finn

1. **P0:** Close Quick View must dismiss overlay **and** clear `&modal=` without re-open. Fix URL↔live apply ordering (suppress URL→open during intentional close, or clear URL before wireTick notify, or ignore apply when closing).
2. Re-prove: `__studioRunMcpPageProbe({ screenId: "plp" })` → `plp-quick-view` + `plp-quick-view-close` + `plp-overlay-eyes` all **PASS**.

---

## Follow-ups

| Item | Owner | Notes |
|------|-------|-------|
| Close race / URL re-open | **Finn (FE)** | bridge in `useStudioModalUrlBridge.ts` |
| Re-prove + stamp PROVEN | **Quinn (QA)** | after Finn tip |

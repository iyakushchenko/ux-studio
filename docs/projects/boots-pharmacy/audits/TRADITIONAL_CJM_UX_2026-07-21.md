# Traditional CJM — holistic UX sitrep

**Status:** Evidence-backed smell inventory (not PROVEN / not green invent)  
**Date:** 2026-07-21  
**Primary dump:** `agent-testing-dump-manual-2026-07-20T22-58-41-155Z.json` (PO Save Log)  
**Helper:** `__protoRunTraditionalPlaySmoke` (session `traditional-play-smoke`)  
**Owners:** Quinn · Uma · Finn · Arch  
**Compare rail:** Agentic full prove `__studioRunAgenticFullPlayProve` · [QA_LOGGING_AND_PLAYBACK_RECIPE.md](../../../shell/QA_LOGGING_AND_PLAYBACK_RECIPE.md) · [CJM_RECORD_PLAY_EDIT.md](../../../shell/CJM_RECORD_PLAY_EDIT.md)

---

## Dump sitrep (PO-clear)

| Field | Value |
|-------|--------|
| Mode / experience / CJM | **traditional** / traditional / **on** |
| Session | `traditional-play-smoke` |
| Elapsed (overlay) | ~67s (play ~30s 01:57:26→01:57:56; Save Log later) |
| Peak during Play | Journey ran PLP → … → appointment-details → **Play finished — back at journey start** |
| Sitrep at Save Log | Post-reset: Steps **1/12** · `traditional-plp` · screen `plp` — **not** mid-peak |
| RESULT / halt | **No RESULT seal** (smoke tears down overlay; Save Log after stop/refresh) |
| Type-in | starts/ends/samples **0** (Traditional has no composer type-in — expected) |
| Click summary counter | `summaries.click.ok=0` despite 9 click rows — counter smell |
| Notices | **3×** `scroll-reversal` (Δ−922 / Δ−1207 / Δ−88), each mirrored twice in QA chat |
| Book date/time | **June 21 / 15:30** (primary pick — Traditional has no Avail handoff; pick-other N/A here) |

### Click sequence (QA chat)

1. Remove from Bookmarks → Book now → `plp`→`pdp`  
2. Book now - £150 → Sign in → `book-step-1` → `book-step-2`  
3. June 21 → 15:30 → Reserve Appointment → `book-step-3` (**scroll-reversal Δ−922**)  
4. Open Appointments → `appointment-history` (**scroll-reversal Δ−1207**)  
5. View Details → `appointment-details` (**scroll-reversal Δ−88**)  
6. Play finished → reset `plp`

**Missing from click log:** location Continue / store pick (beat may have been near-instant or unlabeled). **No** redundant re-click of already-selected date/time in this dump.

---

## Smell inventory

| Smell | Bug vs acceptable | Notes |
|-------|-------------------|--------|
| **Camera yank to origin on beat land** (`scrollCameraToOrigin` / `snapScreenScrollTop`) after Reserve / Open Appointments / View Details | **Bug (UX)** | Notice text ties to origin scroll; large Δ = “jumped the wrong way”. Primary “less smooth than Agentic” signal. |
| PLP first click labeled **Remove from Bookmarks** | **Smell / possible state desync** | Script intends add-bookmark showcase after `resetPlpTileBookmarkForPlayback`. Label may be post-toggle QA text — prove heart start state before calling green. |
| Login → Step1 → Step2 in ~1s; **no Continue click** in log | **Smell** | Feels abrupt vs agentic pacing; may be skip-logged or already-chosen slot. |
| Duplicate notice / Play-finished rows in QA chat | **Tooling noise** | Mirror double-emit — not product FAIL. |
| Smoke teardown → Save Log with Steps 1/12 | **Acceptable (smoke)** | Prefer keep-overlay full prove helper (agentic has one; Traditional still smoke-only). |
| `summaries.click.ok=0` | **Tooling smell** | Do not invent click-pass from summaries alone. |
| No type-in / no chat rails | **Acceptable** | Traditional path by design. |
| June 21 / 15:30 primary | **Acceptable here** | Agentic Avail handoff → pick-other **24/16:30** is the other rail. |

---

## Top 3 ROI fixes (do not invent green)

1. **Stop origin camera yanks on Traditional forward lands** where product scroll should stay / ease — gate `snapScreenScrollTop` / `scrollCameraToOrigin` so Reserve→confirm and history/details do not reverse-yank (fix or suppress false `scroll-reversal` only after camera feels right).  
2. **PLP bookmark beat honesty** — guarantee empty heart before add; QA label = pre-click intent (Add), not post-toggle Remove.  
3. **Traditional keep-overlay full Play prove** (parity with `__studioRunAgenticFullPlayProve`) — peak Steps + RESULT + Save Log without smoke teardown; then re-prove after (1)(2).

---

## Verdict

Traditional Play **completes** the playlist (smoke path) but **does not feel as smooth as Agentic** — evidence is **scroll-reversal yanks**, not missing date/time pick-other. **Not green** until camera ROI is fixed and re-dumped with ALWAYS CLEAR + Save Log (prefer keep-overlay prove).

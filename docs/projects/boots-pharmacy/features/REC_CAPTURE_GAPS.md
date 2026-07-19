# Feature brief — REC capture gaps (beat-enter / scroll / typed-text)

**Project:** `boots-pharmacy` (+ engine shell)  
**Callsigns:** Bea (brief) · Finn (build) · Uma (stand by) · Quinn (prove) · Pax (accept bump/push)  
**Status:** done  
**Updated:** 2026-07-19  
**Refs:** [RECORDING.md](../../../shell/RECORDING.md) · [NEXT_STEPS.md](../../../product/NEXT_STEPS.md) · [TEAM.md](../../../product/TEAM.md)

---

## Context

REC ↺ already replays transport, screen, dwell, demo-click, wire-intent, and director-script. Three capture/replay gaps block realistic cassette playback: **beat-enter**, **scroll**, and **typed-text**. Ship the largest complete vertical that unit + localhost can prove; leave honest compile/journey gaps.

## Business logic

| Rule | Behavior |
|------|----------|
| beat-enter | Already captured via `notePlaybackBeatEnter`. Replay known `JourneyBeatActionId` via `runBeatAction`. `sync-<bookScript>` → book script with `syncState`. Unknown ids → skip (not silent success). |
| scroll | While REC active, capture prototype scroll root (`.studio-scroll--prototype`) `scrollTop` (debounced). Replay sets `scrollTop` (optional `anchorSelector` → `scrollIntoView`). |
| typed-text | While REC active, capture trusted `input`/`change` on text-like fields with a resolvable selector chain. Replay sets value + dispatches `input`/`change`. Skip chrome, password, checkbox/radio/file. |
| Modal eyes | Typed-text / scroll targets under scrim resolve via modal guard (same as demo-click). |
| Compile | Journey compile may still gap `scroll` / `typed-text` — use REC ↺ for those. Known beat-enter → `onEnter` unchanged. |

## Acceptance (Bea → Quinn)

- [x] Unit: beat-enter / scroll / typed-text replay via apply hooks; unsupported when hooks missing
- [x] Unit: scroll + typed-text capture only while `isRecordingActive()`; chrome skipped
- [x] Stable selectors on avail search + agentic query (`data-studio-action`)
- [x] `__studio*` + `__proto*` aliases unchanged; no new `proto*` filenames
- [x] `npm test` green incl. `check:felonies` (315 tests)
- [x] Docs: RECORDING.md + NEXT_STEPS updated
- [x] Localhost: import session → ↺ replayed scrollTop=180 + typed `ProveLondon` + beat-enter; aliases dual-bound

## Chrome / fidelity (Uma)

- [x] No Studio chrome L&F change — Uma stand by
- [x] Concept inputs unchanged visually; `data-studio-action` only

## Mount / FE notes (Finn)

- Engine: `recordingTypes` / `recordingCapture` / `recordingReplay` / `useRecordingReplayBridge` / MCP helpers
- Boots: `AvailabilityTool` search + notify email; agentic home/chat textarea
- Capture: `ensureRecordingDomCapture` (click + scroll + typed)

## Prove notes (Quinn)

- Unit 2026-07-19: recording suite 32/32; full `npm test` 315/315; felonies OK
- Localhost 2026-07-19: `__studioImportRecording` + `__studioReplayRecording` → `{replayed:3, errors:[]}`; input=`ProveLondon`; scrollTop=180; `__studio*`≡`__proto*`

## Pax

- [x] User-visible REC replay fidelity → patch bump **YES**
- [x] Push **YES**
- [x] Notes/CHANGELOG on bump

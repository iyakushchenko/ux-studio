# FE / UI / UX audit — CJM compatibility re-test and all-CJM evidence

**Date:** 2026-07-22  
**Auditor:** Quinn (QA), independent strict post-implementation audit  
**Verdict:** **PROVEN**  
**PO green-light allowed:** **Yes**

## Verdict

The legacy compatibility deadlock is closed without weakening structural protection. Legacy recording metadata is now an advisory that permits playback; only a successful current-version/current-contract proof clears it. Immutable deployed recordings receive an origin-local proof shadow, preserving their creation metadata. The all-CJM suite retains compact per-journey outcomes and reports the real CJM count. The scroll tolerance is project-agnostic and proportional while the previously material 136px path deviation remains above the applicable threshold.

## Interaction and evidence matrix

| Contract | Result | Evidence |
|---|---|---|
| Legacy pre-proof state | **PASS** | `legacy-recording-contract` is severity `warning`; the journey remains `playable: true`. Dialog language already distinguishes “Re-test required” from “Playback blocked”. |
| Structural blockers | **PASS** | Missing source, unsupported schema, empty journey, and unstable click targets retain blocking severity and cannot enter playback. |
| Proof scope | **PASS** | Compatibility proof is current only when both playback-contract version and Studio version match. A stale Studio proof does not clear the advisory. |
| Proof written only after PASS | **PASS** | Autonomous `proveJourney` calls the proof writer only after `passOf(result)` succeeds for a `rec-*` journey. Timeout/non-pass returns without promotion. |
| Immutable deployed proof | **PASS** | Separate project/persona/journey proof receipt overlays deployed evidence without rewriting recording creation version or contract metadata. |
| Local recording proof | **PASS** | Existing persisted recordings receive the same proof receipt and metadata projection; source provenance remains unchanged. |
| Revision / warning refresh | **PASS** | Successful proof dispatches `studio:cjm-compatibility-proof`; App reapplies the proof shadow and recomputes compatibility metadata. Localhost currently exposes no global compatibility warning. |
| All-CJM enumeration | **PASS** | Runtime catalog contains 13 unique entries. Suite loops the current catalog and remains fail-fast. |
| Compact result truth | **PASS** | Completed `play-all-cjms` status stores exactly `{ journeyId, pass }` for each journey and the overlay finale uses result length, producing `13/13 CJMs passed`, not the one-test queue count. |
| Live journey completion | **PASS** | Coordinator live run stopped on two real failures, resumed only after fixes/restarts, then completed through the final 21-beat CJM. Independent localhost inspection confirmed that final journey’s visible Play completion, journey-start return, PASS result, no active diagnostic/PO latch, and no remaining compatibility warning. |
| Scroll false-positive tolerance | **PASS** | Threshold is universally `max(64px, 8% of travel)` after the existing 12% early-progress grace. Short-move 52px compositor offset is ignored. |
| Material scroll failure preserved | **PASS** | Large mid-path lag still fails. For the reported ~975px travel, proportional tolerance is ~78px, so the historical 136px deviation remains a failure and is not normalized away. Diagnostic detail now includes the applied threshold. |

## Focused automated evidence

Focused `vitest`: **6 files passed, 30 tests passed**.

- `recordedJourneyProof.test.ts`
- `recordingMetadata.test.ts`
- `cjmCompatibilitySummary.test.ts`
- `playbackScrollAnomalies.test.ts`
- `qaAutonomousSuite.test.ts`
- Sarah Jenkins `cjm/catalog.test.ts`

No remaining blocker was found in the audited compatibility/re-test, proof-shadow, scroll-threshold, or suite-result seam.

## Knowledge used

- **Quinn (QA):** TEAM_KNOWLEDGE fixed-localhost, source-plus-live verification, R15 stop-on-signal, and false-PROVEN rules; LESSONS early scroll-path false failures and “prior PROVEN is bad until re-proven”; RECORDING compatibility-proof provenance; QA recipe ALWAYS CLEAR, fail-fast, and proceed semantics; PLAYBACK_DIAG real play-end/reset evidence. Applied by preserving structural blockers and the 136px failure while requiring PASS-gated proof and truthful 13-result reporting.


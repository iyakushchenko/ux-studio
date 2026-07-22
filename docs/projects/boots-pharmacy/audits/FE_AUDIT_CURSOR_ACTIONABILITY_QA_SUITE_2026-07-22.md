# FE/UI/UX audit — cursor actionability + autonomous QA suite

**Date:** 2026-07-22  
**Auditor:** Quinn (QA)  
**Verdict:** **PROVEN**

## Scope

Strict post-implementation audit of the shared robo-cursor actionability contract and autonomous QA-suite lifetime. This is an engine audit; Boots Pharmacy is the live reference project, not a journey-specific exception.

## Interaction matrix

| Contract | Evidence | Result |
|---|---|---|
| Universal declared action edge | Shared `EARLY_HAND_INTERACTIVE_SELECTORS` recognizes `[data-studio-action]`; engine unit proves a future-project action area receives hand feedback. | PASS |
| Native disabled target | Shared guard rejects disabled button/input/select/textarea before both early-hand and click paths; integration proves no pointerdown, click, hover, press, or stale hand. | PASS |
| ARIA-disabled target | Guard walks target ancestry and rejects `aria-disabled="true"`; table-driven unit passes. | PASS |
| Inert subtree | Guard walks ancestry and rejects any `inert` ancestor; table-driven unit passes. | PASS |
| Inline pointer blocking | Guard rejects `pointer-events: none` on the action target while deliberately preserving playback through the engine-owned ancestor shield. | PASS |
| Atomic hand ownership | Click travel preserves the early-hand latch until on-target proof creates native hover; the latch is then cleared and graphic mode synchronized in the same turn. No settle arrow gap. | PASS |
| Modal race after travel | Target is resolved against the active modal before interaction and re-resolved after hover dwell. A newly blocking modal produces a diagnostic abort, not a false click. | PASS |
| Actionability race after hover | Both click target and press root are rechecked after hover dwell. Disconnected, disabled, hidden, zero-size, or transparent targets abort before press/click. | PASS |
| Honest click result | Aborts clear hover, release the cursor, return `false`, and emit failure detail; disabled integration proves no synthetic activation escapes. | PASS |
| Cursor graphic stability | Focused graphic-thrash and on-target suites pass; supplied live representative trace reports 9 clicks, 0 failures, 0 graphic flashes. | PASS |
| Autonomous suite continuity | Overlay idle and safety timers explicitly defer while suite phase is `running`; suite API survives orchestra-mode effect cleanup. Supplied live all-project run completed 13/13 CJMs. | PASS |
| Autonomous result truth | `play-all-cjms` retains compact per-journey pass rows and finale uses the actual journey count; unit proves `13/13 CJMs passed`. | PASS |

## Verification

- Focused independent run: **6 files, 57 tests passed**.
- Coordinator evidence: **all 13 CJMs passed live**; representative log **9 clicks / 0 fail / 0 flashes**.
- Coordinator regression evidence: **813 tests passed + production build passed**.

Focused files covered cursor engine policy, interaction dispatch, target proof, graphic thrash, autonomous suite behavior, and overlay lifecycle.

## Non-blocking forecast

The timer deferral is source-proven and exercised by the successful long all-CJM run, but has no isolated fake-timer assertion specifically toggling suite phase to `running`. Add that small regression test when the overlay timer harness is next touched; it does not block this ship.

## Knowledge used

- **Quinn (QA):** applied the no-false-PROVEN rule, source + live evidence pairing, fixed-localhost playback expectations, on-target re-aim/abort lessons, cursor single-source-of-truth, and honest QA diagnostic/result requirements from `TEAM_KNOWLEDGE.md`, `LESSONS_LEARNED.md`, `PLAYBACK.md`, `PLAYBACK_DIAG.md`, and `QA_LOGGING_AND_PLAYBACK_RECIPE.md`.

## Release call

**PROVEN.** The fix is shared-engine behavior, not a Boots/CJM patch. No actionability, modal-race, cursor-graphic, or autonomous-suite blocker remains in the audited scope.

# Agent stuck router — STOP thrashing, READ one dig

**Law (HARD):** If you do not know, or the same FAIL / edit loop hits **twice**, **STOP**.  
Open **one** row below. Do **not** re-run blind, invent fixes, open five docs, or burn tokens “trying harder.”

**Always-on:** This file is the cheap retrieval layer. Deep contracts stay linked — open them only after the dig row names them.

---

## 0) First 10 seconds

| Situation | Do this only |
|-----------|----------------|
| Unknown surface / “where do I look?” | This table → **one** dig file |
| Same error twice | Dig row for that **symptom** (not the page under test by default) |
| Need to **prove** green | [PROOF_ROUTER.md](../shell/PROOF_ROUTER.md) — one blessed helper |
| Role / process unsure | Your hat in [TEAM_KNOWLEDGE.md](./TEAM_KNOWLEDGE.md) only |
| Failure class history | [LESSONS topic index](./LESSONS_LEARNED.md#topic-index) — one topic row |

**Forbidden:** reread LESSONS/TEAM_KNOWLEDGE end-to-end · retry suite/probe without changing a dig-named cause · parallel “maybe” edits · opening Figma + Legacy + three CSS files before the dig card.

---

## 1) Symptom → open exactly one dig

| Symptom / stuck on | Open **only** this | Then |
|--------------------|--------------------|------|
| Suite `qa-self-test` FAIL `dom-observe-open kind=agent` (direct smoke PASS) | [`qaSuiteTouchWrapContract.ts`](../../src/app/shell/qaSuiteTouchWrapContract.ts) dig card (**R16**) | Fix quiet helper · hard-reload `:5173` · suite `[mcp-sanity, qa-self-test]` |
| Fast suite FAIL `scroll-path-deviation` / bubble chop / `PLAYBACK_DIAGNOSTIC_OPEN` on motion | [`playbackScrollMonitor.ts`](../../src/app/shell/playbackScrollMonitor.ts) + [`playJourneySmoke.ts`](../../src/app/shell/playJourneySmoke.ts) — fast = motion diag-only | Confirm `isFastPlayback()`; path/stutter/bubble chop must not Alarm; re-run `all-cjms-fast` |
| Fast suite FAIL `avail-select-date` / `playback-click-failed` with recorded `modalId: choose-pharmacy` over live Availability (or date cells gone after Strand/noSlots) | [`recordedClickPlayback.ts`](../../src/app/orchestra/recordedClickPlayback.ts) — keep-live-avail + noSlots→slotted heal | Do **not** re-open choose-pharmacy; heal to slotted store; never soft-log missing targets; re-run `all-cjms-fast` |
| Probe/click “under open overlay” / Guiding UX board open | Close lightbox / clear `&modal=` · [URL.md](../shell/URL.md) modal registry | Re-prove probe |
| Overlay sticky / teardown dirty / host gone after self-test | [LESSONS](./LESSONS_LEARNED.md) overlay + body-wipe bullets · agent-testing README | ALWAYS CLEAR · never wipe `document.body` |
| PO Alarm / Cursor / Scroll mid-flight | [STUDIO_AUTO_RULES R15](./STUDIO_AUTO_RULES.md) · consume `__studioConsumePoSignal` | STOP→understand `diagSnapshot`→FIX→RESTART |
| Wrong localhost / new tab / port 5174+ | [STUDIO_AUTO_RULES R11](./STUDIO_AUTO_RULES.md) | `list_pages` → reuse `:5173` only |
| Page invent / new accordion/button zoo | [PAGE_CREATE_INHERITANCE.md](./PAGE_CREATE_INHERITANCE.md) P1–P6 | UXDS map + similar page first |
| Next page before previous green | [PAGE_FINAL_PASS.md](./PAGE_FINAL_PASS.md) | Report HARD-GREEN \| NOT-GREEN |
| REC / Play / type-in FAIL | [PROOF_ROUTER.md](../shell/PROOF_ROUTER.md) matching row | One blessed helper only |
| Agentic/traditional step-forward FAIL `director-step-no-effect` / `Agent stale · auto-pause` mid type-in | [`mcpTestSession.ts`](../../src/app/shell/mcpTestSession.ts) + [`agentTestingPresence.ts`](../../src/app/shell/agent-testing/agentTestingPresence.ts) (prove-mode) · on-air/type-in skip in overlay | Confirm `isQaProveModeActive()` during smoke; hard-reload; re-run `__protoRunAgenticStepForwardSmoke` |
| Agentic SF FAIL `transport-no-progress` / `step-forward-unavailable` (chat / book-step2) with `frozen` + sticky diagBlocking, Studio diag closed | [`agentTestingListen.ts`](../../src/app/shell/agent-testing/agentTestingListen.ts) prove orphan → `clearQaPlaybackBlocksForReset` · [`studioMcpHelpers.ts`](../../src/app/shell/studioMcpHelpers.ts) pre-SF clear · [`playbackDiag.ts`](../../src/app/shell/playbackDiag.ts) bubble prove skip · App `triggerTransport` returns false | Instrument block flags; hard-reload; full `__protoRunAgenticStepForwardSmoke` to `22/22` |
| Popup opens → chat/page underlay gone (`display:none` / `content-visibility:hidden`) | [LESSONS non-destructive overlay](./LESSONS_LEARNED.md#topic-overlay-underlay) — not engine; kill Boots chat freeze | Solid scrim only; re-prove `screen=chat&modal=choose-pharmacy` underlay painted |
| `uxml play` / `play step` FAIL `beat-tab-mismatch` (`state-mismatch`) after a director-script beat (avail-book→book-step2, history-view-details→appointment-details) | [LESSONS beat-tab alignment race](./LESSONS_LEARNED.md#topic-playback-alignment) — `beatEnterPendingRef` in [`useJourneyPlayback.ts`](../../src/app/orchestra/useJourneyPlayback.ts) + `shouldAdvanceAfterChainedManualDirectorBeat` in [`journeyBeatDirector.ts`](../../src/app/orchestra/journeyBeatDirector.ts) | New director-script beat: covered automatically. New chained-click beat that navigates: add its `tabScript`/`bookScript` to `shouldAdvanceAfterChainedManualDirectorBeat`; re-prove `uxml play step` 22/22 |
| PO said `uxml rec` / `uxml play` / `uxml play step` / `uxml play step r` | [UXML_COMMANDS.md](../shell/UXML_COMMANDS.md) | Run that locked procedure only (default = current CJM) |
| DS hover / loading invent / densify win | [UMA_FIDELITY_NOTES.md](./UMA_FIDELITY_NOTES.md) · LESSONS densify | Match Legacy; no invent |
| Naming / `proto*` / felonies red | [NAMING.md](./NAMING.md) · `npm run check:felonies` | Fix gate, do not bypass |
| Push / CI babysit urge | [STUDIO_AUTO_RULES R12](./STUDIO_AUTO_RULES.md) | Push once · no `gh run watch` |
| “What should I work on?” | [NEXT_STEPS.md](./NEXT_STEPS.md) | PO `+` / `ok` only |

---

## 2) Stability under any scenario

1. **Prefer under-match + dig** over inventing chrome, loaders, or hover colors.  
2. **One cause → one fix → one prove** (PROOF_ROUTER row). No shotgun.  
3. **Fresh QA session** before proves; strip ephemeral URL params after.  
4. If dig card and LESSONS disagree with local HMR ghosts → **hard-reload** `:5173`, then re-prove.  
5. After fix: append LESSONS only for **new** failure classes; stamp TEAM_KNOWLEDGE **Knowledge improved** with what was **applied**.

---

## 3) Related routers (do not duplicate)

| Router | Job |
|--------|-----|
| **This file** | Stuck / unknown / repetitive FAIL → dig |
| [PROOF_ROUTER.md](../shell/PROOF_ROUTER.md) | Choose blessed prove helper |
| [TEAM_KNOWLEDGE retrieve](./TEAM_KNOWLEDGE.md#retrieve-knowledge-without-reading-the-archive) | Role start → minimum read |
| [LESSONS topic index](./LESSONS_LEARNED.md#topic-index) | Failure class archive lookup |
| [docs/README.md](../README.md) | Audience start routes |

**Owner:** Arch. New critical fail class → add **one row** here + dig SSoT (contract or LESSONS) same ship — PO must not re-ask.

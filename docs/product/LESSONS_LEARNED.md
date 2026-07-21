# Lessons learned — UX Studio agents

**Status:** Living — append dated bullets; do not rewrite history.  
**Audience:** Every agent before UI / chrome / hybrid-mount work.  
**Refs:** [COMMAND_DOCTRINE.md](./COMMAND_DOCTRINE.md) · [FE_UI_UX_AUDIT.md](./FE_UI_UX_AUDIT.md) · [POST_CHANGE_CHECKLIST.md](./POST_CHANGE_CHECKLIST.md) · [CI_ACTIONS_BUDGET.md](./CI_ACTIONS_BUDGET.md) · [NEXT_STEPS.md](./NEXT_STEPS.md)

Agents **must read** this file before claiming a UI or Studio-chrome slice done.

---

## 2026-07-21

### QA chat spam — Camera wait ×N + ring twin restore (PO)

- **Symptom / class:** Chat flooded with `Camera: wait` every beat; after refresh `Journey reset` / `Play finished` appeared twice; Save Log ring had detail+label twins.
- **Root cause:** (1) Routine `chat-camera:wait` dwell mirrored to chat. (2) `mirrorPlaybackDiagToQa` appended ring **and** `logStep`→`pushLogEntry` appended ring again → hydrate restored doubles.
- **Right fix:** Suppress dwell wait from chat; mirror only via `logStep`; restore coalesces consecutive playback-diag twins; lean login drain rows.
- **Gate:** `playbackDiagQaBridge` unit — wait not mirrored; clear via logStep.

### QA Reset must not auto-CAPTURE + HMR ×24 spam (PO)

- **Symptom / class:** Reset wiped log then immediately capturing again. Vite file save flooded QA with dozens of identical `vite-hmr · capture/play paused` rows.
- **Root cause:** Prior Play-gate hotfix left Reset with `capturePaused=false`. `installViteHmrListen` stacked a new `vite:beforeUpdate` handler on every overlay bind.
- **Right fix:** Reset → capture **off** (`Session reset · capture off`); clear pause latch; Play still auto-resumes Pause-only. One HMR listener + mutable deps; identical system rows already coalesce to `×N`.
- **Gate:** Unit `agentTestingViteHmr.test.ts` + format coalesce vite-hmr.

### Make `display:none` ≠ gone — ghosts win querySelector / Play (PO)

- **Symptom / class:** React-migrated page still clicks Make `div[data-name=…]` (not clickable / wrong node) while React `<button>` with same name exists. QA Save Log spam: `Save Log · export` + `Click: a` + download row; capture stayed ON.
- **Root cause:** Retiring Make with `display:none` + `data-studio-make-retired` left nodes in the document → first-match selectors hit ghosts. Download used a bare `<a>.click()` while capture was live.
- **Right fix:** `retireMakeUnderPage` **detaches** Make from the live tree (park + restore on unmount). Save Log **auto-pauses** (silent) then one timeline row; ephemeral download `<a>` stamped `data-studio-agent-testing-ignore`; bare-tag click labels dropped.
- **Gate:** Unit `retireMakeUnderPage.test.ts`; parity / page-final-pass accept `retireMakeUnderPage(`; MCP probes use `isMakeParkedForScreen`.

### QA dump false FAIL — `jump-to-start` matched as bubble JUMP (PO dump 03:30Z)

- **Symptom / class:** Play finished 23/23 + play-end ok, but QA painted `Scroll jumped the wrong way (Δ-96)` and `Cursor eased to rest` as **fail**. Also “Chat camera: wait” on traditional PDP/book; `RecModalPharmacyPick` on login Sign in.
- **Root cause:** `isBubbleChopOrJump` used `/JUMP/i` which matched reason tag `jump-to-start`. Intentional `scrollCameraToOrigin` (jump-to-start / resetPrototypeScroll) was labeled “wrong way”.
- **Right fix:** Word-boundary JUMP; suppress intentional origin resets + play-end park-rest from soft-fail mirror; Camera: wait (not Chat); RecModalPick for login.
- **Gate:** Unit `playbackDiagQaBridge` — jump-to-start origin not mirrored; park-rest jump-to-start not fail.

### Long traditional REC Play FAIL at ~11/23 — login interstitial under Book Now (PO / Finn)

- **Symptom / class:** Continuous Play on `rec-trad-*` peaks ~11/23 with `po-diagnostic:PLAYBACK_DIAGNOSTIC_OPEN` / `tab/Book Now failed on Book Now`. QA: first `Click: Book now - £150` → `Modal open · login` → later second Book Now → click FAIL (target under modal / degraded).
- **Root cause:** Logged-out PDP `pdp-book-now` opens login (does not navigate). REC often captures a second Book Now after sign-in. Play drained choose-pharmacy on REC prove but **not** login on recorded-click Play → second click blocked → hard diagnostic.
- **Right fix:** `drainLoginModalIfOpen` in `playRecordedClick` (before retry + after click). Do **not** auto-drain choose-pharmacy here (own beat owns that pick). Prefer reading live QA rows before ALWAYS CLEAR when a dump/log already has the FAIL.
- **Gate:** UI Play `rec-trad-mru30gpt-zp5d` (logged out) → QA shows login drain → second Book Now → book-step-1… → peak 23/23 + `Play finished — back at journey start`. Unit: `recordedClickPlayback.test.ts`.

### REC robustness = NEW CJM only (PO standing order)

- **Symptom / class:** Agents claim REC robustness by playing built-in `agentic-cjm` / `traditional-cjm` or an old `rec-*`, or call `__studioStartRecording` without REC toggle + CREATE NEW + ● Start.
- **Right fix:** `__studioArmRecCapture` (CJM off → REC ON → CREATE NEW → Start) + `__studioAssertRecLive` (switch+session) + `__studioRunRecNewCjmProve` (always mint new `rec-*`, Play that id). Docs: AGENTS / RECORDING / QA recipe / CJM_RECORD_PLAY_EDIT.
- **Gate:** Live prove returns `{ pass, journeyId: rec-*, recLive: true }`.

### REC prove honesty — fake tiles click + Play logged as REC (PO fury)

- **Symptom / class:** (1) Robo-click on `module.plp.tiles` reported success (auto-refined to first Book now). (2) QA showed Start REC while agent only ran `__studioRunFullPlayProve` on an existing CJM.
- **Wrong fix:** Silent refine of coarse listing shells; generic helper log `start-recording` without verifying `isRecordingActive()`.
- **Right fix:** Explicit coarse shell → click FAIL (no invent child CTA). StartRecording logs `REC capture live · <id>` only after live arm; FullPlayProve logs `Play journey prove (NOT REC)`. Prove catalog reads imported store for `rec-*`.
- **Gate:** Live: `recAttr=live` + tiles click false + Book now `data-studio-action` + Add CJM + Play that id PASS.

### REC prove / labels / camera bind (PO retest `rec-trad-*` FAIL)

- **Symptom / class:** (1) STEPS/touchpoints empty or Make-ish (`data-name="module.plp.tiles"`, `component.plp…`). (2) Camera scroll-stop bound to hidden/filter checkbox. (3) Click degraded to tiles container. (4) `__studioRunFullPlayProve({ journeyId: "rec-trad-…" })` asserted traditional-plp / peak 13. (5) Scroll-reversal Δ~1k from page-land yank on `isPlaying` flip.
- **Root causes:** `resolveExperience` used `id.includes("trad")` → matched `rec-trad-*`; scroll anchor scored nearest `[data-name]` (filters); click `closest("[data-name]")` climbed to module; page-land `force` top ran whenever play/journey deps flipped, not only on screen change; labels stored raw attr soup.
- **Right fix:** Prove catalog lookup for `rec-*` (playlist length + start beat); `humanizeRecordingLabel` scrub at capture/compile; prefer title/content scroll anchors + drop weak filter chains; refine clicks to `data-studio-action` / tile CTA; page-land only when `current` screen changes.
- **Gate:** Unit `recordingLabels` + compile human labels + `fullPlayProve` rec-* peak; live REC PLP→PDP → Play → `__studioRunFullPlayProve({ journeyId })` asserts that journey.

### REC continuous Play stalls on last recordedClick / camera (PO / Quinn + Finn)

- **Symptom / class:** Continuous Play reaches last PDP `recordedClick` (or last `kind:camera`) then hangs → playback-stall ~22s / idle ~45s (often reported as script-timeout). Peak can show `N/N` but play never ends.
- **Root cause:** `scheduleDwellAdvance` no-ops on beats that still carry `recordedClick` / camera / `*Script`. Script runners advanced mid-journey but on **last beat** only `return true` — never `completeJourneyPlay()`.
- **Right fix:** After script success, if `next >= length` and continuous Play (`isPlaying && !manualStep`) → `completeJourneyPlay()`. Helper: `shouldCompleteJourneyPlayAfterScript`. Camera Make ghosts (`display:none` / 0×0 / make-retired) soft-continue dwell-only (`camera-beat:target-unusable`) instead of ghost-scroll.
- **Gate:** Unit `journeyPlayAdvance` + camera unusable; live `__studioRunFullPlayProve({ journeyId: rec-…, startBeatId, startScreenId })` → PASS peak N/N + play-end at start.

### REC scroll-stop never compiled to camera (PO / Quinn + Finn)

- **Symptom / class:** Meaningful scroll + ≥2s settle while REC live produced `scroll` events but **no** `scroll-stop` → compile missed `kind:camera` wait beats. QA also silent on camera-wait milestones.
- **Root causes:** (1) `flushRecordingScrollStop` called `noteScrollSample` then discarded its emit; `noteScrollIdle` saw `armed=false` → always null. (2) Listener install reset tracker with `lastTop=null`, so a single scroll jump only seeded baseline and never armed.
- **Right fix:** Keep `fromSample ?? noteScrollIdle` in flush; seed `lastTop = root.scrollTop` when installing scroll listeners. Mirror lean `rec-capture` scroll-stop (+ weak clicks) into QA as **Camera wait after scroll**.
- **Gate:** Unit `scrollStopDetect` flush-pattern + baseline-jump; live REC PLP scroll ≥2s → `scroll-stop@2xxx` + QA row. Recipe: [RECORDING.md](../shell/RECORDING.md) · [QA_LOGGING_AND_PLAYBACK_RECIPE.md](../shell/QA_LOGGING_AND_PLAYBACK_RECIPE.md).

### Per-char type-in → QA log flood — do NOT kill composer animation (PO / Arch + Finn)

- **Symptom / class:** Huge perf drop / QA overlay noise during continuous Play — one log line (or diag event) per typed character while Site Pilot / Chat composers animate. Dump fingerprint: `typeIn.samples=249` with `starts/ends=2`.
- **Wrong fix:** Disable / skip / instant-fill type-in animation on page composers.
- **Right fix:** Gate **logging only** — `playbackDiagTypeInProgress` = in-memory samples; no `type-in-progress` push; QA mirror ≤ start+end; cursor guard no per-N-char visibility spam. Animation loops in `sitePilotHome` / `sitePilotChat` stay letter-by-letter.
- **Recipe:** [QA_LOGGING_AND_PLAYBACK_RECIPE.md](../shell/QA_LOGGING_AND_PLAYBACK_RECIPE.md) · Play ≡ Step · prove on `:5173` with QA visible + console.

### FM `controls.stop()` hangs Play at confirmation (PO / Finn)

- **Symptom / class:** Full agentic Play `script-timeout` 45s on book-step-3 confirmation — mid-travel abort stranded director scripts.
- **Root cause:** framer-motion `controls.stop()` does **not** settle `await controls`.
- **Gate:** `demoCursor.ts` travel await settles on onComplete / abort poll / ceiling. Also skip `scroll-path-deviation` while chat pull-up `scrollLock`. Prove: continuous Play 21/21.
- **Recipe:** [QA_LOGGING_AND_PLAYBACK_RECIPE.md](../shell/QA_LOGGING_AND_PLAYBACK_RECIPE.md).

### Thinking bubble not camera’d — settle used last revealed only (PO / Finn)

- **Symptom / class:** Thinking dots stay under composer dock; settle scrolled to last `data-studio-chat-revealed="true"` while thinking paints `revealed=false`.
- **Gate:** `ChatScreen` settle uses `resolveChatCameraTarget` (thinking first). Rail: any new content including thinking must camera into view. → [CHAT_PAGE_RAILS.md](../projects/boots-pharmacy/features/CHAT_PAGE_RAILS.md).

## 2026-07-20

### Chat tall-bubble start-scroll fights bottom pin → scroll-reversal (PO / Finn + Quinn)

- **Symptom / class:** PLAYBACK DIAGNOSTIC `scroll-reversal` on agentic-chat SF into frame 4/9 (tall r1); trigger often shows stale `retreat-sync` / `sarah-query-submit`.
- **Root cause:** `settleScrollAfterForwardStep` scrolled tall bubbles to **start** while chat also bottom-pins (thinking / composer pad / ChatScreen) → down→up→down. Retreat into screen-frames also snapped mid-thread `button.chat__cta`.
- **Gate:** Chat `.chat__column` forward settle = bottom only; screen-frames retreat camera pins chat column bottom (no CTA snap). Prove: UI Step forward through chat 4/9 + Step back — no scroll-reversal Alarm.

### Book Step 2/3 page blink on same-tab Step Forward (PO / Finn + Quinn)

- **Symptom / class:** Book Step 2 (and Step 3 funnel) pages blink while in-page steps work; suspected transition leakage.
- **Root cause:** Journey **always** calls `goToTab` (hub-close safety) even when `protoTab` is unchanged (book-step2 date→time→reserve). `goToTab` ran `.studio-wire-mount--nav-cross` opacity crossfade (280ms → opacity 0) on every same-tab advance.
- **Gate:** `resolveNavTransitionInstant` / `buildJourneyGoToTabTransition` — same-tab + hub closed → `instant: true` (still `setHubOpen(false)`). PLAYBACK_DIAG: `nav-cross` RUN vs SKIP + `screen-enter` remount/opacity/motion. Prove: same-tab SF → `nav-cross SKIP sameTab=true`, wire opacity stays 1; real tab change may still RUN.
- **R11 trap:** `localhost` may hit IPv6 `[::1]` on a second Vite (abandoned clone) while `127.0.0.1:5173` is the real `E:\\UX\\ux-studio` server — prove on `http://127.0.0.1:5173/`.

### PO overlay / diagnostic dismiss must hard-stop Play sync (PO / Finn)

- **Symptom / class:** Alarm/Cursor/Scroll click left Play running until next smoke poll; PLAYBACK DIAGNOSTIC Cancel left modal / did not stop cassette.
- **Root cause:** Latch-only path; dismiss cleared React state without `haltPlaybackForPoSignal` + PO latch.
- **Gate:** Overlay CTAs + diagnostic Cancel → `haltPlaybackForPoSignal` (journey/scenario abort + cursor/scroll cancel) in the same click; Cancel latches `DIAGNOSTIC_ACK_STOP`. Smoke `__protoDismissPlaybackDiagnostic` clears without that latch. Prove: mid-Play Alarm/Cancel → `isPlaying===false` immediately; modal gone.

### Agentic chat reply before thinking bubble (PO / Finn + Quinn)

- **Symptom / class:** Chat progressed too fast — first agent reply painted without (or with) thinking bubble; PO Alarm sequence mismatch at `frame:2`.
- **Root cause:** Manual `stepForward` (and home→chat handoff) used `skipPrelude: true`, skipping `runSitePilotChatBeforeReveal` thinking pause. Make order is thinking → fade → reveal reply.
- **Gate:** CJM Step runs `beforeReveal` when hooks exist; React holds reply paint while `playback` thinking anchors that frame (`resolveChatFrameRevealed`). Diag: `thinking-start` / `thinking-end → reveal reply`. Prove: thinking visible + r0 `revealed=false` before reveal; then r0 after fade.

### CJM type-in hid robo-cursor on Site Pilot (PO / Finn + Quinn)

- **Symptom / class:** Agentic home typed-text beat — robo-cursor missing / opacity 0; PO Cursor flag while eyes saw no cursor.
- **Root cause:** Type-in path never parked/moved the demo cursor near the field; Play `isPlaying` left parkAfterInteraction false and prior wipe left DOM-null. No auto latch for “hidden mid type-in.”
- **Gate:** `parkDemoCursorForTypeIn` + `nudgeDemoCursorForTypeIn` at type-in start/progress; `CURSOR_HIDDEN_DURING_TYPEIN` latch; `[PLAYBACK_DIAG] cursor` logs visibility. Prove R11: type-in with `.proto-chat-demo-cursor` visible + opacity>0.

### PO Alarm/Cursor/Scroll must stop→(understand|ask)→fix→reprove (PO / Arch)

- **Symptom / class:** Agents soft-logged Cursor/Scroll and continued; or guessed a fix without knowing what PO flagged.
- **Gate:** `pollSmokePoSignal` aborts on alarm **and** cursor **and** scroll (structured fail + diagSnapshot). Session loop: STOP → understand from diagSnapshot (**ask PO if unclear — do not invent**) → FIX → RESTART + prove that issue gone. Stamp TEAM / COMMAND_DOCTRINE / PLAYBACK_DIAG / PAINPOINTS / AGENTS / R15 / agent-testing README.

### Smoke / Alarm abort still dumped PO to hub — `resetToHub: true` harness (PO / Finn + Quinn)

- **Symptom / class:** Tip claimed journey-start never hub (`53f1348` goToTab) but PO eyes still landed `screen=hub` after Alarm abort / agentic step-forward smoke end.
- **Root cause:** CJM smokes passed `withMcpTestSession(..., { resetToHub: true })` → overlay sitrep + `resetStudioAfterAgentTest({ resetToHub: true })` rewrote URL to hub. Product `goToTab` fix never touched harness teardown.
- **Gate:** Journey smokes use `resetToJourneyStart` → `site-pilot` / `plp` + `cjm=on`. `resetToHub` forbidden for smoke/product (Hub nav click only). Every hub open logs PLAYBACK_DIAG `hub-nav` with reason + stack. Prove R11: Alarm abort / step-forward finally → `screen≠hub`.

### CJM on leaves robo-cursor DOM-null after restart / re-apply (PO / Finn)

- **Symptom / class:** CJM switch ON (or `cjm=on` re-apply) — parked robo-cursor missing (`display` removed / not mounted) even at home park pose.
- **Root cause:** `handleStudioJourneyModeChange(true)` always calls `restartStudioJourney` → `removeDemoCursor({ immediate: true })`. When `studioJourneyMode` was **already** true, React effect is a no-op so park never remounts. First-on also raced wipe before `journeyModePinned`.
- **Gate:** Pin + `setDemoCursorJourneyMode(true)` before restart; restart remounts `parkDemoCursorAtRest` when CJM stays on; `setDemoCursorJourneyMode` idempotently remounts if DOM node missing. Prove R11: toggle/`setJourneyMode(true)` while already-on → `.proto-chat-demo-cursor--parked` visible; Play still travels.

### Agentic chat full-thread dump on enter — React paint ignored engine visibleCount (PO / Finn + Quinn)

- **Symptom / class:** CJM enter chat / Play shows **all bubbles at once** (not Make step-by-step progressive disclosure). Counter may say `2/9` while DOM paints 8 frames.
- **Root cause:** React Chat mounted the full `CHAT_THREAD_FRAMES` list; scenario hide used delayed `display:none` + CSS opacity that lost to paint. Engine `visibleCount` was not a React control point.
- **Gate:** `chatScenarioRevealBridge` + `usePublishChatScenarioReveal` — paint only `index < visibleCount` (`data-studio-chat-revealed` / `hidden`). Engine still collects all mounted frames. Never-shown frames: immediate `display:none` in `applyScenarioFrameVisibility`. Prove: first chat land → visible content frames === 1; step → sequential reveal.

### Journey reset / Jump-to-start still lands hub — matching-tab `goToTab` skip (PO / Finn + Ben)

- **Symptom / class:** CJM Jump to start / Play end / Stop-at-end still shows **hub** (PO again). Expected: key 1 of selected journey (`agentic-home`/`site-pilot` or `traditional-plp`/`plp`).
- **Root cause:** `navigateBeatTab` skipped `runtime.goToTab` when `currentTabIndex === target`. Hub overlay can sit on that same underlying tab — skip left `hubOpen=true`. Smoke `resetToHub` is harness-only and must not define product reset.
- **Gate:** `navigateToBeatTab` **always** calls `goToTab` (closes hub). Stop-at-end → `jumpToStart`. Diag: `[PLAYBACK_DIAG] journey-reset` with `startBeatId` + `startScreenId` ≠ hub. Prove R11: CJM on → jump-to-start / play-end → `screen≠hub`, beat `1/N`.

### Agentic SF `touchpoint-ahead-of-beat` — chat finale opens Availability before beat advances (PO / Finn + Quinn)

- **Symptom / class:** `__protoRunAgenticStepForwardSmoke` FAIL `diagnostic-on-step-8` / `touchpoint-ahead-of-beat` — counter jumps to “Choose date” while `beatId` still `agentic-chat`.
- **Root cause:** `onFinale` called `runSitePilotChatScenarioFinale` (opens `dateChat`) **before** `setJourneyBeatIndex`. Transport guard saw chat beat + `popup:availability:date` (playlist gap ≫ 1).
- **Gate:** Advance beat to `avail-continue` **before** opening Availability; allow chat→avail playlist skip + chat/avail popup substep. Prove agentic SF PASS on R11 `:5173` with `__studioPlaybackDiag`.

### PLAYBACK_DIAG cursor blindness + hub/`goToTab` + agentic CTA off-by-one (PO / Finn + Quinn + Ben)

- **Symptom / class:** Micro-fails (PLP heart not fuchsia, Step2 Continue scroll-only, retreat no scrollIntoView, Play returns hub, agentic chat skips progressive CTAs) with no console proof the cursor did its job; panel mint/green dropdowns stale.
- **Root cause:** Diag logged type-in/step labels only. `goToTab` set `current` without `setHubOpen(false)`. React PLP `resetPlpTileBookmarkForPlayback` wrote SVG `fill` that overrode `currentColor`/`.is-active`. Chat `CTA_BEFORE_USER_FRAME` keys were 1-based vs 0-based `frameIndex`. Retreat sync did not always scrollIntoView the active control.
- **Gate (R13 expand):** Every beat logs target/bbox, cursor park reason, scroll before/after + retreat intoView, click results, journey-reset destination. Product reset never hub. Prove: `__studioPlaybackDiag` dump after traditional + agentic step/retreat on R11 `:5173`.

### Play end stuck on last beat / hub — return to CJM start (PO / Finn)

- **Symptom / class:** After Play finishes, transport sits on last beat (or agent teardown dumps hub); PO wants **CJM journey start** of the active script.
- **Root cause:** `completeJourneyPlay` only stopped play — no `jumpToStart`. Smoke `resetToHub` is harness-only and must not define product end.
- **Gate:** `completeJourneyPlay` → jump to first playable beat + `playbackDiagPlayEnd`. Prove: `__protoRunTraditionalPlaySmoke` / `__protoRunAgenticPlaySmoke` + `__studioAssertPlayEndedAtStart`.

## 2026-07-19

### Traditional SF `stray-popup-on-beat` — settle skipped chained location pick (PO / Finn + Quinn)

- **Symptom / class:** `__protoRunTraditionalStepForwardSmoke` FAIL `stray-popup-on-beat` — Availability still open (`availStep=list`) on `book-step2`.
- **Root cause:** `login-sign-in` **chains** into `book-location-pick`. Smoke `waitForDirectorSettle` ignored `choose-location` / on-air, so the next Step aborted mid-picker and left the scrim. Secondary: Book Step 1 Continue/search first-match could hit Make-retired ghosts.
- **Gate:** Settle must wait until `!isOnAir && !isPlaying` (see `stepForwardSmokeSettle.ts`). Abort closes Availability. Prefer React `[data-studio-action="book-step-1-continue"]` / live `.book-step-1` — never Make-retired Continue. Prove full traditional SF smoke PASS on R11 `:5173` from **`E:\\UX\\ux-studio`** (not abandoned VaccineConcept clone).

### CJM type-in skipped + Chat fade removed — PLAYBACK_DIAG (PO / Finn + Quinn + Ben)

- **Symptom / class:** Agentic CJM Site Pilot type-in animation missing (instant jump to chat); Chat composer/under-bar fade wash gone after “remove gradient” ship; step/retreat hard to prove without console evidence.
- **Root cause:** `simulateSarahHomeTyping` skipped typing when `ta.value === AGENTIC_HOME_DEMO_QUERY` (React `HOME_QUERY_DEFAULT` prefill). Composer fade removed in `95a2eda` without keeping under-bar wash. No console type-in/step contract.
- **Gate (Auto-Rule `playback-diag` R13):** Always clear + type-in during CJM (never prefill-skip). Restore SitePilot bar `::after` top fade + composer-edge fade. Console: `__studioPlaybackDiag` / `__studioAssertTypeIn` (+ `__proto*` aliases). Prove: [PLAYBACK_DIAG.md](../shell/PLAYBACK_DIAG.md) + step-forward/retreat smokes on R11 `:5173`.

### Journey-lock `overflow:hidden` kills CJM eased scroll (PO / Finn)

- **Symptom / class:** Agentic step-forward dies late (`diagnostic-on-step-1N`) with `scroll-path-deviation` on appointment-history — expected ~120px, actual stuck ~0–6.
- **Root cause:** `.studio-scroll--journey-locked` shared popup-lock CSS `overflow: hidden !important`, so `scrollTop` writes during eased director scroll were ignored. Event blockers already prevent user wheel/touch.
- **Gate:** Journey-lock CSS = overscroll/touch-action only; popup `.studio-scroll--locked` keeps overflow hidden. `getPrototypeScrollRoot` must not prefer `.chat__column` when `?screen=` is non-chat.

### Appointment history ghost card first-match (PO / Finn)

- **Symptom / class:** `history-view-details` / late agentic step → scroll-path-deviation or miss; first `recent.order` card is 0×0 with `display:none` View Details.
- **Root cause:** `querySelector` first card is a Make ghost template; visible cards are siblings 2+.
- **Gate:** `findVisibleHistoryViewDetails` — first `isClickableTarget` card + button (never bare first-match).

### Scrollbar gutter always-on → empty white strip on short pages (PO / Finn)

- **Symptom / class:** Home Site Pilot shows a white bar / fake scrollbar track with nothing to scroll; tall pages / modal lock still X-jump when classic `scrollbar-gutter: stable` width ≠ thin 4px thumb.
- **Root cause:** `scrollbar-gutter: stable` reserves **classic** track width (~12–17px), not our `::-webkit-scrollbar { width: 4px }` — empty white strip on short panes; mismatch on tall panes.
- **Gate:** Never `scrollbar-gutter: stable` for Studio hosts. Short panes stay `overflow-y: auto` (no track). Tall prototype / `.chat__column`: `studio-scroll--overflow` → `overflow-y: scroll` (thin track) via `syncStudioScrollOverflowGutter`; lock → `padding-inline-end: var(--studio-scrollbar-size)`. Chat mirrors thin-track inset with `padding-left: calc(64px + var(--studio-scrollbar-size))` so the centered 864 column X does not jump. Prove: Home no empty white bar; Chat center X stable with/without thumb.

### Chat sticky / scroll / Site Pilot bar — don't regress (PO / Finn + Uma + Bea)

- **Symptom / class:** React Chat retired Make Frame337 → Site Pilot white microheader gone; bubble links invent always-underline / browser-blue; scrollbar track shifts centered column left (jagged UI).
- **Root cause:** `hideMakeChrome` retired Frame337 without a React port; `.chat__link` rest-underline fought UXDS `.uxds-link`; always-on `overflow-y: scroll` / uncompensated thin track stole right inset from the flex-centered column.
- **Gate:** Keep `ChatSitePilotBar` (`data-studio-chat-site-pilot-bar`) above `.chat__column`. Bubble/disclaimer links = `.uxds-link` (+ optional `.chat__link` hook). Scroll = auto → overflow sync thin-track + left pad compensate — never classic `scrollbar-gutter: stable` on Studio hosts.

### Robo-cursor hand↔arrow tip jump — CSS-align hotspots (PO / Finn + Uma)

- **Symptom / class:** After press/release, default arrow appeared to teleport vs hand; hand↔default felt like a flicker/jump even when `left`/`top` stayed locked.
- **Root cause:** Arrow tip (~3px) and hand fingertip (~10px) differ inside the 37×37 box; toggling `--pointer` swapped graphics without shared tip.
- **Gate:** CSS-shift `.proto-chat-demo-cursor__graphic--hand { left: -7px }` so tips share one hotspot; keep `left`/`top` locked through settle; R10 prove `onTargetStable` + `maxPostSettleDriftPx=0`. Do **not** re-write post-click pose from a different hotspot math.

### Fixed localhost + reuse tab — no port bump / no new Chrome windows (PO / Arch + Finn + Ben)

- **Symptom / class:** Agents start extra `npm run dev` → Vite silently moves to `5182`/`5185`/`5186`…; Chrome DevTools MCP opens `new_page` / new windows; PO loses the Studio tab context.
- **Gate (GLOBAL HARD FAIL — Auto-Rule `fixed-localhost-reuse-tab`):**
  1. Canonical URL **only:** `http://localhost:5173/` (`127.0.0.1:5173` = same server).
  2. `vite.config.ts`: `server.port: 5173` + `server.strictPort: true` — fail if busy; never silent bump. `check:felonies` asserts this.
  3. **One** `npm run dev` for the workspace; if 5173 busy → reuse or stop stray Vite (docs only — do not kill PO browser).
  4. Chrome MCP: `list_pages` → `select_page` / `navigate_page`; **`new_page` only if zero pages**.
- **Refs:** [STUDIO_AUTO_RULES.md](./STUDIO_AUTO_RULES.md) R11 · [../shell/URL.md](../shell/URL.md) · [AGENTS.md](../../AGENTS.md)

### Platform motion — Accordion height via Motion; CSS reduced-motion hid expand (PO / Arch + Uma + Finn)

- **Symptom / class:** PO could not see Accordion collapse/expand; CSS `grid-template-rows 0fr↔1fr` “fixed” but still looked instant.
- **Root cause:** OS/browser `prefers-reduced-motion: reduce` → kit CSS `transition: none !important` on `.uxds-accordion-content`. Computed `transitionDuration: 0s`. (Secondary: `grid-row: span 2` yielded two-track `0px 0px` computed rows.)
- **Gate:** Accordion expand = Motion `height: 0↔auto` via `@/uxds/motion` (functional reveal; always-mounted; cancel on unmount). Chevron mute/rotate stays CSS (honors reduced-motion). Import `@/uxds/motion` only — never raw `framer-motion`. Shell presence pilots OK; **user-visible PDP Accordion Motion demotes Final Pass `mcpFinalPass` → NEEDS-REPROVE**. See [MOTION.md](./MOTION.md).

### Platform motion — Motion (`framer-motion`) via `@/uxds/motion` (superseded Accordion CSS row — PO / Arch)

- **Symptom / class:** Motion library listed but unused; dual `motion` + `framer-motion` deps; callsigns unsure CSS vs Motion.
- **Gate (updated):** [MOTION.md](./MOTION.md) — import `@/uxds/motion` only; one package (`framer-motion`); CSS for trivial hover + Accordion chevron; Motion for Accordion height + enter/exit panels/menus. No React Spring. Shell-only presence pilots do **not** demote PDP; Accordion Motion on PDP **does**.

### Robo-cursor travel — ease-in-out only, no bounce (PO / Finn)

- **Symptom / class:** Robo cursor “bouncy” arrival (back-ease overshoot + path/end jitter felt like spring).
- **Gate:** Travel driven by Motion `animate(0,1,{ ease:"easeInOut" })` via `@/uxds/motion`; straight-line lerp; **no** spring / back / overshoot / arc variance. `cancelDemoCursorTravel()` → `controls.stop()` on forceClear (keep hang guards from v0.0.31). See [MOTION.md](./MOTION.md).

### Playback panel stranded by AnimatePresence `mode="wait"` (PO / Finn)

- **Symptom / class:** Cassette transport (CJM + STEPS + play deck) missing from nav; only REC switch remains; `.studio-nav-scenario__panel-swap` has `children=0`.
- **Root cause (two classes):**
  1. Playback ↔ Rec XOR used `AnimatePresence mode="wait"` — exit can complete without enter → empty swap while ScenarioControls is mounted.
  2. Invalid URL mode (`mode=traditional` / bare aliases) applied via `setModeId` → 0 journey beats → `showOrchestraControls` false → **REC-only** `StudioNavRecordingModeSlot` (empty playback by design).
- **Gate:** Sync-mount playback when Rec is off (`data-studio-playback-panel`); `normalizeOrchestraModeId` on URL parse + `setModeId` (`traditional`→`traditional-cjm`). Never let an unknown mode zero the cassette deck.

### URL `mode=agentic-cjm` conflates CJM switch with journey path (PO / Arch)

- **Symptom / class:** Deep links used `mode=agentic-cjm` as if “mode” meant both CJM-on and agentic path — logically wrong; CJM is on/off; agentic vs traditional is the experience path.
- **Gate:** Canonical URL = `cjm=on|off` + `experience=agentic|traditional` ([URL.md](../shell/URL.md)). Legacy `mode=*-cjm` / bare aliases parse → `experience` only (do **not** imply CJM on — protects REC replay). Serialize never writes `mode=`.

### Robo-cursor on-target re-aim / tap bounce (PO / Finn)

- **Symptom / class:** After travel, cursor jitters / re-aims / “bounces” on the CTA while pressing.
- **Root cause:** Mid-travel hover + `trackTarget` chased layout shifts; CSS `scale()` on `--tap` read as bounce; path diagnostics required CJM pin so prove could not show the drift.
- **Gate:** Hover only after settle; freeze tracking ≥90% progress; lock left/top through press/release; no tap scale; `__studioCursorDiagnostics()` path samples + prove `onTargetStable`. Keep hang guards.

### PAGE FINAL PASS — no next migrated page until previous hard-green (PO / Arch)

- **Symptom / class:** Team starts PDP (or next erase-Make page) while PLP (previous) still has open Final Pass gaps — PROVEN/tests green used as a false “open next page” signal.
- **Gate (GLOBAL sequencing):** **No new migrated page** until previous is **PAGE FINAL PASS hard-green** — [PAGE_FINAL_PASS.md](./PAGE_FINAL_PASS.md). Finn/Uma own checklist + `check:page-final-pass` (single contract; do not duplicate). Arch vetoes next-page brief/mount otherwise. Team check reports `PAGE FINAL PASS — <screenId> — HARD-GREEN | NOT-GREEN`.
- **Process:** Parallel callsigns still required; **`Knowledge used:`** still mandatory on team check. Board: [NEXT_STEPS.md](./NEXT_STEPS.md) NOW 2e blocks PDP.

### MCP page probe — scroll-into-view + overlay visible every probe (PO / Quinn)

- **Symptom / class:** MCP / robo page probe interacted with off-screen or partially scrolled targets; or ran steps while the agent testing overlay was missing/hidden — prove looked “green” without visible PASS/FAIL chrome the PO can trust.
- **Root cause:** Probe assumed targets were in viewport and that overlay start was optional/ambient; scroll + overlay visibility were not hard FAIL gates on every step.
- **Gate (GLOBAL HARD FAIL — Quinn + Finn + Ben):**
  1. Before every probe interact (hover/click/type): **`scrollIntoView`** (or equivalent) so the target is in the prototype viewport — note `scroll-into-view` in cursor/probe diagnostics when used.
  2. **Agent testing overlay must be visible** for the **entire** probe run (start → each step PASS/FAIL → sitrep/stop). If overlay is absent/hidden at any probe step → that step and the probe **FAIL** (do not continue as PASS).
  3. Prefer `__studioRunMcpPageProbe` so robo-cursor + overlay sitrep are mandatory; Quinn cites overlay-visible + scroll in the MCP evidence log.
  4. **Code gate shipped:** `revealDemoTargetForAgent` + probe `overlay-arm` / `plp-below-fold-scroll`; mid-sitrep re-arm must not fire deferred reload; `RunMcpPageProbe` excluded from helper nest-arm. See [RECORDING.md](../shell/RECORDING.md).
- **Process:** Index in [TEAM_KNOWLEDGE.md](./TEAM_KNOWLEDGE.md); Quinn re-reads this before every MCP prove. Arch rejects PROVEN without overlay-visible evidence.

### Nested scroll host after single-scrollbar Chat (Finn / Quinn)

- **Symptom / class:** Chat beat/CTA `scrollIntoView` / `revealDemoTargetForAgent` no-ops after React Chat moves overflow to `.chat__column` (outer `.studio-scroll--prototype` `protoMax≈0`).
- **Root cause:** Engine `getPrototypeScrollRoot` still resolved the outer prototype pane; scenario/REC helpers hardcoded the same host.
- **Gate:** Prefer active `.chat__column` when it owns overflow (`getPrototypeScrollRoot`); scenario `resolveScrollEl` + REC `captureScroll` must use that helper. Quinn proves with probe `chat-below-fold-reveal` (r1 CTA) — not finale CTAs that cannot clear agent-testing bottom pad at max scroll.

### Sticky Chat composer scroll pad (Finn / Uma)

- **Symptom / class:** Flex-sibling composer (outside `.chat__column`) regresses Make under-composer scroll — below-fold bubbles clip at the dock; Motion wrap height changes leave last CTAs under the overlay.
- **Contract:** Overlay dock (`position: absolute` bottom) + dynamic `--studio-chat-composer-h` (ResizeObserver) → `.chat__column` `padding-bottom` / `scroll-padding-bottom` ≥ dock height; reveal/scrollIntoView reads `scroll-padding-bottom`. Single scroll host only (viewport locked). Transparent scrollbar track.
- **Gate:** Probe `chat-composer-scroll-pad` — pad var ≥120, last CTA above dock at max scroll, prototype `protoMax≈0`.

### Team knowledge must be used, not only written (PO)

- **Symptom:** LESSONS / notes grow but agents re-ship the same fail class — knowledge was append-only.
- **Gate:** [TEAM_KNOWLEDGE.md](./TEAM_KNOWLEDGE.md) living index; before serious work re-read hat section + LESSONS; team check **`Knowledge used:`** one-liner per role; **Knowledge improved** sitrep after ships; Arch rejects write-only “done.”

### Typical DS checks mandatory before screen PROVEN (PO)

- **Symptom / class:** Screens stamped **PROVEN** while UXDS controls (SearchField, Button, checkbox, link) were flat at rest — missing kit/Make **hover / focus / active / disabled**. Concrete miss: PLP filter SearchField had **focus-only** kit (no `:hover`); Make / Availability / Book Step 1 use inset navy ring on hover+focus.
- **PO callout:** **Missing DS hover = fidelity FAIL class** — not a polish nicety. “Why no typical DS checks as rule of thumb?”
- **Gate (GLOBAL rule of thumb):**
  1. Before any screen **PROVEN**, Uma walks the **full state matrix** (default/hover/focus/active/filled/disabled/error + icon positions) per [UMA_FIDELITY_NOTES.md](./UMA_FIDELITY_NOTES.md) §0a — vs **UXDS kit + Make**.
  2. SearchField: `.uxds-search-field__control:hover` + `:focus-within` inset `2px` `--uxds-border-border-focus` (Boots → navy); magnifier stays borderless.
  3. Ratchet **search-field-states** fails CI if kit omits control `:hover` / `:focus-within`.
  4. **Uma (UI/UX)** signs `typical DS checks (state matrix) — PASS|FAIL` in audit + **team check**.
  5. **Quinn (QA)** MCP-hovers **≥1 SearchField** (and the rest of the interaction matrix).
  6. Arch **rejects** **PROVEN** if typical DS checks FAIL or MCP hover evidence is missing.
- **Process:** Parallel callsigns still required for serious streams — DS checks do not collapse the team into one mega-agent ([TEAM.md](./TEAM.md), doctrine §0.2).

### Filter search parity — icon side, double X, View all, counters (PO rage)

- **Symptom:** PLP filter search had **two X** clears; magnifier on the **LEFT** (PO: original RIGHT); no **10-cap / View all**; no option **counters**; invented filter `border-bottom` separator; bespoke input instead of UXDS.
- **Root cause:** Prior “PROVEN” trusted Make static DOM order + `type="search"` (native cancel) without wire scripts (`PLP_FILTER_LIST_MAX`, `handlePlpFilterViewAllClick`, `setFilterRowCount`) or Availability/Book icon-end pattern.
- **Gate (GLOBAL):**
  1. UXDS `SearchField` — `iconPosition` start\|end, single `data-studio-search-clear`, `type="text"`, stamps `data-studio-search-icon-pos`.
  2. PLP: icon **end**, View all + 10-cap, facet counters, **no** `.plp__filter-section` border separator.
  3. Ratchets 1b–1f + MCP `plp-search-icons` / `plp-filter-view-all` / `plp-filter-option-counters`.
  4. Distrust prior PROVEN on filter/search until re-proved.
- **Process:** Every new PO miss → ratchet same ship ([PARITY_RATCHETS.md](./PARITY_RATCHETS.md)).

### Search icon boxed by Make border-overlay hover (PO)

- **Symptom:** PLP “Search countries” / “Search diseases” magnifier showed a weird navy/grey **box border** around the icon.
- **Root cause:** LEGACY chrome targeted `Text Field > [aria-hidden]` for Make’s absolute inset border overlay. UXDS `SearchField` stamps `aria-hidden` on the magnifier (direct child of `Text Field`), so hover/focus painted the overlay ring on the icon.
- **Gate (GLOBAL):**
  1. Make overlay hover selectors must be `> [aria-hidden].absolute` only — never bare `[aria-hidden]`.
  2. UXDS `.uxds-search-field__icon` forces `border/box-shadow: none` (defense in depth).
  3. Uma §7b: magnifier = bare glyph; boxed icon = FAIL.
- **Process:** When porting Make `aria-hidden` overlays into React kits, do not reuse overlay selectors on decorative icons.

### Missing search icon = classic Make→React parity fail

- **Symptom:** React PLP filter fields (“Search countries” / “Search diseases”) shipped with no magnifying glass.
- **Root cause:** `FilterSearch` rebuilt as bare input without `icon=search` sibling; no CI contract for icon affordances.
- **Gate (GLOBAL):**
  1. Stamp `data-studio-search-icon="true"` on every React search magnifier (prefer UXDS `SearchField`).
  2. `npm run check:parity-ratchets` fails if search inputs/placeholders lack the marker ([PARITY_RATCHETS.md](./PARITY_RATCHETS.md) #1).
  3. Quinn MCP page probe step `plp-search-icons` asserts ≥2 visible icons + sibling on disease/country fields.
- **Process:** Every new typical fail class → add a ratchet (Arch/Ben). Ratchets regain trust; green Vitest alone does not.

### Agent DONE sitrep must countdown; clear dismisses robo-cursor

- **Symptom:** Sitrep sat silent/stale; robo-cursor lingered after overlay cleared.
- **Gate:** Hint = `PASS|FAIL — Auto-closes in Xs` (live tick); big green/red badge; `finishSettle` / `forceClear` call `removeDemoCursor({ immediate: true })` + **hard-remove** overlay DOM; idle → sitrep still honest.

### Agent testing overlay: pre-arm before steps; no stale popup after test

- **Symptom:** Probe clicks started before PO could see the BR panel; after stop, sitrep/overlay sometimes stuck or left a stale panel.
- **Gate (GLOBAL):**
  1. MCP probe/sanity/`withMcpTestSession`: `start()` → **pre-arm** (~2.5s `preparing…`) → then steps.
  2. `stop({ result: "pass"|"fail" })` → green/red sitrep (~9s) + FINAL `PASS|FAIL n/m` summary line.
  3. After settle (or interrupt): `forceClear` path — cancel timers, dismiss cursor, clear persist, strip ephemeral URL, **hard-remove** DOM. Probe `finally` schedules ensure-clear at settle+1s.

### MCP page probe must not reload-loop / URL-fight (Chrome crash class)

- **Symptom / class:** Browser tab crashed or endlessly reloaded during agent MCP testing on localhost (overlay + probe + modal URL bridge).
- **Root cause hypotheses (proven gates):**
  1. Page probe defaulted `reload: true` → sitrep → reload → probe re-arm → reload loop under agent automation.
  2. Mid-settle `start`/`touch` abandoned sitrep without cancelling a deferred `location.reload()` timer.
  3. QV/`&modal=` close raced URL→open re-apply (wire cleared live before URL stripped) → modal thrash + re-renders.
  4. Uncapped `scrollIntoView` / reveal storms + overlay DOM thrash under rapid probe steps.
- **Gate (GLOBAL HARD FAIL — Finn + Quinn + Ben):**
  1. `__studioRunMcpPageProbe` defaults **`reload: false`**. At most one reload at end, and only when explicitly `{ reload: true }`.
  2. `forceClear` / mid-settle re-arm **cancels** pending reload timers (`cancelPendingReload`); never nest start/stop loops.
  3. Modal URL bridge suppresses URL→open while intentional close waits for `&modal=` clear (`studioModalUrlBridgePlan`).
  4. Cap probe reveal/scroll calls per run; overlay `forceClear` hard-removes DOM + all timers.
  5. Reload storm cooldown (~4s) — refuse stacked `scheduleReload` (agent loops).
- **PO recovery:** refresh once → `window.__studioAgentTestingOverlay?.forceClear()` → do not re-run probe with `reload: true` in a loop.

### Chrome hang — robo-cursor hover bridge + uncanceled travel rAF (P0)

- **Symptom / class:** Chrome tab hung (not just reload-loop) during agent/robo testing on PDP / avail — same P0 family as prior crash storms.
- **Root cause (v0.0.29–0.0.30 area):**
  1. `demoCursorPseudoBridge` mirrored **all** `:hover`/`:active` rules from readable sheets → mega stylesheet + class toggles → style-recalc storm.
  2. Cursor travel `requestAnimationFrame` kept ticking after `forceClear` / `removeDemoCursor` (no cancel token).
  3. Re-applying hover on an already-hovered root re-dispatched enter/move events.
  4. Accordion permanent `will-change` + rapid open/close amplified layout thrash.
- **Gate (GLOBAL HARD FAIL — Finn + Ben + Quinn):**
  1. Cap bridged CSS rules (`DEMO_PSEUDO_BRIDGE_MAX_RULES`); skip vendor sheets.
  2. `cancelDemoCursorTravel()` on remove/forceClear; Motion travel `.stop()` + generation bump (no orphan tween).
  3. Rate-limit synthetic move; no re-flood when hover class already active.
  4. Accordion: no permanent `will-change`; `contain: layout style`; toggle min-interval.
- **PO recovery:** refresh once → `__studioAgentTestingOverlay?.forceClear()` → `__studioWaitAgentTeardownClean()`.

### Robo-cursor hover missing on secondary/DS CTAs (bridge CSSOM stall — P0)

- **Symptom / class:** Robo hover class applied (`proto-chat-cta--hover` / `data-studio-robo-hover`) but **no visual hover** on PDP **Check availability**, outline/secondary buttons, etc. Chat CTAs looked fine (hand-mirrored rules in chrome CSS).
- **Root cause:** `bridgeDemoPseudoSelector` split selector lists on **every** comma — including commas inside `:is(button, [role="option"], …)`. That emitted broken selectors like `[role="option"]).proto-chat-cta--pressed:focus`. Dumping them into one `style.textContent` **stalled CSSOM parse**, so later bridged page rules (`.pdp__secondary:hover` → `.pdp__secondary.proto-chat-cta--hover`) never became live rules.
- **Gate (GLOBAL HARD FAIL — Finn + Ben + Quinn):**
  1. Split selectors on **top-level commas only** (`splitSelectorsTopLevel`).
  2. `insertRule` per bridged rule; skip invalid; never one mega text blob that can abort the sheet.
  3. Skip pseudo-element `:hover`/`:active` (`::-webkit-scrollbar-thumb:hover`).
  4. Prefer page/UXDS sheets under the 256 cap; fingerprint-refresh when sheets change.
  5. Press = pointerdown → ~40–80ms dwell → pointerup → click; clear hover/press + default arrow after.
  6. Auto-Rule R10: **robo = native hover+press everywhere** (not chat-only). Vitest covers `:is()` + `.pdp__secondary`; MCP prove Check availability bg/border.
- **PO recovery:** refresh → re-run `__studioProveRoboCursorFeedback?.('[data-studio-action="pdp-check-availability"]')`.

### Overlay eyes — MCP/robo must not click through open dialogs (PO rage)

- **Symptom:** MCP page probe / robo-cursor still clicked PLP tiles **under** open Quick View (and other lightboxes).
- **Root cause:** Modal guard existed for REC replay but was **not** wired into `simulateDemoPointerClick` / probe; Quick View (+ other PLP dialogs) not fully registered with `data-studio-modal`.
- **Gate (GLOBAL HARD FAIL):**
  1. Every blocking overlay in `STUDIO_MODAL` / `REGISTERED_OVERLAY_MODAL_IDS` + DOM `data-studio-modal="…"`.
  2. `simulateDemoPointerClick` + `__studioRunMcpPageProbe` refuse under-overlay targets (`refuse-click` prove step).
  3. `check:felonies` fails npm test if guard missing or known overlays unregistered.
- **Quinn prove:** open Quick View → probe cannot click PLP tile underneath → overlay sitrep PASS.

### Modal URL — every popup must change the address bar (PO rage)

- **Symptom:** Quick View (and other Boots dialogs) opened with **no** URL change; only Choose Pharmacy synced `&modal=`.
- **Root cause:** `useStudioUrlSync` derived `modalId` from `availabilityOpen` only; openers called raw `set*Open(true)` without a central registry.
- **Gate (GLOBAL HARD FAIL):**
  1. `STUDIO_MODAL_REGISTRY` lists every dialog (`choose-pharmacy`, `quick-view`, `login`, `vaccine-picker`, `recipient-picker`) with `urlSync: true` + open/close helpers ([URL.md](../shell/URL.md)).
  2. App derives `modalId` via `resolveStudioModalIdFromFlags`; open/close → `writeStudioUrl`; deep-link / `popstate` → `applyStudioModalFromUrl`.
  3. `check:felonies` + ratchet **modal-url-sync** fail npm test if registry entry missing, lacks URL helper, or source opens via orphan `set*Open(true)`.
- **Quinn prove:** open Quick View on PLP → bar shows `modal=quick-view`; close / Back clears `modal`.

### Stale jab count during Reset / filter refresh = ship fail (PO rage #5)

- **Symptom:** During PLP “Updating results…” loader (Reset filters / filter change), top-left still showed stale totals like **“3 jabs available”** — made-up leftover from prior `displayItems`.
- **Root cause:** Count kept prior results “for stability” while tiles hid; PO rejects any numeric jab count that isn’t the post-load truth.
- **Gate:**
  1. While `listingPhase === "loading"`: count children = `null`, `data-studio-plp-results=""`, `data-studio-plp-results-loading="true"`, CSS hide (`.plp__results-count--loading`).
  2. After load: real `${n} jabs available` only.
  3. `check:parity-ratchets` **count-hide-load** + MCP probe `plp-reset-filters` (mid-load empty) → `plp-reset-count-ready`.
- **Quinn prove:** Reset → no count text while loader up → real count after.

### Invented hover / loading chrome not in Make = ship fail (PO rage #3)

- **Symptom:** React PLP showed **duplicate** “Updating results…” (count line + spinner label) + listing **jump**; empty bookmark heart went **fuchsia on hover** (Make tertiary empty hover is navy link; fuchsia only when filled/active).
- **Root cause:** Agents “improved” Make — invented fuchsia-on-empty hover and doubled loader copy / pulsed count — then stamped **PROVEN** without MCP real-user matrix.
- **Forbidden:** Invent hover colors, loader copy placement, or attention chrome not present in Make CSS/behavior. Prefer under-matching over inventing.
- **Gate:**
  1. Uma side-by-side Make vs React for **empty vs filled** icon states and **exactly one** loader treatment (spinner ± one label; never duplicate count-line copy).
  2. Quinn + Ben: **MCP localhost real-user matrix mandatory for every screen ship** — overlay start → log each step → stop/clean slate. Arch **rejects** audit **PROVEN** without that evidence log.
  3. Prior “PROVEN” is **BAD until re-proven** when PO disputes pixels.

### Wrong preloader / loading scenario = fidelity fail (PO called out twice)

- **Symptom:** React PLP filter-change showed a blank listing band with only “Updating results…” (results-count text) — PO rage again; not the Make scenario.
- **Make truth (PLP child 9):** ~450ms load → **hide tiles** → **centered spinner overlay** (44px arc + **one** “Updating results…” under spinner) on height-locked host → stagger reveal. **Not** opacity-0 tiles, **not** text-only, **not** duplicate count-line “Updating results…”.
- **Root cause:** Loading/empty/updating treated as copy polish, not a first-class Make scenario; register marked “preloader Fixed” without mechanism prove; Uma did not sign off loading states.
- **Gate:**
  1. Uma + Bea capture Make loading mechanism **before** Finn codes ([UMA_FIDELITY_NOTES.md](./UMA_FIDELITY_NOTES.md) §0).
  2. Bea register P0 rows for loading/empty/updating with layout notes + screenshot notes.
  3. Quinn proves filter-change: spinner/overlay **in-band**, then results return — blank+text alone = FAIL; duplicate “Updating results…” = FAIL.
  4. **team check:** Uma must explicitly report `loading states — PASS|FAIL` and `checkbox/radio hover — PASS|FAIL`.

### Checkbox / radio hover miss on migrated PLP

- **Symptom:** React filter checkboxes had no Make mint hover (`#c6e5e1`); Make `globals-chrome` targets `[data-name="box"]` which React rows do not use.
- **Gate:** Page CSS must port unchecked hover wash; Uma + Quinn prove hover visible on every migrated checkbox/radio.

### Make → React fidelity (PO rage — not first time)

- **Symptom:** PLP shipped “PROVEN” while Advantage Card promo bar was entirely missing, tile had invent border, Book now hover was mint secondary (LEGACY catch-all), heart had weak/laggy feedback, Reset Filters was text-only — register Wrongly marked OK / residual.
- **Root cause:** Make→React ships without a pixel+interaction register prove; Uma skipped Nazi-hover on every CTA/icon; Bea register incomplete (bands not inventoried before Finn coded); Quinn passed with unchecked P0s / “prior ship” wishlist.
- **PO context:** Human PO has complained before about near-dups / fidelity slips — **zero tolerance**. Missing whole components = ship fail.
- **Gate:**
  1. Bea register lists **every** Make band/component before Finn codes ([UMA_FIDELITY_NOTES.md](./UMA_FIDELITY_NOTES.md)).
  2. Uma Nazi-hovers every CTA/icon; runs full fidelity checklist; audit PROVEN only when checklist PASS.
  3. Quinn cannot PASS if register has unchecked P0s; must click-hover every interactive control (interaction matrix).
  4. **team check** must include Uma checklist + Bea register completeness + Quinn interaction matrix — ship not done if Uma or Quinn FAIL.
- **Example miss:** PLP Advantage Card bar — “Collect 3 points for every £1 you spend with Boots Advantage Card‡”.

### Versioning / felonies

- **Version chip wins overflow** — sticky right block with solid PANEL fill + z-index; never let scrolling tabs cover `vX.Y.Z` / channel.
- **Version chip must track package.json live** — Vite `define` alone freezes semver at `npm run dev` start; after bumps the tab chip lied (0.0.1 while package was 0.0.3). Source of truth = JSON import of `package.json` in `studioRelease.ts` + server restart on package.json change; unit test + `check:felonies` must fail on hardcoded UI semver / missing import. Quinn proves chip after every bump ([VERSIONING.md](./VERSIONING.md) DoD).
- **Felony = `npm test` fail** — wire `check:felonies` + `check:version`; do not rely on docs alone. JSDoc must not contain `*/` mid-word (e.g. write "proto star filenames", not `proto*/…`).
- **Channel ≠ semver** — PO accepts alpha/beta/rc/stable; BE bumps digits via `release.mjs` / notes habit.

### Recording

- **Demo-click replay needs stable targets** — prefer `data-studio-action` on the click element; stop the selector chain there. Ancestor `data-name` noise (progress "Step N", breadcrumbs) breaks nested resolve.
- **Replay ≠ screen advance** — re-firing Continue proves interaction parity even when product logic opens a picker (no location yet). Do not require step navigation for a demo-click PROVE.
- **Wire-intent beat actions ≠ retreat-sync** — known `JourneyBeatActionId` → `runBeatAction`; `retreat-sync` → same script channel as director with `syncState` (`applyRecordingProjectScript` + `retreatScriptOptions`), not `runBeatAction`.
- **Human REC clicks = trusted only** — document capture-phase `click` with `isTrusted`; skip `.studio-nav-panel-host` / agent overlay; demo `.click()` stays on `notePlaybackDemoClick` (no double-capture).
- **Overlay root class must match CSS** — agent testing root is `.studio-agent-testing-overlay` (not bare `.agent-testing-overlay`); mismatch breaks PANEL CSS and lets Dismiss leak into REC capture.
- **Director replay needs scriptKind or resolvable id** — capture `scriptKind` on the interaction record; fall back to `resolvePlaybackScriptKind(scriptId)` for older sessions.

### Domain identity

- **No new `.proto-*` / `data-proto-*`.** PANEL/chrome classes are `.studio-nav-*` / `.studio-*`; DOM attrs are `data-studio-*` (`dataset.studio*`). Prefer `__studio*` window APIs; keep `__proto*` aliases. Concept Make leftovers may stay `.proto-*` in LEGACY until that screen retires — do not invent new ones. Gate: [NAMING.md](./NAMING.md) + Nazi QA light after chrome class renames.
- **Half-renames kill agents** — className + CSS + smoke/MCP selectors must move together (one codemod). Dual attrs only if a release truly needs them; prefer clean cut.
- **Storage/events** — `studio-nav:` / `studio-hub:` / `studio-*-sync` with one-time legacy read; beat field `protoTab` waits for a schema migration.

### File hygiene

- **Monster files block agents** — default 1600 LOC via `npm run check:hygiene`. Allowlist LEGACY Make dumps + current engine ceilings; prefer domain cohesion splits over micro-file zoos or silent ceiling bumps ([HYGIENE.md](./HYGIENE.md)).

### Studio chrome

- **REC ⊗ CJM is XOR, not only AIR.** CJM on → REC `disabled`; REC on → CJM off. AIR still locks both. Gate: `src/app/nav/studioModeXor.ts` + MCP sanity `rec-disabled-when-cjm-on` / `rec-enabled-when-cjm-off-idle`. Audit row **G6**.
- **Blast-radius adjacent chrome** — after any UI edit, scan sibling links/CTAs, counters, mode labels, panel XOR, AIR/browse locks. Do not only test the pixel you touched.

### DS / links / CSS

- **Near-dup text links forbidden** — one footer-like pattern (`.uxds-link` + LEGACY aliases): no underline at rest, underline on hover. Enforce with `npm run check:links` ([DS_STRICTNESS.md](./DS_STRICTNESS.md)).
- **Make `!important` vs kit tokens** — when retiring Make for a React screen, do not fight LEGACY `!important` forever; hide Make chrome and style the React host in page CSS / UXDS / theme. No LEGACY growth for new React pages.
- **Incomplete CSS grid / flex rows must left-align** — never `justify-content: space-between` with narrower pad spacers on short last rows (Book Step 2 time slots). Prefer CSS `grid` with fixed columns, or equal-width pads + `flex-start`.

### Hybrid Make + React

- **Distrust “done” without browser proof** — green Vitest/build/smoke alone are BAD for UI. Live localhost or CSS gate; write audit **PROVEN** under `docs/projects/<project-id>/audits/` (Boots: `docs/projects/boots-pharmacy/audits/`).
- **Hybrid mount gates** — when React mounts, hide Make duplicates (`data-studio-make-retired`); gate Make wire handlers with `isBookStepNReactMounted()`; preserve `data-name` / AIR hooks (`data-studio-open-appointment`, `data-studio-cal-*`).
- **querySelector first-match traps** — Make DOM often still exists (hidden). Prefer React host selectors or React-owned props for clicks (e.g. progress Step 1 → `onBackToStep1`), not wiring the first Make progress node.
- **Agentic home `sarah-query-submit` / Chat summary** — after Site Pilot React mount, hidden Make `[data-name="component.co.order.summary"]` / `appointment.summary` still wins `querySelector` → director transport-no-op (`diagnostic-on-step-1`). Always prefer `.studio-react-screen-host` / `.home__card` / `.chat__summary` and skip `[data-studio-make-retired]` ancestors. Controlled React textareas need the native `value` setter + `input` event for playback typing.
- **Traditional `pdp-book-now`** — same first-match class: Make `[data-name="component.input.button"]` Book now under `data-studio-make-retired` can win while React wire is gated → transport-no-op. Prefer `button[data-studio-action="pdp-book-now"]` on `.studio-react-screen-host` / `[data-studio-react-screen="pdp"]` and skip make-retired ancestors (`findPdpBookNowBtn`).
- **createRoot `unmount()` must not run sync during parent React render/commit** — calling `root.unmount()` from `useLayoutEffect` / effect cleanup while `BootsPharmacyProjectView` is committing triggers: *Attempted to synchronously unmount a root while React was already rendering*. Defer with `setTimeout(0)` (or equivalent); cancel the deferred unmount on remount so Step tab / AIR / CJM flips do not race. Gate: `mountBookStep{1,2,3}Screen.tsx`.

### Navigation / journeys

- **Progress / Studio “Step 1” ≠ Make “tab1”.** Book Step 1 is `INDEX_BOOK_STEP1` (screen index **4**, child **7**, protoTab **5**). Agentic CJM has no beat on that tab; beat-index fallback to `agentic-home` must **not** `goToTab` while browsing (`shouldNavigateBeatTabOnEnter` / `scenarioBrowseMode`).
- **Named screen indices** — use `INDEX_BOOK_STEP*` / `INDEX_PLP` from `screens.ts`; avoid magic `setCurrent(4)` comments that confuse childIndex vs screen index.

### Docs layout

- **Project docs live under `docs/projects/<id>/`** — design deltas, screen pilots, FE audits, migrate-ready reports. Engine doctrine / FE standards / templates stay in `docs/product/`. Old heavily linked paths keep thin stubs. Do not dump Boots files into `docs/product/`.

### Naming

- **Screen folder = `screenId`** — use `screens/book-step-1/` for `?screen=book-step-1`, never `book-step1`. Journey **beat** ids may stay compact (`book-step2`) until a dedicated migration; URL aliases normalize them ([../shell/URL.md](../shell/URL.md)). New files follow [NAMING.md](./NAMING.md).
- **No `proto*` filenames / new classes / new attrs** — see Domain identity above.

### CI / Pages / MCP

- **CI smoke is on-demand** — default CI = unit + build; Playwright smoke = `workflow_dispatch` / local `npm run smoke` only ([CI_ACTIONS_BUDGET.md](./CI_ACTIONS_BUDGET.md)).
- **Post-push sitrep (BE / Director) — no-await routine (R12)** — after routine push: optional one-shot `gh run list` peek, then **move on**. **Forbidden:** `gh run watch` / sleep-poll / await Pages on every ship. Await CI only for HARD-GREEN / release / PO-asked prove. Do **not** claim remote green without evidence. `cancelled` Deploy/CI often means concurrency supersede — check tip SHA when you look. → [CI_ACTIONS_BUDGET.md](./CI_ACTIONS_BUDGET.md) §5 · [STUDIO_AUTO_RULES.md](./STUDIO_AUTO_RULES.md) R12.
- **CI wall clock** — install dominates; warm `node_modules` cache (skip `npm ci`) + parallel `test`∥`build` + Vitest forks/workers is the free-runner path. Target ≤20–25s warm. Do not gut hard gates for speed.
- **Page-probe unit delays ≠ MCP settles** — recipe `settleMs`/`waitMs` are for real robo-cursor MCP. Under Vitest, `compressProbeDelayMs` (env `VITEST` only) + fake timers crush wall clock; never shorten production overlay/pre-arm/step settles for CI.
- **Pages verify after chrome ships** — deploy green ≠ visual proof; check deployed host for `data-studio-react-screen` + MCP sanity on the live URL when chrome/pages matter.
- **Agent MCP testing overlay** — BR corner status + invisible click capture (no lightbox). `stop()` enters ~5s DONE/SITREP (readable log, click guard released) then clears; MCP helpers use `stop({ reload: true })` so reload runs **after** sitrep; Dismiss/`forceClear` is instant; never restore stale persist on load ([../shell/RECORDING.md](../shell/RECORDING.md)).
- **Overlay stuck after agent work** — `helperOverlayArm` `touch()` on mutating helpers (e.g. EnsureCleanStudio) without a matching `stop()` left the panel active with only “overlay start”; titles concatenated `__studioEnsureCleanStudio` and CSS `uppercase` read as garbled `STUDIOENSURE…`. Fix: clean titles only; do not arm on EnsureCleanStudio/AbortAll; idle auto-stop ~45s → sitrep; `forceClear()`; Run helpers keep `finally` → `stop({ reload: true })`.
- **Post-agent stay-on-page** — page/sanity/probe tests must **not** bounce the PO to hub. Default `resetStudioAfterAgentTest()` keeps `project`+`screen`(+persona/mode); **always strips `&modal=`** + ephemeral; closes live dialogs via event (never re-apply modal after `closeAllPopups`). Use `{ resetToHub: true }` only for CJM/journey. Quinn proves: PLP probe → still `screen=plp` with no sticky modal.
- **Sticky `&modal=` after probe / sitrep / forceClear (PO rage felony)** — Root cause: stay-state preserved `modalId` and App `onPostAgentReset` re-applied it after `closeAllPopups`. Gate: stay builder omits modal; reset forces `modalId: undefined`; App never re-applies modal on post-agent event; probe `finally` calls `resetStudioAfterAgentTest` again; intentional-close suppress still covers URL→open race. **Auto-Rule `agent-teardown-clean`:** [STUDIO_AUTO_RULES.md](./STUDIO_AUTO_RULES.md) · `studioAgentTeardownContract` · `check:felonies` §9 · `__studioAssertAgentTeardownClean` after settle.
- **Studio Auto-Rules framework** — recurring PO asks (dismiss/modal, auth SSoT, logged-out avail start, brand-active pills, §0b rhythm) must become CI/MCP gates in the **existing** check family — not a parallel unused system. Catalog: [STUDIO_AUTO_RULES.md](./STUDIO_AUTO_RULES.md) · `check:theme-brand` · felonies §10 auth-ssot.
- **Parity-proven CI gate** — React-migrated screens without PROVEN audit + MCP matrix in `PARITY_PROVEN.json` must fail `npm test` (`check:parity-proven`). Chat “PROVEN” without the gate = PO trust loss.
- **Overlay ≠ lightbox** — opaque full-screen “AGENT TESTING” modals rage the PO and hide the page under test; keep the concept visible.

---

## How to append

Add a `## YYYY-MM-DD` section with concrete bullets (symptom → root cause → gate). Link the audit SHA or commit when relevant.


# Journey playback

How the Proto Studio journey engine works, how to change scripts safely, and what to verify after every playback-related change.

See also: [SHELL.md](./SHELL.md) (architecture), [PROJECTS.md](./PROJECTS.md) (registering projects/personas), **[CJM_RECORD_PLAY_EDIT.md](./CJM_RECORD_PLAY_EDIT.md)** (Record/Play/Edit = guitar tabs), **[PLAYBACK_DIAG.md](./PLAYBACK_DIAG.md)** (console type-in / step / retreat contract — Auto-Rule R13), **[QA_LOGGING_AND_PLAYBACK_RECIPE.md](./QA_LOGGING_AND_PLAYBACK_RECIPE.md)** (Play ≡ Step · type-in REQUIRED · per-char QA FORBIDDEN · FM `stop()` hang · thinking camera).

---

## Play ≡ Step

Continuous **Play** uses the **same** beat/script runners as **Step Forward** (automated). Do not invent a dump-all / skip-type-in Play path. CJM-on chat enter = q0 then progressive; CJM-off = saved-chat load — [CHAT_PAGE_RAILS.md](../projects/boots-pharmacy/features/CHAT_PAGE_RAILS.md).

The QA overlay also exposes **Fast test current CJM** and **Fast test all CJMs**. Fast mode uses those same runners and assertions, but applies a scoped timing profile to presentation-only waits and motion. It never skips beats, direct-clicks past cursor target checks, bypasses modal handling, weakens alignment guards, or changes REC pacing. The normal profile is restored in `finally`, including failures.

**Type-in:** page composers must still animate letter-by-letter. Gate **QA/diag logging** of per-character progress only — never kill the animation to quiet the overlay. Dump smell: `typeIn.samples ≫ starts` (e.g. 249 vs 2).

**Cursor travel:** never `await` FM controls after `stop()` alone — settles on onComplete/abort/ceiling (`demoCursor.ts`) or Play dies with `script-timeout` at confirmation.

**Chat camera:** thinking paints `revealed=false` — settle via `resolveChatCameraTarget` (thinking first).

## Architecture (30-second map)

```
journeys.ts          Beat timeline (declarative)
       ↓
useJourneyPlayback   Shell engine — play, step, dwell, skip, beat-enter
       ↓
playback/index.ts    Dispatches script IDs → runners
       ↓
playback/*.ts        Imperative DOM/cursor actions (project-specific)
```

| Layer | Path | Owns |
|-------|------|------|
| **Beat definitions** | `projects/<id>/personas/<persona>/journeys.ts` | Timeline, labels, `protoTab`, script IDs |
| **Script ID types** | `app/orchestra/types.ts` | `HomeScriptId`, `TabScriptId`, `BookScriptId`, … |
| **Engine** | `app/orchestra/useJourneyPlayback.ts` | Transport, beat advance, scenario handoff |
| **Scenario frames** | `app/nav/useScenarioPlayback.ts` | Chat frame stepping (`screen-frames` beats) |
| **Dispatch** | `projects/<id>/playback/index.ts` | `runHomeScript`, `runTabScript`, `abortAll`, … |
| **Runners** | `projects/<id>/playback/*.ts` | DOM queries, demo cursor, timeouts |
| **Wire DOM** | `projects/<id>/wire/*` | Popups, scroll, sticky chrome — scripts depend on this |

The shell **never** imports project script runners directly. It calls `project.playback` from the registry.

---

## Scroll camera SSoT (ONE engine)

**Module:** `src/app/scenario/playbackScroll.ts`

| API | Use |
|-----|-----|
| `scrollCameraToTarget(el)` | **Primary** — CJM clicks, director, retreat, REC replay, smoke reveal |
| `scrollCameraToOrigin(host)` | Named host-top baseline (jump-to-start / intentional tab reset / probe prep) |
| `scrollCameraToHostEnd(host)` | Host-end **only** when no DOM frame/CTA target (chat latest thread) |
| `scrollChatCamera(host)` | Chat — thinking → last revealed frame → else host-end |
| `animateScrollElementIntoView` / `beginDemoTargetPageScroll` | Lower-level engine (same file) |

**Ban:** new journey/director/smoke `scrollTop =` / `scrollTo({ top })` for camera.  
**Not camera:** product UI chrome (Hub carousel, Studio tabs strip, overlay sitrep list) — local scroll with an explicit boundary comment.

REC capture is **target-only**; legacy `scrollTop`-only replay is **refused**.

### Camera engine rails (screen-enter)

One policy for **any** journey (agentic, traditional, REC tabs):

1. **SSoT** = `playbackScroll.ts`. Directors / REC only pick **targets**. Wire must not bypass with competing mid-flight snaps.
2. **Playback camera session** — shell sets `setPlaybackCameraSessionActive(journeyMode ∪ playing ∪ onAir)`.
3. **Screen-enter / tab change (page land)** — while CJM/Play/AIR, wire **force-origins to host top** on tab change (chat exempt). Prior-screen ease is aborted first. Intentional `kind:camera` beats then wait → ease to target — **no mid-scroll land** from a previous screen’s scrollTop.
4. **Intentional origin also** — jump-to-start, retreat sync, probe prep, scenario align-start → `scrollCameraToOrigin(..., { force: true })` (optionally honor `POST_CLICK_CAMERA_HOLD`).
5. **Chat** — exempt from tab-enter origin. Settle / pin / pad **yield** during `kind:camera` dwell (`shouldYieldChatAutoCamera` / `setCameraBeatDwellActive`). Prefer `scrollChatCamera` / `scrollCameraToTarget` over blind host-end; co-travel uses `coTravel: true` so pull-up lock does not abort the ease.
6. **REC scroll-stop** — one camera wait per settle (≥2s quiet). Detector + compile coalesce so a long pause does not mint N duplicate camera steps.

Smell this kills: landing mid-PLP/PDP after a tab hop; Traditional Reserve→history→details fighting an in-flight ease.
---

## Cursor engine SSoT (ONE engine)

**Policy module:** `src/app/scenario/demoCursorEngine.ts`  
**DOM / Motion:** `src/app/scenario/demoCursor.ts`

| API | Use |
|-----|-----|
| `parkDemoCursorAtRest({ reason? })` | **Primary** — travel-to-rest (Motion easeInOut). CJM idle, retreat, jump-to-start, post-script park |
| `parkDemoCursorAtRest({ force: true, reason })` | Intentional hard snap — first remount / revive / resize / observe teardown |
| `parkDemoCursorForTypeIn(target)` | Hold journey park pose during type-in (force seed only if pose missing) |
| `settleDemoCursorAfterInteraction(target?)` | **Post-click settle** — step park / Play stay / always park from submit |
| `cancelDemoCursorTravel()` | Abort mid-travel — settles via onComplete/abort poll (never `await stop()` alone) |
| `resolveCursorParkDecision(...)` | Pure travel-to-rest policy (tests / callers) |
| `resolvePostInteractionPark(...)` | Pure step vs Play + forbidden-submit policy |
| `logCursorEngineTracker(tag)` | Lean QA rows (see recipe) |

### Cursor engine rails

1. **Travel = eased Motion** — straight-line easeInOut; no bounce / spring / overshoot ([MOTION.md](../product/MOTION.md)).
2. **Park = travel-to-rest** by default. Hard snap **only** with `force: true` or **first-mount** (no start pose).
3. **Ban** `animate: false` without `force` — coerced to travel + **`ABRUPT-PARK FAIL`** QA row (mirrored).
4. **Cancel mid-travel** settles cleanly (generation bump + `.stop()` + promise settle — hang lesson).
5. **Type-in** — CJM cursor stays visible at journey park (`type-in-hold`); hidden → `CURSOR_HIDDEN_DURING_TYPEIN`. Carriage (I-beam) graphic while type-in latch / text focus.
6. **Dual-cursor** — manual/observe = OS only; robo returns for CONTROL / CJM Play.
7. **Park ONLY on stepped playback** — manual Step forward/back / stepped call → `park-on-step`. Continuous Play → **stay at last interaction** (`stay-on-play`) — do **not** ease-to-rest after each click.
8. **Never rest on composer submit** — send/submit is a registered forbidden rest target → always `park-from-submit` (even during continuous Play). Left on submit → **`REST-ON-SUBMIT FAIL`**.
9. **Early hand-on-edge** — hand graphic as soon as tip crosses interactive edge (button/link/input/CTA) during travel — not center-gated.
10. **Graphics (steady binary)** — arrow (default) · hand (`--pointer`, destination-edge latch + CTA hover/press) · carriage (`--carriage`, type-in / fresh text focusin). All fill the **same large 37×37** demo box. **Bar:** mid-travel arrow until tip enters **destination** edge → **one** rising edge to hand (latched; never clear mid-travel; no mid-path `elementFromPoint` thrash) → stay hand through hover/press → **one** falling edge to arrow after leave. Settle keeps hand until hover attaches (no hand→arrow→hand blink). **QA:** `Cursor → arrow|hand|carriage`; **`GRAPHIC-THRASH FAIL`** if arrow↔hand A→B→A within 200ms. Carriage = type-in/focus only; hand wins over carriage.

Transport pin: `setDemoCursorJourneyMode(…, { parkAfterInteraction: cjm && !isPlaying })` (App shell). Directors prefer `settleDemoCursorAfterInteraction(target)` over raw hold/park.

**Ban:** new journey/director paths that `seedDemoCursorPosition` / snap left/top to rest without going through `parkDemoCursorAtRest` / engine policy.

---

## Beat kinds

| Kind | Meaning | Typical fields |
|------|---------|----------------|
| `tab-landing` | Navigate to a prototype tab; optional cursor script | `protoTab`, `tabScript`, `bookScript`, `homeScript`, `dwellMs` |
| `screen-frames` | Step through revealed frames on one screen | `protoTab`, `scenarioId` |
| `overlay` | Availability tool or other overlay script | `availScript`, `onEnter` |
| `camera` | Wait to show page, then eased scroll to target (own STEPS; step-back reverses) | `protoTab`, `camera: { dwellMs, selectorChain }` |

**Camera beat:** do **not** bury page-show wait only in click `dwellMs` / legacy `recordedClick.cameraSelectorChain`. Use `kind: "camera"` so Play = dwell → `scrollCameraToTarget`, and step-back = `reverseCameraBeat` (restore pre-scroll top). Long pages inherit camera-engine pacing.
**`protoTab`** is the **display tab number** (1–9), **not** `childIndex`. Map via `studioTabToIndex()` in the project's `screens/screens.ts`.

---

## How to change an existing script

1. Find the beat in `personas/<persona>/journeys.ts` — note its `homeScript` / `tabScript` / etc.
2. Open the matching runner in `playback/`:
   - `homeScript` → `sitePilotHome.ts`
   - `availScript` → `availability.ts`
   - `bookScript` → `book.ts`
   - `tabScript` → `traditional.ts`
   - `onEnter` actions → `playback/index.ts` → `runBeatAction`
3. Edit DOM selectors / timing inside the runner only.
4. Run **`npm run test`** then the **manual smoke checklist** below.

Do **not** change `useJourneyPlayback.ts` unless the transport behaviour itself needs to change.

---

## How to add a new script

1. **Add the script ID** to the union in `app/orchestra/types.ts` (e.g. `TabScriptId`).
2. **Implement** `run…Script` case in the appropriate `playback/*.ts` file.
3. **Assign** the script ID on a beat in `journeys.ts`.
4. **Add a test case** in `personas/.../__tests__/journeys.test.ts` if the beat uses a new ID (integrity tests will catch missing wiring).
5. Run **`npm run test`** + manual smoke checklist.

---

## How to add or reorder beats

1. Edit `journeys.ts` — keep beat `id` values **unique within the journey**.
2. Set `protoTab` when the beat should land on a specific screen.
3. Use `dwellMs` on `tab-landing` beats for auto-advance during Play (default ~2800 ms).
4. For `screen-frames`, ensure `scenarioId` exists in the project's `screens/scenarios.ts`.
5. Run **`npm run test`** — journey integrity tests validate IDs, tabs, and script references.

**Skip beats:** persona `journeyHooks.shouldSkipBeat` (e.g. skip login when `headerLoggedIn`). Test skip logic in unit tests when changing hooks.

---

## Fragile coupling (read before editing)

These seams caused post-extraction regressions. Touch with care:

| Seam | Risk |
|------|------|
| **Shell ↔ wire `apiRef`** | Login/popup state lags one frame; affects `shouldSkipBeat` and touchpoint labels |
| **Beat-enter vs restored tab** | Engine skips initial `goToTab` on mount; manual tab + Play still navigates |
| **DOM `childIndex` vs tab number** | CSS/effects use `nth-child(childIndex)`; scripts query `data-name` — Figma export changes break silently |
| **`overflow: hidden` on screen** | Breaks `position: sticky` (Site Pilot bar on chat) |
| **Sticky/header effects** | Must re-run when `current` changes to chat tab, not only on mount |
| **Chat scenario frames** | `minVisibleFrames`, `playbackStepMs`, finale hooks in `App.tsx` + `sitePilotChat.ts` |

---

## Automated guardrails

```bash
npm run test          # unit + journey integrity (run after any playback change)
npm run build         # TypeScript compile (required before push)
```

Tests live next to the code they protect:

| Test file | Guards |
|-----------|--------|
| `app/orchestra/__tests__/journeyUtils.test.ts` | Beat stepping, skip logic, first/last playable |
| `app/orchestra/__tests__/resolveActiveScreenScenario.test.ts` | Chat scenario activation |
| `projects/boots-pharmacy/screens/__tests__/screens.test.ts` | Tab ↔ index mapping |
| `projects/boots-pharmacy/personas/.../__tests__/journeys.test.ts` | Beat IDs, script IDs, `protoTab` range |
| `app/shell/__tests__/playbackCursorAnomalies.test.ts` | Stale/orphaned cursor heuristics |
| `app/shell/__tests__/playbackCursorMonitor.test.ts` | Cursor guard timing after manual transport |

**What tests do not cover:** live DOM scripts, cursor animation timing, Figma export drift. Those require the manual checklist.

---

## Manual smoke checklist (required after playback changes)

Run `npm run dev`, then:

### Quick (any script/timeline change)

- [ ] `npm run test` passes
- [ ] `npm run build` passes
- [ ] Transport: **Step forward** and **step back** on 3 consecutive beats — tab and touchpoint label track
- [ ] **Play** for ~10 s on current journey — no stall, no unexpected tab jump

### Agentic CJM (full path — before demos)

- [ ] Jump to start → **Play** through: home query → chat frames → availability (date → time → book) → book date/time/reserve → confirmation → appointment history → details
- [ ] Retreat contract: `personas/sarah-jenkins/__tests__/agenticRetreatContract.test.ts` (Agentic avail + book step-back baselines)
- [ ] Composer send during chat pauses/resumes scenario correctly

### Traditional CJM (full path — before demos)

- [ ] Jump to start → **Play** through: PLP tile click → PDP Book now → login (if logged out) → **Book Step 1: cursor clicks location search field** → choose pharmacy → Continue → book date/time/reserve → confirmation → MA

### Persistence / navigation

- [ ] Hard refresh on tab 3+ — **same tab** restored (not forced to Agentic home)
- [ ] Switch persona or CJM mode — beat resets, playback stops
- [ ] Agentic chat: Site Pilot secondary header **sticks** below main header when scrolling

---

## File reference (Boots Pharmacy)

```
src/projects/boots-pharmacy/
  personas/sarah-jenkins/
    journeys.ts              # AGENTIC_CJM_JOURNEY, TRADITIONAL_CJM_JOURNEY
    index.ts                 # journeyHooks.shouldSkipBeat
  playback/
    index.ts                 # BOOTS_PHARMACY_PLAYBACK dispatch
    sitePilotHome.ts         # homeScript
    sitePilotChat.ts         # chat scenario hooks (finale, thinking)
    availability.ts          # availScript
    book.ts                  # bookScript
    traditional.ts           # tabScript
  screens/
    screens.ts          # PROJECT_SCREENS, studioTabToIndex
    scenarios.ts             # site-pilot-chat config
  wire/
    BootsPharmacyProjectView.tsx   # DOM effects scripts rely on
```

---

## When to extend the engine vs the project

| Change | Where |
|--------|-------|
| New cursor step on existing screen | `playback/*.ts` + `journeys.ts` |
| New beat kind or transport behaviour | `app/orchestra/` (shell) |
| New project with different screens | New `projects/<id>/` + register in `registry.ts` |
| Popup open/close from script | `JourneyRuntime` in `App.tsx` + wire refs |

Keep shell changes rare. Prefer project-local script runners.

---

## Retreat sync (universal transport contract)

CJM **step back** must restore DOM, scroll, and wire/React state to the target beat baseline — not leave director outcomes (e.g. robo-selected date) in place.

### Shell-owned (project / page / UX agnostic)

| Piece | Path | Role |
|-------|------|------|
| **Retreat trigger** | `useJourneyPlayback` | Sets `retreatSyncRef` on step-back; beat-enter calls `syncBeatRetreatState` |
| **Universal router** | `app/orchestra/journeyRetreatSync.ts` | Routes by beat metadata (`homeScript`, `availScript`, `bookScript`, `tabScript`) — never by project id or beat id |
| **Script options** | `projects/playbackScriptOptions.ts` | `{ skip, syncState, instant }` on all `run*Script` runners |
| **Wire bridge** | `app/scenario/retreatBridge.ts` | `proto-retreat-sync` event — wire resets React state playback cannot reach |
| **Viewport guard** | `transport-retreat-scroll-mismatch` | ~520ms after step-back; optional `checkRetreatViewportGoal` per beat |

```
step back → retreatSyncRef
         → syncBeatRetreatState(playback, beat, runtime)
              ├─ homeScript  → runHomeScript({ syncState: true })
              ├─ availScript → runAvailScript({ syncState: true })
              ├─ bookScript  → runBookScript({ syncState: true })
              ├─ tabScript   → runTabScript({ syncState: true })
              └─ dwell beat  → playback.syncDwellRetreat(beat)
         → dispatchRetreatSync({ channel, scriptId, intent? })
         → wire listens → reset local React state
```

### Project-owned (implement per screen)

| Hook | When | What to implement |
|------|------|-------------------|
| `run*Script` + `syncState` | Beat has a director script | Restore cumulative UI for that script step (DOM + dispatch bridge intent if React state involved) |
| `syncDwellRetreat` | Dwell landing beat (no script) | Screen baseline only — e.g. Book Step 2 scroll to date block |
| `checkRetreatViewportGoal` | Optional monitor | Return `{ expectsAnchor, domGoalMet }` for viewport guard after step-back |

**New project checklist:**

1. Implement `syncState` branches in each `playback/*.ts` runner (no-op `scriptOk()` until the screen needs retreat).
2. Add `syncDwellRetreat` for dwell beats that own scroll/DOM baseline.
3. Wire listens to `onRetreatSync` filtered by `intent` (not beat ids) when playback cannot update React state alone.
4. Add `checkRetreatViewportGoal` cases when the beat has a verifiable DOM goal.

Boots Book Step 2 is the reference implementation: `book.ts` (`syncBookBeatState`), `dom/bookStep2Calendar.ts` (DOM + `book-step2-default-date` intent), wire `chosenBookingSlot` listener.

---

## Playback diagnostics

When a journey script fails, times out, or the studio stays on-air without advancing, playback stops automatically and a **Playback diagnostic** card appears (dismissible; does not replace the fatal error boundary).

| Layer | Trigger | What stops |
|-------|---------|------------|
| **Script failure** | `runAvailScript` / book / tab / home returns `false` | `stopJourneyPlay()` + diagnostic with beat + script id |

Pausing playback or aborting a script does **not** surface a diagnostic — orchestration suppresses failures when transport is already stopped or a script abort flag is set.
| **Script timeout** | Script promise exceeds 45s (`withPlaybackScriptTimeout`) | Same |
| **Scenario stall** | Chat prelude/finale exceeds 60s | `abortPlayback()` + diagnostic |
| **Stall watchdog** | On-air with no beat/frame/touchpoint change for 22s (`usePlaybackGuard`) | `handlePlaybackDiagnostic` → stops journey + scenario |

Key files:

- `src/app/shell/playbackDiagnostic.ts` — error types, formatters, timeout helper
- `src/app/shell/usePlaybackGuard.ts` — stall fingerprint watchdog
- `src/app/shell/PlaybackDiagnosticOverlay.tsx` — UI card

If the control room still shows pause/green diode while a popup is stuck, the watchdog should fire within ~22s and surface beat + avail step in technical details.

**Copy report** (playback diagnostic) is optimized for agents:

- `failureStep` — exact script checkpoint (e.g. `findButtonByText: "Book now" on PLP tile not found`)
- `trigger` / `triggerKind` / `triggerElement` — last studio interaction before the failure (transport button, director script, robo-cursor click target)
- `source` — file + function (`traditional.ts → runPlpOpenPdp()`)
- `## studio` — project/persona, beat index, protoTab, childIndex, touchpoint, wire flags at failure time
- No duplicate `## raw` block, no userAgent noise

Scripts return `PlaybackScriptResult` (`{ ok: false, step }`) from project playback runners; registry in `playbackScriptRegistry.ts`.

**Scroll / camera guard** (`usePlaybackScrollGuard`) stays active while journey mode is on (not only on-air) and reports `scroll-anomaly` diagnostics (stops playback) when it sees:

- `scroll-reversal` — direction flips 3+ times in 700ms (pin vs eased scroll fighting)
- `scroll-jump` — large instant jump while not in eased animation
- `scroll-stutter` — 3+ animation frames longer than 50ms
- `scroll-path-deviation` — eased scroll position diverges from expected curve
- `scroll-interrupted` / `scroll-competing` — animation cancelled, or **multiple eased scroll starts during one viewport director script** (e.g. reserve scroll + cursor travel scroll before click)
- `scroll-excessive-burst` — after a viewport director script ends (`select-book-time`, `reserve-appointment`), **more than one** additional eased scroll within ~1.4s (not a single long camera move to the next target). Tab/`protoTab` changes clear the burst watch (same as screen navigation grace).

The guard captures the script label when scripting **starts** (`noteDirectorScriptStart`, clears any prior burst watch) and arms post-script burst detection when `isPausingBeforeReveal` falls (`noteDirectorScriptEnd`). Intra-script stacked scrolls are caught on the **second** `onAnimationStart` while the script is still running — not after it ends.

Demo camera easing uses `computeDemoScrollDuration` (~720–1200ms depending on travel distance).

Tab/screen changes (e.g. PLP → PDP on Book now) get a **700ms navigation grace** — scroll resets during intentional screen swaps are not reported as jumps.

**CJM step-back retreat sync** (`syncBeatRetreatState`, e.g. `select-book-time` instant snap to the time grid) gets a **900ms retreat grace** — instant `snapDemoTargetIntoView` scrolls are expected and not reported as `scroll-jump`.

**Viewport alignment guard** (`usePlaybackViewportGuard`) catches touchpoint advances where the status bar moves but the prototype scroll root does not follow on the **same screen**:

- `viewport-stall` — touchpoint/beat advanced but `scrollTop` moved less than ~48px and the beat focal element is not in view (~520ms after step/script end)
- `transport-retreat-scroll-mismatch` — step back changed the beat but the prototype scroll anchor or project DOM goal did not restore (~520ms after step-back). Book date/time retreats expect June **24** selected (wire default), not the director playback date **21**; reserve retreat expects date **21** + time **15:30**
- **Book — time** director step: scroll to time grid **and** select 15:30 with demo cursor (one step). Beat-enter sync only ensures date + clears time — no scroll. Reserve scroll happens on the reserve beat only.
- **Popup touchpoints** (`popup:*` keys from `resolveStudioTouchpoint`) are excluded — modals/overlays do not use prototype scroll follow
- Screen-frame scenario beats are excluded (scenario engine owns scroll)

**Demo cursor guard** (`usePlaybackCursorGuard`) runs while the prototype is open (not hub) and reports `cursor-anomaly` diagnostics when demo cursors leak in the DOM:

- **Journey mode (CJM):** one visible robo-cursor is **expected** between director steps (parked idle pose). `cursor-stale` and `cursor-orphaned` do **not** fire for `cursorCount=1` while journey mode is on.
- `cursor-stale` — outside journey mode (or multiple cursors): cursor still visible ~220ms after step/jump/play or script abort when transport is idle
- `cursor-orphaned` — `cursorCount > 1`, or a leftover cursor after beat/screen change when not in the single-cursor CJM contract (~480ms grace)

The guard does **not** fix cursor cleanup — it surfaces leaks for copy-report / supervisor review. In CJM, only **duplicate** cursors (`cursorCount > 1`) indicate a real problem.

**Director guard** (`usePlaybackDirectorGuard`) reports `cursor-anomaly` using universal patterns (not hardcoded beat ids):

- `selection-without-director` — beat-enter sync applied a director-only outcome, skip click on a director step, or outcome applied without demo cursor (`DirectorOutcomeReport` from project scripts)
- `director-step-skipped` — step forward from a **dwell landing beat** (`isDwellLandingBeat`) did not start the next beat's director script within ~1.2s
- `director-step-no-effect` — manual step forward ran a director script but DOM goal was not met (`domGoalMet` on `DirectorOutcomeReport`, e.g. time not selected after `select-book-time`); or step-forward with `advanceAfter` landed on the next beat without running its director script (date → time empty landing)

When a playback diagnostic is showing, the studio transport diode glows **red** (`playbackErrorActive` on `StudioNavScenarioControls`). When CJM reaches the last playlist frame (e.g. `11/11` for logged-in Traditional CJM with login beat skipped, `12/12` when login is in the playlist), the diode glows **blue** (`journeyAtEnd`) until the user steps back or leaves journey mode.

Studio step counter (`scenarioFrames` in diagnostics) uses the **live touchpoint playlist length** as the denominator and the max of beat-anchored + **current screen tab** playlist index as the numerator — so the counter can show appointment history (`10/11`) while the beat index is still on confirmation until the next transport step. With **CJM off**, the deck shows `-- / N` only (no numerator); `N` is always the current journey playlist length (e.g. `11` for logged-in Traditional, `25` for Agentic) and updates when you switch CJM mode.

**Transport no-op guard** — if manual step forward completes (~1.2s) without changing beat index, reports `transport-no-op` / `transport-step-no-op` (e.g. director script failed silently during manual CJM stepping). Manual script failures also surface via `script-failed` diagnostics (not only during auto-play).

**Transport contract guard** (`usePlaybackTransportGuard`) catches studio deck invariants the DOM-focused monitors do not:

| Check | When it fires |
|-------|----------------|
| `playlist-frame-skip` | One manual step advances the raw touchpoint playlist by more than one frame (e.g. 3/12 → 5/12) |
| `touchpoint-ahead-of-beat` | Runtime touchpoint is **two or more** playlist frames ahead of the active beat (adjacent next frame is OK — e.g. PDP → login popup before beat advances; chat `screen-frames` substeps like `beat:agentic-chat:frame:2` are also OK while the beat stays on `agentic-chat`) |
| `director-script-off-air` | `isScripting` is true while `isOnAir` is false — control panel should show on-air during director scripts |

Key files: `playbackTransportAnomalies.ts`, `usePlaybackTransportGuard.ts`.

**Viewport guard** derives `expectsViewportFollow` from journey beat metadata (`beatExpectsViewportFollow` in `journeyBeatDirector.ts`): same `protoTab`, chained director scripts on one screen. No per-beat id registry.

### Retreat selection monitor

After CJM **step back**, the viewport monitor waits ~520ms then evaluates project selection baselines via `checkRetreatSelectionGoal` on `ProjectPlayback` (Boots: `retreatSelectionGoal.ts`). Fires `state-mismatch` diagnostics (copy report includes `expected` / `actual` / trigger context).

| Beat | Baseline verified |
|------|-------------------|
| `avail-continue` | Availability date step, **June 25** selected |
| `avail-time` | **June 21** selected, no time slot |
| `avail-book` | **June 21** + **15:30** |
| `book-step2` (dwell) | Book Step 2 **June 24** + wire default **16:30**, not playback **21/15:30** (step-back). Forward Play after Avail **preserves** handoff **21/15:30** so Step2 can demo-change. |
| `book-step2-date` / `select-book-time` | Same as dwell default on retreat. Forward: if primary **21/15:30** already selected → demo-change to **24/16:30**; else pick **21/15:30**. Never re-click the already-selected day/slot. |
| `book-step2-reserve` | Playback **June 21** + **15:30** (retreat baseline). Forward reserve uses whatever Step2 demo lane settled. |

Anomaly kinds (shell `playbackRetreatAnomalies.ts`):

| Kind | When it fires |
|------|----------------|
| `retreat-sync-no-op` | Beat has retreatable state + selection goal, but no `retreat-sync` interaction recorded within ~800ms of step back |
| `retreat-selection-mismatch` | Retreat sync ran (or beat has no sync requirement met) but DOM/date/time/overlay selection still matches the **forward-playback** state instead of the beat baseline |

Still covered separately: `transport-retreat-mismatch` (wrong tab/overlay), `transport-retreat-scroll-mismatch` (scroll anchor / book viewport goal).

**Not monitored yet:** traditional tab beats (`login-sign-in`, `book-location-pick`, confirmation/history) — `runTraditionalScript({ syncState: true })` is still a no-op; selection monitor does not apply.

### Control panel console log

Every studio control-panel interaction logs to the browser console with prefix **`[StudioControlPanel]`** — filter DevTools on that string.

Each entry includes `seq`, action id, detail (e.g. `canStepBack`, blocked reason), and a **snapshot** (beat, touchpoint, steps, overlay flags, transport caps).

| Action prefix | Control |
|---------------|---------|
| `transport:*` | Cassette deck — jump/start, step back/forward, play |
| `nav:*` | Hub, tabs, dots, prev/next screen, reset page |
| `studio:*` | Journey mode switch, project/persona/journey selects |
| `diagnostic:*` | Dismiss error overlay, copy report |

Blocked clicks (disabled buttons) log as **`BLOCKED`** via `console.warn`.

Dump recent history in the console: `dumpProtoControlPanelLog()` or inspect `window.__protoControlPanelLog`.

Implementation: `controlPanelLog.ts`, `StudioNavScenarioControls.tsx`, `StudioNavPanel.tsx`, `StudioNavStudioSelect.tsx`.

Key files: `journeyBeatDirector.ts`, `playbackDirectorAnomalies.ts`, `playbackDirectorMonitor.ts`, `usePlaybackDirectorGuard.ts`.


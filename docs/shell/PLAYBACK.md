# Journey playback

How the Proto Studio journey engine works, how to change scripts safely, and what to verify after every playback-related change.

See also: [SHELL.md](./SHELL.md) (architecture), [PROJECTS.md](./PROJECTS.md) (registering projects/personas).

---

## Architecture (30-second map)

```
journeys.ts          Beat timeline (declarative)
       ↓
useProtoJourneyPlayback   Shell engine — play, step, dwell, skip, beat-enter
       ↓
playback/index.ts    Dispatches script IDs → runners
       ↓
playback/*.ts        Imperative DOM/cursor actions (project-specific)
```

| Layer | Path | Owns |
|-------|------|------|
| **Beat definitions** | `projects/<id>/personas/<persona>/journeys.ts` | Timeline, labels, `protoTab`, script IDs |
| **Script ID types** | `app/orchestra/types.ts` | `HomeScriptId`, `TabScriptId`, `BookScriptId`, … |
| **Engine** | `app/orchestra/useProtoJourneyPlayback.ts` | Transport, beat advance, scenario handoff |
| **Scenario frames** | `app/nav/useProtoScenarioPlayback.ts` | Chat frame stepping (`screen-frames` beats) |
| **Dispatch** | `projects/<id>/playback/index.ts` | `runHomeScript`, `runTabScript`, `abortAll`, … |
| **Runners** | `projects/<id>/playback/*.ts` | DOM queries, demo cursor, timeouts |
| **Wire DOM** | `projects/<id>/wire/*` | Popups, scroll, sticky chrome — scripts depend on this |

The shell **never** imports project script runners directly. It calls `project.playback` from the registry.

---

## Beat kinds

| Kind | Meaning | Typical fields |
|------|---------|----------------|
| `tab-landing` | Navigate to a prototype tab; optional cursor script | `protoTab`, `tabScript`, `bookScript`, `homeScript`, `dwellMs` |
| `screen-frames` | Step through revealed frames on one screen | `protoTab`, `scenarioId` |
| `overlay` | Availability tool or other overlay script | `availScript`, `onEnter` |

**`protoTab`** is the **display tab number** (1–9), **not** `childIndex`. Map via `protoTabToIndex()` in the project's `screens/protoScreens.ts`.

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

Do **not** change `useProtoJourneyPlayback.ts` unless the transport behaviour itself needs to change.

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
| `projects/boots-pharmacy/screens/__tests__/protoScreens.test.ts` | Tab ↔ index mapping |
| `projects/boots-pharmacy/personas/.../__tests__/journeys.test.ts` | Beat IDs, script IDs, `protoTab` range |
| `app/shell/__tests__/protoPlaybackCursorAnomalies.test.ts` | Stale/orphaned cursor heuristics |
| `app/shell/__tests__/protoPlaybackCursorMonitor.test.ts` | Cursor guard timing after manual transport |

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
- [ ] Chat finale opens availability overlay; closing availability retreats scenario frames
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
    protoScreens.ts          # PROTO_SCREENS, protoTabToIndex
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

## Playback diagnostics

When a journey script fails, times out, or the studio stays on-air without advancing, playback stops automatically and a **Playback diagnostic** card appears (dismissible; does not replace the fatal error boundary).

| Layer | Trigger | What stops |
|-------|---------|------------|
| **Script failure** | `runAvailScript` / book / tab / home returns `false` | `stopJourneyPlay()` + diagnostic with beat + script id |

Pausing playback or aborting a script does **not** surface a diagnostic — orchestration suppresses failures when transport is already stopped or a script abort flag is set.
| **Script timeout** | Script promise exceeds 45s (`withPlaybackScriptTimeout`) | Same |
| **Scenario stall** | Chat prelude/finale exceeds 60s | `abortPlayback()` + diagnostic |
| **Stall watchdog** | On-air with no beat/frame/touchpoint change for 22s (`useProtoPlaybackGuard`) | `handlePlaybackDiagnostic` → stops journey + scenario |

Key files:

- `src/app/shell/protoPlaybackDiagnostic.ts` — error types, formatters, timeout helper
- `src/app/shell/useProtoPlaybackGuard.ts` — stall fingerprint watchdog
- `src/app/shell/ProtoPlaybackDiagnosticOverlay.tsx` — UI card

If the control room still shows pause/green diode while a popup is stuck, the watchdog should fire within ~22s and surface beat + avail step in technical details.

**Copy report** (playback diagnostic) is optimized for agents:

- `failureStep` — exact script checkpoint (e.g. `findButtonByText: "Book now" on PLP tile not found`)
- `source` — file + function (`traditional.ts → runPlpOpenPdp()`)
- `## studio` — project/persona, beat index, protoTab, childIndex, touchpoint, wire flags at failure time
- No duplicate `## raw` block, no userAgent noise

Scripts return `PlaybackScriptResult` (`{ ok: false, step }`) from project playback runners; registry in `playbackScriptRegistry.ts`.

**Scroll / camera guard** (`useProtoPlaybackScrollGuard`) stays active while journey mode is on (not only on-air) and reports `scroll-anomaly` diagnostics (stops playback) when it sees:

- `scroll-reversal` — direction flips 3+ times in 700ms (pin vs eased scroll fighting)
- `scroll-jump` — large instant jump while not in eased animation
- `scroll-stutter` — 3+ animation frames longer than 50ms
- `scroll-path-deviation` — eased scroll position diverges from expected curve
- `scroll-interrupted` / `scroll-competing` — animation cancelled, or **multiple eased scroll starts during one viewport director script** (e.g. reserve scroll + cursor travel scroll before click)
- `scroll-excessive-burst` — after a viewport director script ends (`select-book-time`, `reserve-appointment`), **more than one** additional eased scroll within ~1.4s (not a single long camera move to the next target). Tab/`protoTab` changes clear the burst watch (same as screen navigation grace).

The guard captures the script label when scripting **starts** (`noteDirectorScriptStart`, clears any prior burst watch) and arms post-script burst detection when `isPausingBeforeReveal` falls (`noteDirectorScriptEnd`). Intra-script stacked scrolls are caught on the **second** `onAnimationStart` while the script is still running — not after it ends.

Demo camera easing uses `computeDemoScrollDuration` (~720–1200ms depending on travel distance).

Tab/screen changes (e.g. PLP → PDP on Book now) get a **700ms navigation grace** — scroll resets during intentional screen swaps are not reported as jumps.

**Viewport alignment guard** (`useProtoPlaybackViewportGuard`) catches touchpoint advances where the status bar moves but the prototype scroll root does not follow on the **same screen**:

- `viewport-stall` — touchpoint/beat advanced but `scrollTop` moved less than ~48px and the beat focal element is not in view (~520ms after step/script end)
- **Book — time** director step: scroll to time grid **and** select 15:30 with demo cursor (one step). Beat-enter sync only ensures date + clears time — no scroll. Reserve scroll happens on the reserve beat only.
- **Popup touchpoints** (`popup:*` keys from `resolveStudioTouchpoint`) are excluded — modals/overlays do not use prototype scroll follow
- Screen-frame scenario beats are excluded (scenario engine owns scroll)

**Demo cursor guard** (`useProtoPlaybackCursorGuard`) runs while the prototype is open (not hub) and reports `cursor-anomaly` diagnostics when demo cursors leak in the DOM:

- **Journey mode (CJM):** one visible robo-cursor is **expected** between director steps (parked idle pose). `cursor-stale` and `cursor-orphaned` do **not** fire for `cursorCount=1` while journey mode is on.
- `cursor-stale` — outside journey mode (or multiple cursors): cursor still visible ~220ms after step/jump/play or script abort when transport is idle
- `cursor-orphaned` — `cursorCount > 1`, or a leftover cursor after beat/screen change when not in the single-cursor CJM contract (~480ms grace)

The guard does **not** fix cursor cleanup — it surfaces leaks for copy-report / supervisor review. In CJM, only **duplicate** cursors (`cursorCount > 1`) indicate a real problem.

**Director guard** (`useProtoPlaybackDirectorGuard`) reports `cursor-anomaly` using universal patterns (not hardcoded beat ids):

- `selection-without-director` — beat-enter sync applied a director-only outcome, skip click on a director step, or outcome applied without demo cursor (`DirectorOutcomeReport` from project scripts)
- `director-step-skipped` — step forward from a **dwell landing beat** (`isDwellLandingBeat`) did not start the next beat's director script within ~1.2s
- `director-step-no-effect` — manual step forward ran a director script but DOM goal was not met (`domGoalMet` on `DirectorOutcomeReport`, e.g. time not selected after `select-book-time`); or step-forward with `advanceAfter` landed on the next beat without running its director script (date → time empty landing)

When a playback diagnostic is showing, the studio transport diode glows **red** (`playbackErrorActive` on `ProtoNavScenarioControls`). When CJM reaches the last playlist frame (e.g. `11/11` for logged-in Traditional CJM with login beat skipped, `12/12` when login is in the playlist), the diode glows **blue** (`journeyAtEnd`) until the user steps back or leaves journey mode.

Studio step counter (`scenarioFrames` in diagnostics) uses the **live touchpoint playlist length** as the denominator and the max of beat-anchored + **current screen tab** playlist index as the numerator — so the counter can show appointment history (`10/11`) while the beat index is still on confirmation until the next transport step. With **CJM off**, the deck shows `-- / N` only (no numerator); `N` is always the current journey playlist length (e.g. `11` for logged-in Traditional, `25` for Agentic) and updates when you switch CJM mode.

**Transport no-op guard** — if manual step forward completes (~1.2s) without changing beat index, reports `transport-no-op` / `transport-step-no-op` (e.g. director script failed silently during manual CJM stepping). Manual script failures also surface via `script-failed` diagnostics (not only during auto-play).

**Transport contract guard** (`useProtoPlaybackTransportGuard`) catches studio deck invariants the DOM-focused monitors do not:

| Check | When it fires |
|-------|----------------|
| `playlist-frame-skip` | One manual step advances the raw touchpoint playlist by more than one frame (e.g. 3/12 → 5/12) |
| `touchpoint-ahead-of-beat` | Runtime touchpoint is **two or more** playlist frames ahead of the active beat (adjacent next frame is OK — e.g. PDP → login popup before beat advances) |
| `director-script-off-air` | `isScripting` is true while `isOnAir` is false — control panel should show on-air during director scripts |

Key files: `protoPlaybackTransportAnomalies.ts`, `useProtoPlaybackTransportGuard.ts`.

**Viewport guard** derives `expectsViewportFollow` from journey beat metadata (`beatExpectsViewportFollow` in `journeyBeatDirector.ts`): same `protoTab`, chained director scripts on one screen. No per-beat id registry.

Key files: `journeyBeatDirector.ts`, `protoPlaybackDirectorAnomalies.ts`, `protoPlaybackDirectorMonitor.ts`, `useProtoPlaybackDirectorGuard.ts`.


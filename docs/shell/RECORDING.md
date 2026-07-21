# Journey recording

Foundation + Studio shell UI for **record → export → replay → compile**. Events compile to the same beat/action model the playback engine uses.

**Product rail (Record / Play / Edit = guitar tabs):** [CJM_RECORD_PLAY_EDIT.md](./CJM_RECORD_PLAY_EDIT.md) — PO edits by swapping targets/timing/order, not rewriting director novels.

See also: [PLAYBACK.md](./PLAYBACK.md) (engine), [SHELL.md](./SHELL.md) (shell architecture).

---

## Agent testing overlay (MCP / `__protoRun*` / DevTools)

**Canonical host (HARD):** prove only on **`http://localhost:5173/`** (Auto-Rule **`fixed-localhost-reuse-tab`**). Chrome DevTools MCP: `list_pages` → `select_page` / `navigate_page` on the existing Studio tab — **never** `new_page` unless the page list is empty. Do not start a second Vite / invent ports.

While an agent drives localhost, Studio shows a **compact bottom-right status panel** (title + scrolling actions log). The page stays **fully visible** underneath — no lightbox / opaque modal.

**Click guard (active only):** an invisible full-viewport capture layer (`pointer-events: auto`, transparent) plus `#root { pointer-events: none }` blocks PO clicks into the concept UI. The BR panel itself stays interactive (log + **Dismiss**).

**Pre-arm (PO prepare):** MCP page probe / sanity / `withMcpTestSession` call `start()` first, show **AGENT TESTING — preparing…** with a ~2.5s countdown (configurable `preArmMs`), then run steps. BR panel must be visible before the first click.

**Sitrep settle (DONE):** on `stop()` (nest → 0), the panel does **not** vanish instantly. It enters **AGENT DONE — PASS** (green) or **AGENT DONE — FAIL** (red) when `result` is set (~9s default, configurable `settleMs` clamped 5–12s): big PASS/FAIL badge + **Auto-closes in Xs** countdown; click guard is **released**. After settle the panel is **hard-removed** from the DOM (not merely hidden); if `reload: true`, reload runs **after** settle. Manual **Dismiss** / `forceClear()` / `stop({ force: true })` clear **instantly** (timers + cursor + persist + ephemeral URL). A tiny recent-session stack (max 5, `sessionStorage`) may show under the log during settle — keep it simple, not a notification center product.

**Post-test reset (mandatory):** on `stop()` (nest → 0) and again immediately before any `reload`, Studio runs `resetStudioAfterAgentTest()`:

| Mode | Behavior |
|------|----------|
| **Default (page / sanity / probe)** | Stay on current `project` + `screen` (+ persona/mode). **Always strip `&modal=`** + ephemeral (`proof`, …). Close sticky popups via `studio-post-agent-reset` (never re-apply modal). **Do not** bounce to hub/onboarding. |
| **`resetToJourneyStart: true`** (CJM / journey smokes) | Journey key 1: agentic → `site-pilot`, traditional → `plp`; `cjm=on`; no modal — **never hub** |
| **`resetToHub: true`** (forbidden for smokes) | `screen=hub` — Hub nav / deep-link tests only; logs `hub-nav` |

Quinn proves stay-on-page: open PLP → `__studioRunMcpPageProbe()` → stop/reload → still `screen=plp`.  
Journey smokes pass `resetToJourneyStart: true` (never hub after Alarm abort / smoke end).

### Visible page probe (Quinn + Ben — screen ships)

```js
await window.__studioRunMcpPageProbe?.() // current ?screen=; reload defaults false
await window.__studioRunMcpPageProbe?.({ screenId: "plp" })
await window.__studioRunMcpPageProbe?.({ screenId: "pdp", reload: false })
// optional: { resetToHub: true } — only for journey clean slate
// optional one clean-tab reload after sitrep: { screenId: "plp", reload: true }
```

Drives the shared CJM/AIR **robo-cursor** (`simulateDemoPointerClick`) to each recipe target and logs **PASS** / **FAIL** on the AGENT TESTING panel. Prefer this over silent `evaluate_script` clicks for every React screen ship.

**HARD FAIL (Quinn + Finn — LESSONS 2026-07-19):** Before every probe interact, **scroll the target into view**. The agent testing overlay **must be visible on every probe step** — if absent/hidden → that step and the probe **FAIL**. Do not stamp PASS without overlay chrome the PO can see.

**Code gate (shipped):**
1. Probe start → `start` + **pre-arm** countdown (`preparing…`) + `overlay-arm` — BR panel must paint **before** first click.
2. Click/hover → `revealDemoTargetForAgent` + robo-cursor sync scroll on `.studio-scroll--prototype` (REC demo-click also `scroll: true`).
3. PLP `plp-below-fold-scroll` (`action: "reveal"`) → `button[data-studio-probe-below-fold="true"]` (last tile Quick View): park top → scroll into view with overlay still visible.
4. Re-arm mid-sitrep abandons settle **without** firing a deferred `reload` from the prior stop.
5. Probe `finally` → `stop({ result, settleMs })` → `resetStudioAfterAgentTest` (strip `&modal=`) → `scheduleAgentTestingOverlayEnsureClear(settle+1s)` — overlay DOM **absent** after settle; `forceClear()` always wired.
6. Auto-Rule **`agent-teardown-clean`**: after settle/forceClear, `__studioAssertAgentTeardownClean()` must PASS (no overlay root, no `modal` param, no dialog DOM). See [STUDIO_AUTO_RULES.md](../product/STUDIO_AUTO_RULES.md).

**PLP recipe includes** `overlay-arm`, `plp-search-icons` (icon end + single clear), `plp-filter-view-all`, `plp-filter-option-counters`, `plp-below-fold-scroll`, overlay-eyes. Source contracts: [PARITY_RATCHETS.md](../product/PARITY_RATCHETS.md).

**PDP recipe includes** `overlay-arm`, mount/leak + landmarks, Advantage, no invented loader, booster £150↔£75 (+ mint hover CSS), empty-heart hover CSS (not fuchsia), Book→`login` + overlay-eyes, Check avail→`choose-pharmacy` + overlay-eyes (**logged-out must land Find Pharmacy / `data-studio-avail-step="start"`**, not Choose Date), Vaccination crumb→PLP, PLP Book→PDP, `pdp-below-fold-scroll` (`data-studio-probe-below-fold` on compact `.pdp__content-title`), `url-screen=pdp`. Quinn MCP matrix **PASS** 2026-07-19 — [FE_AUDIT_PDP_MCP_2026-07-19.md](../projects/boots-pharmacy/audits/FE_AUDIT_PDP_MCP_2026-07-19.md). Open PDP first (`?screen=pdp`), logged-out for Book→login and Check avail→Find Pharmacy; empty chickenpox heart before heart step.

**Studio auth flag (SSoT):** `isStudioLoggedIn` / `setStudioLoggedIn` in `src/app/shell/studioAuthSession.ts`. Console: `window.__studioIsLoggedIn()` / `window.__studioSetLoggedIn(true|false)` (`__proto*` aliases). Header chrome + PDP CTAs + Availability hearts + journey skip hooks read this flag.

```js
window.__studioAgentTestingOverlay?.start("optional title") // prefer __studio*; __proto* alias OK
window.__studioAgentTestingOverlay?.touch() // arm if inactive; no nest bump; title stays "AGENT TESTING"
window.__studioAgentTestingOverlay?.log("clicked Book Step 2") // plain line (outcome inferred)
window.__studioAgentTestingOverlay?.logStep?.({ label: "step-forward · traditional-plp", beatId: "traditional-plp", outcome: "ok" })
window.__studioAgentTestingOverlay?.setTimeline?.(["tp:a", "tp:b"])
window.__studioAgentTestingOverlay?.ringAlarm?.("progressive bubbles broken") // ALARM_SEQUENCE_MISMATCH + live latch
window.__studioAgentTestingOverlay?.flagCursorWeird?.()
window.__studioAgentTestingOverlay?.flagScrollIssue?.("camera stuck mid-flight")
window.__studioAgentTestingTakeover // peek live PO signal (primary)
window.__studioConsumePoSignal?.() // consume + clear — poll each beat mid-smoke
window.__studioDownloadAgentTestingDump?.() // secondary dump (postmortem)
window.__studioAgentTestingOverlay?.stop() // nest-aware → DONE settle ~9s; no reload
window.__studioAgentTestingOverlay?.stop({ force: true }) // clear immediately
window.__studioAgentTestingOverlay?.forceClear() // Dismiss / stuck recovery — always works; hard-removes DOM
window.__studioAgentTestingOverlay?.stop({ reload: true, result: "pass" }) // green PASS sitrep ~9s, then reload
window.__studioAgentTestingOverlay?.stop({ settleMs: 9000, reload: true, result: "fail" }) // also saves dump
window.__studioAgentTestingOverlay?.isActive() // false during settle
```

**Mid-flight QA shell (2026-07-20 · PP-10):** code under `src/app/shell/agent-testing/`. Readable coalesced steps (beat/touchpoint/action), ok/amber/red rows, elapsed timer, control-panel sitrep, Alarm + Cursor + Scroll + Dump CTAs, script timeline strip, console `AGENT TEST START/END` separators. **Alarm** = sequence / expected-steps mismatch. **Primary mid-flight path:** live latch `__studioAgentTestingTakeover` / `__studioConsumePoSignal` (agents MUST poll each beat). **Dump secondary:** last-N JSON in `sessionStorage` (`studioAgentTestingDumps`) on FAIL/alarm/cursor/scroll — never every step. Track: [PAINPOINTS.md](../product/PAINPOINTS.md).

### Lifecycle (must not stick)

| Event | Behavior |
|-------|----------|
| `__studioRunMcpPageProbe` / sanity `finally` | Pre-arm → steps → `stop({ reload, result, settleMs })` — green/red sitrep **Auto-closes in Xs**, then hard-remove + optional reload; `scheduleEnsureClear(settle+1s)` failsafe |
| CJM/journey `__protoRun*` session `finally` | Pre-arm → `stop({ reload: true, resetToJourneyStart: true, result })` — sitrep countdown, journey key 1 URL, hard-clear, then reload |
| Mutating `__proto*` / `__studio*` helpers | Auto-`touch()` + coalesced helper step with sitrep context (read-only getters + `EnsureCleanStudio` / `AbortAll` skipped) |
| DevTools MCP clicks only | Agent **must** call `touch()` at session start (or rely on idle auto-stop) |
| `stop()` nest → 0 | Enter DONE settle (default **9s**); PASS/FAIL badge when `result` set; release click guard; stay-on-page reset (or hub if `resetToHub`); keep log visible |
| Settle timer fires | **Hard-remove** overlay DOM + dismiss robo-cursor; re-assert URL; if `reload: true`, deferred `location.reload()` (~120ms) |
| Idle timeout | Auto `stop()` → sitrep after **~45s** without log/touch (abandoned touch-only sessions) |
| Safety timeout | Auto `stop({ force: true })` after **3 min** (skips settle) |
| `beforeunload` | Clears active/settle state + sessionStorage persist |
| Page load / overlay install / stop | Strip ephemeral; stay on current screen unless `resetToHub` — never leave `?proof=*` |
| Page load | **Never** restores stale "testing" unless `sessionStorage.protoAgentTestingOverlayContinue=1` (default: never) |
| Dismiss / `forceClear()` / `stop({ force: true })` | Immediate hard-clear (no settle): timers, cursor, persist, ephemeral URL, DOM remove |
| Titles | Clean `AGENT TESTING` / `AGENT DONE — PASS\|FAIL` — never raw `__studio*` names |

**Crash-safe reload rule:** `__studioRunMcpPageProbe` defaults **`reload: false`**. Do not pass `reload: true` in a tight agent loop — at most one reload after sitrep when the PO wants a clean tab. If the tab misbehaves: refresh once, then `window.__studioAgentTestingOverlay?.forceClear()`.

Manual console experiments should omit reload (default `false`). Journey/`__protoRun*` MCP sessions may still reload once after sitrep. `__protoAbortAll` force-clears the overlay. Shell-only (`src/app/shell/agent-testing/` + PANEL CSS) — not Boots page CSS. Compat re-export: `src/app/shell/agentTestingOverlay.ts`.

**Deep links:** see [URL.md](./URL.md). Do not use `?proof=*` for agent status.

**Z-index:** the overlay root (`.studio-agent-testing-overlay`) paints at `z-index: 2147483646` on `document.body` — **above** Boots Availability / Choose Pharmacy (`.studio-avail-scrim` ~10200). Sitrep must remain readable with the avail tool open. **Studio nav** (`.studio-nav-panel-host` z `11000`) stays above concept lightboxes; the agent-testing capture hole clears the nav band so Step/Play/REC stay clickable while page clicks stay blocked. **Viewport frame** is a full-overlay inset ring (`__frame`) so nav-panel DS popups stay inside the frame; **REC live → orange** (`data-rec=live`); MCP CONTROL → gold when not recording.

---

## Blocking popups / lightboxes (popup eyes)

Recording, replay, and agent testing must treat open lightboxes as **navigable blocking UI**:

| Rule | Behavior |
|------|----------|
| Detect | Topmost registered overlay via `studioModalGuard.ts` — `REGISTERED_OVERLAY_MODAL_IDS` (`choose-pharmacy`, `quick-view`, `login`, `vaccine-picker`, `recipient-picker`) + `.studio-avail-scrim` + `[role=dialog][aria-modal=true]` |
| Do not click through | **GLOBAL HARD FAIL:** `simulateDemoPointerClick` / `__studioRunMcpPageProbe` / REC demo-click **refuse** targets under the topmost scrim (prefer a hit **inside** the modal). Felony gate enforces registry + guard wiring. |
| URL | Open any registered modal → `&modal=<id>` on the current `screen` (e.g. `choose-pharmacy`, `quick-view`); close / Back clears `modal`. Registry: `studioModalRegistry.ts` |
| Capture | Modal open/close updates `studioUrl` → `kind: "screen"` events (same channel as tab changes) |
| Replay | `applyStudioScreen` + `applyModal` re-opens/closes Availability |
| Quinn prove | Open Quick View → probe step `plp-overlay-eyes` PASS only when under-tile click is refused |

Book Step 1 **Continue** without a pharmacy opens Choose Pharmacy and must appear in the address bar before any under-page CTA replay.

---

## Prerequisite: page interactivity first

**Recording depends on page fidelity.** The REC deck and MCP helpers only capture what the user can actually do on the concept page.

| Ready to record when… | Not ready when… |
|----------------------|-----------------|
| Links/CTAs lead somewhere (or are honestly inert) | Buttons look live but do nothing |
| On-page controls work (filters, accordions, forms, modals, steppers) | Scenario needs a control that is static mock only |
| Happy path for the hypothesis is playable | Page is visual-only strip with no interaction |

**Agent obligation:** build anticipated interactivity from page context (and later CJM deck) **before** expecting the Product Owner to record. Prefer shared React + UXDS behavior kits (`src/uxds/interactions/`) — do not grow one-off imperative scripts per screen.

Full doctrine: [../product/INTERACTION_FIDELITY.md](../product/INTERACTION_FIDELITY.md).

---

## Architecture

```
User / MCP transport + demo cursor
       ↓
playbackInteractionContext   (existing flight recorder)
       ↓
recordingCapture             (bridge + touchpoint hook in App.tsx)
       ↓
recordingSession             (in-memory session + JSON export)
       ↓
recordingReplay              (v2 transport / screen / demo-click / wire / director)
       ↓
compileRecordingToBeatTimeline → compileRecordingToJourney
       ↓
journeyRuntimeStore          (ephemeral catalog overlay — play in CJM)
```

| Module | Path | Owns |
|--------|------|------|
| **Types** | `app/recording/recordingTypes.ts` | Event union, session shape, replay options |
| **Session** | `app/recording/recordingSession.ts` | start/stop/pause, append, serialize, last session |
| **Capture** | `app/recording/recordingCapture.ts` | Snapshot provider, interaction bridge, touchpoint |
| **Replay** | `app/recording/recordingReplay.ts` | `replayRecordingSession`, `compileRecordingToBeatTimeline` |
| **Compile** | `app/recording/recordingCompile.ts` | `compileRecordingToJourney` / `saveRecordingAsJourney` → runtime catalog |
| **Script apply** | `app/recording/recordingScriptApply.ts` | Shared `applyRecordingProjectScript` (director + retreat-sync) |
| **App bridge** | `app/recording/useRecordingReplayBridge.ts` | Replay options + human click install + MCP register |
| **MCP** | `app/recording/recordingMcpHelpers.ts` | `__studioStartRecording` (legacy `__proto*`), **`__studioArmRecCapture`**, **`__studioAssertRecLive`**, **`__studioRunRecNewCjmProve`** |
| **REC arm** | `app/recording/recArmCapture.ts` | PO sequence: CJM off → REC ON → CREATE NEW → ● Start; truth latch |
| **REC new CJM prove** | `app/recording/recNewCjmProve.ts` | Robustness = **always mint new `rec-*`** then Play that id |
| **UI** | `app/nav/StudioNavRecordingControls.tsx` | Studio shell REC deck (same session APIs) |

---

## Studio UI

Cassette deck mode toggles (labels match STEPS type; pipe bars match zoom delimiters):

| Control | Chrome | Behavior |
|---------|--------|----------|
| **REC** | Always-on `REC` mode label + muted/red switch; `STEPS: N` event count only in Rec mode | Playback XOR recording panel; count live from `recordingSession` |
| **CJM** | `\| CJM [switch] \|` pipes + amber when on | Journey mode (browse vs cassette transport) |

**Playback | Rec** (mutually exclusive panels):

- **Left (muted, same as CJM-off) / REC off** — playback mode: `REC [switch] | CJM [switch] | STEPS: N` (journey) — shared `.studio-mode-switch` off chrome; no recording counter. Recording event counter and REC transport are unmounted.
- **Right (red) / REC on** — rec mode: `REC [switch] STEPS: N` (recording events) + REC deck. Journey STEPS / cassette transport are unmounted.
- **REC ⊗ CJM:** when CJM is ON, REC switch is `disabled` (cannot enter Rec). When REC is ON, CJM is off/disabled. AIR/play still locks both. Gate: `src/app/nav/studioModeXor.ts`.
- **Transition:** `framer-motion` `AnimatePresence` (`mode="wait"`) in `StudioNavScenarioControls` — `.studio-nav-scenario__panel-swap` crossfades Playback ↔ Rec (0.34s, shared `studioMotion` timings). XOR preserved: only one interactive panel. Touchpoint label width also uses `framer-motion` (same duration).

Leaving Rec while a capture is live **pauses** the session (does not stop/destroy it).

| Control | Action |
|---------|--------|
| ● | Start recording — **CREATE NEW CJM path only** (hidden for saved CJMs) |
| ❚❚ / ► | Pause / resume — CREATE NEW / live NEW recording only |
| ■ | Stop — CREATE NEW / live NEW recording only |
| ✕ | Discard stopped session — CREATE NEW path only (not a saved CJM) |
| ↓ | **Download JSON** — CREATE NEW: `.recording.json` (disabled while live). **Saved CJM: enabled** → `.journey.json` for the selected journey |
| ↑ | Import — **CREATE NEW CJM idle only**; `.recording.json` **or** `.journey.json` **with embedded `recording`** (saved CJM Download). Stages session → unlocks Download / Replay / **+**. Hidden for saved CJMs / while live |
| ↺ | Replay — **CREATE NEW path only** (hidden for saved CJMs) |
| + | **Add as CJM** — CREATE NEW path only; disabled while live |

CJM picker: first option **CREATE NEW CJM**, separator, then built-ins + recorded. Idle default stays saved journey. Picker **disabled while REC live**. Saved CJM → panel shows **Download only** (enabled journey export); no Start…+/Import/Replay; REC **STEPS** counter hidden until CREATE NEW / live.

| 🗑 | **Delete recorded CJM** (REC mode only) — trash glyph (PLP reset filters); confirm popup DELETE/CANCEL. Built-in Agentic/Traditional hidden. Falls back to matching built-in path after delete. |
| LED | Same playback diode chrome — **blinks red** while recording live; dim solid red when paused; idle graphite when REC ready / REC off restores green on-air |

**Illegal / unallowed combinations (control-panel state machine):**

| State | Rule |
|-------|------|
| CJM on + REC on | **Forbidden** — XOR (`studioModeXor`); REC switch disabled when CJM on; CJM switch hidden/disabled when REC on |
| REC live + editable CJM picker | **Forbidden** — picker locked (“CJM picker locked while recording”) |
| REC live + Download / + / Import | **Forbidden** — Download & + disabled; Import **hidden** while live |
| Saved CJM + Start/Pause/Stop/X/+/Import/Replay | **Forbidden** — deck hidden; Download only |
| Saved built-in + trash | **Forbidden** — trash only for `rec-*` / imported recorded |
| CREATE NEW idle + Replay with no session | Replay disabled (not hidden) |
| REC STEPS while saved CJM selected | **Hidden** — STEPS counter only on CREATE NEW / live |
| Playback transport while REC mode | **Hidden** — panel XOR (cassette vs journey STEPS/Play) |
| **CREATE NEW selected + REC mode OFF** | **Forbidden (auto-correct)** — picking CREATE NEW **turns REC ON**; turning REC OFF while CREATE NEW is selected **snaps** the picker to the first saved CJM (see below). Never leave CREATE NEW gold outside Rec. |
| CREATE NEW + CJM on | **Forbidden** — entering Rec (incl. via CREATE NEW) forces CJM off |
| Gold CREATE NEW while Rec deck closed | **Forbidden** — live/paused session alone does **not** keep CREATE NEW selected when Rec is off |

**CREATE NEW ↔ REC guiding (PO):**

1. Select **CREATE NEW CJM** → REC mode **ON** automatically (create/record surface).
2. Turn **REC OFF** while CREATE NEW is selected → snap away from CREATE NEW.
3. **First-saved snap rule** (`resolveFirstSavedCjmModeId`): prefer the **last non–CREATE NEW** catalog selection still present; else **`modes[0]`** (menu order after the CREATE NEW separator — typically Agentic CJM, then Traditional, then recorded).

**Future agent playbook:** [AGENTIC_RECORDING.md](./AGENTIC_RECORDING.md) — derive CJM from persona artifact links, record on available screens, name missing **UX CONCEPT(s)** (not shipped as full automation today).

### Product model — REC start + steps

1. **● Start** seeds the **current tab/screen** as event 1 (`kind: "screen"`) — journey starting point. CJM picker selects **CREATE NEW CJM** (gold) while the session is live/paused — picker locked; prior selection restored on Stop/purge. Idle default stays Agentic/Traditional/last saved; **CREATE NEW CJM** is the first dropdown option (separator below), not the default.
2. Later on-page interactions (human clicks → `demo-click`, typed-text, navigations → `screen`) append as further events. Scroll is stored as a **replay target** only. Each carries `atMs`; Play holds **≥4s** per major step (see pacing below). Compile v2 stamps `dwellMs: 4000` on `recordedClick` beats so CJM Play matches that floor.
3. REC **STEPS** counter = counted events **excluding `scroll`** (clicks/screens/… only) — UI re-renders on every append.

### Auto-play pacing (REC ↺)

**Was missing (pre-v0.0.50):** bridge/MCP forced `stepDelayMs: 200` (and processor defaulted ~400ms) — Play was an immediate burst. Capture `atMs` / `dwell` existed but were not enforced as a ≥4s floor.

**Now:** `replayRecordingSession` defaults to **`RECORDING_REPLAY_MIN_STEP_HOLD_MS = 4000`**. Major steps (screen / transport / demo-click / wire / director / beat-enter / typed-text / dwell) hold **max(4s, capture gap, dwellMs)**. Scroll uses **engine eased** `animateScrollElementIntoView` (same as CJM) plus a short settle (~280ms) — not a pixel snap / frame burst. Opt out with `stepDelayMs: 0` (tests only).

UI and MCP share `recordingSession` + `replayRecordingSession` — no second session store.

---

## Event types

| Kind | Captured from | Replay |
|------|---------------|--------|
| `transport` | Step/Play/Jump via `notePlaybackTransport` | Yes |
| `touchpoint` | Touchpoint key change in `App.tsx` | Boundary marker only |
| `screen` | Address-bar / tab screen change (`useStudioUrlSync`) | Yes — `applyStudioScreen` via `screenId` / `studioUrl` |
| `demo-click` | Robo-cursor via `notePlaybackDemoClick` **or** trusted human REC clicks | Yes — `resolvePlaybackSelectorChain` → `simulateDemoPointerClick` |
| `director-script` | Journey director via `notePlaybackDirectorScript` | Yes — `applyRecordingProjectScript` → `run*Script` by channel |
| `beat-enter` | Beat onEnter via `notePlaybackBeatEnter` | Yes — known `JourneyBeatActionId` → `runBeatAction`; `sync-<bookScript>` → book script with `syncState` |
| `wire-intent` | Retreat sync / `captureWireIntent` / beat actions | Yes — known `JourneyBeatActionId` via `runBeatAction`; `retreat-sync` → script runner with `syncState` when `scriptId` resolves |
| `studio` | Journey/orchestra mode changes (manual API) | No |
| `scroll` | Debounced active scroll host while REC — **targets only** (`selectorChain` / `anchorSelector`); no `scrollTop` written | Yes — **engine** eased scroll-to-target (`animateScrollElementIntoView` / `scrollCameraToTarget`). **Legacy `scrollTop`-only events are refused** (target-only forward) |
| `typed-text` | Debounced trusted `input`/`change` on text-like fields with selector chain | Yes — set value + dispatch `input`/`change` (modal eyes) |
| `dwell` | Manual API or compiled pauses | Yes (delay) |

Each event may include a `snapshot` (`PlaybackStudioSnapshot` + journey/orchestra fields), including `screenId` and `studioUrl` when the bar is synced.

### Screen replay restore (v1.1)

Capture already appends `kind: "screen"` when the address bar / tab changes. On **↺ Replay** (UI or `__protoReplayRecording`):

1. Each `screen` event calls `applyScreen` → shared `applyStudioScreen` (`src/app/shell/studioUrl.ts`).
2. That helper is the **same path** as refresh deep-link + `popstate` (`useStudioUrlSync`).
3. Prefer `studioUrl` when present; else `screenId` (+ `projectId`). Unknown ids error; missing `applyScreen` → unsupported.

Boots book steps (`book-step-1` … `book-step-3`) and mapped screens (`home`, `chat`, …, `hub`) restore in event order before/alongside transport.

### Demo-click + human REC click replay (v2)

Capture stores a **selector chain** (`data-studio-action` / `data-studio-*` / `data-name`). Sources:

| Source | Path |
|--------|------|
| Robo-cursor | `notePlaybackDemoClick` → `notifyRecordingDemoClick` |
| Human REC | Trusted `click` (capture phase) via `ensureRecordingHumanClickCapture` — skips Studio chrome; ignores `isTrusted === false` so demo `.click()` does not double-capture |

On **↺ Replay**:

1. Each `demo-click` resolves via `resolvePlaybackSelectorChain` (nested outer→inner, then most-specific unique fallback).
2. Hit calls shared `simulateDemoPointerClick` (same path as journey director CTAs).
3. Prefer stable `data-studio-action` on book CTAs (`book-step-1-continue`, `book-step-2-reserve`, …).

### Director-script replay (v2)

When `applyDirectorScript` is wired (App / MCP):

1. Capture stores `scriptId` + `scriptKind` (`home` / `avail` / `book` / `tab`).
2. Replay calls shared `applyRecordingProjectScript` → project `runHomeScript` / `runAvailScript` / `runBookScript` / `runTabScript`.
3. If `scriptKind` is missing, kind is inferred via `resolvePlaybackScriptKind(scriptId)`.

### Wire-intent replay (v2)

When `applyWireIntent` is wired (App / MCP):

| `intentId` | Replay |
|------------|--------|
| `open-availability-start` / `open-availability-date-chat` / `close-availability` / `apply-demo-location` | Yes — `projectPlayback.runBeatAction` |
| `retreat-sync` | Yes when payload has resolvable `scriptId` — same script runner with `retreatScriptOptions` (`syncState`) |
| Other strings | Skipped until a beat-action / script bridge exists |

---

## Start / stop via MCP

**HARD:** `startRecording` / `__studioStartRecording` **throw** unless nav REC switch is ON (`aria-label="REC on"` + `aria-checked="true"`). Use `__studioArmRecCapture()` (clicks REC switch → Orchestra CREATE NEW → ● Start) — never silent session while playback chrome shows.

**ALWAYS CLEAR is code law** (not a reminder): `__studioArmRecCapture`, `__studioRunRecNewCjmProve`, and `__studioRunFullPlayProve` call `requireFreshQaSession()` first — `forceClear` + fresh `start` with **no skip flag**. If arm is bypassed, `startRecording` also ensures QA overlay is active (or forceClears + starts).

**Human pace is code law:** agent REC / `__studioRunRecNewCjmProve` use `REC_USER_PACE_MS` (`src/app/recording/recUserPace.ts`) — read after screen change, before CTA, after click, scroll-stop ≥2.4s. Not optional.

**Modal `&modal=` is code law:** if URL has `modal=choose-pharmacy` (or any blocking modal), drain before the next beat (`recModalDrain.ts` / `afterRecClickDrainModal`). Book Step 1 Continue with no location opens choose-pharmacy — pick a pharmacy (`avail-choose-location`); never rush past. REC captures modal open; Play stamps `recordedClick.modalId` and re-opens before click.

```javascript
window.__studioEnsureCleanStudio?.()
window.__studioStartRecording?.()          // FAILS if REC switch off
await window.__studioArmRecCapture?.()     // ALWAYS CLEAR QA → REC switch → CREATE NEW → ● Start
window.__studioAssertRecLive?.()           // { ok, recMode, recording, … } — FAIL if switch or session missing
await window.__studioRunRecNewCjmProve?.({ experience: "traditional" })
// REC robustness = human-paced NEW CJM + modal drain → Play that journeyId
```

Import a saved session:

```javascript
window.__studioImportRecording?.(jsonString)
```

Prefer `__studio*`; `__proto*` aliases remain. Export / replay / compile fall back to the **last stopped or imported** session when nothing is live. **`__studioGetRecording()`** returns the **active** session while live, otherwise the **last staged** session (Stop / Import) — same resolve as Export/Replay.

### Compile → journeys (PO path) — **Add as CJM**

1. Record (or ↑ import a `.recording.json` **or** a saved `.journey.json` that embeds `recording`). Use **Download JSON** on CREATE NEW for the raw recording file; saved-CJM Download is `.journey.json` (often with embedded REC). After Import, **+** unlocks so you can add the staged session to the project.
2. Stop ■ then **+** → enter a **CJM title** in the Studio nav popup → **Add** (or `__studioSaveRecordingAsJourney(session, { label })`).
3. Studio mints a free id (`rec-trad-…` / `rec-agentic-…`), uses the title as journey `label` + picker text, merges into `journeyRuntimeStore`, persists in **localStorage** for that project+persona, and selects it in the nav CJM picker. **Recorded CJM titles are product-facing** (e.g. `Sarah · PLP→Book · HH:MM`) — never agent-test codenames (`REC prove`, `QA REC`, …).
4. Turn **CJM** on and play/step — best-effort beats from the recording.
5. Optional: export journey JSON via MCP `saved.json` / `__studioExportJourneyBundle()` — not conflated with REC Download.
6. Clear runtime overlay: `__studioClearImportedJourneys()` (localStorage recorded CJMs re-hydrate on next load unless cleared from storage).

**Mapped into beats (compile v2):** touchpoint segments (or screen/director fallback), **usable `demo-click` → `recordedClick`** (SF/Play drives `simulateDemoPointerClick`), preceding `scroll` → **first-class `kind: "camera"` beat** (dwell + target) then the click beat (legacy `cameraSelectorChain` on the click is stripped when the camera beat is emitted), **`scroll-stop` (≥ ~2s settle, jiggles ignored) → `kind: "camera"` pause wait** bound to scroll host / optional next target (`camera.dwellMs` = stop duration), `director-script` → home/avail/book/tab scripts, known `wire-intent` / `beat-enter` → `onEnter`, `dwell` → `dwellMs`, snapshot `protoTab` / `currentTabIndex`. Click→screen within ~1s coalesces (no hollow nav beat). Consecutive same-screen URL/modal churn does not mint `chat-2` / `chat-3`.

**Scroll-stop → camera (REC):** while recording, the engine watches the prototype scroll host. Meaningful Δpx arms a settle timer (`SCROLL_STOP_DWELL_MS` ≈ 2000, tunable). Small jiggles / short ups-downs are not activity. On settle, capture `kind: "scroll-stop"` (duration + target). **One wait per settle** — detector re-arm requires leaving the settle band; compile merges consecutive stops. Compile emits the same Play camera beat (dwell → eased scroll; step-back reverses). Live REC hard to prove → unit + compile path is the gate.

**Touchpoint labels:** REC stamps **short human labels** (visible text / aria-label / action slug) on `demo-click` → beat `label` — not long selectors. STEPS / Play nav must stay concise.

**Persisted with Add as CJM:** the **full `.recording.json` session** is stored beside the compiled journey in localStorage (`studio-recorded-cjm:…` v2 `recordings` map) and embedded in Download `.journey.json` when available. Never discard the event log on compile (8.56 failure mode).

**Not compiled (honest gaps — use REC ↺ replay for fidelity):** `demo-click` with unusable selectors (`#root` / empty — fix with `data-studio-action` on product CTAs), `typed-text`, unknown wire intents / unknown beat-enter ids, bare `scroll` without a following click **and** without `scroll-stop`. Built-in persona `journeys.ts` is not auto-edited.

### Hit targets (capture)

Avail overlay + book-critical CTAs must expose stable `data-studio-action` (and `data-studio-avail-date` / `data-studio-avail-time` / `data-studio-avail-store` where needed) so REC never stores `#root` as the click leaf. Prefer climbing to the nearest studio action when the pointer hits a glyph inside the CTA.

**Browse vs CJM beat stamp:** While REC is on and CJM is **off**, demo-clicks omit `beatId` / `touchpointKey` from the parked journey snapshot (those fields only apply when `journeyMode`). Prevents STEPS/compile lying as `agentic-home` on book/PLP clicks.

### PLAYBACK_DIAG for REC

Recording/capture/compile/replay emit lean `[PLAYBACK_DIAG]` kinds (same ring buffer as CJM):

| kind | When |
|------|------|
| `rec-capture` | demo-click stored / weak selector / chrome reject / scroll target |
| `rec-compile` | `compileRecordingToJourney` summary (beat + click counts, gaps) |
| `rec-replay` | ↺ major steps (screen / click / scroll / typed-text / transport) |

```js
window.__studioPlaybackDiagClear?.()
// … REC … Stop … Add as CJM / Replay …
window.__studioPlaybackDiag?.().rec
// → { capture, compile, replay, lastCapture, lastCompile, lastReplay }
```

Full field contract: [PLAYBACK_DIAG.md](./PLAYBACK_DIAG.md).

### Beat-enter + scroll + typed-text replay (v3)

| Kind | Capture | Replay |
|------|---------|--------|
| `beat-enter` | Flight recorder (`notePlaybackBeatEnter`) | `applyBeatEnter` → `runBeatAction` or `sync-*` book script |
| `scroll` | Debounced scroll → **`selectorChain` / `anchorSelector`** (viewport target); `scrollTop` not persisted | `applyScroll` → engine `animateScrollElementIntoView`; **scrollTop-only refused** |
| `typed-text` | Debounced trusted text field `input`/`change` (needs selector chain) | `applyTypedText` → native value + events |

Stable field selectors: `data-studio-action="avail-search-query"` / `agentic-home-query` / `agentic-chat-query` / `avail-notify-email`. Password / checkbox / radio / file / chrome skipped.

---

## v3 vs future

| v3 (now) | Later |
|----------|-------|
| In-memory session + recording JSON download + **Add as CJM** (title + localStorage **journey + raw recording**) | Auto-commit into persona `journeys.ts` / `data/journeys/` |
| Studio REC deck + MCP helpers | Nested scroll containers beyond prototype root |
| Transport + screen + dwell + demo-click + human REC click + **beat-enter + scroll-to-target + typed-text** | Drag / contenteditable / rich form widgets |
| Director-script + retreat-sync via shared script apply | — |
| **Compile v2 → free CJM id** with **playable `recordedClick` beats** (`rec-…`) | typed-text → beats; edit `journeys.ts` source automatically |

---

## Recordable DOM conventions

Prefer stable selectors on interactive targets:

- `data-name="…"` — primary wire target (Figma export names)
- `data-studio-avail-store="…"` — availability store rows
- `data-studio-action="…"` — **required** on product CTAs for REC → CJM (avail Choose/Continue/Book, near-me, book continue/reserve, etc.)
- `data-studio-avail-date` / `data-studio-avail-time` — Availability Tool calendar + time cells
- `data-studio-cal-kind` / `data-studio-cal-month` / `data-studio-cal-value` — Book Step 2 date/time cells (unique REC targets; same attrs the book director queries)
- `data-studio-beat="…"` — beat-scoped controls (future)

Demo clicks store a **selector chain** (nearest `data-studio-*` / `data-name` ancestors) for future replay targeting.

---

## Tests

```bash
npm test -- src/app/recording
```

Run full suite after capture/replay changes: `npm test`.

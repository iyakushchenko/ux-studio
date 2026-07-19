# Journey recording

Foundation + Studio shell UI for **record → export → replay → compile**. Events compile to the same beat/action model the playback engine uses.

See also: [PLAYBACK.md](./PLAYBACK.md) (engine), [SHELL.md](./SHELL.md) (shell architecture).

---

## Agent testing overlay (MCP / `__protoRun*` / DevTools)

While an agent drives localhost, Studio shows a **compact bottom-right status panel** (title + scrolling actions log). The page stays **fully visible** underneath — no lightbox / opaque modal.

**Click guard (active only):** an invisible full-viewport capture layer (`pointer-events: auto`, transparent) plus `#root { pointer-events: none }` blocks PO clicks into the concept UI. The BR panel itself stays interactive (log + **Dismiss**).

**Sitrep settle (DONE):** on `stop()` (nest → 0), the panel does **not** vanish instantly. It enters a short **AGENT DONE — SITREP** state (~5s, configurable `settleMs` clamped 4–6s): final status + last log lines stay readable; click guard is **released** so the PO can use the page while reading. After the settle delay the panel clears; if `reload: true`, reload runs **after** settle (not during). Manual **Dismiss** / `stop({ force: true })` still clears **instantly**. A tiny recent-session stack (max 5, `sessionStorage`) may show under the log during settle — keep it simple, not a notification center product.

**Post-test reset (mandatory):** on `stop()` (nest → 0) and again immediately before any `reload`, Studio runs `resetStudioAfterAgentTest()`:

| Mode | Behavior |
|------|----------|
| **Default (page / sanity / probe)** | Stay on current `project` + `screen` (+ persona/mode/modal). Strip only ephemeral (`proof`, …). Close sticky popups via `studio-post-agent-reset`. **Do not** bounce to hub/onboarding. |
| **`resetToHub: true`** (CJM / journey smokes) | `?project=<current\|boots-pharmacy>&screen=hub` — no modal |

Quinn proves stay-on-page: open PLP → `__studioRunMcpPageProbe()` → stop/reload → still `screen=plp`.  
Journey proves hub: retreat/robot-qa sessions pass `resetToHub: true`.

### Visible page probe (Quinn + Ben — screen ships)

```js
await window.__studioRunMcpPageProbe?.() // current ?screen=
await window.__studioRunMcpPageProbe?.({ screenId: "plp" })
// optional: { resetToHub: true } — only for journey clean slate
```

Drives the shared CJM/AIR **robo-cursor** (`simulateDemoPointerClick`) to each recipe target and logs **PASS** / **FAIL** on the AGENT TESTING panel. Prefer this over silent `evaluate_script` clicks for every React screen ship.

```js
window.__studioAgentTestingOverlay?.start("optional title") // prefer __studio*; __proto* alias OK
window.__studioAgentTestingOverlay?.touch() // arm if inactive; no nest bump; title stays "AGENT TESTING"
window.__studioAgentTestingOverlay?.log("clicked Book Step 2")
window.__studioAgentTestingOverlay?.stop() // nest-aware → DONE settle ~5s; no reload
window.__studioAgentTestingOverlay?.stop({ force: true }) // clear immediately
window.__studioAgentTestingOverlay?.forceClear() // Dismiss / stuck recovery — always works
window.__studioAgentTestingOverlay?.stop({ reload: true }) // settle ~5s, then location.reload()
window.__studioAgentTestingOverlay?.stop({ settleMs: 5000, reload: true })
window.__studioAgentTestingOverlay?.isActive() // false during settle
```

### Lifecycle (must not stick)

| Event | Behavior |
|-------|----------|
| `__studioRunMcpPageProbe` / sanity `finally` | `stop({ reload: true })` — sitrep ~5s, **stay on screen**, then reload |
| CJM/journey `__protoRun*` session `finally` | `stop({ reload: true, resetToHub: true })` — sitrep ~5s, hub URL, then reload |
| Mutating `__proto*` / `__studio*` helpers | Auto-`touch()` + log helper name (read-only getters + `EnsureCleanStudio` / `AbortAll` skipped) |
| DevTools MCP clicks only | Agent **must** call `touch()` at session start (or rely on idle auto-stop) |
| `stop()` nest → 0 | Enter DONE/SITREP settle (default **5s**); release click guard; stay-on-page reset (or hub if `resetToHub`); keep log visible |
| Settle timer fires | Hide panel; re-assert URL; if `reload: true`, deferred `location.reload()` (~120ms) after URL strip |
| Idle timeout | Auto `stop()` → sitrep after **~45s** without log/touch (abandoned touch-only sessions) |
| Safety timeout | Auto `stop({ force: true })` after **3 min** (skips settle) |
| `beforeunload` | Clears active/settle state + sessionStorage persist |
| Page load / overlay install / stop | Strip ephemeral; stay on current screen unless `resetToHub` — never leave `?proof=*` |
| Page load | **Never** restores stale "testing" unless `sessionStorage.protoAgentTestingOverlayContinue=1` (default: never) |
| Dismiss / `forceClear()` / `stop({ force: true })` | Immediate clear (no settle) + clean slate; no reload unless `reload: true` |
| Titles | Always clean `AGENT TESTING` / `AGENT DONE — SITREP` — never raw `__studio*` names |

Manual console experiments should omit reload (default `false`). Auto-shown for `__protoRun*` MCP sessions and any mutating `__proto*` helper. `__protoAbortAll` force-clears it. Shell-only (`src/app/shell/agentTestingOverlay.ts` + PANEL CSS) — not Boots page CSS.

**Deep links:** see [URL.md](./URL.md). Do not use `?proof=*` for agent status.

**Z-index:** the overlay root (`.studio-agent-testing-overlay`) paints at `z-index: 2147483646` on `document.body` — **above** Boots Availability / Choose Pharmacy (`.studio-avail-scrim` ~10200). Sitrep must remain readable with the avail tool open.

---

## Blocking popups / lightboxes (popup eyes)

Recording, replay, and agent testing must treat open lightboxes as **navigable blocking UI**:

| Rule | Behavior |
|------|----------|
| Detect | Topmost registered overlay via `studioModalGuard.ts` — `REGISTERED_OVERLAY_MODAL_IDS` (`choose-pharmacy`, `quick-view`, `login`, `vaccine-picker`, `recipient-picker`) + `.studio-avail-scrim` + `[role=dialog][aria-modal=true]` |
| Do not click through | **GLOBAL HARD FAIL:** `simulateDemoPointerClick` / `__studioRunMcpPageProbe` / REC demo-click **refuse** targets under the topmost scrim (prefer a hit **inside** the modal). Felony gate enforces registry + guard wiring. |
| URL | Open Choose Pharmacy → `&modal=choose-pharmacy` on the current `screen`; close / Back clears `modal` |
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
| **MCP** | `app/recording/recordingMcpHelpers.ts` | `window.__studioStartRecording` (legacy `__protoStartRecording` alias) etc. |
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
| ● | Start recording (current project / persona / journey) |
| ❚❚ / ► | Pause / resume |
| ■ | Stop — keeps session for export / replay |
| ↓ | Download `.recording.json` |
| ↑ | Import a saved `.recording.json` |
| ↺ | Replay last stopped or imported session (v3: transport + screen + demo/human-click + wire-intent + director-script + beat-enter + scroll + typed-text) |
| ⌁ (save) | **Save as journey** — compile → replace current CJM slot in the runtime catalog + download `journey-*.json` |

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
| `scroll` | Debounced prototype root scroll while REC active (`captureScroll`) | Yes — restore `scrollTop` on `.studio-scroll--prototype` (or `anchorSelector` → `scrollIntoView`) |
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

```javascript
window.__studioEnsureCleanStudio?.()
window.__studioStartRecording?.()          // uses current project/persona/journey
window.__studioTriggerTransport?.('step-forward')
// … navigate freely …
window.__studioStopRecording?.()
window.__studioExportRecording?.()         // JSON string — copy to file
window.__studioCompileRecording?.()        // beat segments from touchpoint markers
window.__studioCompileRecordingToJourney?.() // JourneyDefinition (no catalog write)
window.__studioSaveRecordingAsJourney?.()  // compile + apply into runtime catalog
```

Import a saved session:

```javascript
window.__studioImportRecording?.(jsonString)
```

Prefer `__studio*`; `__proto*` aliases remain. Export / replay / compile fall back to the **last stopped or imported** session when nothing is live.

### Compile → journeys (PO path)

1. Record (or ↑ import a `.recording.json`).
2. Stop ■ then **Save as journey** (or `__studioSaveRecordingAsJourney()`).
3. Studio merges the compiled journey over the matching CJM slot (`agentic-cjm` / `traditional-cjm`) via `journeyRuntimeStore` — same seam as `__studioApplyJourney` / journey bundle import.
4. Turn **CJM** on and play/step — beats come from the recording (label ends with `(recorded)`).
5. Optional: keep the downloaded `journey-*.json` and re-apply later with `__studioApplyJourney(json)`.
6. Clear overlay: `__studioClearImportedJourneys()`.

**Mapped into beats:** touchpoint segments (or screen/director fallback), `director-script` → home/avail/book/tab scripts, known `wire-intent` / `beat-enter` → `onEnter`, `dwell` → `dwellMs`, snapshot `protoTab` / `currentTabIndex`.

**Not compiled (honest gaps — use REC ↺ replay):** `scroll`, `typed-text`, unknown wire intents / unknown beat-enter ids, writing durable `journeys.ts` source (runtime overlay only).

### Beat-enter + scroll + typed-text replay (v3)

| Kind | Capture | Replay |
|------|---------|--------|
| `beat-enter` | Flight recorder (`notePlaybackBeatEnter`) | `applyBeatEnter` → `runBeatAction` or `sync-*` book script |
| `scroll` | Debounced scroll on `.studio-scroll--prototype` while REC | `applyScroll` → `scrollTop` / optional anchor |
| `typed-text` | Debounced trusted text field `input`/`change` (needs selector chain) | `applyTypedText` → native value + events |

Stable field selectors: `data-studio-action="avail-search-query"` / `agentic-home-query` / `agentic-chat-query` / `avail-notify-email`. Password / checkbox / radio / file / chrome skipped.

---

## v3 vs future

| v3 (now) | Later |
|----------|-------|
| In-memory session + JSON export | Persist compile into persona `journeys.ts` / `data/journeys/` commit path |
| Studio REC deck + MCP helpers | Nested scroll containers beyond prototype root |
| Transport + screen + dwell + demo-click + human REC click + **beat-enter + scroll + typed-text** | Drag / contenteditable / rich form widgets |
| Director-script + retreat-sync via shared script apply | — |
| **Compile → ephemeral journey catalog** (Save as journey) | Multi-journey free ids beyond the two CJM slots; compile scroll/typed into beats |

---

## Recordable DOM conventions

Prefer stable selectors on interactive targets:

- `data-name="…"` — primary wire target (Figma export names)
- `data-studio-avail-store="…"` — availability store rows
- `data-studio-action="…"` — explicit playback actions (future)
- `data-studio-beat="…"` — beat-scoped controls (future)

Demo clicks store a **selector chain** (nearest `data-studio-*` / `data-name` ancestors) for future replay targeting.

---

## Tests

```bash
npm test -- src/app/recording
```

Run full suite after capture/replay changes: `npm test`.

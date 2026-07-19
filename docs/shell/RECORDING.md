# Journey recording

Foundation + Studio shell UI for **record → export → replay → compile**. Events compile to the same beat/action model the playback engine uses.

See also: [PLAYBACK.md](./PLAYBACK.md) (engine), [SHELL.md](./SHELL.md) (shell architecture).

---

## Agent testing overlay (MCP / `__protoRun*` / DevTools)

While an agent drives localhost, Studio shows a **compact bottom-right status panel** (title + scrolling actions log). The page stays **fully visible** underneath — no lightbox / opaque modal.

**Click guard (active only):** an invisible full-viewport capture layer (`pointer-events: auto`, transparent) plus `#root { pointer-events: none }` blocks PO clicks into the concept UI. The BR panel itself stays interactive (log + **Dismiss**).

**Sitrep settle (DONE):** on `stop()` (nest → 0), the panel does **not** vanish instantly. It enters a short **AGENT DONE — SITREP** state (~5s, configurable `settleMs` clamped 4–6s): final status + last log lines stay readable; click guard is **released** so the PO can use the page while reading. After the settle delay the panel clears; if `reload: true`, reload runs **after** settle (not during). Manual **Dismiss** / `stop({ force: true })` still clears **instantly**. A tiny recent-session stack (max 5, `sessionStorage`) may show under the log during settle — keep it simple, not a notification center product.

```js
window.__protoAgentTestingOverlay?.start("optional title")
window.__protoAgentTestingOverlay?.touch("optional title") // arm if inactive; no nest bump
window.__protoAgentTestingOverlay?.log("clicked Book Step 2")
window.__protoAgentTestingOverlay?.stop() // nest-aware → DONE settle ~5s; no reload
window.__protoAgentTestingOverlay?.stop({ force: true }) // clear immediately (Dismiss)
window.__protoAgentTestingOverlay?.stop({ reload: true }) // settle ~5s, then location.reload()
window.__protoAgentTestingOverlay?.stop({ settleMs: 5000, reload: true })
window.__protoAgentTestingOverlay?.isActive() // false during settle
```

### Lifecycle (must not stick)

| Event | Behavior |
|-------|----------|
| `__protoRunMcpSanityCheck` / `__protoRun*` session `finally` | Always `stop({ reload: true })` — sitrep ~5s, then clean-tab reload |
| Mutating `__proto*` helpers | Auto-`touch()` on first/each call (read-only getters skipped) |
| DevTools MCP clicks only | Agent **must** call `touch()` at session start |
| `stop()` nest → 0 | Enter DONE/SITREP settle (default **5s**); release click guard; keep log visible |
| Settle timer fires | Hide panel; if `reload: true`, then deferred `location.reload()` (~120ms) |
| Safety timeout | Auto `stop({ force: true })` after **3 min** (skips settle) |
| `beforeunload` | Clears active/settle state + sessionStorage persist |
| Page load / overlay install / stop | Strip ephemeral query (`proof`, …) — never leave `?proof=unmount-race` |
| Page load | **Never** restores stale "testing" unless `sessionStorage.protoAgentTestingOverlayContinue=1` (default: never) |
| Dismiss button / `stop({ force: true })` | Immediate clear (no settle); no reload unless `reload: true` |

Manual console experiments should omit reload (default `false`). Auto-shown for `__protoRun*` MCP sessions and any mutating `__proto*` helper. `__protoAbortAll` force-clears it. Shell-only (`src/app/shell/agentTestingOverlay.ts` + PANEL CSS) — not Boots page CSS.

**Deep links:** see [URL.md](./URL.md). Do not use `?proof=*` for agent status.

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
recordingReplay              (v1 transport replay; v2 demo-click / wire-intent)
       ↓
compileRecordingToBeatTimeline    (future journeys.ts compiler input)
```

| Module | Path | Owns |
|--------|------|------|
| **Types** | `app/recording/recordingTypes.ts` | Event union, session shape, replay options |
| **Session** | `app/recording/recordingSession.ts` | start/stop/pause, append, serialize, last session |
| **Capture** | `app/recording/recordingCapture.ts` | Snapshot provider, interaction bridge, touchpoint |
| **Replay** | `app/recording/recordingReplay.ts` | `replayRecordingSession`, `compileRecordingToBeatTimeline` |
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
| ↺ | Replay last stopped or imported session (v1 transport) |

UI and MCP share `recordingSession` + `replayRecordingSession` — no second session store.

---

## Event types

| Kind | Captured from | v1 replay |
|------|---------------|-----------|
| `transport` | Step/Play/Jump via `notePlaybackTransport` | Yes |
| `touchpoint` | Touchpoint key change in `App.tsx` | Boundary marker only |
| `screen` | Address-bar / tab screen change (`useStudioUrlSync`) | Yes — `applyStudioScreen` via `screenId` / `studioUrl` |
| `demo-click` | Robo-cursor via `notePlaybackDemoClick` | No (selector chain stored) |
| `director-script` | Journey director via `notePlaybackDirectorScript` | No |
| `beat-enter` | Beat onEnter via `notePlaybackBeatEnter` | No |
| `wire-intent` | Retreat sync / future beat actions | No |
| `studio` | Journey/orchestra mode changes (manual API) | No |
| `scroll` | Manual API | No |
| `dwell` | Manual API or compiled pauses | Yes (delay) |

Each event may include a `snapshot` (`PlaybackStudioSnapshot` + journey/orchestra fields), including `screenId` and `studioUrl` when the bar is synced.

### Screen replay restore (v1.1)

Capture already appends `kind: "screen"` when the address bar / tab changes. On **↺ Replay** (UI or `__protoReplayRecording`):

1. Each `screen` event calls `applyScreen` → shared `applyStudioScreen` (`src/app/shell/studioUrl.ts`).
2. That helper is the **same path** as refresh deep-link + `popstate` (`useStudioUrlSync`).
3. Prefer `studioUrl` when present; else `screenId` (+ `projectId`). Unknown ids error; missing `applyScreen` → unsupported.

Boots book steps (`book-step-1` … `book-step-3`) and mapped screens (`home`, `chat`, …, `hub`) restore in event order before/alongside transport.

---

## Start / stop via MCP

```javascript
window.__protoEnsureCleanStudio?.()
window.__protoStartRecording?.()          // uses current project/persona/journey
window.__protoTriggerTransport?.('step-forward')
// … navigate freely …
window.__protoStopRecording?.()
window.__protoExportRecording?.()         // JSON string — copy to file
window.__protoCompileRecording?.()        // beat segments from touchpoint markers
```

Import a saved session:

```javascript
window.__protoImportRecording?.(jsonString)
```

Export / replay / compile fall back to the **last stopped or imported** session when nothing is live.

---

## v1 vs future

| v1.1 (now) | v2+ |
|----------|-----|
| In-memory session + JSON export | Demo-click replay via `simulateDemoPointerClick` |
| Studio REC deck + MCP helpers | Full compile to `journeys.ts` beats |
| Transport + **screen** + dwell replay | Wire-intent replay via `runBeatAction` |
| Capture via existing hooks | Retreat-aware replay matrix |

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

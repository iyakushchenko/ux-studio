# Journey recording

Foundation + Studio shell UI for **record → export → replay → compile**. Events compile to the same beat/action model the playback engine uses.

See also: [PLAYBACK.md](./PLAYBACK.md) (engine), [SHELL.md](./SHELL.md) (shell architecture).

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
protoPlaybackInteractionContext   (existing flight recorder)
       ↓
protoRecordingCapture             (bridge + touchpoint hook in App.tsx)
       ↓
protoRecordingSession             (in-memory session + JSON export)
       ↓
protoRecordingReplay              (v1 transport replay; v2 demo-click / wire-intent)
       ↓
compileRecordingToBeatTimeline    (future journeys.ts compiler input)
```

| Module | Path | Owns |
|--------|------|------|
| **Types** | `app/recording/protoRecordingTypes.ts` | Event union, session shape, replay options |
| **Session** | `app/recording/protoRecordingSession.ts` | start/stop/pause, append, serialize, last session |
| **Capture** | `app/recording/protoRecordingCapture.ts` | Snapshot provider, interaction bridge, touchpoint |
| **Replay** | `app/recording/protoRecordingReplay.ts` | `replayRecordingSession`, `compileRecordingToBeatTimeline` |
| **MCP** | `app/recording/protoRecordingMcpHelpers.ts` | `window.__protoStartRecording` etc. |
| **UI** | `app/nav/ProtoNavRecordingControls.tsx` | Studio shell REC deck (same session APIs) |

---

## Studio UI

Cassette deck mode toggles (labels match STEPS type; pipe bars match zoom delimiters):

| Control | Chrome | Behavior |
|---------|--------|----------|
| **REC** | Always-on `REC` mode label + muted/red switch; `STEPS: N` event count only in Rec mode | Playback XOR recording panel; count live from `protoRecordingSession` |
| **CJM** | `\| CJM [switch] \|` pipes + amber when on | Journey mode (browse vs cassette transport) |

**Playback | Rec** (mutually exclusive panels):

- **Left (muted, same as CJM-off) / REC off** — playback mode: `REC [switch] | CJM [switch] | STEPS: N` (journey) — shared `.proto-studio-mode-switch` off chrome; no recording counter. Recording event counter and REC transport are unmounted.
- **Right (red) / REC on** — rec mode: `REC [switch] STEPS: N` (recording events) + REC deck. Journey STEPS / cassette transport are unmounted.
- **Transition:** `framer-motion` `AnimatePresence` (`mode="wait"`) in `ProtoNavScenarioControls` — `.proto-nav-scenario__panel-swap` crossfades Playback ↔ Rec (0.34s, shared `protoStudioMotion` timings). XOR preserved: only one interactive panel. Touchpoint label width also uses `framer-motion` (same duration).

Leaving Rec while a capture is live **pauses** the session (does not stop/destroy it).

| Control | Action |
|---------|--------|
| ● | Start recording (current project / persona / journey) |
| ❚❚ / ► | Pause / resume |
| ■ | Stop — keeps session for export / replay |
| ↓ | Download `.recording.json` |
| ↑ | Import a saved `.recording.json` |
| ↺ | Replay last stopped or imported session (v1 transport) |

UI and MCP share `protoRecordingSession` + `replayRecordingSession` — no second session store.

---

## Event types

| Kind | Captured from | v1 replay |
|------|---------------|-----------|
| `transport` | Step/Play/Jump via `notePlaybackTransport` | Yes |
| `touchpoint` | Touchpoint key change in `App.tsx` | Boundary marker only |
| `demo-click` | Robo-cursor via `notePlaybackDemoClick` | No (selector chain stored) |
| `director-script` | Journey director via `notePlaybackDirectorScript` | No |
| `beat-enter` | Beat onEnter via `notePlaybackBeatEnter` | No |
| `wire-intent` | Retreat sync / future beat actions | No |
| `studio` | Journey/orchestra mode changes (manual API) | No |
| `scroll` | Manual API | No |
| `dwell` | Manual API or compiled pauses | Yes (delay) |

Each event may include a `snapshot` (`PlaybackStudioSnapshot` + journey/orchestra fields).

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

| v1 (now) | v2+ |
|----------|-----|
| In-memory session + JSON export | Demo-click replay via `simulateDemoPointerClick` |
| Studio REC deck + MCP helpers | Full compile to `journeys.ts` beats |
| Transport + dwell replay | Wire-intent replay via `runBeatAction` |
| Capture via existing hooks | Retreat-aware replay matrix |

---

## Recordable DOM conventions

Prefer stable selectors on interactive targets:

- `data-name="…"` — primary wire target (Figma export names)
- `data-proto-avail-store="…"` — availability store rows
- `data-proto-action="…"` — explicit playback actions (future)
- `data-proto-beat="…"` — beat-scoped controls (future)

Demo clicks store a **selector chain** (nearest `data-proto-*` / `data-name` ancestors) for future replay targeting.

---

## Tests

```bash
npm test -- src/app/recording
```

Run full suite after capture/replay changes: `npm test`.

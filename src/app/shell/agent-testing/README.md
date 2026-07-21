# Agent testing — mid-flight QA shell

**Refs:** [PLAYBACK_DIAG.md](../../../../docs/shell/PLAYBACK_DIAG.md) · [STUDIO_AUTO_RULES.md](../../../../docs/product/STUDIO_AUTO_RULES.md) R15 · [TEAM.md](../../../../docs/product/TEAM.md) · [PAINPOINTS.md](../../../../docs/product/PAINPOINTS.md) PP-10…PP-12

## Session kind SSoT (no mode soup)

**One overlay · one gate · explicit `sessionKind`:** `manual` | `agent` | `observe`  
Module: [`agentTestingSession.ts`](./agentTestingSession.ts) — do **not** reintroduce `loggerSession` / dual owner flags.

```
idle ──bug/open──► manual (paused) ──Resume──► manual (capturing)
  │                    │
  │                    ├──handoff(oversee)──► agent | observe
  │                    └──handoff(!oversee) / touch──► wipe → agent
  │
  ├──start/touch──► agent (locked)
  └──open({kind:'observe'})──► observe (capturing, soft bug)
                                    │
                                    └──Alarm/escalate──► agent (locked)
                                                           │
                                                           └──unlock──► observe | ask proceed?
```

| Kind | Capture | Dismiss | Bug chip | Status |
|------|---------|---------|----------|--------|
| **manual** | Pause freezes clock+capture; opens paused | Close × / bug toggle | **Amber active** | `Paused` / `Capturing` |
| **agent** | Pause + halt Play; Message = note or reply to agent-prompt | **Locked** | **Disabled** | `Agent running` / `Paused` / `Awaiting reply` |
| **observe** | Capturing on; user clicks free | Close × (not bug toggle) | **Calm/soft** | `Observing` / `Paused` |

### Handoff helpers

```js
__studioOpenQaLogger({ kind: "manual" | "observe" | "agent", oversee?: boolean })
__studioQaHandoff({ oversee: true, kind?: "agent" | "observe" }) // keep ring/log
__studioQaHandoff({ oversee: false }) // wipe → agent (default on touch)
__studioAskUserInQa("Does Book now look right?") // log kind agent-prompt
__studioQaSessionKind() // current kind
```

- **oversee:false** (default when agent connects): stop session, clear to green field, open as `agent`.
- **oversee:true**: keep log/ring (incl. user-message); switch to agent or observe.
- Observe Alarm → `observe-escalate` log + agent lock; `__studioAgentTestingOverlay.unlockObserve()` returns to observe.

Dump includes `sessionKind` (+ `gateMode` alias).

## How agents should open / handoff / ask (lean)

Prove only at **`http://127.0.0.1:5173/`** (or `localhost:5173` — same Vite). One tab; reuse via Chrome DevTools MCP `list_pages` → `select_page`.

```js
// 0) ALWAYS CLEAR before a new prove/test (mandatory)
window.__studioForceClearAgentTestingOverlay?.()
// or: window.__studioAgentTestingOverlay?.forceClear()

// 1) Open CONTROL session (wipe → green field)
window.__studioOpenQaLogger?.({ kind: "agent" })
// or handoff from manual without keeping notes:
window.__studioQaHandoff?.({ oversee: false })

// 2) Keep PO notes / ring when connecting
window.__studioQaHandoff?.({ oversee: true, kind: "agent" }) // or "observe"

// 3) Ask PO (→ PENDING + agent-prompt row; Reply via Message/Send)
window.__studioAskUserInQa?.("Does Book now look right?")

// 4) Poll mid-flight (primary). Dump / Save Log is secondary.
//    Do NOT only flood-read chat — consume latches each beat.
window.__studioAgentTestingTakeover
window.__studioConsumePoSignal?.()
window.__studioPeekPoSignal?.()
window.__studioMcpConnectionStatus?.() // CONTROL | OBSERVE | PENDING | …
window.__studioConsumePlaybackDiagnostic?.() // if diag modal / ingest

// 4b) Leave / return (HARD) — pause while in Cursor chat; Message on arrival
window.__studioAgentTestingOverlay?.pauseForAgentLeave?.()
const back = window.__studioAgentTestingOverlay?.resumeForAgentReturn?.()
// if back.messagePendingWork → handle back.consumedSignal.note before continue

// 5) Cleanup
window.__studioForceClearAgentTestingOverlay?.()
```

### Agent leave / return (HARD)

Agents **SHOULD** call leave/return. **Guard rail:** presence TTL (`QA_AGENT_AUTO_PAUSE_MS` = 8s) auto-pauses capture + Play when last touch goes stale (keeps Last seen; no `QA_PAUSE_HALT` / no `DIAGNOSTIC_ACK_STOP`). **Prove latch:** `__studioRunFullPlayProve` skips auto-pause until prove ends. **REC live:** QA capture auto-pauses + click guard releases (product clicks free).

1. **`pauseForAgentLeave()`** — halt Play + pause capture + presence OFFLINE (no `QA_PAUSE_HALT` latch).
2. **Stale auto-pause** — if you forget leave, heartbeat pauses after ~8s without touch.
3. On return: **`resumeForAgentReturn()`** — presence ONLINE + **consume Message/latch** + resume only if no Message work (`messagePendingWork`).
4. If Message arrived while gone → stay paused; follow User Message procedure below.

→ [QA_LOGGING_AND_PLAYBACK_RECIPE.md](../../../../docs/shell/QA_LOGGING_AND_PLAYBACK_RECIPE.md) § Agent leave / return.

### User Message → agent procedure (HARD)

When PO **Send**s a Message (or Reply) mid-flight:

1. **STOP** — Play/progress already halted; latch `USER_MESSAGE_RECEIVED` (`type: user-message`).
2. **`__studioConsumePoSignal()`** — read `note` (full text).
3. **Investigate** (diagSnapshot / PLAYBACK_DIAG / dump `priorityHints[]` — cause before symptom).
4. **FIX** the issue named (do not invent).
5. **Reply** in QA (agent log / AskUser follow-up) so PO sees acknowledgment.
6. **Proceed** — Resume capture only when safe; do not ignore Pause/Message.

**Pause (all kinds):** hard-halts Play + latches `QA_PAUSE_HALT`. Further Play clicks are ignored until Resume (+ latch cleared).

**PENDING + typing:** while awaiting reply, focus/type in Message → `user-typing` extends pending timeout; draft persists across refresh (`studioQaMessageDraft`); Message autofocuses on open/restore.

**Playback diagnostic open:** QA pauses, latches `PLAYBACK_DIAGNOSTIC_OPEN`, logs control-room Alarm-red sitrep, blocks Play until Ack/`__studioConsumePlaybackDiagnostic`.

**QA latch phase changes (lean filter — HARD):** diode + status line under Message = live SSoT for STARTING/READY/CONTROL.
Chat timeline is **not** a full phase dump — filter in `shouldLogMcpPhaseToChat`:  
Visible chat log **does not** spam flash transitions. Log only:

| Log to chat? | Phase / event |
|--------------|---------------|
| NO | STARTING · READY · first settle to CONTROL/OBSERVE · idle |
| YES | ERROR · PENDING start · CONTROL↔OBSERVE kind switch · leave ERROR |
| NO (dup) | PENDING leave — Reply / timeout rows already cover it |

Code: `shouldLogMcpPhaseToChat` in `agentTestingQaListenBridge.ts`.  
Action sitrep (Save Log / Pause / Close / Reset) stays visible — denser meaningful events, less chrome.

**QA chat lean (2026-07-21):** routine `Camera: wait` dwell is dump-only (not chat). Playback-diag mirrors via `logStep` only — no twin ring row (was the refresh restore ×2 source). Login drain: Modal open/pick/close only.

**Do not:** invent hover/loader chrome; click under open modal (overlay eyes); claim PROVEN without MCP probe; await CI on routine ships (R12); DDOS yourself by re-reading the whole chat instead of consuming latches.

**Save Log:** auto-pauses capture (halts Play) then downloads **current** session dump as `qa-{manual|agent|observe}-{iso}.json` (session kind in the name — not `agent-testing-dump-manual-…`). One timeline row.

**Control room (manual/observe):** interactive controls only (buttons/toggles/tabs/inputs) → `Control room: …`. Empty-space nav clicks are ignored. Pause / CAPTURE off stops **all** interaction logging until Resume. One gesture → one line (click-canonical coalesce).

**Session line:** `Session: Localhost:5173 - Active` (live origin probe; Offline when unreachable).

**Stale-green (PP-07):** snap≠URL (screen/cjm/experience) → amber Session + one `stale-green · …` sitrep line (no spam).

**PLAYBACK_DIAG → QA chat (PP-15):** lean events append into the **main QA chat** as human-readable rows (unified chronology). Old side-pane PLAYBACK_DIAG mirror stays **hidden**. Mirror keep: FAIL/JUMP/CHOP/scroll-reversal/type-in start+end/play-end/alarms. Suppress: TRACE frames, cursor park/remove chatter, type-in-progress.

**Agent intervene:** takeover confirm / wipe handoff / observe escalate → **fresh AGENT SESSION** (elapsed reset + boundary log). Old manual elapsed does not continue.

**FAIL handoff freeze:** while `Caught error. Handing off to agent….` is open, Play/SF/jump/camera are hard-frozen (`__studioIsQaProgressFrozen()`). Confirm takeover starts a new session **and lifts freeze** so agent can drive; Resume also clears any leftover freeze.

**Message RTT:** Send → `Message delivered · awaiting agent consume`; consume → `Message consumed · RTT Nms`. PENDING timeout floors via measured RTT (`__studioQaMessageRttStats()`). **Presence XOR:** `ONLINE` when agent recently touched (≤8s) **or** `Last seen Ns ago` when stale — never both. Green diode only when `data-presence=online`. **Auto-pause guard rail:** stale ≥8s → pause capture + halt Play (same as leave, no `QA_PAUSE_HALT`); return via `resumeForAgentReturn()`.

**QA chat colors (industry norms):** red = hard FAIL / chop / script-timeout / Play-stopping alarms; amber = soft-fail attention; neutral = routine milestones (journey reset, play-end, typing started, cursor cleared, stepped notes); green = explicit `RESULT · PASS` only. Timestamps only — no 1/2/3 list numbering.

**Full chat bubble motion (restartable):** `await window.__studioRunChatBubbleMotionSelfTest?.()` — opens QA, SF agentic q0…r3, asserts samples / thinking-handoff / jumps=0. See [SELF_TEST.md](./SELF_TEST.md).

**OBSERVE + REC dual-use:** StartRecording preserves observe. **Manual/observe = OS cursor only** — demo/robo cursor is hidden (no pointer-follow; PO dual-cursor FAIL). Robo cursor returns for agent CONTROL / CJM Play/SF. Session Beat = selected journey (rec-* catalog); STEPS frames show as `Steps` when different.

### FAIL → agent takeover handshake (HARD)

On PlaybackDiagnostic / Alarm / Bubble JUMP / FAIL:

1. Progress **pauses immediately**
2. QA log: `Caught error. Handing off to agent....`
3. After **real** agent handshake (`touch` / `consumePoSignal` / `ackDiagnostic` / `__studioConfirmFailTakeover`): `Agent take over confirmed. In progress`
4. Then: `Please wait... Agent will resume on completion`
5. Agent investigates under CONTROL, then clears / resumes

Never emit (3) without handshake. Module: `agentTestingFailHandoff.ts`.


**Session finale:** cleanup first, then `__studioAgentTestingOverlay.appendFinale("pass"|"fail", summary)` → `RESULT · PASS/FAIL — …` is the **last** visible chat line. Post-RESULT clear-stale / playback-diag housekeeping is sealed out of chat. Self-test smoke appends this automatically.

**Refresh mid-CONTROL:** gate persist stores `sessionKind` + `awaitingReply` + **`elapsedAccumMs` / `sessionStartedAt`**; boot reopens agent CONTROL (not manual), re-arms PENDING when awaiting, **keeps elapsed clock**, and logs `page refresh · session restored`.

**New agent / handoff wipe:** `__studioOpenQaLogger` / `__studioQaHandoff({ oversee:false })` / nest=1 `start` **always reset** the QA log (no stale). Only `hydrateRestore` / `oversee:true` keep history.

### Console ↔ QA sanity (HARD)

Agents **must** cross-check the same session:

| Console | QA tool |
|---------|---------|
| `[PLAYBACK_DIAG]` events | Save Log `recentPlaybackDiagEvents` + ring `playback-diag` rows |
| `[PLAYBACK_DIAG] clear` | amber `playback-diag · clear` log row |
| click FAIL / OFF-TARGET | deep-red / fail outcome rows |
| scroll-reversal Δ | soft-fail `playback-diag · scroll · scroll-reversal` |
| PlaybackDiagnostic popup | dump `diagnosticFlashes` + `lastPlaybackDiagnostic`; `__studioConsumePlaybackDiagnostic()` |

Mismatch = desync — fix bridge, do not trust vibes. See [PLAYBACK_DIAG.md](../../../../docs/shell/PLAYBACK_DIAG.md) § QA bridge.

**Architect (PO 2026-07-20 / hardened):** **One monitor.** While QA gate/agent session is open, PlaybackDiagnostic lands **in the QA log** (fail row + ring + dump `diagnosticFlashes`) and **does not** open the blocking modal. Halt + latch still fire; PO/agent **Ack diag** in the overlay (or `__studioConsumePlaybackDiagnostic`). Modal remains **PO-only when QA is closed**. Do **not** rebuild two monitors.

**Sitrep Keep open:** DONE sitrep shows `Auto-closes in Ns` + **Keep open** link — cancels countdown so PO does not lose log context.

### Two agent CONTROL kinds (not a third sessionKind)

Under `sessionKind: agent` only — derived from CJM on/off + Play transport:

| `agentControlKind` | When | Status label |
|--------------------|------|--------------|
| **playback** | CJM on + auto Play (`isPlaying`) | `AGENT — CONTROL · PLAYBACK` |
| **stepped** | CJM on + Play off (frame-by-frame SF) | `AGENT — CONTROL · STEPPED PLAYBACK` |
| **manual** | CJM off — free exploration / QA latch | `AGENT — CONTROL · MANUAL` |

Not the same as `sessionKind: manual` (bug-icon free logger). Module: `agentTestingControlKind.ts`.

**Session finale:** cleanup first, then `__studioAgentTestingOverlay.appendFinale("pass"|"fail", summary)` → `RESULT · PASS/FAIL — …` is the **last** visible chat line. Post-RESULT clear-stale / playback-diag housekeeping is sealed out of the chat (console may still note dismiss).

**Console ↔ QA (HARD):** when QA log looks wrong or empty vs expected FAIL/Alarm/diag, agents **MUST** compare raw `[PLAYBACK_DIAG]` / `[AGENT_TESTING]` console against the sitrep. If desync → fix QA bridge — do not trust chat alone.

### QA latch status (not Cursor MCP)

**Studio `AGENT — CONTROL/OBSERVE` is not Cursor Chrome-DevTools MCP.** It means the **in-app agent-testing / QA gate session** is active (latch + overlay). Cursor may drive the browser via DevTools MCP independently; the status line only reflects Studio's own CONTROL/OBSERVE/PENDING latch. Tooltip: *In-app testing latch (not Cursor MCP)*. Legacy helper names (`__studioMcpConnectionStatus`, CSS `mcp-*`) stay for API stability.

Primary: **lean muted status line** under Message/Send with a **live connection diode** (same camera-lens LED language as playback/REC). Short nav hint beside bug icon (CTRL / OBS / PENDING) only while overlay is **actually open** (gate + `data-active`) — never ghost when closed. **Close × / softClose / forceClear** always wipe AGENT mode (no stuck CONTROL after prove waves).

| Phase | Label | Diode | Viewport |
|-------|-------|-------|----------|
| STARTING | `AGENT — STARTING` | pulse cool | — |
| READY | `AGENT — READY` | pulse cool (brief) | — |
| CONTROL | `AGENT — CONTROL` (+ `· PLAYBACK` / `· MANUAL`) | bright green | **10px gold** |
| OBSERVE | `AGENT — OBSERVE` | fuchsia | — |
| CONTROL · PENDING | `AGENT — CONTROL · PENDING` (+ kind) | blue pulse | **10px blue** |
| ERROR | `AGENT — ERROR: …` | red | **10px red** |
| Idle / closed | hidden | off | none |

**PENDING timeout (default 60s):** auto-pause capture + log `MCP pending timed out (Ns) — paused; resume when ready`. Override: `window.__studioQaPendingTimeoutMs`. Clear on user Reply/Send.

```js
__studioMcpConnectionStatus()
__studioReportMcpConnectionError("latch fail")
```

**Toolbar:** clock + CAPTURE|Pause|Resume + Reset + × + Save Log (same height). CAPTURE after reset/start; Resume only with paused progress. Reset disabled until log dirty.

**Alarm:** observe or agent — from observe, escalates then latches investigate prompt (`agentPrompt` in dump); agent-only path halts Play + pause.

**Recent:** deleted (low-value clutter).

## Dual-role self-test (required after overlay changes)

Overlay is **load-bearing** ([PP-13](../../../../docs/product/PAINPOINTS.md)). After any QA-tool ship:

1. Open [`SELF_TEST.md`](./SELF_TEST.md) checklist (USER observe ↔ AGENT intervene).
2. Lean smoke (paced): `await window.__studioRunQaSelfTestSmoke?.()` — expect `ok: true` (~step 350ms / settle 900ms).
3. Scenario catalog: `agentTestingSelfTest.scenarios.ts` (Vitest covers pure state).

## Overlay CTAs (PO mid-flight)

| CTA | Meaning | Latch code |
|-----|---------|------------|
| **Alarm** | Observe → escalate+latch; Agent → stop + investigate latch | `ALARM_SEQUENCE_MISMATCH` + `agentPrompt` |
| **Cursor** | Cursor weird / invisible / wrong | `CURSOR_WEIRD_FLAG` (manual) · `CURSOR_HIDDEN_DURING_TYPEIN` (auto) |
| **Scroll** | Scroll path / intoView issue | `SCROLL_ISSUE_REPORTED` (+ auto soft-logs) |

Primary: `window.__studioAgentTestingTakeover` / `__studioConsumePoSignal()`. Dump secondary.

## QA diag gate / free-form logger

- Bug chip: amber = **manual** open only; calm idle; disabled = **agent** lock; soft = **observe**.
- While capturing: **page clicks** + **screen nav** in visible log; full detail in ring/dump.
- Log colors: capture muted · system **blue** · user message **amber** · agent-prompt **violet** · observe-escalate **orange** · alarms warn · init muted.
- Warm-up → one **Initializing…** row.
- **Session** bar ≠ **Touchpoints** strip.
- **Close (×)** / **Reset** (manual + observe). **Save Log** snapshots anytime while session active.

See [PLAYBACK_DIAG.md](../../../../docs/shell/PLAYBACK_DIAG.md) § QA diag gate.

## Official overlay test & bugfix process (HARD)

When PO clicks Alarm / Cursor / Scroll during a watched MCP / smoke session:

1. **STOP Play immediately** in the same click (`haltPlaybackForPoSignal` → journey/scenario abort — not next smoke poll).
2. **Latch** stays for `__studioConsumePoSignal` / smoke abort + `diagSnapshot`.
3. **Understand** from `diagSnapshot` + `[PLAYBACK_DIAG]`. If unclear → **ask PO** (do not invent).
4. **FIX** → **RESTART** → prove that exact issue gone.
5. Continue until next signal or green end.

**PLAYBACK DIAGNOSTIC Cancel** (Scroll/camera jank, etc.): same hard-stop + latch `DIAGNOSTIC_ACK_STOP`. Modal must close in that click. Smoke harness `__protoDismissPlaybackDiagnostic` clears UI without that latch.

## Type-in cursor (CJM)

CJM on ⇒ robo-cursor stays visible during typed-text (`parkDemoCursorForTypeIn` / `typeInCursorGuard`). Hidden mid type-in → `CURSOR_HIDDEN_DURING_TYPEIN`.

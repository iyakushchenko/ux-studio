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

### MCP connection status

Primary: under Message/Send compose (not header). Short nav hint beside bug icon.

| Phase | Label | Color / viewport |
|-------|-------|------------------|
| CONNECTING | `MCP — CONNECTING` | soft blue |
| CONNECTED | `MCP — CONNECTED` | soft blue (brief) |
| CONTROL | `MCP — CONTROL` | bright green + **3px gold** viewport border |
| OBSERVE | `MCP — OBSERVE` | bright fuchsia |
| CONTROL · PENDING | `MCP — CONTROL · PENDING` | system blue + **3px blue** border |
| ERROR | `MCP — ERROR: …` | red + **3px red** border |
| Idle | hidden | manual / no agent session |

**PENDING timeout (default 60s):** auto-pause capture + log `MCP pending timed out (Ns) — paused; resume when ready`. Override: `window.__studioQaPendingTimeoutMs`. Clear on user Reply/Send.

```js
__studioMcpConnectionStatus()
__studioReportMcpConnectionError("latch fail")
```

**Toolbar:** clock + CAPTURE|Pause|Resume + Reset + × + Save Log (same height). CAPTURE after reset/start; Resume only with paused progress. Reset disabled until log dirty.

**Alarm:** agent mode only — halt Play + pause + latch investigate prompt (`agentPrompt` in dump).

**Recent:** deleted (low-value clutter).

## Overlay CTAs (PO mid-flight)

| CTA | Meaning | Latch code |
|-----|---------|------------|
| **Alarm** | AGENT only — stop progress + investigate latch | `ALARM_SEQUENCE_MISMATCH` + `agentPrompt` |
| **Cursor** | Cursor weird / invisible / wrong | `CURSOR_WEIRD_FLAG` (manual) · `CURSOR_HIDDEN_DURING_TYPEIN` (auto) |
| **Scroll** | Scroll path / intoView issue | `SCROLL_ISSUE_REPORTED` (+ auto soft-logs) |

Primary: `window.__studioAgentTestingTakeover` / `__studioConsumePoSignal()`. Dump secondary.

## QA diag gate / free-form logger

- Bug chip: amber = **manual** open only; calm idle; disabled = **agent** lock; soft = **observe**.
- While capturing: **page clicks** + **screen nav** in visible log; full detail in ring/dump.
- Log colors: capture muted · system **blue** · user message **amber** · agent-prompt **violet** · observe-escalate **orange** · alarms warn · init muted.
- Warm-up → one **Initializing…** row.
- **Session** bar ≠ **Touchpoints** strip.
- **Close (×)** / **Reset** (manual + observe). **Save Log** gated while capturing.

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

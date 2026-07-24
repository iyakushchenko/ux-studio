# PLAYBACK_DIAG — console contract

Runtime alignment verifies the active beat, expected tab, address URL, rendered
screen, semantic touchpoint, and filtered playlist counter. Sampling is deferred
by one animation frame and cancelled when a scripted handoff changes the beat or
touchpoint, preventing transitional false alarms without masking stable drift.

**Status:** Locked (PO 2026-07-19) · Expanded beat/cursor/scroll schema (PO 2026-07-20)  
**Owners:** Finn (wire) · Quinn (prove) · Ben (MCP helpers) · Arch (Auto-Rule)  
**Code:** `src/app/shell/playbackDiag.ts`  
**Related:** [PLAYBACK.md](./PLAYBACK.md) · [RECORDING.md](./RECORDING.md) · [STUDIO_AUTO_RULES.md](../product/STUDIO_AUTO_RULES.md) R13

---

## Why

React Site Pilot / Chat migration broke CJM playback in silent ways:

| Failure | Symptom | Root cause |
|---------|---------|------------|
| Type-in missing | Step jumps home→chat with no typing | Prefill `HOME_QUERY_DEFAULT === AGENTIC_HOME_DEMO_QUERY` skipped type-in |
| Legacy-retired selectors | `diagnostic-on-step-1` / transport-no-op | Hidden Legacy DOM wins `querySelector` |
| Scroll host | Wrong scroll / sticky pad | Chat sole host is `.chat__column` |
| Fade removed | Bubbles hard-edge under bar / composer | Composer + under-bar wash dropped |
| Cursor opaque | “Did the cursor do its job?” | Diag only logged type-in/step labels — no target/bbox/park |
| Hub reset | Play/end lands hub | `goToTab` left `hubOpen=true` |
| Agentic CTAs | Chat skips progressive clicks | CTA frameIndex off-by-one after React |

**Rule:** Prefer under-match Legacy over inventing chrome — but **do not** skip director type-in for convenience. Trust `[PLAYBACK_DIAG]` once it logs every beat.

---

## Console APIs (prefer `__studio*`)

```js
window.__studioPlaybackDiagClear?.()
// … step / play CJM …
window.__studioPlaybackDiag?.()
// → {
//   events, typeIn, step,
//   cursor: { events, parks, lastParkReason },
//   scroll: { events, retreatIntoView },
//   click: { ok, fail },
//   skip: { count, reasons },
//   playEnd, journeyReset
// }

window.__studioAssertTypeIn?.()
// → { pass, reason?, bundle }  — FAIL if type-in-skip or too few progress samples

window.__studioAssertPlayEndedAtEnd?.({ endBeatId, endScreenId?, startBeatId? })
// → FAIL if hub / rewound to start / counter not N/N / no play-end
// legacy alias (same AtEnd semantics):
window.__studioAssertPlayEndedAtStart?.(...)

// Legacy aliases (same functions):
window.__protoPlaybackDiag?.()
window.__protoAssertTypeIn?.()
window.__protoAssertPlayEndedAtEnd?.()
window.__protoAssertPlayEndedAtStart?.()
```

Filter DevTools console: `[PLAYBACK_DIAG]`.

### QA diag gate (lean open-world logger)

Console noise is **gated**. Detailed `[PLAYBACK_DIAG]` console emit runs **only while** `qaDiagGateOpen` is true.

**Type-in (HARD — PO 2026-07-21):** page composer letter-by-letter animation is **required**. `playbackDiagTypeInProgress` keeps **in-memory samples only** — **no** per-char `type-in-progress` events into the ring/overlay/console. QA may show **start + end** at most. Full recipe: [QA_LOGGING_AND_PLAYBACK_RECIPE.md](./QA_LOGGING_AND_PLAYBACK_RECIPE.md).

**Session kinds (SSoT):** `manual` | `agent` | `observe` — see [`agent-testing/README.md`](../../src/app/shell/agent-testing/README.md) · `agentTestingSession.ts`.

| Action | Gate / UX |
|--------|-----------|
| Bug / `__studioToggleQaLogger()` | Toggle **manual** only (amber). Observe = soft chip (Close ×). Agent = disabled |
| `__studioOpenQaLogger({ kind, oversee? })` | Open as kind; oversee keeps context |
| `__studioQaHandoff({ oversee })` | Default wipe→agent; oversee keeps ring/log |
| `__studioAskUserInQa(prompt)` | `agent-prompt` row; Message/Send → `Reply: …`; starts PENDING (60s) |
| QA latch status chip | `AGENT — CONTROL` (green) / `OBSERVE` (fuchsia) / `CONTROL · PENDING` / … — **in-app latch, not Cursor MCP** |
| `__studioMcpConnectionStatus()` | Snapshot `{ phase, label, … }` |
| PENDING timeout | Auto-pause + log; `__studioQaPendingTimeoutMs` override for prove |
| Agent `touch` / `start` | Agent lock; if manual/observe open without oversee → wipe |
| Observe Alarm | Escalate → agent + `observe-escalate` log |
| **Pause / Resume** | Freezes elapsed + capture. Status: `Paused` / `Capturing` (manual) — never “send a message” |
| While capturing | `Click: …` + `Screen → …` |
| Dump | Includes `sessionKind` (+ `gateMode` alias) + **`chatBubbleMotion`** frame series when sampled |

### Chat bubble motion (gate-open)

While the QA gate is open, chat pull-up / thinking→reply samples feed agents without DevTools:

| Surface | What |
|---------|------|
| Console | `[PLAYBACK_DIAG] chat-bubble-motion` (phase + y / opacity / layoutY / deltaY) |
| Overlay log | Lean lines: `Bubble r0 pull-up` · `Bubble r0 thinking→reply` · `Bubble JUMP ΔY=…` |
| Save Log / dump | Full frame series under `chatBubbleMotion.samples` + `summaries.chatBubbleMotion` (`jumps`, `maxAbsDeltaY`, `maxAbsDeltaTransformY`) |

Jump thresholds: transform `|Δy| > 4.5px` between rAF frames → `bubble.jump`. Layout `|ΔΔY| > 10px` (acceleration, not raw magnitude) → jump regardless of co-travel (scrollLock only exempts the separate scroll-chop check, not this one). Scroll `|ΔscrollTop|` large **without** pull-up lock → `bubble.chop`. **Self-test hard FAIL (2026-07-23, PP-14 closed):** `jumps=0`, `chops=0`, continuous transform y **and** continuous composited layout y (`continuousLayoutY` / `layout-continuous` check) — the earlier "layout ΔY during co-travel excluded from hard gate" loophole (only isolated transform `y` was checked for monotonic, non-jittery descent; layout was capped by magnitude only) is closed in `chatBubbleMotionSelfTest.ts`. Gate closed → **no** bubble samples.

**North star:** one Motion appear (`CHAT_PULL_UP`) for every progressive / send bubble; thinking exit opacity-only same duration; co-travel camera so the message finishes already in view ([MOTION.md](../product/MOTION.md) · [CHAT_PAGE_RAILS.md](../projects/boots-pharmacy/features/CHAT_PAGE_RAILS.md)).

Code: `playbackDiagChatBubbleMotion` · `chatMotion.ts` · dump: `agentTestingDump.ts`.

### QA bridge (PLAYBACK_DIAG ↔ overlay) — Arch 2026-07-20

**Decision:** One monitor path. Agents do **not** depend on the PlaybackDiagnostic **popup**. Capture lean monitor/error events into QA ring + overlay (`kind: playback-diag`; color from outcome: neutral info / amber notice / deep-red fail) and Save Log (`recentPlaybackDiagEvents`, `diagnosticFlashes`, `lastPlaybackDiagnostic`). Popup remains for PO eyes; `__studioConsumePlaybackDiagnostic()` dismisses after ingest.

| Event | Console | QA |
|-------|---------|-----|
| clear | `[PLAYBACK_DIAG] clear` | neutral `playback-diag · clear` |
| journey-reset / play-end / type-in-start | diag event | neutral info row |
| click FAIL / OFF-TARGET | click event | fail row |
| unexpected scroll Δ↑ | scroll | notice + `scroll-reversal` |
| PlaybackDiagnostic open | control-panel + flash | fail `playback-diag · DIAGNOSTIC — …` + dump flashes |

**Agents must** compare console filter `[PLAYBACK_DIAG]` vs Save Log / ring for the same session (SELF_TEST `console-qa-diag-sync`).

```js
window.__studioConsumePlaybackDiagnostic?.() // → { consumed, message, dismissed }
window.__studioPeekPlaybackDiagnostic?.()
```

Code: `playbackDiagQaBridge.ts` · `playbackDiagnosticFlash.ts` · dump fields in `agentTestingDump.ts`.

```js
window.__studioQaSessionKind?.()
window.__studioOpenQaLogger?.({ kind: "observe" })
window.__studioQaHandoff?.({ oversee: true })
window.__studioAskUserInQa?.("Does Book now look right?")
window.__studioMcpConnectionStatus?.()
window.__studioToggleQaLogger?.()
window.__studioAppendPoNote?.("pixel drift on PDP Book")
```

Code: `qaDiagGate.ts` · `agentTestingSession.ts` · `agentTestingMcpStatus.ts` · overlay: `agent-testing/`.

---

## Event schema (every beat — agentic + traditional)

| `kind` | Fields (key) | When |
|--------|----------------|------|
| `beat` | `beatId`, `beatKind`, `mode`, `screenBefore`/`After` | Beat enter / journey start |
| `target` | `selector`, `found`, `bbox` | Before click/type |
| `cursor` | `travelStart`/`End`, `onTarget`, `hoverApplied`, `press`/`release`, `graphicState`, `samples`, **`parked` + `parkReason`** | Travel / park / press — **park must be visible in console** |
| `scroll` | `host`, `beforeTop`/`afterTop`, `intoViewRequested`/`Done`, `retreat` | Camera move + retreat scrollIntoView |
| `chat-bubble-motion` | `bubble.{id,phase,y,opacity,layoutY,deltaY,jump…}` | Gate-open chat pull-up / thinking→reply (full series in dump `chatBubbleMotion`) |
| `click` | `clickOk`, `selector`, `bbox` | Robo-cursor click result |
| `type-in-*` | `chars`, `targetChars`, `typeOk` | Composer type-in |
| `skip` | `skipReason` | Skipped beat / missing CTA / dwell-only |
| `step-forward` / `step-back` / `retreat-sync` / `transport` | `beatId`, `detail` | Nav transport |
| `play-end` / `journey-reset` | `startBeatId`, `startScreenId` | **Never silent hub** — destination = selected journey start |
| `hub-nav` | `hubReason`, `hubStack`, `screenBefore`/`After` | **Every** hub open — reason + stack (PO leak forensics). Product = user Hub click only |
| `screen-enter` | `surface` (screenId), `remountCount`, `renderCount`, `createdRoot`, `opacity`, `visibility`, `motionPresence` | React screen host mount / re-render (book-step-2/3 blink forensics) |
| `nav-cross` | `navCross`, `instant`, `sameTab`, `screenBefore`/`After` | Wire-mount opacity crossfade **RUN** vs **SKIP** — same-tab journey steps must SKIP |
| `rec-capture` | `beatKind` (event kind), `selector`, `found`, `clickOk` (usable chain), `beatId`, `screenAfter`, `skipReason=chrome-target` | REC live capture — demo-click / scroll / chrome reject |
| `rec-compile` | `beatId` (journeyId), `counter=beats:N;clicks:M`, `skipReason` (gap CSV) | Compile → journey summary |
| `rec-replay` | `beatKind`, `selector`, `found`/`clickOk`, `counter=i/N`, `skipReason` (error) | REC ↺ step outcome |

Helpers: `playbackDiagRecCapture` / `playbackDiagRecCompile` / `playbackDiagRecReplay`. Bundle: `__studioPlaybackDiag().rec` → `{ capture, compile, replay, last* }`.

Filter: `[PLAYBACK_DIAG] rec-capture` · `rec-compile` · `rec-replay`.

### Sample console line

```text
[PLAYBACK_DIAG] cursor {
  detail: "PARKED — journey-park (park · traditional-plp)",
  beatId: "traditional-plp",
  cursor: { parked: true, parkReason: "journey-park", graphicState: "default", samples: 12 }
}
```

```text
[PLAYBACK_DIAG] journey-reset {
  detail: "jump-to-start → selected journey start (never hub)",
  startBeatId: "traditional-plp",
  startScreenId: "plp"
}
```

```text
[PLAYBACK_DIAG] nav-cross {
  detail: "nav-cross SKIP instant sameTab=true",
  sameTab: true, instant: true, navCross: false,
  screenBefore: "book-step-2", screenAfter: "book-step-2"
}
```

```text
[PLAYBACK_DIAG] screen-enter {
  detail: "screen-enter book-step-2 remount=1 render=3 … motion=no",
  remountCount: 1, renderCount: 3, motionPresence: false, opacity: 1
}
```

**Blink rule (book-step-2/3):** Same-tab Step Forward must log `nav-cross SKIP` (not `RUN`). `nav-cross RUN` while `sameTab=true` = transition leakage FAIL.

---

## Companion diags (always use together)

| API | Role |
|-----|------|
| `__studioPlaybackDiag` / `__studioAssertTypeIn` | Type-in + step/retreat + cursor/scroll/click log |
| `__studioCursorDiagnostics` | Robo-cursor path / park |
| `__protoStudioState` | Beat / counter / diagnosticOpen |
| `__protoRunAgenticStepForwardSmoke` | Full agentic step matrix |
| `__protoRunTraditionalStepForwardSmoke` | Traditional step matrix |
| `__protoRunRetreatSmoke` / `__protoRunTraditionalRetreatSmoke` | Retreat |
| `__studioAgentTestingOverlay` | Mid-flight QA shell — steps/colors/timer/sitrep/alarm/timeline ([RECORDING.md](./RECORDING.md) · `src/app/shell/agent-testing/`) |
| `__studioAgentTestingTakeover` | **Live** PO latch peek (`null` \| signal) — primary mid-flight path |
| `__studioPeekPoSignal` / `__studioConsumePoSignal` | Peek / consume+clear live latch (poll each beat) |
| `__studioDownloadAgentTestingDump` | Dump JSON (secondary — persistence/postmortem; last-N sessionStorage) |
| `__studioCursorDiagnostics` + scroll reveal | Camera / scroll host |

**Overlay ↔ diag:** PO **Alarm** = sequence / expected-steps mismatch (`ALARM_SEQUENCE_MISMATCH`). **Alarm / Cursor / Scroll** latch a live takeover signal first; dump is secondary. Auto `CURSOR_UNEXPECTED_DWELL` / optional scrollIntoView·path-deviation notices log here. Scroll CTA code: `SCROLL_ISSUE_REPORTED`. Filter: `[PLAYBACK_DIAG]` + `[AGENT_TESTING]`. Painpoints: [PAINPOINTS.md](../product/PAINPOINTS.md) PP-10.

**Mid-smoke poll (Quinn/Finn — mandatory):**

```js
// each beat / step of MCP smoke (manual agents):
const sig = window.__studioConsumePoSignal?.() // or peek via __studioAgentTestingTakeover
if (sig?.type === "alarm") {
  // pause play / investigate progressive disclosure — do NOT keep stepping blind
  console.warn("PO Alarm", sig.code, sig.beat, sig.diagSnapshot)
}
```

**Wired into smoke helpers (R15 — 2026-07-20):** `pollSmokePoSignal` (`src/app/shell/smokePoSignalPoll.ts`) runs **each beat** inside:

| Smoke | Window API |
|-------|------------|
| Agentic step-forward | `__protoRunAgenticStepForwardSmoke` |
| Traditional step-forward | `__protoRunTraditionalStepForwardSmoke` |
| Agentic Play → start | `__protoRunAgenticPlaySmoke` |
| **Full Play prove (KEEP overlay, universal)** | `__studioRunFullPlayProve` / `__protoRunFullPlayProve` (`{ journeyId \| experience }`) |
| **Thin presets** | `__studioRunAgenticFullPlayProve` · `__studioRunTraditionalFullPlayProve` |
| Traditional Play → start | `__protoRunTraditionalPlaySmoke` |
| Home Play (chat handoff) | `__protoRunHomePlaySmoke` |

On `type:'alarm'|'cursor'|'scroll'`: pause Play → **fail** result with `reason: "po-<type>:<code>"`, `poSignal` (+ `diagSnapshot`).

**Official overlay test & bugfix process (HARD):**

1. **STOP** — consume latch; do not advance more beats.
2. **Understand** from `diagSnapshot` (+ console `[PLAYBACK_DIAG]`). If the agent does **not** know exactly what the PO flagged, **ask PO for follow-up details before guessing** — do not invent the bug.
3. **FIX** the reported issue.
4. **RESTART** the test and **prove that exact issue is gone**.
5. Continue journey until next PO signal or green end.

Smokes cannot auto-fix; orchestrator session owns the loop. Opt-in soft continue: `{ continueOnPoAlarm: true }` / `{ continueOnCursorScroll: true }` — still not “ignore.” Type-in: CJM cursor must stay visible (`type-in-park`); hidden → `CURSOR_HIDDEN_DURING_TYPEIN` + `[PLAYBACK_DIAG] cursor`.

**Note:** `__protoTriggerTransport` requires an active MCP session (`__protoRun*` / recording). UI Step buttons always work; for console step use a smoke runner or click the nav button. Helper arm coalesces identical transport rows on the overlay (no monotonous spam).

Harness journey smokes use **`resetToJourneyStart`** (key 1: `site-pilot` / `plp`) **after** the play-end assert for teardown — **never** `resetToHub`. Product continuous Play completion **stays on the finale** (`endBeatId` + `endScreenId`, counter N/N — never silent hub, never auto-rewind). Jump-to-start / Stop remain for **manual** rewind. Hub only via Hub nav click. Matching-tab `goToTab` skip is a FAIL class. Every hub open logs `hub-nav` with stack.

---

## Prove recipe (R11 — reuse `:5173` tab)

```js
window.__studioAgentTestingOverlay?.touch?.()
window.__studioPlaybackDiagClear?.()

// Site Pilot type-in (agentic CJM on):
// Jump to start → Step forward once → watch textarea grow → then:
window.__studioAssertTypeIn?.({ minSamples: 3, minChars: 8 })

// Full matrices (diag dump in return via __studioPlaybackDiag):
await window.__protoRunAgenticStepForwardSmoke?.({ timeoutMs: 600_000 })
await window.__protoRunRetreatSmoke?.()
await window.__protoRunTraditionalStepForwardSmoke?.()
await window.__protoRunTraditionalRetreatSmoke?.()
window.__studioPlaybackDiag?.()
```

**Traditional settle (2026-07-19):** After each Step, wait until transport is idle (`!isOnAir && !isPlaying`). Login chains into `book-location-pick` — early Step aborts mid-picker → stray Availability on `book-step2`.

**Play end → stay at finale (PO 2026-07-22; supersedes 2026-07-20 start-rewind):** Continuous Play finish **stays** on the last journey beat / N/N (not hub, not auto-jump to start). Diag: `play-end` only (`play-end → stay at journey end`) — **no** play-end `journey-reset`. Assert: `__studioAssertPlayEndedAtEnd({ endBeatId, endScreenId?, startBeatId? })`. Manual rewind = Jump-to-start (emits `journey-reset`). Step-forward on the last beat also stays (no complete/rewind). Smokes: `__protoRunTraditionalPlaySmoke` / `__protoRunAgenticPlaySmoke` (harness `resetToJourneyStart` **after** assert — never hub).

**PO Alarm mid-Play prove (R11 `:5173`):**

```js
window.__studioAgentTestingOverlay?.touch?.()
const run = window.__protoRunAgenticPlaySmoke?.({ timeoutMs: 90_000 })
// after Play is on-air (~2–4s), ring Alarm on the overlay
document.querySelector(".studio-agent-testing-overlay__alarm")?.click()
const r = await run
// expect: r.pass === false && r.reason?.startsWith("po-alarm:") && r.poSignal?.diagSnapshot
```

PASS criteria:

1. No `diagnostic-on-step-1` / no playback diagnostic card mid-smoke  
2. `__studioAssertTypeIn()` PASS on agentic home step  
3. Retreat smoke PASS (agentic + traditional) — `scroll.retreatIntoView ≥ 1` in diag  
4. Chat: top fade under SitePilot bar + composer-edge fade; sticky pad; scrollIntoView host `.chat__column`  
5. Cursor park lines appear in console on traditional idle (`PARKED — …`)  
6. Play/end/reset → `startBeatId` of **selected** journey; `screen≠hub`

---

## Auto-Rule

**R13 `playback-diag`** — document + window APIs must exist; type-in skip is a FAIL class; step/retreat must emit diag (incl. cursor park + retreat scrollIntoView). See [STUDIO_AUTO_RULES.md](../product/STUDIO_AUTO_RULES.md).

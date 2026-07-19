# PLAYBACK_DIAG — console contract

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
| Make-retired selectors | `diagnostic-on-step-1` / transport-no-op | Hidden Make DOM wins `querySelector` |
| Scroll host | Wrong scroll / sticky pad | Chat sole host is `.chat__column` |
| Fade removed | Bubbles hard-edge under bar / composer | Composer + under-bar wash dropped |
| Cursor opaque | “Did the cursor do its job?” | Diag only logged type-in/step labels — no target/bbox/park |
| Hub reset | Play/end lands hub | `goToTab` left `hubOpen=true` |
| Agentic CTAs | Chat skips progressive clicks | CTA frameIndex off-by-one after React |

**Rule:** Prefer under-match Make over inventing chrome — but **do not** skip director type-in for convenience. Trust `[PLAYBACK_DIAG]` once it logs every beat.

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

window.__studioAssertPlayEndedAtStart?.({ startBeatId, startScreenId })
// → FAIL if hub / wrong beat / no play-end

// Legacy aliases (same functions):
window.__protoPlaybackDiag?.()
window.__protoAssertTypeIn?.()
window.__protoAssertPlayEndedAtStart?.()
```

Filter DevTools console: `[PLAYBACK_DIAG]`.

---

## Event schema (every beat — agentic + traditional)

| `kind` | Fields (key) | When |
|--------|----------------|------|
| `beat` | `beatId`, `beatKind`, `mode`, `screenBefore`/`After` | Beat enter / journey start |
| `target` | `selector`, `found`, `bbox` | Before click/type |
| `cursor` | `travelStart`/`End`, `onTarget`, `hoverApplied`, `press`/`release`, `graphicState`, `samples`, **`parked` + `parkReason`** | Travel / park / press — **park must be visible in console** |
| `scroll` | `host`, `beforeTop`/`afterTop`, `intoViewRequested`/`Done`, `retreat` | Camera move + retreat scrollIntoView |
| `click` | `clickOk`, `selector`, `bbox` | Robo-cursor click result |
| `type-in-*` | `chars`, `targetChars`, `typeOk` | Composer type-in |
| `skip` | `skipReason` | Skipped beat / missing CTA / dwell-only |
| `step-forward` / `step-back` / `retreat-sync` / `transport` | `beatId`, `detail` | Nav transport |
| `play-end` / `journey-reset` | `startBeatId`, `startScreenId` | **Never silent hub** — destination = selected journey start |

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

**Overlay ↔ diag:** PO **Alarm** = sequence / expected-steps mismatch (`ALARM_SEQUENCE_MISMATCH`). **Alarm / Cursor / Scroll** latch a live takeover signal first; dump is secondary. Auto `CURSOR_UNEXPECTED_DWELL` / optional scrollIntoView·path-deviation soft-fails log here. Scroll CTA code: `SCROLL_ISSUE_REPORTED`. Filter: `[PLAYBACK_DIAG]` + `[AGENT_TESTING]`. Painpoints: [PAINPOINTS.md](../product/PAINPOINTS.md) PP-10.

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
| Traditional Play → start | `__protoRunTraditionalPlaySmoke` |
| Home Play (chat handoff) | `__protoRunHomePlaySmoke` |

On `type:'alarm'`: pause Play (toggle transport) → **fail** result with `reason: "po-alarm:ALARM_SEQUENCE_MISMATCH"`, `poSignal` (+ `diagSnapshot`). Cursor/Scroll = soft-fail + `[PLAYBACK_DIAG]` log (matrix continues). Opt-in soft Alarm: `{ softFailPoAlarm: true }`.

**Note:** `__protoTriggerTransport` requires an active MCP session (`__protoRun*` / recording). UI Step buttons always work; for console step use a smoke runner or click the nav button. Helper arm coalesces identical transport rows on the overlay (no monotonous spam).

Harness `resetToHub` after smokes is **labeled harness-only** — product Play/end/reset must stay on journey start.

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

**Play end → CJM start (2026-07-20):** Product Play finish returns to the first journey beat (not hub, not stuck on last). Diag: `play-end` + `journey-reset` + `__studioAssertPlayEndedAtStart({ startBeatId, startScreenId })`. Smokes: `__protoRunTraditionalPlaySmoke` / `__protoRunAgenticPlaySmoke` (harness may still `resetToHub` after assert).

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

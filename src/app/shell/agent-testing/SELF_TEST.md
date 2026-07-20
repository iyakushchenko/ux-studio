# QA overlay — dual-role self-test (restartable)

**Prove URL:** `http://127.0.0.1:5173/` only (`strictPort`).  
**Catalog:** [`agentTestingSelfTest.scenarios.ts`](./agentTestingSelfTest.scenarios.ts)  
**Lean runner:** `window.__studioRunQaSelfTestSmoke?.()` → pure session checks + paced DOM probe + **RESULT finale line**.  
**Doctrine:** [PAINPOINTS.md](../../../../docs/product/PAINPOINTS.md) **PP-13** · [README.md](./README.md)

The QA overlay is **load-bearing** for mid-flight agent work. Do not claim Studio/product green without a recent self-test when the overlay changed.

---

## Pace (near real-life, slightly faster)

| Constant | Default | Role |
|----------|---------|------|
| `QA_SELF_TEST_STEP_MS` | **350** | Between actions |
| `QA_SELF_TEST_SETTLE_MS` | **900** | After open (MCP flash) |
| `QA_SELF_TEST_CLEAR_MS` | **250** | After forceClear |

Override: `window.__studioQaSelfTestPaceMs = { step: 400, settle: 1000 }`.

---

## Dual roles

### USER (Observe)
```js
window.__studioForceClearAgentTestingOverlay?.()
window.__studioOpenQaLogger?.({ kind: "observe" })
// CAPTURE on — demo cursor follows pointer; clicks log 1:1 (no coalesce)
// Alarm = escalate → agent + latch
```

### AGENT
```js
window.__studioAskUserInQa?.("Does Book now look right?") // → PENDING
// User types Message + Send → Reply in log; PENDING clears
window.__studioAgentTestingOverlay?.appendFinale?.("pass", "12/12 checks")
window.__studioForceClearAgentTestingOverlay?.()
```

---

## Scenario checklist (trust = must PASS)

| ID | Trust | How to prove |
|----|-------|--------------|
| observe-open-capture | Y | Observe → Observing + MCP OBSERVE |
| observe-page-click-log | Y | Dense clicks → one row each (no ×N coalesce) |
| observe-pointer-follow | Y | Demo cursor tracks mousemove while observe+capturing |
| observe-alarm-escalate | Y | Alarm → agent + latch |
| observe-unlock | Y | unlockObserve → observe |
| ask-pending-reply | Y | Ask → PENDING; Message/Send → Reply + not PENDING |
| handoff-oversee-keeps-note | Y | oversee keeps note |
| handoff-wipe-clears-note | Y | wipe clears note |
| refresh-mid-control | Y | Reload restores agent (+ PENDING) |
| control-border-10px | Y | CONTROL/PENDING/ERROR inset **10px** under modal |
| rec-observe-preserve | Y | StartRecording keeps observe |
| save-log-live-snapshot | Y | Save Log while capturing → current log + selectors |
| save-log-selector-depth | Y | Dump click rows include `selector` / `dataStudioAction` |
| duration-ms-sane | Y | After Pause/Alarm, durationMs ≤ 10min (no ~1.7e9s) |
| cjm-beat-honesty | Y | Active `rec-*` → Beat n/3 not orchestra Steps 1/11 as Beat |
| session-finale-line | Y | `RESULT · PASS/FAIL — …` before teardown |
| no-ghost-obs-when-closed | Y | softClose/forceClear → header MCP hint hidden; no OBS/CTRL; `studioMcpStatus` cleared |
| mcp-diode-observe | Y | Observe open → fuchsia diode + `MCP — OBSERVE` |
| mcp-diode-control | Y | Agent handoff → green diode + `MCP — CONTROL` (+ gold 10px) |
| mcp-diode-pending | Y | AskUser → blue pulse diode + PENDING |
| dual-message-bridge | Y | Ask twice → two prompts; two replies clear PENDING |
| observe-rec-cjm-play | Y | REC+OBSERVE → Add CJM → Play while observe logs clicks |

---

## Stress marathon matrix (15–25) — run via MCP

Run in one session at `http://127.0.0.1:5173/` (reuse tab). Pace ~350–900ms. After each fail: STOP → fix → restart that scenario.

| # | Combo | Expect |
|---|-------|--------|
| 1 | OBSERVE open + settle | phase observe; Session has Screen |
| 2 | Dense product clicks (QV→Close→Book) | ≥3 Click rows; no coalesce merge |
| 3 | mousemove while observing | demo cursor follows (not parked) |
| 4 | Pause → Resume | system pause/resume lines; clicks resume |
| 5 | REC start while OBSERVE | kind stays observe |
| 6 | Stop REC → Add as CJM | journey id `rec-*` listed |
| 7 | ApplyJourney(rec) + CJM on | Session **Beat** uses journey beatCount |
| 8 | Play while OBSERVE | Click + Screen → in log |
| 9 | Save Log mid-capture | dump reason manual; log has selector |
| 10 | AskUser → PENDING | border blue 10px; status PENDING |
| 11 | Message/Send reply | Reply row; PENDING clears → CONTROL/OBSERVE |
| 12 | Dual Ask + dual Reply | two prompts; two replies |
| 13 | Observe Alarm | escalate agent + latch + gold 10px |
| 14 | unlockObserve | back to observe |
| 15 | handoff wipe | log cleared |
| 16 | handoff oversee | log kept |
| 17 | Quick View under CONTROL | gold 10px still visible |
| 18 | SoftClose + reopen | fresh session |
| 19 | `__studioRunQaSelfTestSmoke` | ok + RESULT finale line |
| 20 | forceClear | overlay gone; latch wiped |
| 21 | Chrome nav click | ignored (not product Click) |
| 22 | duration after Alarm | durations human (ms/s), not e9 |
| 23 | Pending timeout (optional short `__studioQaPendingTimeoutMs=2000`) | auto-pause line |
| 24 | Save Log after Alarm | current session not stale-only |

```js
const r = await window.__studioRunQaSelfTestSmoke?.()
console.table(r?.checks)
// Agents closing any session:
window.__studioAgentTestingOverlay?.appendFinale?.(r?.ok ? "pass" : "fail", "summary")
```

---

## Exhaustion / confidence

Re-run waves until last 2–3 find only nits.  
**Sole-brain residuals (still NO for absolute sole brain):** selector ≠ full CDP path; Steps vs Beat both shown when playlist expands; chrome outside nav may still tag product.

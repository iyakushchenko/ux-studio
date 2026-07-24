# QA logging & playback recipe (HARD)

Fresh Manual capture clears any completed-run/finale seal before accepting
events. A previous completed session may never make a new `CAPTURE` state look
live while silently dropping rows.

**Status:** Locked (PO 2026-07-21)  
**Owners:** Arch · Finn · Quinn · Bea  
**Related:** [PLAYBACK.md](./PLAYBACK.md) · [PLAYBACK_DIAG.md](./PLAYBACK_DIAG.md) · [RECORDING.md](./RECORDING.md) · [CJM_RECORD_PLAY_EDIT.md](./CJM_RECORD_PLAY_EDIT.md) (Record/Play/Edit = guitar tabs) · [CHAT_PAGE_RAILS.md](../projects/boots-pharmacy/features/CHAT_PAGE_RAILS.md) · [agent-testing/README.md](../../src/app/shell/agent-testing/README.md)

**Purpose:** Stop agents from “fixing” QA/perf by killing product type-in — or flooding the QA overlay with one log line / sample per typed character. Also capture Play≡Step + known hang/camera rails.

## Human log vs technical evidence

- **Engine rule:** formatters contain no project, screen, journey, or English CTA dictionaries. They title-case arbitrary IDs and use neutral `Activated` unless semantic DOM/recording metadata proves a stronger verb.
- Projects/recordings own nouns and accessible labels; the Guitar-Tab engine owns generic verbs, ordering, counters, outcomes, and evidence.
- The visible log is product-first: human action/screen names, failures, and one sealed completion result.
- Healthy cursor state changes, camera traces, bubble settle frames, and reset plumbing remain in the downloaded JSON rather than the primary chronology.
- Raw `label`, selector, action, beat, and touchpoint fields remain separate from `displayLabel`; long strings keep the dump's documented safety clipping.
- Inferred time between rows is stored as `durationKind: "since-previous"` and is not presented as action duration.
- A full Play prove must seal `RESULT · PASS — Completed N/N · returned to journey start`; the current post-reset `1/N` state must not replace that result.
- Type-in start/end/skip totals are durable across the capped diagnostic event ring.

---

## Play ≡ Step (non-negotiable)

| Rule | Meaning |
|------|---------|
| **Continuous Play = Step** | Play is the **same** beat/script path as step-by-step, automated. There is **no** separate “dump-all / skip type-in / skip motion” Play path. |
| **Do not invent a fast path** | Prefer under-match Make over inventing chrome — never skip director type-in for convenience. |
| **CJM-on chat enter** | First Sarah message (**q0**) only on enter, then **progressive** disclosure (thinking → bubbles / CTAs). |
| **CJM-off chat** | Saved-chat load: blank interim → full thread → smooth scroll to bottom. Full rails: [CHAT_PAGE_RAILS.md](../projects/boots-pharmacy/features/CHAT_PAGE_RAILS.md). |
| **`CHAT_LOADING_DUMP_ALL` watch** | **CJM-off only** (`agentTestingChatLoadingWatch`). Must **not** Alarm during CJM-on Play/SF when frames advance fast — that is progressive reveal, not saved-chat dump. |

Transport: `useJourneyPlayback` / scenario prelude — same runners for Play and Step Forward.

---

## Type-in animation vs QA logging (do not conflate)

| Surface | Required? | Notes |
|---------|-----------|--------|
| **Page composer type-in** (Home / Chat) | **REQUIRED** product behavior | Letter-by-letter animate via `sitePilotHome` / `sitePilotChat` (`setReactTextareaValue` + delay). **Never disable / skip / instant-fill** to “fix” QA. |
| **Per-character log lines in QA overlay** | **FORBIDDEN** | Perf + noise. One typed char must **not** become one QA sitrep / playback-diag row. |
| **Per-letter QA / dump samples** | **FORBIDDEN** as event spam | Dump signal: `summaries.typeIn.samples ≈ 249` with `starts/ends = 2` = every char sampled into the ring. Gate emit — keep animation. |
| **Type-in diag samples (assert)** | Sparse in-memory OK | `playbackDiagTypeInProgress` keeps **checkpoints** (0 / every 16 / final) for `__studioAssertTypeIn` — **not** every char, and **must not** `push()` events. |
| **QA / PLAYBACK_DIAG emit** | **At most** start + done | `type-in-start` + `type-in-end` (and `type-in-skip` = FAIL class). **No** `type-in-progress` into ring / overlay / console spam. |

### Code map (where agents derail)

| Do this | Not this |
|---------|----------|
| Gate `playbackDiagTypeInProgress` → samples only (`playbackDiag.ts`) | Delete / skip `simulateSarahTypingInComposer` / `simulateSarahHomeTyping` loops |
| `shouldMirrorPlaybackDiagToQa`: block `type-in-progress`; allow start/end | Mirror every progress / cursor tick into overlay |
| Diag mirror: filter progress noise (`agentTestingDiagMirror.ts`) | Kill composer animation to quiet the log |
| Cursor guard: park + hidden latch; no per-N-char visibility spam | Remove `parkDemoCursorForTypeIn` / type-in animation |

---

## Chat camera — thinking must enter view

**Rail:** Any **new** chat content — including **thinking** bubbles — must scroll/camera into view under the composer dock.

| Bug | Cause | Fix |
|-----|-------|-----|
| Thinking not pulled up | Settle scrolled to last `[data-studio-chat-revealed="true"]` while thinking paints `revealed=false` | `ChatScreen` settle uses `resolveChatCameraTarget` (**thinking first** → CTA → last revealed) |
| Always pin / fight camera | Settle + pin used `force` host-end during `kind:camera` dwell or over eased target scrolls | Yield via `shouldYieldChatAutoCamera`; co-travel `coTravel: true`; no blind always-pin |

Code: `ChatScreen.tsx` settle · `resolveChatCameraTarget` · `setCameraBeatDwellActive` · [CHAT_PAGE_RAILS.md](../projects/boots-pharmacy/features/CHAT_PAGE_RAILS.md).

Also: suppress `scroll-path-deviation` while chat pull-up holds `scrollLock` (`playbackScrollMonitor.ts`) — intentional co-travel is not a FAIL.

### Chat camera QA trackers (lean)

Mirrored into QA chat (deduped ~450–500ms — not TRACE flood):

| Detail prefix | Human label |
|---------------|-------------|
| `chat-camera:wait` | Chat camera: wait |
| `chat-camera:thinking` | Chat scroll to thinking |
| `chat-camera:pin-bottom` | Chat pin bottom |
| `chat-camera:host-end` | Chat host-end |
| `chat-camera:target` | Chat camera: target |
| `chat-camera:skip-dwell` | Chat camera: wait (settle skipped) |
| `chat-camera:skip-ease` | Chat camera: ease in flight |
| `camera-beat:target-unusable` | Skipped hidden/retired target — wait only |

Emit: `logChatCameraTracker` in `playbackScroll.ts`. Mirror: `playbackDiagQaBridge`.

---

## Demo cursor travel hang (script-timeout)

**Proven (PO full agentic Play):** continuous Play died at book-step-3 `confirmation` with **`script-timeout` 45s** because **framer-motion `controls.stop()` does not settle `await controls`**. Mid-travel abort stranded director scripts.

| Fix | Where |
|-----|--------|
| Travel `await` settles on `onComplete` / abort poll / ceiling — **never** rely on `stop()` alone | `demoCursor.ts` |
| Skip `scroll-path-deviation` while chat pull-up `scrollLock` | `playbackScrollMonitor.ts` |

After fix: full Play **PASS 22/22**. Do not invent green past real timeouts.

---

## QA tool while proving

1. Keep **AGENT TESTING** overlay **visible** for the whole Play (gate open).  
2. **One sequence:** playback diag events that matter land in the **main QA chat** (chronological with clicks / transport / RESULT) — not a separate cryptic PLAYBACK_DIAG pane.  
3. Expect lean rows: clicks, nav, FAIL/chop/JUMP, type-in **start/end**, skips, scroll-reversal, play-end — **not** a waterfall of TRACE frames / cursor park chatter / 249 typeIn samples.  
4. **Do not invent green.** Bubble-chop, script-timeout, Alarm, cursor-hidden-during-type-in, scroll-reversal notices are **real** until fixed. Tests alone ≠ PROVEN.
5. Mid-flight Save Log dumps may show **no RESULT** (Play still running) — read `sitrepLine` / `timeline` / `summaries` honestly.  
6. **Save Log** stays enabled while capturing **and** after **Keep open → Complete**.  
7. **ALWAYS CLEAR is code law** — `requireFreshQaSession(title)` (`forceClear` + `start`, **no skip flag**). ArmRecCapture / RecNewCjmProve / FullPlayProve call it first; `startRecording` re-asserts if bypassed. Smokes wipe too.  
8. **Leave / return (HARD):** when the agent disconnects to Cursor chat / elsewhere, **pause** the QA session; on return **resume** and **read Message latch** before continuing. See § Agent leave / return below.  
9. **Dump-on-FAIL habit:** on Alarm / hard FAIL / chop / script-timeout — **Save Log** immediately (Keep open → Complete still allows Save Log). Do not invent green from memory.  
10. **Friendly diag in chat:** mirrored playback-diag rows use human labels in the main QA sequence (not a cryptic side pane).
11. **Completed-session autosave:** every completed QA session enters the capped twenty-session evidence history. Manual **Save Log** remains the explicit single-session JSON download; `__studioDownloadQaEvidencePack()` exports the history plus parity verdict without requiring the agent to re-read raw logs.

### Playback diag → QA chat (mirrored vs suppressed)

| Mirrored into QA chat (human labels) | Suppressed (dump/console only) |
|--------------------------------------|--------------------------------|
| Type-in **start** / **end** / **skip** | `type-in-progress` (per-char) |
| Click miss | Healthy step-forward / routine transport |
| Cursor off-target / hidden during typing / **ABRUPT-PARK** | Routine `PARKED` chatter without engine tag |
| Cursor engine milestones (`park-rest` / `type-in-hold` / cancel — deduped) | Cursor remove / abort spam |
| Scroll jumped the wrong way (reversal) | Small camera nudges / origin scrolls |
| **Chat camera** wait / thinking / pin / host-end (deduped) | Bubble TRACE / frame rAF samples |
| Chat bubble **JUMP** / **CHOP** / script-timeout | Routine beat landings |
| Play finished / journey reset / hub-nav | Helper peek / is-open polls |
| PO Alarm / diagnostic FAIL | (same — always mirror) |

**Label examples:** `remove` → “Cursor cleared”; `type-in-park` → “Cursor parked for typing”; `ABRUPT-PARK` → “Cursor teleported to park — FAIL”; `REST-ON-SUBMIT` → “Cursor left on submit — FAIL”; `cursor-engine:park-rest` → “Cursor eased to rest”; `cursor-engine:stay-on-play` → “Cursor stayed at last click (Play)”; scroll-reversal → “Scroll jumped the wrong way”; bubble-chop → “Chat bubble motion cut short”. Machine `kind` stays on ring `detail` / data attrs.

### Cursor engine QA trackers (lean)

Mirrored into QA chat (deduped ~480ms — not park-spam flood):

| Detail prefix | Human label |
|---------------|-------------|
| `cursor-engine:park-rest` | Cursor eased to rest |
| `cursor-engine:park-force` | Cursor parked (force) |
| `cursor-engine:type-in-hold` | Cursor parked for typing |
| `cursor-engine:cancel-settle` | Cursor travel cancelled — settled |
| `cursor-engine:park-on-step` | Cursor parked after step |
| `cursor-engine:stay-on-play` | Cursor stayed at last click (Play) |
| `cursor-engine:park-from-submit` | Cursor parked away from submit |
| `ABRUPT-PARK` / `cursor-engine:abrupt-park` | Cursor teleported to park — FAIL |
| `REST-ON-SUBMIT` / `cursor-engine:rest-on-submit` | Cursor left on submit — FAIL |

Emit: `logCursorEngineTracker` in `demoCursorEngine.ts`. Mirror: `playbackDiagQaBridge`. Policy: [PLAYBACK.md](./PLAYBACK.md) § Cursor engine SSoT — **step parks / Play stays / never rest on submit**.

### Dump fingerprint (PO 2026-07-20T21:26:23Z manual)

| Field | Value | Read as |
|-------|-------|---------|
| Title | PO prove — FULL agentic Play | Mid-flight Save Log (not finale) |
| Sitrep | Steps **12/21** · `avail-continue` · chat | Play not finished — no RESULT row |
| `typeIn` | starts **2** / ends **2** / samples **249** | **FORBIDDEN** per-letter sampling class |
| Bubble motion | jumps **0** / chops **0** | No bubble-chop in this dump |
| Notice | 2× `scroll-reversal` (eased Δ) | Open / watch — pull-up co-travel noise |
| Helper spam | 52/80 log = peek/is-open polls | Agent poll noise (not product FAIL) |
| script-timeout | **absent** in this dump | Separate prove: confirmation hang → cursor `stop()` fix |

### Dump fingerprint (PO 2026-07-20T22:58:41Z — Traditional smoke)

| Field | Value | Read as |
|-------|-------|---------|
| Mode | **traditional** · CJM **on** · session `traditional-play-smoke` | Primary Traditional smoothness evidence |
| Peak | Play finished → stayed at finale (PLP→…→details) | Playlist **completed**; sitrep at Save Log = **N/N** on finale (not rewound) |
| RESULT | **absent** | Smoke tears down overlay — use keep-overlay prove when available |
| Clicks | Bookmark → Book now → PDP Book → Sign in → **21/15:30** → Reserve → Open Appts → View Details | No date/time re-click; location Continue not in click log |
| Notice | **3×** scroll-reversal (Δ−922 / Δ−1207 / Δ−88) | Camera origin yank — **not green** smoothness |
| Type-in | 0 | Expected (no Traditional composer type-in) |

Sitrep audit: [TRADITIONAL_CJM_UX_2026-07-21.md](../projects/boots-pharmacy/audits/TRADITIONAL_CJM_UX_2026-07-21.md).

---

## Prove recipe (universal — any CJM)

**Localhost only:** `http://localhost:5173/` (`strictPort`; never invent 5174+). One `npm run dev`. Chrome MCP: `list_pages` → reuse tab.

**REC robustness prove (HARD — NEW CJM only):** agents MUST use:

```js
await window.__studioRunRecNewCjmProve?.({ experience: "traditional" })
// → { pass, journeyId, recLive, peak, errors }
// ALWAYS CLEAR → arm REC (CREATE NEW + Start) → short new path → Add as CJM → Play THAT journeyId
// FAIL if rec never live or journeyId missing
// FORBIDDEN: only playing agentic-cjm / traditional-cjm / an old rec-* as “REC prove”
// Latch: await window.__studioArmRecCapture?.() · window.__studioAssertRecLive?.()
```

**Full continuous Play prove (HARD — one engine):** agents MUST prefer:

```js
await window.__studioRunFullPlayProve?.({ experience: "agentic" })
// or: await window.__studioRunFullPlayProve?.({ journeyId: "traditional-cjm" })
// or: await window.__studioRunFullPlayProve?.({ experience: "traditional", timeoutMs: 180_000 })
// alias: window.__protoRunFullPlayProve
// → { pass, peak, end, errors, journeyId, experience } — ALWAYS forceClear + fresh arm
//   + Play + peak assert + play-end at end + pauseForAgentLeave; overlay STAYS open.
// Thin presets (same core, no duplicated logic):
//   __studioRunAgenticFullPlayProve / __studioRunTraditionalFullPlayProve
// Do NOT ad-hoc Play / do NOT prefer *PlaySmoke (tears down overlay).
```

### Agentic preset

```js
await window.__studioRunFullPlayProve?.({ experience: "agentic" }) // default timeoutMs 300_000
// thin: window.__studioRunAgenticFullPlayProve?.()
```

Example URL:

```text
http://localhost:5173/?project=boots-pharmacy&screen=home&persona=sarah-jenkins&cjm=on&experience=agentic
```

0. **Reset QA before each test (ALWAYS CLEAR = code law)** — `requireFreshQaSession(title)` = `forceClear` + fresh `start` (**no skip flag**). Entry points: `__studioArmRecCapture`, `__studioRunRecNewCjmProve`, `__studioRunFullPlayProve`. Bypass guard: `startRecording` → `ensureQaSessionForRecCapture`. Smoke `withMcpTestSession` also wipes. Never reuse a dirty overlay. **Do not invent** a parallel ad-hoc Play/REC path that skips this.  
0b. **URL `modal=` is navigable state** — if Continue opens `modal=choose-pharmacy`, drain (pick pharmacy) before the next beat; QA logs `RecModalOpen` / `RecModalPharmacyPick`. Never rush past.  
0c. **Human REC pace** — `REC_USER_PACE_MS` (read / before CTA / after click / scroll-stop ≥2.4s). Prove helper enforces; not optional.  
0d. **Fast Play QA is not fast REC** — `Fast test current CJM` / `Fast test all CJMs` compress narrative dwell, cursor travel, and typing cadence while preserving every declared UI-transition floor. They keep the same journey, selectors, clicks, modal drains, state/counter alignment, readiness polling, failure alarms, and terminal PASS/FAIL. Bubble jump/chop and cursor-hidden evidence are hard failures in both timing modes. REC capture remains human-paced because timing is part of the recorded artifact.
1. Open QA logger / agent overlay (gate open) — only after step 0.  
2. Start **continuous Play** (same path as Step).  
3. **Eyes on composer:** Home then Chat type-in must animate letter-by-letter.  
4. **Eyes on thinking:** new thinking bubbles must camera into view (not stuck under dock).  
5. **Eyes on QA log:** no one-line-per-letter spam; at most start + done for type-in. Dump `typeIn.samples` must not track every char as events.  
6. Console: `[PLAYBACK_DIAG]` should not flood `type-in-progress` per char.  
7. After type-in: `__studioAssertTypeIn?.()` still PASS (sparse in-memory samples).  
8. Full Play should reach **22/22** without `script-timeout` on confirmation.  
9. Poll `__studioConsumePoSignal?.()` each beat (R15) — do not invent green past Alarm/chop.  
10. **Leave QA → `pauseForAgentLeave()`; return → `resumeForAgentReturn()`** (Message on arrival mandatory). **Guard rail:** if you forget, presence TTL (~8s) auto-pauses capture + Play.

---

## Prove recipe (Traditional CJM)

**Full Traditional continuous Play prove (HARD — keep overlay):** prefer universal API:

```js
await window.__studioRunFullPlayProve?.({ experience: "traditional" }) // default timeoutMs 180_000
// thin: window.__studioRunTraditionalFullPlayProve?.()
// alias: window.__protoRunTraditionalFullPlayProve
// → { pass, peak, end, errors } — forceClear + fresh arm + Play + peak
//   (13 with login, or 12 when Sarah login-skipped) + play-end at end
//   + pauseForAgentLeave; overlay STAYS open for Save Log.
```

**Smoke (tears down overlay):** `await window.__protoRunTraditionalPlaySmoke?.()` — Play → start assert; good for local smoke, **weak** for Save Log peak sitrep.

**Dump/log hygiene (2026-07-21):** click rows prefer `data-studio-action` / `data-studio-cal-*` selectors; consecutive duplicate `Journey reset to start` / notice QA rows are deduped (~900–1600ms). `summaries.click.ok` uses durable tallies (survives diag ring rotation).

**REC ⊕ QA (XOR):** REC live → QA capture auto-pauses + page click guard releases — product clicks must work; observe logger may stay open. Log: `REC live · QA capture paused (product clicks free)`.

**Prove-mode latch:** `__studioRunFullPlayProve` arms prove-mode so the 8s stale auto-pause cannot abort mid continuous Play; cleared in `finally`.

**Camera unusable:** hidden/retired targets soft-continue as QA row `Skipped hidden/retired target — wait only` (`camera-beat:target-unusable`).

Example URL:

```text
http://localhost:5173/?project=boots-pharmacy&screen=plp&persona=sarah-jenkins&cjm=on&experience=traditional
```

Eyes: no already-selected date/time re-click; Book Step 3 camera beat dwells then scrolls to Open Appointments; watch residual notices on play-end rewind ([TRADITIONAL_CJM_UX_2026-07-21.md](../projects/boots-pharmacy/audits/TRADITIONAL_CJM_UX_2026-07-21.md)).

---

## Agent leave / return (HARD — do not keep capturing while gone)

**Problem:** Agent leaves the QA tool session (Cursor chat, docs, elsewhere) but capture/Play keep running as if the agent is still watching.

**Default guard rail (auto-pause):** Presence heartbeat TTL = `QA_AGENT_AUTO_PAUSE_MS` (**8s**, same as ONLINE present window). When last touch is stale, overlay **automatically** pauses capture + halts Play (leave-equivalent: **no** `QA_PAUSE_HALT` / **no** `DIAGNOSTIC_ACK_STOP`). Chrome shows **Last seen Ns ago** (never green ONLINE while stale). Agents **still SHOULD** call leave/return explicitly; auto-pause is the belt when they forget. **Exception:** full Play prove (`beginQaProveMode`) skips auto-pause until prove ends.

| Moment | Call | Effect |
|--------|------|--------|
| **Leave** | `__studioAgentTestingOverlay.pauseForAgentLeave()` | Halt Play · `capturePaused` · presence **OFFLINE** · log `Agent leave · …`. Does **not** latch `QA_PAUSE_HALT` (Message latch stays free for PO). |
| **Stale (auto)** | *(none — heartbeat)* | After ~8s without `touch` / leave / return: same pause+halt · keep **Last seen** · log `Agent stale · auto-pause · …`. |
| **Return** | `__studioAgentTestingOverlay.resumeForAgentReturn()` | Presence **ONLINE** · **consume** any PO latch (Message / Alarm / …) · resume capture **only if** no Message work · return `{ consumedSignal, messagePendingWork, captureResumed }`. |

```js
// LEAVE — before switching to Cursor chat / other work
window.__studioAgentTestingOverlay?.pauseForAgentLeave?.()

// RETURN — first thing when coming back to the QA tab
const back = window.__studioAgentTestingOverlay?.resumeForAgentReturn?.()
if (back?.messagePendingWork) {
  // HARD: read note, investigate, fix, reply in QA, then Resume (Pause toggle / second return)
  console.log(back?.consumedSignal?.note)
  // … Message procedure (STOP → understand → FIX → reply) …
} else if (back?.consumedSignal) {
  // Alarm / Cursor / Scroll / etc. — branch on code before continuing
  console.log(back.consumedSignal.code, back.consumedSignal.note)
}
```

**Message on return (mandatory):** If PO Sent while you were gone, `messagePendingWork === true`, capture **stays paused**, and `consumedSignal.note` is the full Message. Do **not** continue prove work until handled. Offline PO Send also paints the resume card for Cursor paste (same hooks).

**Do not:** invent green past unread Messages; treat auto-pause as optional (it is the default guard rail); resume without reading Message latch.

---

## MCP glyph = in-app latch, not a literal "Cursor MCP attached" detector (HARD)

**Header nav + QA panel MCP icon** (silver = disconnected, green = connected) reflects the **in-app AGENT TESTING presence latch** (`agentTestingPresence.ts`), never a real browser signal that Cursor's Chrome DevTools MCP is attached. There is **no** web API to detect a remote CDP client debugging an already-open tab (`navigator.webdriver` only fires for browsers *launched* under automation, not for `list_pages`/`select_page` reuse of a normal tab per R11). Hover text always disambiguates: `(In-app testing latch (not Cursor MCP))`.

**Consequence:** a raw `click` / `evaluate_script` / `take_screenshot` via Chrome DevTools MCP does **not** by itself light the icon green — it stays honestly **disconnected** unless the latch was touched. Green requires one of:

- `window.__studioAgentTestingOverlay.touch(source?)` — "safe to call on every helper / DevTools evaluate"; does not bump nest, does not steal PO MANUAL/OBSERVE.
- Any of the existing arm/start helpers (`__studioArmRecCapture`, `startAgentTestingOverlay`, `__studioRunFullPlayProve`, etc.) which already call `touchQaAgentPresence` internally.

**Habit going forward:** when doing live MCP verification work outside a formal REC/Play prove helper (e.g. ad-hoc `evaluate_script`/`click` probing), call `.touch('<short-source>')` once at the start of the session so the icon honestly reflects "an agent is actively working the page" for the duration (8s heartbeat TTL — re-touch or use a prove helper for longer sessions).

---

## Autonomous QA suites (1–100 tests)

Submit once; the in-product runner owns sequencing and stops on the first non-pass:

```js
window.__studioStartQaSuite?.([
  "mcp-sanity",
  "qa-self-test",
  "play-agentic",
  "play-traditional",
], { suiteId: "release-core" })
```

Supported IDs include page probes, interaction maps, current/all-CJM playback, REC and QA self-tests; the product dropdown is the canonical catalog. Read compact state with `__studioGetQaSuiteStatus()`. Failure persists across refresh, latches QA, and stays on the failed test. After a fix, `__studioProceedQaSuite()` reruns that test before continuing. `__studioCancelQaSuite()` explicitly aborts. Never agent-loop individual cases.

**Save Log evidence contract:** completed autonomous dumps include `verdict` (pass/fail/incomplete), `suite` (profile, start/end, aggregate duration, per-test duration, failure if any), and compact per-CJM outcome data (`journeyId`, experience, speed, peak, elapsed, errors). A successful suite has no “QA Pause” priority hint: the final pause is intentional handoff hygiene, not a defect.

Global CJM warning **Run tests** and agent helper `window.__studioRunGlobalCompatibilityTests?.()` both start the canonical fail-fast `all-cjms` suite. The warning dialog supplies the static issue inventory and copy-ready aggregate diagnostic; the QA overlay remains execution evidence.

**Known blind spot (PP-47, read before trusting a green `all-cjms` run as proof of IxD or coverage):** this suite only asserts, per beat: each scripted click's target resolved and dispatched (`click.fail === 0` — [playJourneySmoke.ts](../../src/app/shell/playJourneySmoke.ts) ~L164-329), cursor stayed visible, no PO alarm/diagnostic-modal, the beat counter reached the expected peak N/N, and the run landed on the correct final beat/screen ([fullPlayProve.ts](../../src/app/shell/fullPlayProve.ts) `assertPeak`/`assertPlaybackPlayEndedAtEnd`, ~L355-395). It does **not** check computed styles, pending/loading attributes, or any other visual/animation outcome of a click — a click that dispatches successfully scores green regardless of what it visually produces. More importantly, it only scores what a beat's script *does*; an interactive control a beat's script never clicks produces zero diagnostics, so **omitted coverage is invisible to it** — adding a new interactive element (or forgetting to script a click for one) requires a human to notice and wire it into the journey script (`builtInJourneys.ts` / `traditional.ts` / the agentic scripts) by hand; the suite will not flag the gap. This is why the PDP wishlist heart's missing IxD (PP-45) and missing scripted click were never caught by a "suite green" run — see PP-47 for the full writeup. Same root shape as PP-44 (stale exact-match) but broader: PP-44 is about assertions going stale, this is about the suite being structurally unable to detect *absence*. **The omitted-coverage half now has a static gate:** `npm run check:cjm-coverage` (`scripts/check-cjm-interaction-coverage.mjs`, in `test:gates`) fails if a screen wires a stateful commit-pending control whose identifier is never referenced under `playback/`. The visual/IxD-assertion half (does a click actually produce the right animation state) is still unfixed — that needs runtime instrumentation, not a static gate.

## Failure classes (LESSONS)

| Class | Correct fix | Wrong fix |
|-------|-------------|-----------|
| Per-char type-in → QA flood / `samples≫starts` | Gate **logging** only (`playbackDiag` / QA bridge / mirror) | Skip type-in / instant-fill composers |
| Thinking not in view | `resolveChatCameraTarget` (thinking first) | Camera only to last `revealed=true` |
| Play dies `script-timeout` mid cursor travel | Settle travel await without relying on FM `stop()` | Raise timeout / skip confirmation script |
| QA perf “fix” | Lean emit | Kill Play motion |

---

## PERF (HARD — Play + QA open)

**Symptom:** Main-thread jank / unusable page during continuous Play with AGENT TESTING overlay open. Dump fingerprints: `chatBubbleMotion.count` hundreds, helper log ≈ peek/is-open polls, console waterfall of `[PLAYBACK_DIAG] chat-bubble-motion` / TRACE / cursor.

| Killer | Correct fix | Wrong fix |
|--------|-------------|-----------|
| Bubble **frame** → console every rAF | Sample dump frames (every Nth); **never** console frames; JUMP/CHOP still every-frame detect | Disable pull-up / skip motion |
| Camera **TRACE** → overlay every co-travel | Routine TRACE dump-sampled only; overlay/console = milestones + JUMP/CHOP/topup FAIL | Drop TRACE from Save Log entirely |
| QA log `replaceChildren` per event | Coalesce DOM rebuild to **one rAF** (`scheduleLogDomFlush`) | Remove overlay during Play |
| Agent **peek / is-open** helper rows | Mark `PeekPlaybackDiagnostic` / `IsPlaybackDiagnosticOpen` / `ConsumePlaybackDiagnostic` **read-only** (no touch-wrap log) | Ban peeks (breaks Save Log / poll) |
| Per-letter type-in samples | Already gated — keep animation | Kill composer type-in |

**Keep always:** real FAIL / bubble-chop / JUMP / Alarm / type-in start+end / Play≡Step path.

**Avail after chat (HARD — non-destructive overlay):** Opening Availability Tool must **not** hide/freeze/`display:none` the chat (or any) underlay. Popup sits on top; page beneath stays painted. Perf lever = solid `.studio-avail-scrim` (no `backdrop-filter`) only — **forbidden:** `content-visibility: hidden` / contain-strict chat freeze when `modal=choose-pharmacy` (PO 2026-07-22; prior FPS hack retired). Keep Save Log / type-in / friendly diag.

**Prove:** Play a stretch with QA open — page feels usable; console + overlay not flooding; composers still type letter-by-letter. After chat → open avail — chat underlay still visible through/under scrim; avail usable.

# QA logging & playback recipe (HARD)

**Status:** Locked (PO 2026-07-21)  
**Owners:** Arch · Finn · Quinn · Bea  
**Related:** [PLAYBACK.md](./PLAYBACK.md) · [PLAYBACK_DIAG.md](./PLAYBACK_DIAG.md) · [RECORDING.md](./RECORDING.md) · [CJM_RECORD_PLAY_EDIT.md](./CJM_RECORD_PLAY_EDIT.md) (Record/Play/Edit = guitar tabs) · [CHAT_PAGE_RAILS.md](../projects/boots-pharmacy/features/CHAT_PAGE_RAILS.md) · [agent-testing/README.md](../../src/app/shell/agent-testing/README.md)

**Purpose:** Stop agents from “fixing” QA/perf by killing product type-in — or flooding the QA overlay with one log line / sample per typed character. Also capture Play≡Step + known hang/camera rails.

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

Code: `ChatScreen.tsx` settle · `resolveChatCameraTarget` · [CHAT_PAGE_RAILS.md](../projects/boots-pharmacy/features/CHAT_PAGE_RAILS.md).

Also: suppress `scroll-path-deviation` while chat pull-up holds `scrollLock` (`playbackScrollMonitor.ts`) — intentional co-travel is not a FAIL.

---

## Demo cursor travel hang (script-timeout)

**Proven (PO full agentic Play):** continuous Play died at book-step-3 `confirmation` with **`script-timeout` 45s** because **framer-motion `controls.stop()` does not settle `await controls`**. Mid-travel abort stranded director scripts.

| Fix | Where |
|-----|--------|
| Travel `await` settles on `onComplete` / abort poll / ceiling — **never** rely on `stop()` alone | `demoCursor.ts` |
| Skip `scroll-path-deviation` while chat pull-up `scrollLock` | `playbackScrollMonitor.ts` |

After fix: full Play **PASS 21/21**. Do not invent green past real timeouts.

---

## QA tool while proving

1. Keep **AGENT TESTING** overlay **visible** for the whole Play (gate open).  
2. **One sequence:** playback diag events that matter land in the **main QA chat** (chronological with clicks / transport / RESULT) — not a separate cryptic PLAYBACK_DIAG pane.  
3. Expect lean rows: clicks, nav, FAIL/chop/JUMP, type-in **start/end**, skips, scroll-reversal, play-end — **not** a waterfall of TRACE frames / cursor park chatter / 249 typeIn samples.  
4. **Do not invent green.** Bubble-chop, script-timeout, Alarm, cursor-hidden-during-type-in, scroll-reversal soft-fails are **real** until fixed. Tests alone ≠ PROVEN.  
5. Mid-flight Save Log dumps may show **no RESULT** (Play still running) — read `sitrepLine` / `timeline` / `summaries` honestly.  
6. **Save Log** stays enabled while capturing **and** after **Keep open → Complete**.  
7. **ALWAYS CLEAR** before each prove (`forceClear` then `start`; smokes wipe too).  
8. **Leave / return (HARD):** when the agent disconnects to Cursor chat / elsewhere, **pause** the QA session; on return **resume** and **read Message latch** before continuing. See § Agent leave / return below.  
9. **Dump-on-FAIL habit:** on Alarm / hard FAIL / chop / script-timeout — **Save Log** immediately (Keep open → Complete still allows Save Log). Do not invent green from memory.  
10. **Friendly diag in chat:** mirrored playback-diag rows use human labels in the main QA sequence (not a cryptic side pane).

### Playback diag → QA chat (mirrored vs suppressed)

| Mirrored into QA chat (human labels) | Suppressed (dump/console only) |
|--------------------------------------|--------------------------------|
| Type-in **start** / **end** / **skip** | `type-in-progress` (per-char) |
| Click miss | Healthy step-forward / routine transport |
| Cursor off-target / hidden during typing | Cursor remove / park / abort chatter |
| Scroll jumped the wrong way (reversal) | Small camera nudges / origin scrolls |
| Chat bubble **JUMP** / **CHOP** / script-timeout | Bubble TRACE / frame rAF samples |
| Play finished / journey reset / hub-nav | Routine beat landings |
| PO Alarm / diagnostic FAIL | Helper peek / is-open polls |

**Label examples:** `remove` → “Cursor cleared”; `type-in-park` → “Cursor parked for typing”; scroll-reversal → “Scroll jumped the wrong way”; bubble-chop → “Chat bubble motion cut short”. Machine `kind` stays on ring `detail` / data attrs.

### Dump fingerprint (PO 2026-07-20T21:26:23Z manual)

| Field | Value | Read as |
|-------|-------|---------|
| Title | PO prove — FULL agentic Play | Mid-flight Save Log (not finale) |
| Sitrep | Steps **12/21** · `avail-continue` · chat | Play not finished — no RESULT row |
| `typeIn` | starts **2** / ends **2** / samples **249** | **FORBIDDEN** per-letter sampling class |
| Bubble motion | jumps **0** / chops **0** | No bubble-chop in this dump |
| Soft-fail | 2× `scroll-reversal` (eased Δ) | Open / watch — pull-up co-travel noise |
| Helper spam | 52/80 log = peek/is-open polls | Agent poll noise (not product FAIL) |
| script-timeout | **absent** in this dump | Separate prove: confirmation hang → cursor `stop()` fix |

### Dump fingerprint (PO 2026-07-20T22:58:41Z — Traditional smoke)

| Field | Value | Read as |
|-------|-------|---------|
| Mode | **traditional** · CJM **on** · session `traditional-play-smoke` | Primary Traditional smoothness evidence |
| Peak | Play finished → journey start (PLP→…→details) | Playlist **completed**; sitrep at Save Log = post-reset **1/12** |
| RESULT | **absent** | Smoke tears down overlay — use keep-overlay prove when available |
| Clicks | Bookmark → Book now → PDP Book → Sign in → **21/15:30** → Reserve → Open Appts → View Details | No date/time re-click; location Continue not in click log |
| Soft-fail | **3×** scroll-reversal (Δ−922 / Δ−1207 / Δ−88) | Camera origin yank — **not green** smoothness |
| Type-in | 0 | Expected (no Traditional composer type-in) |

Sitrep audit: [TRADITIONAL_CJM_UX_2026-07-21.md](../projects/boots-pharmacy/audits/TRADITIONAL_CJM_UX_2026-07-21.md).

---

## Prove recipe (agentic CJM)

**Localhost only:** `http://localhost:5173/` (`strictPort`; never invent 5174+). One `npm run dev`. Chrome MCP: `list_pages` → reuse tab.

**Full agentic continuous Play prove (HARD — one entrypoint):** agents MUST call only:

```js
await window.__studioRunAgenticFullPlayProve?.() // default timeoutMs 300_000
// or: await window.__studioRunAgenticFullPlayProve?.({ timeoutMs: 600_000 })
// alias: window.__protoRunAgenticFullPlayProve
// → { pass, peak, end, errors } — forceClear + fresh arm + Play + assert peak 21/21
//   + play-end at start + pauseForAgentLeave; overlay STAYS open for Save Log.
// Do NOT ad-hoc Play / do NOT prefer __protoRunAgenticPlaySmoke (tears down overlay).
```

Example URL:

```text
http://localhost:5173/?project=boots-pharmacy&screen=home&persona=sarah-jenkins&cjm=on&experience=agentic
```

0. **Reset QA before each test (ALWAYS CLEAR)** — mandatory. Wipe prior session first (`forceClear` / `__studioForceClearAgentTestingOverlay`), then arm fresh (`start` + `keepOpen` as needed). Overlay `start` and smoke `withMcpTestSession` also wipe on fresh arm so agents cannot skip clear. Never reuse a dirty overlay. **Full Play prove:** the helper above does forceClear + arm for you — still do not invent a parallel ad-hoc Play path.  
1. Open QA logger / agent overlay (gate open) — only after step 0.  
2. Start **continuous Play** (same path as Step).  
3. **Eyes on composer:** Home then Chat type-in must animate letter-by-letter.  
4. **Eyes on thinking:** new thinking bubbles must camera into view (not stuck under dock).  
5. **Eyes on QA log:** no one-line-per-letter spam; at most start + done for type-in. Dump `typeIn.samples` must not track every char as events.  
6. Console: `[PLAYBACK_DIAG]` should not flood `type-in-progress` per char.  
7. After type-in: `__studioAssertTypeIn?.()` still PASS (sparse in-memory samples).  
8. Full Play should reach **21/21** without `script-timeout` on confirmation.  
9. Poll `__studioConsumePoSignal?.()` each beat (R15) — do not invent green past Alarm/chop.  
10. **Leave QA → `pauseForAgentLeave()`; return → `resumeForAgentReturn()`** (Message on arrival mandatory). **Guard rail:** if you forget, presence TTL (~8s) auto-pauses capture + Play.

---

## Prove recipe (Traditional CJM)

**Smoke (tears down overlay):** `await window.__protoRunTraditionalPlaySmoke?.()` — Play → start assert; good for local smoke, **weak** for Save Log peak sitrep.

**Manual / full Play:** ALWAYS CLEAR → arm QA keep-open → continuous Play on `experience=traditional&cjm=on` → Save Log on Complete (or dump-on-FAIL). Prefer a keep-overlay full prove helper when shipped (parity with `__studioRunAgenticFullPlayProve`).

Example URL:

```text
http://localhost:5173/?project=boots-pharmacy&screen=plp&persona=sarah-jenkins&cjm=on&experience=traditional
```

Eyes: no already-selected date/time re-click; watch camera yanks on Reserve / history / details ([TRADITIONAL_CJM_UX_2026-07-21.md](../projects/boots-pharmacy/audits/TRADITIONAL_CJM_UX_2026-07-21.md)).

---

## Agent leave / return (HARD — do not keep capturing while gone)

**Problem:** Agent leaves the QA tool session (Cursor chat, docs, elsewhere) but capture/Play keep running as if the agent is still watching.

**Default guard rail (auto-pause):** Presence heartbeat TTL = `QA_AGENT_AUTO_PAUSE_MS` (**8s**, same as ONLINE present window). When last touch is stale, overlay **automatically** pauses capture + halts Play (leave-equivalent: **no** `QA_PAUSE_HALT` / **no** `DIAGNOSTIC_ACK_STOP`). Chrome shows **Last seen Ns ago** (never green ONLINE while stale). Agents **still SHOULD** call leave/return explicitly; auto-pause is the belt when they forget.

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

**Avail after chat (HARD):** Opening Availability Tool over a full React chat underlay was ~15fps (chat layout/paint + scrim blur). Fix: freeze chat under `html:has([data-studio-modal="choose-pharmacy"])` via `content-visibility: hidden` + drop avail `backdrop-filter`. Keep Save Log / type-in / friendly diag.

**Prove:** Play a stretch with QA open — page feels usable; console + overlay not flooding; composers still type letter-by-letter. After chat → open avail with QA paused — avail feels smooth (~60fps).

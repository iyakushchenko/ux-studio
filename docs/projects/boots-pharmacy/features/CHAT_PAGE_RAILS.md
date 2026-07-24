# Chat page rails — by condition

**Project:** `boots-pharmacy` · `screen=chat`  
**Purpose:** Agent recovery doc. When chat load/scroll/thinking regresses, read this first — then fix code to match these rails.  
**Motion:** [MOTION.md](../../../product/MOTION.md) · **Parity:** [CHAT_LEGACY_PARITY_REGISTER.md](./CHAT_LEGACY_PARITY_REGISTER.md) · **Migration brief:** [CHAT_REACT.md](./CHAT_REACT.md)

**Prove URL (CJM off):**  
`http://localhost:5173/?project=boots-pharmacy&screen=chat&persona=sarah-jenkins&cjm=off&experience=agentic`

**Prove URL (CJM on):**  
`http://localhost:5173/?project=boots-pharmacy&screen=chat&persona=sarah-jenkins&cjm=on&experience=agentic`

---

## Conditions at a glance

| Condition | What the user should feel | Owner path |
|-----------|---------------------------|------------|
| **`cjm=off`** | Opening a **saved chat** (Legacy-like): brief empty hold → **full thread at once** → **smooth scroll to bottom** | `runChatBrowseEntryReveal` |
| **`cjm=on`** + agentic chat beat | Scripted progressive disclosure: thinking → staged bubbles / CTAs via engine `visibleCount` | `usePublishChatScenarioReveal` + scenario prelude |
| **`cjm=on`** + leave chat scenario (e.g. avail overlay) | **Hold** last painted count — never wipe thread to empty behind modal | `usePublishChatScenarioReveal` hold branch |
| Traditional CJM | No chat beat — do not invent chat load for traditional path | Journey playlist |

Detect CJM-off: `?cjm=off` (URL). ChatScreen also gates `existingChatLoadHold` on that.

---

## CJM OFF — required (saved-chat load)

**Metaphor:** user opened an existing thread, not creating one.

1. **Interim** — blank thread column for `STUDIO_CONTENT_LOAD_MS` (**1500**) via `waitStudioContentLoad` / `@/uxds/motion`. Body may set `data-studio-content-loading="chat"` for timing/QA hooks only.
2. **Paint** — publish full thread in one shot: `{ active: false, visibleCount: totalFrames }`.
3. **Camera** — after React paints revealed nodes, **eased** `scrollCameraToHostEnd` with `durationMs: STUDIO_ENTER_MS` (**340**), reason `cjm-off existing-chat load settle`. Wait for paint before scrolling (sync publish sees `scrollHeight≈0` and camera no-ops).

### Forbidden on CJM-off

| Do not | Why |
|--------|-----|
| Progressive `visibleCount: 1` → N | That is **creation / CJM-on** disclosure |
| Thinking bubble on browse entry / r1+ | Saved chat is already complete |
| Invented spinning preloader / skeleton chrome | PO rejected; interim is **blank**, not a spinner |
| Instant dump with no interim | Feels abrupt — use platform content-load ms |
| Appear-then-yank scroll (or no scroll) | Must co-travel: paint → smooth host-end |
| One-off timers in chat CSS/TS | Extend `@/uxds/motion` defaults instead |
| Letting engine `usePublishChatScenarioReveal` drive paint | Hook **yields** when `cjm=off` |

**QA:** While AGENT TESTING is open on `cjm=off&screen=chat`, `armQaChatLoadingWatch` Alarms `CHAT_LOADING_DUMP_ALL` if ≥4 frames paint within ~500ms (before `STUDIO_CONTENT_LOAD_MS` interim).

---

## CJM ON — required (scripted progressive)

### Appear north star (HARD)

- **One** Motion language: `CHAT_PULL_UP` = opacity + y, `STUDIO_ENTER_MS` (340), `MOTION_EASE_IN_OUT` — every progressive query/reply **and** composer-send thinking→reply.
- Thinking **exit** = opacity-only at the **same** duration (no height collapse under the reply).
- **No** CSS `transition`/`animation` enter on `.chat__bubble` (Motion owns appear).
- Camera **co-travels** the same beat/duration — message finishes already in view (no appear-then-yank).
- Industry bar: message arrives once, continuous ease, in-place thinking→reply crossfade.
- Prove: `__studioRunChatBubbleMotionSelfTest` — jumps=0, chops=0, continuous transform y ([PLAYBACK_DIAG.md](../../../shell/PLAYBACK_DIAG.md)).

- Engine owns `visibleCount`; React paints `index < visibleCount` (`data-studio-chat-revealed`).
- Thinking / prelude owned by scenario playback (`site-pilot-chat`), not by browse-entry helper.
- Bubble appear + scroll co-travel on step reveal uses `STUDIO_ENTER_MS` + `scrollCameraToTarget` / host-end in `ChatScreen` settle effect — do not reintroduce appear-then-scroll lag.
- **Camera target:** settle uses `resolveChatCameraTarget` — **thinking first** (thinking paints `data-studio-chat-revealed="false"`), then CTA, then last revealed. **Rail:** any new content including thinking must camera into view under the dock.
- **Camera SSoT yield:** settle / pin / pad **yield** during `kind:camera` dwell (`shouldYieldChatAutoCamera`) and do **not** blind-`force` host-end over an in-flight ease. Co-travel uses `coTravel: true` so pull-up lock does not abort the ease into an instant yank. QA trackers: `chat-camera:wait|thinking|pin-bottom|host-end` (deduped) — [QA_LOGGING_AND_PLAYBACK_RECIPE.md](../../../shell/QA_LOGGING_AND_PLAYBACK_RECIPE.md).
- Forward settle frames chat column to the **resolved target** (not a competing always-pin that cancels the camera engine).
- **Play ≡ SF:** Continuous Play is the same progressive sequence as step-forward (thinking → staged bubbles → camera), automated — **not** a dump-all path. Chat enter (Play or land) shows **Sarah q0 only** until transport advances. `jumpToStart` must complete before `play()` resumes on the chat beat.
- **Cursor settle:** Continuous Play **stays** at last CTA/bubble click (`stay-on-play`); Step parks (`park-on-step`). Composer **send always parks away** (`park-from-submit`) — never leave cursor on submit. → [PLAYBACK.md](../../../shell/PLAYBACK.md) § Cursor engine SSoT.
- **QA dump-all watch:** `armQaChatLoadingWatch` / `CHAT_LOADING_DUMP_ALL` is **CJM-off only** (saved-chat content-load interim). Do **not** apply `STUDIO_CONTENT_LOAD_MS` dump-all gating during CJM-on Play/SF progressive reveal — fast frame advances are expected and must not Alarm.

### Forbidden on CJM-on

| Do not | Why |
|--------|-----|
| Dump full thread on enter | Progressive disclosure is the product |
| Call `runChatBrowseEntryReveal` while CJM on | Wrong metaphor |
| Clear thread when opening Availability | Hold last paint count |
| Inherit CJM-off inactive full-thread hold into CJM-on first paint | Stale bridge bleed — seed q0 via `seedCjmOnProgressiveEntryFromStaleHold` |
| `play()` before `jumpToStart` on chat beat enter | Races stale count → full-thread flash |
| Camera only to last `[data-studio-chat-revealed="true"]` | Thinking stays under composer (revealed=false) |
| Arm `CHAT_LOADING_DUMP_ALL` while `cjm=on` | False positive vs progressive Play — watch is CJM-off saved-chat only |

---

## File map

| File | Role |
|------|------|
| `screens/chat/chatBrowseEntryReveal.ts` | **CJM-off** saved-chat load + post-paint host-end camera |
| `screens/chat/ChatScreen.tsx` | Mount: CJM-off clears thinking, `visibleCount: 0`, runs browse entry; CJM-on settle / pad / co-travel |
| `screens/chat/usePublishChatScenarioReveal.ts` | CJM-on paint bridge; **returns early** when `cjm=off` |
| `screens/chat/chatScenarioRevealBridge.ts` | Sync reveal state for React paint |
| `screens/chat/chatThinkingBridge.ts` | Thinking chrome — clear on CJM-off load |
| `screens/chat/chatMotion.ts` | Pull-up / sample timings (consume platform enter ms) |
| `screens/chat/chat.css` | Layout only — **no** content-load spinner |
| `@/uxds/motion` | `STUDIO_CONTENT_LOAD_MS`, `STUDIO_ENTER_MS`, `waitStudioContentLoad` |
| `@/app/scenario/playbackScroll` | `scrollCameraToHostEnd` / `scrollCameraToTarget` SSoT |
| `agentTestingChatLoadingWatch` | QA dump-all Alarm — **`cjm=off` only**; never gate CJM-on Play |

---

## Regression checklist (before claiming fixed)

**Unit (fast):**  
`npx vitest run src/projects/boots-pharmacy/screens/chat/__tests__/chatBrowseEntryReveal.test.ts`  
— empty hold → full thread; `scrollCameraToHostEnd` **after** paint, once.

**QA tool (mandatory for load/scroll — unit tests alone are BAD):**

1. `npm run dev` on **`http://localhost:5173/`** (reuse tab; R11).
2. Open prove URL with **`cjm=off`**.
3. Start / use **AGENT TESTING** overlay (Control Room / `__studioAgentTestingOverlay` / page probe as appropriate).
4. Eyes: blank ~1.5s → full thread → **smooth** scroll to bottom (not jump, not stuck at top, no spinner, no thinking).
5. Diag: look for `chat-browse-entry` + `cjm-off existing-chat load settle`; no scroll-jump / scroll-reversal Alarm on that path.
6. Optional: `__studioRunMcpPageProbe({ screenId: "chat", reload: false })` when matrix covers browse.

**CJM-on smoke:** same host, `cjm=on` — first land shows progressive count, not full dump; thinking on scripted beats only.

---

## Known failure modes (quick triage)

| Symptom | Likely cause |
|---------|----------------|
| Thinking / q0 during “load” | Seeded `active: true, visibleCount: 1` or remapped `0→1` — fight browse entry |
| Full thread, no camera motion | Scrolled before React paint (`scrollHeight≈0`) — must `waitBrowseEntryThreadPainted` |
| Spinner on chat | Re-added CSS on `data-studio-content-loading="chat"` — remove |
| Instant full thread | Skipped `waitStudioContentLoad` or shortened with local ms |
| CJM-off still progressive | `usePublishChatScenarioReveal` not yielding / ChatScreen not calling browse entry |
| Appear then yank | Settle scrolled after pull-up delay instead of same-beat co-travel |
| CJM-on Play dumps full thread then snaps to q0 | Stale inactive hold from CJM-off / prior end, or `play()` before `jumpToStart` — seed + land-then-play |
| `CHAT_LOADING_DUMP_ALL` mid CJM-on Play (visible≥4 in <500ms) | **False positive** if watch armed while `cjm=on` — gate watch to `cjm=off` only (`agentTestingChatLoadingWatch`) |

---

## Do not confuse with

- **PLP listing load** — also uses `STUDIO_CONTENT_LOAD_MS`, but has an in-pane sticky loader; chat interim is **blank**.
- **CJM Play / SF** — same progressive disclosure rails; Play automates SF (no dump-all alternate). Diag/transport differ from browse entry.
- **Send-path thinking** — user/agent send while browsing may still use thinking; **entry load** must not.

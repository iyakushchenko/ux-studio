# UX Studio — PO painpoints (trackable)

**Status:** Living board — mark → COMPLETE when shipped + proven.  
**Owner:** Arch (curate) · Bea (acceptance language) · callsigns execute.  
**Updated:** 2026-07-20  
**Related:** [NEXT_STEPS.md](./NEXT_STEPS.md) · [PRODUCT_FORECAST.md](./PRODUCT_FORECAST.md) · [UX_STUDIO_VISION.md](./UX_STUDIO_VISION.md) · [TEAM_KNOWLEDGE.md](./TEAM_KNOWLEDGE.md) · [STUDIO_AUTO_RULES.md](./STUDIO_AUTO_RULES.md) · [../shell/PLAYBACK_DIAG.md](../shell/PLAYBACK_DIAG.md)

Do **not** lose this list. New PO rage → append a row here **and** stamp TEAM_KNOWLEDGE. Prefer COMPLETE over silent delete.

---

## How to read status

| Status | Meaning |
|--------|---------|
| OPEN | Still hurts; not done |
| IN PROGRESS | Active ship / MVP landed but residuals remain |
| COMPLETE | Shipped + proven (cite tip / audit when useful) |
| WATCH | Mitigated but easy to regress — keep eyes |

---

## Board (2026-07-19 → 2026-07-20)

| ID | Pain | PO sentiment (compressed) | Status | Track / owner |
|----|------|---------------------------|--------|---------------|
| PP-01 | Playback engine reliability | CJM / step / retreat / play-end still feel fragile after React Site Pilot / Chat — “did it actually work?” | WATCH | 2026-07-20 prove: `__protoRunAgenticPlaySmoke` PASS (~71s) + `assertPlayEndedAtStart` → `site-pilot`/`agentic-home`; type-in PASS; retreat smoke PASS after counter-honesty fix; traditional Play PASS. Keep eyes on Play→end regressions. |
| PP-02 | Diag-first culture | Prefer console + overlay evidence over “tests green / vibes green.” Agents must prove, not narrate. | WATCH | R13 PLAYBACK_DIAG + agentic/traditional smokes used as evidence this wave |
| PP-03 | CJM micro-fails | Small silent breaks (type-in skip, wrong scroll host, CTA off-by-one, fade missing) stack into “CJM broken.” | WATCH | Type-in skips=0 on Play; retreatIntoView logged; false smoke FAIL (`>=10` vs 9/21) fixed — not invent UX |
| PP-04 | Hub vs journey-start | Play finish / jump must land **selected journey start**, never silent hub. | WATCH | `resetToJourneyStart` smokes + `hub-nav` diag · tip `862bc97` · Finn · 2026-07-20 agentic/trad Play hubNav=0 |
| PP-11 | Type-in cursor invisible | CJM Site Pilot typed-text beat hid robo-cursor — PO Cursor flag / eyes. CJM on = always visible incl. type-in. | WATCH | R11 prove: mid type-in `.proto-chat-demo-cursor` opacity>0 + `type-in-park` · `CURSOR_HIDDEN_DURING_TYPEIN` · Finn/Quinn |
| PP-12 | PO-signal process | Alarm/Cursor/Scroll click must **stop → (understand OR ask PO) → fix → reprove that issue** — not soft-log, not invent. | COMPLETE | R15 docs: TEAM / PLAYBACK_DIAG / COMMAND_DOCTRINE / AGENTS / STUDIO_AUTO_RULES / agent-testing README · Arch |
| PP-05 | Fuchsia invent / Step2 / retreat scroll | No invented fuchsia hover; book-step-2 dwell cursor law; retreat must scrollIntoView correctly. | WATCH | Uma no-invent · cursor QA · scroll host LESSONS |
| PP-06 | Agentic full chat | Agentic path must click progressive chat CTAs (no off-by-one / skipped frames). | WATCH | 2026-07-20 agentic Play→end: click ok=17 fail=0 · did **not** block Play honesty — keep eyes, no invent CTA path rewrite this wave |
| PP-07 | Control-panel stale green | Transport / mode chrome can look “ok” while state is stale or wrong — PO distrusts green without fresh sitrep. | WATCH | **2026-07-20:** in-QA stale-green detector (snap≠URL screen/cjm/experience → amber + one lean sitrep line). STEPS holds during type-in while onAir. Prefer PLAYBACK_DIAG + onAir |
| PP-08 | Insufficient logging | Not enough mid-flight signal; identical helper spam ≠ useful log. | WATCH | v0.0.91 action sitrep + v0.0.92 lean MCP filter (no CONNECTING spam) |
| PP-09 | Team listening | Team must **use** TEAM_KNOWLEDGE / LESSONS (Knowledge used), not only append. Write-only = FAIL. | WATCH | TEAM.md · Arch gate on team check |
| PP-10 | Agent testing overlay vision | Overlay must be a **mid-flight QA shell** (named steps, colors, timer, sitrep, alarm, cursor flag, timeline strip, console START/END, dump on FAIL/alarm) — not a monotonous `helper: __studioTriggerTransport` list. | COMPLETE | R11 `:5173` mid-flight prove 2026-07-20 — coalesced transport×2, ok/amber/red rows, sitrep, timeline chips, Alarm/Cursor, console END, dumps=3 · Uma/Finn/Quinn |
| PP-13 | QA-tool trust (dual-role self-test) | Overlay is **load-bearing** for agent mid-flight work. Observe↔agent handoff, Alarm escalate, ask/PENDING, refresh hydrate, and REC XOR must stay trustworthy — agents **must** re-run self-test after overlay changes. | WATCH | **2026-07-20:** catalog 24 · QaSelfTestSmoke **28/28 PASS** on `:5173` · tip `b6d8abb` / v0.0.100 |
| PP-14 | Chat bubble motion polish | Progressive / thinking→reply pull-up must be continuous ease (face of product). **PO 2026-07-21: still choppy after multi-agent “fixes”** — self-test 8/8 is **necessary not sufficient** (layout ΔY during co-travel was excluded from hard gate). Suspect clash stack: Motion pull-up + camera co-travel + thinking handoff + HelpfulStrip/layout + CSS. | ACTIVE | Reopen — eyes-only prove + Save Log forensics before any more “green”; north star MOTION/CHAT_PAGE_RAILS |
| PP-15 | Diag popup vs QA dump | PO does not need the diagnostic modal if agents get the data. Prefer dump/ring ingest; keep Alarm; optional consume dismiss. | WATCH | **Live PLAYBACK_DIAG mirror** in-panel (last-N, severity colors) when gate open · leftover modal=false after self-test wipe |
| PP-16 | QA does not listen | PO furious — tool ignores Pause / Message / PENDING / diag / diode; agents keep acting as if nothing happened. | WATCH | Retest: Pause+Message halt PASS; MCP lean log PASS |
| PP-17 | Pause must halt Play | Pause in QA (manual/agent/observe) must stop playback/progress immediately — was no-op for non-agent. | COMPLETE | M3 retest: Play→Pause → `isPlaying` false |
| PP-18 | Message must be honored | Send (esp. PENDING / mid-Play) must pause progress, latch user message, require agent read→investigate→fix→reply before proceed. | COMPLETE | Retest: Play→Message → halt + `USER_MESSAGE_RECEIVED`; halt uses `__studioStopAllPlayback` (not MCP play-toggle) |
| PP-19 | PENDING + typing race | Focusing/typing Message while PENDING must signal wait (extend timeout); draft must survive refresh. | COMPLETE | Retest: AskUser→PENDING + draft persist |
| PP-20 | Message autofocus + draft | Message field must autofocus on QA open + after refresh restore; draft in sessionStorage. | COMPLETE | draft `studioQaMessageDraft` retest PASS |
| PP-21 | QA unaware of playback diag | When diagnostic modal open, stop/ignore Play; ingest to dump; color-coded log; halt until Ack/consume. | WATCH | auto-dismiss + leftover=false on campaign wipe |
| PP-22 | Control-room diode / Alarm red ignored | QA must notice + log sitrep; not act like nothing happening. | WATCH | M4 Alarm escalate latch PASS |
| PP-23 | MCP phase changes invisible | CONNECTING→CONTROL→OBSERVE→PENDING→ERROR must appear in QA timeline for sitrep. | COMPLETE | **Lean filter:** diode=live; chat only ERROR/PENDING/CONTROL↔OBSERVE — no CONNECTING spam · `shouldLogMcpPhaseToChat` |
| PP-24 | Timing / priority / event DDOS | Timestamps+durations must be trustworthy; agents need `priorityHints[]` (cause before symptom); poll/consume latches — don’t flood-read chat. | COMPLETE | dump `priorityHints[]` · consume helpers documented |
| PP-25 | Vite HMR mid-flight | Hot invalidate should pause capture/play + log `vite-hmr` (lean) so agents don’t race HMR. | COMPLETE | `import.meta.hot` `vite:beforeUpdate` → pause+log |
| PP-26 | QA action blindness | PO cannot see Save Log / export / toolbar lifecycle in timeline — sitrep incomplete. | COMPLETE | M8 retest: Save Log · + QA · Pause rows |
| PP-27 | Stale playback diagnostic leak | Modal left open after self-test/SF/Play jobs — blocks further work. | COMPLETE | leftover=false after matrix + smoke |
| PP-28 | MCP chat log noise | CONNECTING→CONNECTED→CONTROL flash spam drowns PO/agent sitrep. | COMPLETE | v0.0.92 lean filter; diode carries live; chat meaningful-only |
| PP-29 | MCP label ≠ Cursor | Status said `MCP — CONTROL/CONNECTED` → PO thought Cursor MCP was linked. | COMPLETE | Labels `AGENT — …` + tooltip “not Cursor MCP” |
| PP-30 | Ghost AGENT CONTROL | Close × hidden on agent lock; overlay stayed CONTROL after prove/pause with no mid-flight agent. | COMPLETE | Close/softClose → forceClear wipe |
| PP-31 | Chat pull-up scroll false FAIL | Chat bubble pull-up called `cancelPlaybackScroll("abort")` → PlaybackDiagnostic SCROLL_ANOMALY mid agentic. | COMPLETE | intentional cancels use `"replace"` |
| PP-32 | Sitrep auto-close loses context | DONE sitrep Auto-closes with no Keep open. | COMPLETE | Keep open cancels countdown |
| PP-33 | Diag popup vs QA half-integrated | Agents still needed leftover modal; PO asked repeatedly for QA-first. | COMPLETE | gate open → QA log only + Ack diag; modal when QA closed |
| PP-34 | Chat bubble arrive stutter | Instant reveal-snap + eased settle + eased composer top-up fought Motion. | COMPLETE | settle owns camera; top-up instant |
| PP-35 | Dual cursor manual+CJM | Observe/manual pointer-follow + parked CJM robo = two cursors. | COMPLETE | hide robo on manual/observe; Play keeps robo |
| PP-37 | RESULT not final | clear-stale / playback-diag rows after `RESULT · PASS` undermine finale. | COMPLETE | cleanup→RESULT last + finale seal |
| PP-39 | Composer-exit scroll chop | Bubble rise from under dock + instant clearance top-up = stutter; dump too thin. | COMPLETE | TRACE + host-end settle |
| PP-40 | Message then RESULT | Self-test RESULT after PO Message looks like ignore/reply. | COMPLETE | withhold RESULT while USER_MESSAGE latch |

---

## Overlay vision acceptance (PP-10) — MVP checklist

Lean ship (this stream). Residuals stay OPEN until proven on `:5173`.

| # | Feature | MVP target | Status |
|---|---------|------------|--------|
| 1 | Readable step rows | Beat / touchpoint / action — not identical helper spam | COMPLETE (MVP) |
| 2 | Outcome colors | fail red-ish · soft-fail/unexpected amber · ok default/white | COMPLETE (MVP) |
| 3 | Elapsed timer | Mid-flight elapsed + cheap per-step duration | COMPLETE (MVP) |
| 4 | Control-panel sitrep | Mode / CJM / experience / screen / beat counter in panel | COMPLETE (MVP) |
| 5 | Alarm bell CTA | PO rings **sequence / expected-steps mismatch** → **live latch** `__studioAgentTestingTakeover` / `__studioConsumePoSignal` (primary) + dump secondary | COMPLETE (MVP) |
| 6 | Cursor weird flag | Clickable flag + auto-log known parks/issues → `__studioPlaybackDiag` error code | COMPLETE (MVP) |
| 6b | Scroll issue flag | Clickable **Scroll** CTA → amber `SCROLL_ISSUE_REPORTED` + host/`scrollTop` + dump; optional auto scrollIntoView/path-deviation | COMPLETE (MVP) |
| 7 | Script timeline strip | Touchpoint keys; white/amber/red after step | COMPLETE (MVP) |
| 8 | Console separators | Clear START/END per test sequence | COMPLETE (MVP) |
| 9 | Console dump auto-save | Opt-in / last-N to `sessionStorage` + downloadable JSON on FAIL or alarm — **not** every step | COMPLETE (MVP) |

**PP-10 COMPLETE** (2026-07-20): Quinn mid-flight prove on R11 `:5173` — BR panel active with named coalesced steps, outcome colors, elapsed, control-panel sitrep, Alarm/Cursor/Dump, timeline chips, console START/END, FAIL/alarm dumps. Residual wishlist rows remain OPEN.

### Live PO signal (Arch — primary mid-flight path)

- **Alarm meaning:** sequence / expected-steps mismatch (e.g. progressive bubbles disclosure broken) — **not** vague “something weird.”
- **Primary:** Alarm / Cursor / Scroll / **Pause** / **Message** / **diagnostic** latch `window.__studioAgentTestingTakeover` + `CustomEvent("studio-agent-testing-po-signal")`. MCP agents **MUST poll/consume each beat** via `__studioConsumePoSignal()` / `__studioPeekPoSignal()` and branch (pause / investigate) — do **not** wait for dump download · do **not** flood-read chat only.
- **Shape:** `{ type:'alarm'|'cursor'|'scroll'|'user-message'|'pause'|'diagnostic'|'mcp', code, at, beat, screen, counter, sitrepLine, timeline, diagSnapshot }`.
- **User Message procedure (HARD):** latch `USER_MESSAGE_RECEIVED` → **STOP** → read note → investigate → fix → reply in QA → `__studioConsumePoSignal` → Resume/proceed. Dump `priorityHints[]` lists cause before symptom.
- **PENDING typing:** focus/type Message while PENDING → `user-typing` extends timeout; draft in `sessionStorage` (`studioQaMessageDraft`).
- **Alarm code** = `ALARM_SEQUENCE_MISMATCH`. Pause = `QA_PAUSE_HALT`. Diag open = `PLAYBACK_DIAGNOSTIC_OPEN`.

### Dump policy (Arch — secondary / postmortem)

- **When:** FAIL sitrep (`stop({ result: "fail" })`) or PO **Alarm** / **Cursor weird** / **Scroll** (explicit).
- **What:** last-N (default 5) JSON blobs in `sessionStorage` (`studioAgentTestingDumps`) + downloadable via overlay / `__studioDownloadAgentTestingDump`. Includes `code`, `currentBeat`, timeline chips, last-N PLAYBACK_DIAG, typeIn/scroll/cursor summaries.
- **Why not every step:** noisy, hangs the tab, floods storage; mid-flight UI already shows steps. Diag-first ≠ spam-first.
- **Rejected overkill:** no heavy APM (Sentry/Datadog/full session replay). Prefer Motion (existing) + PLAYBACK_DIAG + this shell. Tiny util only if ROI is obvious.

### Free libs note (Arch)

Prefer **existing** `framer-motion` / `@/uxds/motion` + PLAYBACK_DIAG + control-panel snapshot. Optional tiny util OK. Rejected: full APM, log shippers, second overlay framework.

---

## Residual wishlist (post-MVP)

- Richer timeline scrub / jump-to-beat from strip
- ~~Live mirror of full `[PLAYBACK_DIAG]` event table in-panel~~ → **shipped lean last-N mirror** (PP-15) — expand if PO wants full table
- Alarm → optional screenshot hook (PO asset later)
- ~~Stale-green detector that forces amber when snapshot vs DOM diverge (PP-07)~~ → **shipped** snap≠URL amber + sitrep line
- Persist dumps across reload only behind explicit continue flag

---

## Completing a row

1. Ship + prove (Quinn MCP / PLAYBACK_DIAG / overlay on R11 `:5173` as relevant).  
2. Set status **COMPLETE** (or **WATCH** if regress-prone).  
3. One-liner in [TEAM_KNOWLEDGE.md](./TEAM_KNOWLEDGE.md) **Knowledge improved**.  
4. Link tip SHA or audit when useful — do not invent PROVEN.

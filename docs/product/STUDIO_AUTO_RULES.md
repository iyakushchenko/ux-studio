# Studio Auto-Rules / Auto-Gates framework

**Status:** Locked (PO mandate, 2026-07-19) — recurring PO pain → automatic CI / probe contracts  
**Owners:** Arch (Director) catalogs · Ben (BE) wires scripts · Quinn (QA) owns MCP probe steps · Finn/Uma plug ratchets  
**Entry:** `npm test` (all static gates) · MCP page probe teardown (runtime)  
**Do not:** invent a parallel unused gate system — **extend** `check:felonies` / `check:parity-*` / `check:page-final-pass` / probe recipes.

**PO contract:** Dismiss/modal sticky, auth SSoT drift, logged-out avail wrong start, brand-active teal, §0b rhythm regressions — **CI catches them**. Do not re-ask the team in chat.

---

## How this unifies (one system)

| Layer | Command | Role |
|-------|---------|------|
| Naming / overlay / modal URL / **probe teardown** / **auth SSoT** | `npm run check:felonies` | Hard laws — agent felony |
| Make→React typical misses + **avail start** + **§0b rhythm markers** | `npm run check:parity-ratchets` | Source contracts |
| Audit honesty (PROVEN + MCP matrix) | `npm run check:parity-proven` | No chat-only PROVEN |
| Page close sequencing | `npm run check:page-final-pass` | No next page until hard-green |
| **Brand theme wins** (active pills/tabs) | `npm run check:theme-brand` | Theme remaps interactive actives |
| Links / hygiene / version | `check:links` · `check:hygiene` · `check:version` | Existing companions |
| Vitest unit | `vitest run` (via `npm test`) | Teardown / auth / avail intent |
| MCP probe runtime | `__studioRunMcpPageProbe` | Hover/click matrix + **end contract** |

`package.json` → `npm test` runs **all** static layers above, then Vitest. No fork.

---

## Auto-rules catalog (live in CI)

| # | Id | Rule (PO pain) | Static gate | Unit / script | MCP probe |
|---|-----|----------------|-------------|---------------|-----------|
| R1 | **`agent-teardown-clean`** | Overlay dismissed, `&modal=` stripped, modal UI closed | `check:felonies` §9 | `studioAgentTeardownContract` + URL/probe tests | After settle: `__studioAssertAgentTeardownClean` / `__studioWaitAgentTeardownClean` |
| R2 | **`auth-ssot`** | `studioAuthSession` / `__studioIsLoggedIn` only | `check:felonies` §10 | `studioAuthSession.test.ts` | Probe reads `__studioIsLoggedIn` |
| R3 | **`avail-logged-out-start`** | Logged-out avail → Find Pharmacy (`start`) | `check:parity-ratchets` | `resolveAvailIntent.test.ts` | PDP `pdp-check-avail-logged-out` |
| R4 | **`pdp-rtb-rhythm`** | Uma §0b vertical rhythm markers | `check:parity-ratchets` | — | Uma MCP measure still required for PROVEN |
| R5 | **`theme-brand-active`** | Brand primary wins on active pills/tabs | `check:theme-brand` | — | Uma pixel prove when theme changes |
| R6 | *(existing)* | Overlay eyes / modal URL registry | `check:felonies` | modal bridge tests | `*-overlay-eyes`, open/close modal URL |
| R7 | *(existing)* | Parity typical misses | `check:parity-ratchets` | — | PLP/PDP recipe steps |
| R8 | *(existing)* | PROVEN honesty | `check:parity-proven` | — | Matrix evidence |
| R9 | *(existing)* | PAGE FINAL PASS | `check:page-final-pass` | — | `mcpFinalPass` stamp |
| R10 | **`robo-cursor-native-feedback`** | Robo-cursor = **native hover+press everywhere** (buttons/links/DS secondary/outline/popup close — not chat-only); press = down→dwell→up→click; default graphic after click | `vitest` | `demoCursorInteraction` + `demoCursorPseudoBridge` (top-level selector split + insertRule) | MCP: PDP Check availability bg/border change; Book now; popup close press |
| R11 | **`fixed-localhost-reuse-tab`** | **One** localhost URL forever; agents must **not** open new ports/windows/tabs | `check:felonies` (vite `port`+`strictPort`) | — | Chrome DevTools MCP: `list_pages` → `select_page` / `navigate_page` on existing; **`new_page` only if zero pages** |
| R12 | **`batch-ship-push`** | **No push after every tiny fix** + **no await CI/Pages** on routine ships (push → move on; await only HARD-GREEN / release / PO-asked prove) | Process (Pax/Ben) — no static CI gate | — | — |
| R13 | **`playback-diag`** | CJM type-in / step / retreat regressions checkable from console every night | `vitest` (`playbackDiag`) | `__studioPlaybackDiag` / `__studioAssertTypeIn` | Step-forward + retreat smokes + assertTypeIn |

**Code catalog:** `src/app/shell/studioAutoRules.ts` (`STUDIO_AUTO_RULES`) — keep ids in sync with this table for **CI-gated** rules (R1–R11, R13). **R12** is process-only (docs + director); do not invent a fake CI assert.

---

## R1 — Probe end teardown (HARD)

**Fail class:** After agent testing / MCP probe, sticky AGENT TESTING overlay and/or sticky `&modal=` (choose-pharmacy etc.) and reopen thrash.

**Contract (deterministic):**

1. `buildStudioPostAgentStayState` / hub builders **omit** `modalId`.
2. `resetStudioAfterAgentTest` always writes `modalId: undefined` + dispatches close-all.
3. App `onPostAgentReset` **never** re-applies `modalId` from event detail.
4. `runMcpPageProbe` / `withMcpTestSession` `finally`:
   - `stopAgentTestingOverlay` (sitrep) or `forceClearAgentTestingOverlay` on throw
   - `resetStudioAfterAgentTest` again
   - `scheduleAgentTestingOverlayEnsureClear(settle+1s)` → `forceClear` if DOM remains
5. Unit tests assert post-probe URL has **no** `modal=`.
6. Code catalog: `STUDIO_AUTO_RULES` id `agent-teardown-clean` · contract `studioAgentTeardownContract.ts`.

**MCP prove:**

```js
window.__studioAgentTestingOverlay?.forceClear?.()
await window.__studioWaitAgentTeardownClean?.(1200)
// → { pass: true, failures: [], snapshot: { overlayRootPresent: false, modalParam: null, … } }
```

**Recovery (human):** `window.__studioAgentTestingOverlay?.forceClear()` once after refresh.

---

## R2 — Auth SSoT

**Single module:** `src/app/shell/studioAuthSession.ts`  
**Window:** `__studioIsLoggedIn` / `__studioSetLoggedIn` (`__proto*` aliases).  
**Aliases OK:** `isHeaderLoggedIn` / `setHeaderLoggedIn` → must call SSoT (not a second store).

**Felony:** parallel logged-in flags (`localStorage` auth keys, duplicate booleans that bypass SSoT for CTA/avail branching).

---

## R3 — Logged-out avail starts on Find Pharmacy

`resolveAvailIntent` when logged-out and no chosen location → `{ step: "start" }` for date/time/list/map intents.  
PDP Check availability must open Availability at **start**, not Choose Date.

---

## R4 — Uma §0b rhythm (automatable slice)

Static ratchet locks PDP RTB column `gap: 32px` + LEGACY exclusion `:not(.pdp__rtb-card)`.  
**Does not replace** Uma MCP measure before fidelity IN PROGRESS / PROVEN ([UMA_FIDELITY_NOTES.md](./UMA_FIDELITY_NOTES.md) §0b).

---

## R5 — Brand theme wins (`check:theme-brand`)

When a project ships `styleguide/theme.css` under `[data-studio-project="…"]`:

1. Must define `--project-brand-primary`.
2. Must remap `--uxds-filter-chip-surface-selected-strong` to `var(--project-brand-primary)` (or brand token chain — **not** a raw UXDS default hex that bypasses brand).
3. UXDS `filter-chip.css` strong selected states must use `var(--uxds-filter-chip-surface-selected-strong)` (no hard-coded active fill that ignores theme).
4. Boots Availability store filters must use `.uxds-filter-chip--strong` (theme-bound active).

**Sibling hook:** Uma/Finn brand-primary pill fixes plug into this check — extend the script, do not add a second brand gate.

---

## R10 — Robo-cursor native feedback (HARD)

**Fail class:** Agent testing / MCP probe cursor looks dead — no hover wash, no press/active, hand graphic stuck after click.

**Behavior contract (global — `demoCursor` click/hover path):**

1. **Hover** — On approach/dwell: dispatch `pointerover` / `pointerenter` / `mouseover` / `mouseenter` / `pointermove` / `mousemove`, add `.proto-chat-cta--hover`, show hand graphic. CSS `:hover` rules are bridged onto that class via `demoCursorPseudoBridge` (synthetic events alone do not flip `:hover`).
2. **Press** — Keep hover class; add `.proto-chat-cta--pressed`; dispatch `pointerdown`/`mousedown` then `pointerup`/`mouseup` before `click` so `:active` / pressed styles show (e.g. `.proto-popup-close`).
3. **After click / unfocus** — Clear hover+pressed; **cursor graphic returns to default arrow immediately** (never leave hand/pointer stuck).
4. **Motion** — Mild path variance + subtle back-ease overshoot (human agility, not cartoon).

**CI:** Vitest `demoCursorInteraction` + `demoCursorPseudoBridge`.  
**MCP prove:**

```js
// Open Availability (or any surface with .proto-popup-close / tertiary)
await window.__studioProveRoboCursorFeedback?.(".proto-avail-header .proto-popup-close")
// → { pass: true, hoverClass, hoverStyleChanged, pressSeen, pointerClearedAfterClick }
```

---

## R11 — Fixed localhost + reuse tab (HARD)

**Fail class:** Agents spawn extra `npm run dev` → Vite picks `5182`/`5185`/`5186`…; PO loses the tab. Or Chrome DevTools MCP calls `new_page` / opens a new window every prove.

**Canonical URL (agents MUST use only this):**

```
http://localhost:5173/
```

Deep links stay on that origin, e.g. `http://localhost:5173/?project=boots-pharmacy&screen=plp` or `…&screen=chat&cjm=on&experience=agentic` ([URL.md](../shell/URL.md) — not legacy `mode=`).  
`http://127.0.0.1:5173/` is the same server (CI smoke alias) — do **not** invent other ports.

**Config gate:** `vite.config.ts` → `server.port: 5173` + `server.strictPort: true` (fail if busy; never silent bump). Smoke defaults `PROTO_SMOKE_URL=http://localhost:5173` (CI: `http://127.0.0.1:5173`).

**One dev server:** Only **one** `npm run dev` for the Studio workspace. If port 5173 is taken → do **not** start a second Vite; reuse the existing process, or stop the stray Node/Vite holding 5173 (docs only — never kill the PO’s browser). Windows tip: `netstat -ano | findstr :5173` then end the stray `node` PID if it is a duplicate Vite.

**Chrome DevTools MCP / agent practice (felony):**

1. `list_pages`  
2. If a Studio tab exists → `select_page` then `navigate_page` (or evaluate in place)  
3. `new_page` **only** when the page list is empty  
4. Never open a second window “just in case”

**CI:** `check:felonies` asserts vite `port`/`strictPort` + catalog id `fixed-localhost-reuse-tab`.  
**Docs:** [AGENTS.md](../../AGENTS.md) · [TEAM.md](./TEAM.md) · [COMMAND_DOCTRINE.md](./COMMAND_DOCTRINE.md) · [../shell/URL.md](../shell/URL.md) · [../shell/RECORDING.md](../shell/RECORDING.md)

---

## R12 — Batch ship / push + no-await CI (HARD process)

**Fail class:**

1. Agents `git push` after every tiny fix → CI/Pages thrash, tip noise, PO loses coherent ships.
2. Agents **`gh run watch` / sleep-poll / wait for Pages** after every push → PO wall-clock burns even when CI is “only” 20–40s × many pushes.

**Contract:**

1. **Land local** — commit locally when coherent; keep working on the wave without pushing each micro-fix.
2. **One push per coherent ship** — push when Pax (or human PO) says so, or at: coherent feature close · PO explicit ask · PAGE FINAL PASS HARD-GREEN · **end of wave**.
3. **Ben** executes **one** push for that ship — not per file.
4. **No await CI/Pages on routine ships** — push and **move on**. Optional one-shot `gh run list` peek is fine; **forbidden:** `gh run watch`, sleep/poll loops, babysitting Pages, blocking the next task on `in_progress`.
5. **Await CI only when:** PAGE FINAL PASS HARD-GREEN · release/version ship · human PO explicitly asked to prove remote green.
6. Hotfix that unblocks the human PO **may** push early — still batch remaining work after; still no routine await.

**Docs:** [COMMAND_DOCTRINE.md](./COMMAND_DOCTRINE.md) · [TEAM.md](./TEAM.md) · [TEAM_KNOWLEDGE.md](./TEAM_KNOWLEDGE.md) · [CI_ACTIONS_BUDGET.md](./CI_ACTIONS_BUDGET.md) §5 · [AGENTS.md](../../AGENTS.md) · director rule · `ci-sitrep.mdc`.

---

## R13 — PLAYBACK_DIAG (HARD prove contract)

**Fail class:** CJM type-in animation missing / step-forward or retreat silently broken after React Site Pilot / Chat migration — agents claim green without console evidence. Cursor “did it work?” must be answerable from `[PLAYBACK_DIAG]` alone.

**Contract:**

1. Type-in on Site Pilot home **always** clears + types (never skip because prefilled `HOME_QUERY_DEFAULT` matches demo query).
2. Chat composer type-in logs the same diag events.
3. Step-forward / step-back / retreat-sync emit `[PLAYBACK_DIAG]` console events.
4. Every beat (agentic + traditional) logs: beat id/kind/mode/screen, target found+bbox, cursor travel/park/press (park reason visible), scroll host before/after + retreat scrollIntoView, click/type results, skips + why, journey-reset/`play-end` destination (start beat + screen — never silent hub).
5. Window APIs installed with MCP helpers: `__studioPlaybackDiag`, `__studioPlaybackDiagClear`, `__studioAssertTypeIn`, `__studioAssertPlayEndedAtStart` (`__proto*` aliases).
6. Quinn prove uses assert + step/retreat smokes on **R11** `:5173` reuse tab — see [PLAYBACK_DIAG.md](../shell/PLAYBACK_DIAG.md).

**CI:** Vitest `playbackDiag.test.ts` (emits on step/retreat/cursor/scroll).  
**Docs:** [PLAYBACK_DIAG.md](../shell/PLAYBACK_DIAG.md) · [PLAYBACK.md](../shell/PLAYBACK.md).

---

## R14 — Agent-testing mid-flight shell (soft → harden)

**Fail class:** AGENT TESTING panel is a monotonous identical `helper: __studioTriggerTransport` log — PO cannot QA mid-flight (PP-10).

**Contract (MVP landed 2026-07-20):**

1. Code lives under `src/app/shell/agent-testing/` (compat re-export OK).
2. Helper arm uses coalesced/readable rows (beat/touchpoint when snapshot available).
3. Outcome colors: fail red-ish · soft-fail amber · ok default.
4. Elapsed timer + control-panel sitrep line visible while active.
5. Alarm + Cursor CTAs log + optional dump; auto `CURSOR_UNEXPECTED_DWELL` points at `__studioPlaybackDiag`.
6. Probe sets script timeline strip; chips update by outcome.
7. Console START/END separators per sequence.
8. Dumps: last-N `sessionStorage` on FAIL/alarm only — **not** every step.

**CI:** Vitest `agentTestingFormat.test.ts` + existing overlay lifecycle tests.  
**Docs:** [PAINPOINTS.md](./PAINPOINTS.md) · [RECORDING.md](../shell/RECORDING.md) · [PLAYBACK_DIAG.md](../shell/PLAYBACK_DIAG.md).

---

## Adding a rule (Arch / Ben)

1. Reproduce once in [LESSONS_LEARNED.md](./LESSONS_LEARNED.md).  
2. Prefer cheapest **source** assertion in the **existing** check family (felony vs ratchet vs theme-brand).  
3. Add unit/probe assert when runtime.  
4. Row in this catalog + [TEAM_KNOWLEDGE.md](./TEAM_KNOWLEDGE.md) stamp — **PO must not re-ask**.

---

## Related

- [COMMAND_DOCTRINE.md](./COMMAND_DOCTRINE.md) · [TEAM_KNOWLEDGE.md](./TEAM_KNOWLEDGE.md) · [PARITY_RATCHETS.md](./PARITY_RATCHETS.md)  
- [UMA_FIDELITY_NOTES.md](./UMA_FIDELITY_NOTES.md) §0b · [../shell/RECORDING.md](../shell/RECORDING.md) · [../shell/URL.md](../shell/URL.md) · [../shell/PLAYBACK_DIAG.md](../shell/PLAYBACK_DIAG.md)  
- Scripts: `scripts/check-agent-felonies.mjs` · `scripts/check-parity-ratchets.mjs` · `scripts/check-theme-brand.mjs`

# Quinn (QA) — Chat MCP prove criteria (stub)

**Status:** **STUB / NOT PROVEN** — React `chat` host not mounted; probe recipe minimal (`chat-host` only). **No false PROVEN this wave.**  
**Updated:** 2026-07-19 (Quinn QA — Chat migration kickoff)  
**Screen:** `chat` (Make child 10 · scenario `site-pilot-chat`)  
**Refs:** [STUDIO_AUTO_RULES.md](../../../product/STUDIO_AUTO_RULES.md) R11 · [URL.md](../../../shell/URL.md) · [RECORDING.md](../../../shell/RECORDING.md) · [PLAYBACK.md](../../../shell/PLAYBACK.md) · `studioMcpPageProbe.ts` · `playback/sitePilotChat.ts` · `App.tsx` (`site-pilot-chat` hooks)

**Unrelated prior PROVEN:** Home (`site-pilot`) stub, PDP HARD-GREEN, PLP HARD-GREEN — **do not** treat as Chat PROVEN or waive Chat matrix / playback smoke.

---

## Hard refuse rules

| Rule | FAIL when |
|------|-----------|
| **No false PROVEN** | Vitest/build green, stub `chat-host` only, or Make-only DOM without React host |
| **Overlay visible every step** | Agent testing BR panel absent/hidden on any probe or MCP interact step ([LESSONS](../../../product/LESSONS_LEARNED.md) 2026-07-19) |
| **Scroll-into-view** | Interact before target is in view |
| **`reload: false`** | Page probe / sanity uses reload (R1 teardown / URL fight) |
| **R11 fixed localhost + reuse tab** | Not `http://localhost:5173/`; extra Vite ports; Chrome MCP `new_page` when a Studio tab already exists |
| **Teardown clean** | After probe: `__studioAssertAgentTeardownClean()` / no sticky `&modal=` / overlay DOM absent post-settle |
| **PARITY / Final Pass honesty** | Do **not** add `chat` to `PARITY_PROVEN.json` or stamp Chat PAGE FINAL PASS until full MCP matrix + playback smoke PASS + Uma PROVEN |

**R11 session hygiene:** `list_pages` → `select_page` / `navigate_page` on the **existing** Studio tab; `new_page` **only** if page list is empty. One `npm run dev` on `:5173` (`strictPort`).

---

## Prove URLs (canonical — R11)

### Agentic CJM on Chat (primary deep link)

```
http://localhost:5173/?project=boots-pharmacy&screen=chat&persona=sarah-jenkins&cjm=on&experience=agentic
```

### Traditional orchestra slot on Chat tab (path / touchpoint — not agentic home→chat script)

```
http://localhost:5173/?project=boots-pharmacy&screen=chat&persona=sarah-jenkins&cjm=on&experience=traditional
```

### Browse / probe without CJM hijack (matrix isolation)

Per [URL.md](../../../shell/URL.md): use `cjm=off` when CJM playback must not steal the page probe.

```
http://localhost:5173/?project=boots-pharmacy&screen=chat&persona=sarah-jenkins&cjm=off&experience=agentic
```

**Site Pilot entry (handoff source — not Chat host prove):**

```
http://localhost:5173/?project=boots-pharmacy&screen=site-pilot&persona=sarah-jenkins&cjm=off&experience=agentic
```

**Parse contract:** `studioUrl.test.ts` covers `screen=chat` + `cjm`/`experience` serialize/parse (incl. strip `proof` on reset). Legacy `mode=agentic-cjm` / `mode=traditional-cjm` → `experience` only; they do **not** enable CJM — prefer honest `cjm=` + `experience=`.

**Internal ids:** Journey `agentic-cjm` / `traditional-cjm` (`OrchestraModeId`); URL `screen=chat` maps scenario **`site-pilot-chat`** (`studioUrl` alias `"site-pilot-chat": "chat"`).

---

## Probe entry

```js
await window.__studioRunMcpPageProbe?.({ screenId: "chat", reload: false })
```

**Prep (when matrix grows):** `cjm=off` for static host/fidelity rows; `cjm=on&experience=agentic` for playback-coupled rows; strip ephemeral (`proof`, …); `__studioSetLoggedIn` per heading/persona rows; never probe with sticky `&modal=`.

---

## Stub matrix (current — React host)

Injected by `runMcpPageProbe`: `overlay-arm`, `url-screen` (address bar `screen=chat`).

| Step | Id | Expect |
|------|-----|--------|
| auto | `overlay-arm` | BR agent-testing panel visible **before** first interact |
| 1 | `chat-host` | `[data-studio-react-screen="chat"]` present |
| auto | `url-screen` | `screen=chat` in address bar |

**Expected today (Make wire only):** `chat-host` **FAIL** — guards false PROVEN (`studioMcpPageProbe.test.ts`).

**Next matrix rows (before PROVEN — expand recipe in `chatProbeSteps()`):**

| Id | Expect |
|----|--------|
| `chat-landmarks` | `main` / thread region; Site Pilot secondary header sticky on scroll ([PLAYBACK.md](../../../shell/PLAYBACK.md) fragile coupling) |
| `chat-composer-dock` | Composer dock in-place or portal per beat; `[data-studio-chat-composer="true"]` (or React successor) |
| `chat-composer-textarea` | Query field focusable; height sync (max 5 lines) |
| `chat-send` | Send / robo send path; no hang (R10 capped bridge) |
| `chat-frame-reveal` | Scenario frames `[data-name="query"]` / `[data-name="reply"]` reveal under `site-pilot-chat` |
| `chat-thinking` | Playback thinking chrome during agent reply prelude (`sitePilotChatThinking`) |
| `chat-make-retired` | `data-studio-make-retired` on Make child 10 when React mounts; no duplicate composer |
| `chat-heading-auth` | Persona heading branches on `__studioIsLoggedIn()` only — no new auth store |
| DS hover | Send, mic (if shown), ≥1 agent CTA chip — Uma signs; Quinn MCP-hover |

---

## Selectors (expected once Finn mounts React host)

**Probe / mount contract (hard):**

| Role | Selector |
|------|----------|
| React host | `[data-studio-react-screen="chat"]` |
| BEM root (target) | `.chat` (screen folder `screens/chat/` = `screenId`) |
| Make retired | ancestor `data-studio-make-retired` on viewport child 10 |

**Playback / scenario (Make today — must keep working until parity; React should expose stable `data-studio-*` equivalents):**

| Role | Selector / hook |
|------|------------------|
| Scenario screen | `.studio-viewport > div > div:nth-child(10)` |
| Scroll host | `.studio-scroll--prototype:not(.hidden)` |
| User frame | `[data-name="query"]` |
| Agent frame | `[data-name="reply"]` |
| Agent CTA | `[data-name="component.input.button"]` |
| Composer card | `.proto-site-pilot-composer` · `findSitePilotChatComposerCard()` |
| Composer flag | `[data-studio-chat-composer="true"]` |
| Dock | `.proto-chat-composer-dock[data-studio-chat-screen="10"]` |
| Textarea | `textarea.proto-agentic-query` |
| Send | `.proto-agentic-send` |
| Summary anchor | `[data-name="component.appointment.summary"]` |
| Robo demo classes | `.proto-chat-cta--hover` / `--pressed` · `.proto-agentic-send--sending` (playback only — not product PROVEN asserts) |

**Engine wiring (not DOM):** `activeScreenScenario.id === "site-pilot-chat"` → `collectSitePilotChatScenarioFrames`, `sitePilotChatPlaybackHooks` (`beforeReveal`, `onFinale`, `onPreludeAbort`), `playbackStepHooks` only when `studioJourneyMode` + chat scenario active.

---

## Playback smoke criteria (MANDATORY before Chat PROVEN)

Not automated in CI (lean budget). Quinn **must** PASS manually or via dev MCP helpers on canonical `:5173` after React mount **and** after any change to `sitePilotChat.ts`, `sitePilotChatScenario.ts`, `App.tsx` chat hooks, or `journeys.ts` chat beat.

**Entry URL for agentic path:**

`?project=boots-pharmacy&screen=chat&persona=sarah-jenkins&cjm=on&experience=agentic`  
(or start from `screen=site-pilot` + `cjm=on` and Play through `agentic-home` → `agentic-chat`)

| # | Check | Pass criteria |
|---|--------|----------------|
| P1 | **Journey Play on Chat** | CJM on + `experience=agentic`; land `agentic-chat` beat; `screen=chat`; touchpoint shows chat frame counter |
| P2 | **Beat enter / scroll** | Beat-enter does not fight restored tab; chat scroll pins to bottom during agent thinking; step forward/back restores frame index + scroll baseline ([PLAYBACK.md](../../../shell/PLAYBACK.md) retreat sync) |
| P3 | **Demo cursor path** | `moveDemoCursorTo` on send + agent CTAs; native hover/press (R10); no orphan cursor after `abortSitePilotChatPlaybackPrelude` / forceClear |
| P4 | **Agentic vs traditional after React mount** | **Agentic:** home query → chat frames → avail finale (`runSitePilotChatScenarioFinale`). **Traditional:** full `TRADITIONAL_CJM_JOURNEY` Play still advances (PLP→PDP→book…) — Chat React mount must not break orchestra mode switch (`experience=traditional` / `__protoSetOrchestraMode`) |
| P5 | **Composer dock / thinking / send** | `ensureSitePilotChatComposerDock`; thinking prelude ~`SITE_PILOT_CHAT_PLAYBACK_THINK_MS`; typing simulation + send pulse; CTA-before-user frames (e.g. frame 5/7 patterns in `sitePilotChat.ts`) |
| P6 | **REC ⊗ CJM ⊗ AIR XOR** | CJM on → REC disabled; REC on → CJM off; AIR locks both — panel labels/counters unchanged after chat playback session |
| P7 | **Transport smoke helpers** (dev console) | At least one of: `__protoRunHomePlaySmoke` (home→chat handoff), `__protoRunAgenticStepForwardSmoke`, `__protoSmokeRetreatChecks` / `__protoRunRetreatSmoke` (chat counter ≥10, not 2/25), `__protoRunTraditionalPlaySmoke` — **PASS** with no `playback-diagnostic` stall |
| P8 | **Persistence** | Hard refresh on chat mid-journey restores `screen` + `cjm`/`experience`; no forced hub bounce |
| P9 | **Agentic chat chrome** | Site Pilot secondary header **sticks** below main header when scrolling thread |
| P10 | **Post-playback teardown** | Stop Play; overlay gone; no stuck avail modal; `&modal=` stripped after agent test |

**Existing Make playback inventory:** [PLAYBACK.md](../../../shell/PLAYBACK.md) § Manual smoke checklist (Agentic full path, Traditional full path, composer send, retreat contract tests in `agenticRetreatContract.test.ts`).

---

## MCP real-user matrix (gate — not run this stub wave)

Chat **PROVEN** requires:

1. Full `__studioRunMcpPageProbe({ screenId: "chat", reload: false })` expanded matrix PASS with overlay on **every** step + evidence log in `docs/projects/boots-pharmacy/audits/FE_AUDIT_CHAT_MCP_*.md` (future).
2. Playback smoke table above **PASS** on tip SHA.
3. Uma fidelity PROVEN (Make register + DS checks) — separate artifact.

**This wave:** criteria doc only — **no live MCP probe** (no React host → `chat-host` would FAIL by design).

---

## PAGE FINAL PASS / parity

- **PDP** remains HARD-GREEN; **PLP** HARD-GREEN — Chat work does not demote them.
- **Home** (`site-pilot`) remains stub — Chat does not inherit Home PROVEN.
- **No** `chat` row in `PARITY_PROVEN.json` until Quinn MCP + playback smoke PASS (Arch/Pax).

---

## Optional lean checks (no marathon)

```bash
npm run test -- src/app/shell/__tests__/studioMcpPageProbe.test.ts -t "chat stub"
npm run test -- src/app/shell/__tests__/studioUrl.test.ts
npm run test -- src/app/orchestra/__tests__/resolveActiveScreenScenario.test.ts
```

Do **not** run full Playwright marathon in CI for this stub.

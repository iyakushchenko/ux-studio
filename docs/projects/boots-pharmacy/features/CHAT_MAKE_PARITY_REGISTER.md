# Chat Make → React parity register

**Project:** `boots-pharmacy`  
**Callsigns:** Bea (BA) owns register truth · Quinn (QA) owns prove · Finn/Uma restore gaps  
**Updated:** 2026-07-21 (truth label added; detailed table retains 2026-07-19 kickoff baseline)  
**Overall proof status:** Chat PAGE FINAL PASS **HARD-GREEN** per [NEXT_STEPS.md](../../../product/NEXT_STEPS.md) and [FE_AUDIT_CHAT_PAGE_FINAL_PASS_2026-07-20.md](../audits/FE_AUDIT_CHAT_PAGE_FINAL_PASS_2026-07-20.md).  
**Register interpretation:** The detailed columns and Missing P0 list preserve the kickoff baseline, including the period when the React mount was off. They are not current status. Use the audit/Final Pass evidence for closure; do not rewrite individual rows without row-level evidence. A newly discovered P0 reopens Final Pass and the board.
**Make source:** Frame child **10** (`Agentic. Site Pilot. Chat`) — `Frame337` microheader + `Body9` in `frame/index.tsx` (`left-[1535px]` UX frame) · wire `BootsPharmacyProjectView` child-10 effects · `dom/sitePilotChatScenario.ts` · `dom/sitePilotChatThinking.ts` · `playback/sitePilotChat.ts` · orchestra `App.tsx` (`site-pilot-chat`)  
**Public `screenId`:** `chat` (URL `?screen=chat`; scenario id `site-pilot-chat`)  
**React target:** `src/projects/boots-pharmacy/screens/chat/*` — **live** (`CHAT_REACT_MOUNT_ENABLED=true`; Make child 10 `data-studio-make-retired`)  
**Refs:** [CHAT_REACT.md](./CHAT_REACT.md) · [HOME_MAKE_PARITY_REGISTER.md](./HOME_MAKE_PARITY_REGISTER.md) (composer shared kit) · [URL.md](../../../shell/URL.md) · [PAGE_FINAL_PASS.md](../../../product/PAGE_FINAL_PASS.md)

**Status legend:** Present · Partial · Missing · Fixed · N/A

**Make column:** inventory from Frame `Body9` + `ComponentAppointmentSummary2` + wire/dom/playback (2026-07-19).  
**React column:** historical kickoff baseline, including the mount-off period; retained as migration traceability.

**Bea rule:** Every band before Finn codes — **thinking / send-stop / browse-reveal** = **P0** (Make has them; not a page spinner). No invented bands. **Composer = same component as Site Pilot Home** — not a fork ([HOME_MAKE_PARITY_REGISTER.md](./HOME_MAKE_PARITY_REGISTER.md) L7).

**PAGE FINAL PASS:** Chat — **NOT-GREEN** (not in `PAGE_FINAL_PASS.json` `requiredScreens`; do **not** add until honest PROVEN). **PDP HARD-GREEN unchanged.**

---

## Layout (every Make band)

| # | Make behavior | Make | React status | Evidence |
|---|---------------|------|--------------|----------|
| L1 | **1440 shell** — child-10 frame `w-[1440px]`, UX column | **Present** | **Missing** | `frame/index.tsx` child 10 wrapper |
| L2 | **Engine header** — `boots-pharmacy.module.header` (shared navy) | **Present** | **N/A** (engine) | GhBsBrandSwitcher8 |
| L3 | **Chat microheader (Frame337)** — white bar above thread (structural sticky; outside `.chat__column`) | **Present** | **Present** | `ChatSitePilotBar` · `data-studio-chat-site-pilot-bar` |
| L4 | **Microheader logo** — `boots.ai assistant 3` compact (112×29) | **Present** | **Present** | `ChatSitePilotBar` SitePilotCompactLogo |
| L5 | **Contact Support** — tertiary pill + question icon | **Present** | **Present** | `chat__site-pilot-action` |
| L6 | **Rate your experience** + **More** — header aux actions | **Present** | **Present** | `chat__site-pilot-action` |
| L7 | **Body fill** — `#dbebf5` full-width `data-name="body"` | **Present** | **Missing** | `Body9` |
| L8 | **Thread host** — `component.appointment.summary` 864px, `gap-[40px]`, centered in `p-[64px]` | **Present** | **Missing** | `ComponentAppointmentSummary2` |
| L9 | **User bubbles (`query`)** — mint-tint card `bg-[rgba(245,255,254,0.35)]`, 438px, right-aligned column | **Present** | **Partial** | React live — Uma pixel PROVEN still PENDING |
| L10 | **Agent bubbles (`reply`)** — white `component.co.order.summary` 16px pad + inline CTAs | **Present** | **Partial** | React live — Uma pixel PROVEN still PENDING |
| L11 | **Per-reply helpful strip** — “Was this reply helpful?” + thumbs Yes/No on **reply** (Make: first `Reply`; React: r0 + latest r3, centered) | **Present** | **Partial** | `ChatScreen` `HelpfulStrip` · Make `ComponentGseSystemMessage` / `Frame342`–`343` |
| L12 | **Conversation feedback (finale band)** — “Was this conversation helpful so far?” — wire **hidden** until scripted | **Present** | **Partial** | React band `hidden` — live |
| L13 | **Disclaimer** — “SitePilot can make mistakes…” + underlined support link below thread | **Present** | **Partial** | `chat__disclaimer` — live |
| L14 | **Footer** — absent on Chat Make child 10 | **N/A** | **N/A** | Do not invent |
| L15 | **Accordion / chat history sidebar** — absent on Chat Make | **N/A** | **N/A** | No `component.gse.accordion` in `Body9` |

---

## Loading / empty / updating (P0 when Make has them)

| # | Make behavior | Make | React status | Evidence |
|---|---------------|------|--------------|----------|
| LE1 | **Playback thinking bubble** — dots before each `reply` frame reveal (~**1400ms** `SITE_PILOT_CHAT_PLAYBACK_THINK_MS`) | **Present** | **Partial** | React bridge + `@/uxds/motion` bubble — live only when mount ON |
| LE2 | **Thinking fade-out** — exit class ~360ms before reply shows | **Present** | **Partial** | React `AnimatePresence` exit ~360ms via bridge |
| LE3 | **Browse / CJM-off saved-chat load** — blank `STUDIO_CONTENT_LOAD_MS` interim → **full thread** → smooth scroll bottom (**not** creation thinking / progressive) | **Present** | **Present** | [CHAT_PAGE_RAILS.md](./CHAT_PAGE_RAILS.md) · `runChatBrowseEntryReveal` — do **not** invent thinking pause on `cjm=off` |
| LE4 | **Send thinking** — user send → thinking bubble + send becomes **Stop** glyph | **Present** | **Partial** | `SitePilotComposer sendThinking` + bridge |
| LE5 | **Ambient hint thinking** — frame 1 / after cancel → hint bubble before first reply | **Present** | **Partial** | Bridge publishes hint mode |
| LE6 | **Page load spinner / empty thread** | **N/A** | **N/A** | Static scripted thread — **forbidden** invent full-page loader |
| LE7 | **“Updating results…”-style listing overlay** | **N/A** | **N/A** | Not in Make Chat |

---

## Interactions / DS states

| # | Make behavior | Make | React status | Evidence |
|---|---------------|------|--------------|----------|
| I1 | **Fixed composer dock** — in-place bottom; `--proto-chat-composer-h` pad; scroll pin near bottom | **Present** | **Missing** | `setupSitePilotChatComposerDock` |
| I2 | **Composer card** — white shadow `component.co.order.summary`, 32px pad, same row as Home (mic + send) | **Present** | **Missing** | `ComponentCoOrderSummary8` |
| I3 | **Textarea** — wire replaces placeholder `<p>`; `textarea.proto-agentic-query`; autosize 1→5 lines | **Present** | **Missing** | `BootsPharmacyProjectView` composer effect |
| I4 | **Placeholder** — “Ask Boots SitePilot” (13px `#7a7d87`) | **Present** | **Missing** | `Subtotal10` / wire |
| I5 | **Mic** — 48×48 outline button (visual; no voice) | **Present** | **Missing** | `ComponentInputButton2` |
| I6 | **Send** — navy `proto-agentic-send`; Stop while thinking | **Present** | **Missing** | wire + `sitePilotChatThinking.ts` |
| I7 | **Next dialog chips ×3** — NHS / Show available slots for today / Elaborate on previous reply | **Present** | **Missing** | `Frame350` |
| I8 | **Chip fill textarea** — chip click fills composer (not navigate) | **Present** | **Missing** | wire `onCardClick` |
| I9 | **Chip “Show available slots for today”** — opens Availability Tool (`dateToday`) | **Present** | **Missing** | wire allowlist |
| I10 | **Agent inline CTAs** — navy pills via UXDS `ButtonPrimary` + `--commerce` (Make `component.input.button`; Figma `#003fcb` rest forced navy like Make globals) | **Present** | **Partial** | `ChatScreen` `AgentCta` · size-only `.chat__cta` |
| I11 | **Product links** → PDP (UXDS `.uxds-link` rest/hover — not invent always-underline) | **Present** | **Partial** | `chat__link uxds-link` · wire `PRODUCT_LINK_RE` |
| I12 | **“Go to vaccines catalog”** CTA → PLP | **Present** | **Missing** | wire `goPlp` |
| I13 | **Availability Checker Tool** underline → overlay | **Present** | **Missing** | wire `AVAIL_BTN_INTENT` |
| I14 | **Reply helpful Yes/No** (+ thumbs, DS hover) | **Present** | **Partial** | React buttons + Make SVG thumbs — wire no-op |
| I15 | **Conversation helpful** (hidden band) | **Present** | **Missing** | feedback frame hidden |
| I16 | **CTA hover/press (demo)** — `proto-chat-cta--hover` / `--pressed` during playback | **Present** | **Missing** | `playback/sitePilotChat.ts` |
| I17 | **Demo cursor** — robo on CTA + send; stripped from DOM | **Present** | **Missing** | `moveDemoCursorTo` · `stripSitePilotChatDemoCursors` |
| I18 | **Scenario deck interrupt** — click scenario controls cancels send-thinking | **Present** | **Missing** | wire `onScenarioDeckClick` |
| I19 | **Composer suppressed** when blocking overlays open | **Present** | **Missing** | `setSitePilotChatComposerDockSuppressed` · `App.tsx` |
| I20 | **Scroll ownership** — chat tab skips default scroll-top; scenario start pins top; else bottom | **Present** | **Missing** | wire + `App.tsx` `proto-chat-scenario-at-start` |
| I21 | **Mic/send/chip/CTA hover·focus** vs Make/UXDS | **Present** | **Missing** | Uma §0a — no invent colors |
| I22 | **Thread motion** — scenario frame reveal + thinking (not height-thrash CSS) | **Present** | **Missing** | React target: `@/uxds/motion` per [MOTION.md](../../../product/MOTION.md) |

---

## Shared kit — Site Pilot composer (Home + Chat)

| # | Contract | Make | React status | Evidence |
|---|----------|------|--------------|----------|
| SK1 | **Single React component** for query row + mic + send + chip row — used by `site-pilot` **and** `chat` | **Present** (Make duplicates markup) | **Partial** | `SitePilotComposer` shared; Chat wired but mount flag OFF |
| SK2 | **Home variant** — “Suggested dialog options:” + 3 home chips; `data-studio-action=agentic-home-*` | **Present** | **Present** | Home → `SitePilotComposer surface="home"` |
| SK3 | **Chat variant** — “Next dialog options:” + 3 chat chips; `data-studio-action=agentic-chat-query` | **Present** | **Partial** | Chat chips in React; Make dock authoritative until flip |

---

## Wire / mount gates

| # | Behavior | Make | React status | Evidence |
|---|----------|------|--------------|----------|
| W1 | React host child 10 | — | **Present** | `CHAT_REACT_MOUNT_ENABLED=true`; Make `data-studio-make-retired` |
| W2 | `data-studio-make-retired=chat` | — | **Partial** | Mount path ready; retired attr only when flag true |
| W3 | URL `?project=boots-pharmacy&screen=chat` | **Present** | **Present** | `screens.ts` · `studioUrl.ts` |
| W4 | Make wire early-return when React mounted | — | **Partial** | `isChatReactMounted()` gates wire + dock; inactive while flag false |
| W5 | No LEGACY growth for React path | — | **Partial** | `chat.css` + `site-pilot-composer.css` only |
| W6 | PAGE FINAL PASS stamp | — | **Missing** | Do **not** add `chat` to `requiredScreens` until PROVEN |
| W7 | Engine header + microheader remain hybrid until React owns full shell | **Present** | **N/A** | Finn scope = body thread + dock |

---

## CJM / playback / URL contracts

| # | Contract | Make / engine | React status | Evidence |
|---|----------|---------------|--------------|----------|
| C1 | **Agentic deep link** — `?project=boots-pharmacy&screen=chat&persona=sarah-jenkins&cjm=on&experience=agentic` | **Present** | **Present** | [URL.md](../../../shell/URL.md) |
| C2 | **Traditional path** — `experience=traditional` → PLP/PDP/book beats; **no** `site-pilot-chat` beat | **Present** | **Present** | `TRADITIONAL_CJM_JOURNEY` |
| C3 | **Journey beat** — `agentic-chat` → `scenarioId: site-pilot-chat`, `protoTab: 2` | **Present** | **Present** | `journeys.ts` |
| C4 | **Scenario config** — `minVisibleFrames: 1`, `playbackStepMs: 2000` | **Present** | **Present** | `screens/scenarios.ts` |
| C5 | **Frame collection** — summary children minus composer, thinking, feedback | **Present** | **Missing** | `collectSitePilotChatScenarioFrames` |
| C6 | **beforeReveal** — thinking → type/CTA demo → reveal `reply` / `query` | **Present** | **Missing** | `runSitePilotChatBeforeReveal` |
| C7 | **Finale** — “Choose Different Date” demo click → Availability Tool `dateChat` → journey advance | **Present** | **Missing** | `runSitePilotChatScenarioFinale` |
| C8 | **Browse reveal** — off-CJM chat tab → auto full thread + thinking prelude | **Present** | **Missing** | `runChatBrowseReveal` |
| C9 | **Touchpoint counter** — chat frame index in studio nav | **Present** | **Present** | `resolveStudioTouchpoint` |
| C10 | **REC compile** — beat `agentic-chat` → scenario `site-pilot-chat` | **Present** | **Present** | `recordingCompile.ts` |
| C11 | **Overlay eyes** — availability/login/QV suppress composer; finale retreat on overlay close | **Present** | **Missing** | `App.tsx` + modal guard |
| C12 | **Do not use legacy `mode=`** for new links — `cjm=` + `experience=` only | **Present** | **Present** | URL.md |

### `__studio*` helpers (chat-touching)

| Helper | Role |
|--------|------|
| `__studioRunMcpPageProbe` | Quinn prove matrix (future `screenId: chat`) |
| `__studioRunMcpSanityCheck` | Chrome XOR / overlay hygiene when on chat |
| Scenario playback | `collectScenarioFrames` + hooks when `site-pilot-chat` active (no separate window export) |
| Demo cursor | `moveDemoCursorTo` / `notifyStudioDemoClick` via playback prelude |

---

## Overlays / modals (chat-triggered)

| # | Make behavior | Make | React status | Evidence |
|---|---------------|------|--------------|----------|
| O1 | **Availability Tool** — from chat CTAs / finale / chip | **Present** | **Partial** | Engine overlay; wire allowlist |
| O2 | **Login popup** — copy mentions Boots Account | **Present** | **Partial** | Shared engine overlay |
| O3 | **Quick View / vaccine picker** — not primary chat path | **N/A** | **N/A** | Suppress composer if open |

---

## Honest residual / blockers (Finn mount)

| Id | Note |
|----|------|
| B1 | **PO override:** Chat kickoff while **Site Pilot (`site-pilot`) NOT Final Pass hard-green** — document only; Arch accepted for register/brief. |
| B2 | **Mount ON** — Quinn agentic P1–P10 playback smoke green on React host (2026-07-19); Make retired. No Chat PROVEN / Final Pass yet. |
| B3 | **Scenario frames** — React emits `data-name=query|reply` + `data-studio-chat-frame`; `getChatSummary` prefers React host (Make first-match trap fixed). |
| B4 | **Thinking UI** — LEGACY CSS classes today (`proto-chat-thinking-*`); React should use `@/uxds/motion` for bubble enter/exit without inventing new copy/placement. |
| B5 | **Wire DOM surgery** — textarea replace + dock must early-return when React mounted (mirror Home). |
| B6 | **No PROVEN** — no `PARITY_PROVEN.json` row for `chat` on this kickoff. |
| B7 | **PDP PAGE FINAL PASS HARD-GREEN** — must stay; Chat work must not demote PDP stamp. |

---

## Prove URL (R11)

```
http://localhost:5173/?project=boots-pharmacy&screen=chat&persona=sarah-jenkins&cjm=on&experience=agentic
```

Traditional (no chat beat):

```
http://localhost:5173/?project=boots-pharmacy&screen=plp&persona=sarah-jenkins&cjm=on&experience=traditional
```

```js
// Future — Quinn criteria TBD; not PROVEN on kickoff
await window.__studioRunMcpPageProbe?.({ screenId: "chat", reload: false })
```

---

## Band count summary (Bea)

| Area | Bands |
|------|------:|
| Layout (L*) | 15 |
| Loading / empty / updating (LE*) | 7 |
| Interactions (I*) | 22 |
| Shared composer kit (SK*) | 3 |
| Wire / mount (W*) | 7 |
| CJM / playback (C*) | 12 |
| Overlays (O*) | 3 |
| **Total registered** | **69** |

---

## Missing P0 list (React kickoff — must close before PROVEN)

| P0 | Band |
|----|------|
| Playback thinking bubble + timing + fade (LE1, LE2) | LE1–LE2 |
| Browse reveal thinking + full thread pin (LE3) | LE3 |
| Send thinking + Stop send mode (LE4) | LE4 |
| Hint thinking on frame 1 / cancel (LE5) | LE5 |
| Fixed composer dock + disclaimer geometry (I1, L13) | I1 |
| Shared composer component Home≡Chat (SK1–SK3) | SK1 |
| Chat chip row + fill + availability chip (I7–I9) | I7–I9 |
| Scenario frame playback + demo cursor prelude (C6–C7, I16–I17) | C6–C7 |
| Agent CTAs + PDP/PLP/avail wiring (I10–I13) | I10–I13 |
| Composer suppress under overlays (I19, C11) | I19 |
| DS hover/focus on composer + CTAs (I21) | I21 |
| Thread/scenario motion via `@/uxds/motion` (I22) | I22 |

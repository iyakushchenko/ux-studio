# Uma fidelity stamp — Site Pilot Chat

**Surface:** Boots Pharmacy Site Pilot Chat (`screenId: chat`, Frame child **10**, Make `Body9`)  
**Date:** 2026-07-19  
**Owner:** Uma (UI/UX)  
**Status:** **IN PROGRESS** — React Chat host **ON**; **NOT PROVEN** (no false Final Pass)  
**React target:** `screens/chat/*` — **live** (`CHAT_REACT_MOUNT_ENABLED=true`; Make child 10 `data-studio-make-retired=chat`)  
**Make truth:** `frame/index.tsx` `Body9` · `ComponentAppointmentSummary2` · `query` / `reply` bubbles · `component.co.order.summary` · `component.gse.system.message` (feedback + chips) · `ComponentCoOrderSummary8` (composer) · `globals-chrome.css` child-10 · `globals-screens.css` chat flash  
**Wire / DOM today:** React `ChatScreen` + shared `SitePilotComposer` · `chatThinkingBridge` · Motion frames via `@/uxds/motion` · playback `sitePilotChat.ts`  
**Register:** [CHAT_MAKE_PARITY_REGISTER.md](../features/CHAT_MAKE_PARITY_REGISTER.md) · brief [CHAT_REACT.md](../features/CHAT_REACT.md)  
**Shared composer:** `screens/shared/SitePilotComposer.tsx` (Home + Chat)  
**Checklist:** [../../../product/UMA_FIDELITY_NOTES.md](../../../product/UMA_FIDELITY_NOTES.md) · [MOTION.md](../../../product/MOTION.md) · [VISUAL_FIDELITY.md](../../../product/VISUAL_FIDELITY.md) · [FE_UI_UX_AUDIT.md](../../../product/FE_UI_UX_AUDIT.md) · [PAGE_FINAL_PASS.md](../../../product/PAGE_FINAL_PASS.md)

**Gate:** PDP PAGE FINAL PASS **HARD-GREEN** — **do not demote PDP**. Chat Final Pass / whole-page PROVEN blocked until §0a + §0b complete.

---

## Verdict

| Field | Value |
|-------|-------|
| **Overall** | **IN PROGRESS** — React host live; composer identity vs Site Pilot **PARTIAL**; whole-page **NOT PROVEN** |
| **§0a typical DS / pointer matrix** | **PARTIAL** — shared kit CSS has mic/send/chip hover+focus+active; reply CTA hover in `chat.css`; helpful Yes/No + thumbs restored (hover CSS); MCP hover rows exist — full Nazi side-by-side still open |
| **§0b section vertical rhythm** | **PENDING** — thread `gap` / body pad **64px** / bubble **16px** — MCP measure before PARTIAL layout claim |
| **loading / empty / updating** | **PARTIAL (P0)** — React `ChatThinkingBubble` + Motion enter; send→stop glyph on shared send — still need live timing vs wire `SITE_PILOT_CHAT_PLAYBACK_THINK_MS` |
| **checkbox / radio hover** | **N/A** — no checkbox/radio on Chat Make frame |
| **Composer ↔ Home shared kit** | **PASS (identity)** — same `SitePilotComposer` + `site-pilot-composer.css`; Chat label **“Next dialog options:”** (not Home “Suggested…”); dual-class `proto-agentic-*` retained |
| **Motion** | **PASS (ownership)** — frames + thinking via `@/uxds/motion` (`AnimatePresence` / `motion.*`); no new max-height thrash on React path |
| **Accordion / history** | **N/A on Make chat** — do not port PDP FAQ accordion here |
| **PO green-light allowed?** | **No** — IN PROGRESS only |
| **PAGE FINAL PASS** | **NOT-GREEN** — no false stamp |

**Honest scope (Make `Body9` / summary column):**

- **Present in Make:** navy header · sticky Site Pilot secondary bar (logo + Contact Support) · `#dbebf5` body · centered **864px** thread · user `query` bubbles (mint wash, **438px**) · agent `reply` cards (white, full width) · inline **pill CTAs** in replies · **“Was this reply helpful?”** / **“Was this conversation helpful so far?”** feedback rows · **“Next dialog options:”** chips in composer · mic + send composer · disclaimer under thread · **9** CJM scenario frames (wire `proto-scenario-frame`)  
- **Absent in Make (must not invent):** PLP Advantage strip · chat mini-footer (wire hides `.proto-footer-mount` on child 10) · FAQ accordion · page-level “Updating results…” listing loader  
- **Wire-only (not in static Figma export):** thinking bubble · fixed composer dock + bottom fade · user-send flash on query (`proto-chat-highlight` keyframes)

---

## Layout bands — Make `Body9` inventory (await Bea register)

| # | Make band / component | Make truth (computed / DOM) | Uma stamp | Notes |
|---|------------------------|----------------------------|-----------|-------|
| **C1** | **Shell / column** — 1440, **64px** pad on body stack | `Body9` inner `p-[64px]`; summary **864px** centered | **PENDING** | Sticky bar uses **1312px** inner max ([globals-chrome.css](../../../../src/styles/globals-chrome.css) child-10) |
| **C2** | **Page bg / atmosphere** | `#dbebf5` on `[data-name="body"]` | **PASS (PO)** | Solid `#dbebf5` only — **no** composer / under-bar fade wash (PO 2026-07-19) |
| **C3** | **Sticky Site Pilot bar** | `data-studio-sticky-group` — white bar, logo cluster + Contact Support | **PENDING** | JS-injected sticky; Nazi QA on scroll lock frame 1 |
| **C4** | **Thread column** — `component.appointment.summary` | `flex-col gap-[40px]` · **864px** · children: query/reply pairs + feedback + composer card | **PENDING** | `padding-bottom: var(--proto-chat-composer-h)` when dock mounted |
| **C5** | **User query bubble** | `data-name="query"` · `component.co.order.summary` · `bg-[rgba(245,255,254,0.35)]` · **rounded 16** · **p 16** · **w 438** · right-aligned | **PENDING** | Send flash: outline keyframes — port or Motion equivalent per § Motion |
| **C6** | **Agent reply bubble** | `data-name="reply"` · white card · **p 16** · **gap 16** inside · full width | **PENDING** | Long-form copy + **Next Steps:** + pill CTA rows |
| **C7** | **Reply inline CTAs** | `component.input.button` → UXDS `ButtonPrimary` commerce · **32px** size-only · all navy (Make globals forced Figma `#003fcb` → `#012169`) | **PARTIAL** | Kit hover/active; full frame sweep still open |
| **C8** | **Feedback strip** | `component.gse.system.message` · `rgba(215,233,248,0.57)` · Yes/No micro-controls | **PENDING** | Per-reply vs end-of-thread copy differs — stamp both |
| **C9** | **Thinking / agent pending** | Wire: `proto-chat-thinking-bubble` · dots animation · **not** a Make static layer | **PENDING (P0)** | Must match send + CJM playback timing (`SITE_PILOT_CHAT_PLAYBACK_THINK_MS`); no invent alternate loader |
| **C10** | **Composer card** — `ComponentCoOrderSummary8` | White · **rounded 16** · shadow `0 4px 4.45px rgba(1,33,105,0.1)` · **p 32** · internal **gap 32** (list + chips) | **PENDING** | **Must pixel-match Home H5** — shared kit required ([UMA_FIDELITY_HOME_2026-07-19.md](./UMA_FIDELITY_HOME_2026-07-19.md) H5–H11) |
| **C11** | **Composer row** — `Subtotal10` | Placeholder **“Ask Boots SitePilot”** `#7a7d87` · mic + send **48px** circles (wire → textarea) | **PENDING** | Home: **gap 16** · top-align multiline — Chat wire must not drift |
| **C12** | **Next dialog chips** | Label **“Next dialog options:”** 10px `#7a7d87` · chips `rgba(204,224,242,0.57)` · 13px navy | **PENDING** | Home uses **“Suggested dialog options:”** — Chat label is **different** (Make truth); chips same family |
| **C13** | **Disclaimer** | 10px `#3a3a3a` · support link `#012169` underline | **PENDING** | Fixed with composer dock (`proto-chat-composer-disclaimer`) |
| **C14** | **Scenario frame motion** | 9 frames · `.proto-scenario-frame` reveal/hide | **PENDING** | See § Motion — migrate off raw `max-height` CSS thrash |
| **C15** | **Footer on chat** | Make may include footer in artboard export | **PENDING** | Wire: **hide** `.proto-footer-mount` on child 10 — React must not resurrect mini-footer |

---

## Motion ownership (locked for Chat — cite [MOTION.md](../../../product/MOTION.md))

**Hard rule (PO / Arch):** All **user-visible animated chat transitions** on the React migration path go through **`@/uxds/motion`** (`AnimatePresence`, `motion.*`, `useReducedMotion`). **No** new raw `framer-motion` imports. Trivial one-property hover on mic/send/chips stays CSS per MOTION.md table.

| Transition | Current (hybrid wire) | React target | Forbidden |
|------------|----------------------|--------------|-----------|
| **Scenario frame reveal / hide** (CJM 1…9) | LEGACY CSS: `opacity` + `transform` + **`max-height 0 ↔ 3200px`** on `.proto-scenario-frame` ([globals-chrome.css](../../../../src/styles/globals-chrome.css) ~1295–1316) | `AnimatePresence` + opacity/y **or** Motion `height` `0` ↔ `"auto"` for collapse — **one** owner; `initial={false}`; reduced-motion safe | Ad-hoc `max-height` tween zoos; `grid-template-rows` accordion hacks on thread rows |
| **Thinking bubble enter / exit** | `@keyframes proto-chat-thinking-reveal/exit` + dot pulse | `motion.*` enter/exit (opacity + small y) — decorative dots may stay CSS if `prefers-reduced-motion` honored | Invent spinner/skeleton not in wire |
| **Composer dock / disclaimer presence** | Fixed positioning + `--proto-chat-composer-h` padding sync (`syncInPlaceGeometry`) | Layout padding may stay imperative; **enter/exit** of suppressed composer → Motion presence, not `display` flip alone | CSS height thrash on summary column to “animate” dock |
| **Query send flash** | `@keyframes proto-chat-flash` on user bubble | Motion one-shot highlight **or** registered deviation — match Make outline/shadow timing | Permanent invent glow |
| **Accordion expand** | **N/A** — no accordion on Chat Make | If Bea adds history accordion later: UXDS `AccordionContent` height motion only ([MOTION.md](../../../product/MOTION.md) § Accordion) | CSS `grid-template-rows` 0fr/1fr on chat |

**PDP note:** Shell-only motion pilots do not demote PDP HARD-GREEN; **user-visible chat thread transitions** on a React mount **will** require Quinn re-prove before Chat PROVEN (same class as PDP Accordion policy in MOTION.md).

---

## §0a — Typical DS state matrix (PARTIAL — not whole-page PROVEN)

**Hard rule:** Rest-state green + missing hover = **FAIL**. Invent hover not in Make / Home parity = **FAIL**. Composer controls **must** match Site Pilot Home matrix (shared kit).

| Control | States to prove (Make + Home parity) | Status | Evidence |
|---------|--------------------------------------|--------|----------|
| **Textarea** (`agentic-chat-query`) | default · placeholder · filled · focus · 1–5 line growth | **PARTIAL** | Shared `site-pilot-composer__query`; Chat placeholder **Ask Boots SitePilot** |
| **Mic** (48px circle) | default · **hover** · **active** · focus-visible | **PARTIAL** | Shared CSS `:hover` `#eef8f7` / border `#afccca` — MCP `chat-composer-mic-hover` |
| **Send / stop** (primary pill) | default **`#012169`** · stop glyph when thinking · hover/active | **PARTIAL** | Shared send hover + `sendThinking` → stop glyph; probe `chat-composer-send` |
| **Next dialog chips** | default · **hover** · **active** · keyboard focus | **PARTIAL** | Label **Next dialog options:**; chip `:hover` in shared CSS — MCP `chat-chip-hover` |
| **Reply pill CTAs** (per frame) | default · hover · active · pressed | **PARTIAL** | UXDS commerce `:hover` — MCP `chat-cta-hover`; full frame sweep still open |
| **Feedback Yes/No** | default · hover · active | **PARTIAL** | Make thumbs + `chat__helpful-choice:hover` — MCP hover prove still open |
| **SearchField** | **N/A** | **N/A** | |
| **Quinn MCP hover prove** | Composer mic + ≥1 chip + ≥1 reply CTA | **PASS when recipe green** | Expanded `chatProbeSteps()` — **≠** whole-page PROVEN |

---

## §0 — Loading / empty / updating (P0)

| Gate | Make / wire | React / hybrid must | Status |
|------|-------------|---------------------|--------|
| **Thinking on send** | Injected bubble + animated dots (~1.4s playback path) | Same placement (after last thread child / before anchor frame) · same mint wash **`rgba(215,233,248,0.57)`** | **PENDING** |
| **Thinking on CJM step** | `hint` / `playback` modes in `sitePilotChatThinking.ts` | No duplicate loader copy elsewhere | **PENDING** |
| **Page loader** | **None** | No skeleton listing invent | **N/A — PASS if absent** |
| **Empty thread** | **N/A** (demo always has content) | Do not invent empty-state illustration | **N/A** |
| **FAIL class** | — | Blank thread + lone text without dots bubble | **Not evaluated** |

---

## Code vs Make — IN PROGRESS gaps (Finn extraction notes)

| Area | Today | Gap vs Make / Home |
|------|--------|-------------------|
| **React mount** | Host ON · Make `data-studio-make-retired=chat` | Pixel Final Pass still open |
| **Composer** | Shared `SitePilotComposer` + dock | Identity PASS; Home↔Chat pixel side-by-side still open |
| **Composer row** | `textarea.site-pilot-composer__query` + dual-class send | Placeholder Chat-specific — OK |
| **Thread** | React frames + `@/uxds/motion` | §0b gap measure PENDING |
| **Thinking** | `ChatThinkingBubble` Motion + bridge | Timing prove vs wire still open |
| **Sticky bar** | Make sticky may still apply via chrome | PENDING scroll-at-start prove |
| **Shared kit** | **Identity PASS** | Whole-page PROVEN blocked on §0a finish + §0b |

---

## No invent vs Make

- Do **not** add accordion, Advantage bar, or PLP loaders to Chat.  
- Do **not** rename **“Next dialog options:”** to Home’s **“Suggested dialog options:”** on Chat.  
- Do **not** invent thinking UI beyond dots bubble already in wire CSS.  
- Reply CTA colors: port Make `#012169` / `#003fcb` — no mint commerce one-offs.  
- Under-match beats invent on hover washes.

---

## §1–§7 — Chrome / CTAs / borders (Chat-scoped)

| Gate | Status | Notes |
|------|--------|-------|
| Page bg (no fade wash) | **PASS (PO)** | C2 — fade removed |
| Promo / Advantage | **N/A** | Not on chat frame |
| Primary / pill CTAs | **PENDING** | C7 — Nazi-hover every frame |
| Icon mic/send | **PENDING** | Shared with Home |
| Borders / radii | **PENDING** | Query **16** / composer **16** / chips **16** |
| Icon+text nowrap | **PENDING** | Pill CTAs + chips single line |
| Checkbox/radio | **N/A** | |

---

## Side-by-side screenshot pass (PENDING)

- [ ] Frame 1 vs frame 9 thread depth (scenario counter 1/9…9/9)
- [ ] User bubble vs agent reply alignment (438 vs full)
- [ ] Thinking bubble on send (before next frame)
- [ ] Composer fixed dock + disclaimer + fade
- [ ] Sticky Site Pilot bar on scroll
- [ ] Mic · send/stop · chip · reply CTA hovers (MCP or photo)
- [ ] Home vs Chat composer **pixel diff** (same kit — post-extract)

---

## Early FAIL risks (Uma forecast)

| Risk | Class | Mitigation |
|------|-------|------------|
| Composer diverges from Home | **FAIL** | Shared kit + stamp H5/C10 together |
| Rest-state-only sign-off | **FAIL** | §0a before PROVEN |
| LEGACY `max-height` frame motion forever | **FAIL** | MOTION.md migration plan |
| Invent thinking spinner | **FAIL** | Wire dots only |
| Demote PDP HARD-GREEN for chat wire | **FAIL** | Chat hybrid ≠ PDP regression |
| Claim IN PROGRESS without **40px** thread gap measure | **FAIL** | §0b MCP numbers |
| Footer visible on chat tab | **FAIL** | Wire hide rule |

---

## Mandatory sign-off stamps (mount ON — honest)

| Line | Stamp |
|------|-------|
| `loading states` | **PARTIAL** — thinking bubble present; timing prove open |
| `checkbox/radio hover` | **N/A** |
| `typical DS checks` | **PARTIAL** — composer identity + hover CSS; feedback + full frame sweep open |
| `fidelity checklist` | **IN PROGRESS** — **not PROVEN** |
| `PAGE FINAL PASS` | **NOT-GREEN** |

---

## team check report lines (Uma — mount ON)

```
Uma (UI/UX): fidelity checklist — IN PROGRESS (React Chat ON; NOT PROVEN / no Final Pass)
Uma (UI/UX): section vertical rhythm — PENDING (§0b MCP gap measure)
Uma (UI/UX): loading states — PARTIAL (ChatThinkingBubble + Motion; timing prove open)
Uma (UI/UX): checkbox/radio hover — N/A
Uma (UI/UX): typical DS checks (state matrix) — PARTIAL (shared composer §0a + CTA/chip hover; feedback PENDING)
Uma (UI/UX): motion ownership — PASS (@/uxds/motion frames + thinking)
Uma (UI/UX): composer shared kit — PASS identity (SitePilotComposer Home↔Chat; Next dialog options:)
Uma (UI/UX): accordion/history — N/A
PAGE FINAL PASS — chat — NOT-GREEN
```

**Knowledge used:** UMA_FIDELITY_NOTES §0/§0a/§0b · MOTION.md · VISUAL_FIDELITY · HOME H5–H11 composer parity · shared `site-pilot-composer.css` — **no whole-page PROVEN claim**.

---

## Blockers for PROVEN

1. **Uma:** §0b MCP measures + finish §0a (feedback Yes/No + full CTA frame sweep) + Home↔Chat pixel side-by-side.  
2. **Quinn:** Expanded probe may PASS recipe rows — still need FE audit artifact + playback P1–P10 before `PARITY_PROVEN.json`.  
3. **Arch:** No Chat Final Pass until Uma PROVEN; PDP HARD-GREEN untouched.

---

## Related

- [NEXT_STEPS.md](../../../product/NEXT_STEPS.md) §5–6  
- [UMA_FIDELITY_HOME_2026-07-19.md](./UMA_FIDELITY_HOME_2026-07-19.md) — composer parity reference  
- [UMA_FIDELITY_PDP_2026-07-19.md](./UMA_FIDELITY_PDP_2026-07-19.md) — stamp format · PDP HARD-GREEN  
- [HOME_REACT.md](../features/HOME_REACT.md) · [MOTION.md](../../../product/MOTION.md)

# Uma fidelity stamp — Site Pilot Chat

**Surface:** Boots Pharmacy Site Pilot Chat (`screenId: chat`, Frame child **10**, Make `Body9`)  
**Date:** 2026-07-19  
**Owner:** Uma (UI/UX)  
**Status:** **IN PROGRESS** — hybrid Make + DOM composer dock; **NOT PROVEN**  
**React target:** `screens/chat/*` scaffold — **runtime off** (`CHAT_REACT_MOUNT_ENABLED=false`; no live `data-studio-react-screen="chat"` until playback port)  
**Make truth:** `frame/index.tsx` `Body9` · `ComponentAppointmentSummary2` · `query` / `reply` bubbles · `component.co.order.summary` · `component.gse.system.message` (feedback + chips) · `ComponentCoOrderSummary8` (composer) · `globals-chrome.css` child-10 · `globals-screens.css` chat flash  
**Wire / DOM today:** `sitePilotChatScenario.ts` (fixed composer dock) · `sitePilotChatThinking.ts` (thinking bubble) · `BootsPharmacyProjectView.tsx` (textarea · mic/send · scenario wiring) · `sitePilotChat.ts` (playback)  
**Register:** [CHAT_MAKE_PARITY_REGISTER.md](../features/CHAT_MAKE_PARITY_REGISTER.md) · brief [CHAT_REACT.md](../features/CHAT_REACT.md)  
**Shared composer:** `screens/shared/SitePilotComposer.tsx` (Home live; Chat scaffold)  
**Checklist:** [../../../product/UMA_FIDELITY_NOTES.md](../../../product/UMA_FIDELITY_NOTES.md) · [MOTION.md](../../../product/MOTION.md) · [VISUAL_FIDELITY.md](../../../product/VISUAL_FIDELITY.md) · [FE_UI_UX_AUDIT.md](../../../product/FE_UI_UX_AUDIT.md) · [PAGE_FINAL_PASS.md](../../../product/PAGE_FINAL_PASS.md)

**Gate:** PDP PAGE FINAL PASS **HARD-GREEN** @ tip `53da33f` / v0.0.38 — **do not demote PDP**. PO override kickoff: Chat started while Site Pilot Final Pass still NOT-GREEN ([NEXT_STEPS.md](../../../product/NEXT_STEPS.md) §6).

---

## Verdict

| Field | Value |
|-------|-------|
| **Overall** | **IN PROGRESS** — checklist seeded; hybrid Make thread + DOM composer only |
| **§0a typical DS / pointer matrix** | **PENDING** — composer mic · send/stop · textarea · reply CTAs · dialog chips · feedback Yes/No |
| **§0b section vertical rhythm** | **PENDING** — thread `gap-[40px]` on `component.appointment.summary` · body pad **64px** · bubble internal **16px** — MCP measure before PARTIAL layout claim |
| **loading / empty / updating** | **PENDING (P0)** — Make has **thinking dots** bubble on send/playback (`proto-chat-thinking-bubble`); not a page loader — prove mechanism matches wire, **do not invent** skeleton/spinner |
| **checkbox / radio hover** | **N/A** — no checkbox/radio on Chat Make frame |
| **Composer ↔ Home shared kit** | **Partial** — `SitePilotComposer` shared; Home live; Chat React off (Make dock authoritative) — Uma pixel sign-off **PENDING** before PROVEN |
| **Accordion / history** | **N/A on Make chat** — `Body9` has **no** `component.gse.accordion`; sticky Site Pilot bar (`data-studio-sticky-group`) is **not** an accordion — do not port PDP FAQ accordion here |
| **PO green-light allowed?** | **No** — IN PROGRESS only |
| **PAGE FINAL PASS** | **NOT-GREEN** — not started; blocked until stamp → PROVEN + Quinn MCP + `PAGE_FINAL_PASS.json` row |

**Honest scope (Make `Body9` / summary column):**

- **Present in Make:** navy header · sticky Site Pilot secondary bar (logo + Contact Support) · `#dbebf5` body · centered **864px** thread · user `query` bubbles (mint wash, **438px**) · agent `reply` cards (white, full width) · inline **pill CTAs** in replies · **“Was this reply helpful?”** / **“Was this conversation helpful so far?”** feedback rows · **“Next dialog options:”** chips in composer · mic + send composer · disclaimer under thread · **9** CJM scenario frames (wire `proto-scenario-frame`)  
- **Absent in Make (must not invent):** PLP Advantage strip · chat mini-footer (wire hides `.proto-footer-mount` on child 10) · FAQ accordion · page-level “Updating results…” listing loader  
- **Wire-only (not in static Figma export):** thinking bubble · fixed composer dock + bottom fade · user-send flash on query (`proto-chat-highlight` keyframes)

---

## Layout bands — Make `Body9` inventory (await Bea register)

| # | Make band / component | Make truth (computed / DOM) | Uma stamp | Notes |
|---|------------------------|----------------------------|-----------|-------|
| **C1** | **Shell / column** — 1440, **64px** pad on body stack | `Body9` inner `p-[64px]`; summary **864px** centered | **PENDING** | Sticky bar uses **1312px** inner max ([globals-chrome.css](../../../../src/styles/globals-chrome.css) child-10) |
| **C2** | **Page bg / atmosphere** | `#dbebf5` on `[data-name="body"]` | **PENDING** | Composer fade gradient must match wire (`::after` on `.proto-chat-screen`) |
| **C3** | **Sticky Site Pilot bar** | `data-studio-sticky-group` — white bar, logo cluster + Contact Support | **PENDING** | JS-injected sticky; Nazi QA on scroll lock frame 1 |
| **C4** | **Thread column** — `component.appointment.summary` | `flex-col gap-[40px]` · **864px** · children: query/reply pairs + feedback + composer card | **PENDING** | `padding-bottom: var(--proto-chat-composer-h)` when dock mounted |
| **C5** | **User query bubble** | `data-name="query"` · `component.co.order.summary` · `bg-[rgba(245,255,254,0.35)]` · **rounded 16** · **p 16** · **w 438** · right-aligned | **PENDING** | Send flash: outline keyframes — port or Motion equivalent per § Motion |
| **C6** | **Agent reply bubble** | `data-name="reply"` · white card · **p 16** · **gap 16** inside · full width | **PENDING** | Long-form copy + **Next Steps:** + pill CTA rows |
| **C7** | **Reply inline CTAs** | `component.input.button` pills **32px** h · **rounded 360** · navy `#012169` / highlight `#003fcb` where Make shows | **PENDING** | §0a hover/active on every pill in scenario |
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

## §0a — Typical DS state matrix (PENDING)

**Hard rule:** Rest-state green + missing hover = **FAIL**. Invent hover not in Make / Home parity = **FAIL**. Composer controls **must** match Site Pilot Home matrix once shared kit lands.

| Control | States to prove (Make + Home parity) | Status | Evidence |
|---------|--------------------------------------|--------|----------|
| **Textarea** (`agentic-chat-query`) | default · placeholder · filled · focus · 1–5 line growth | **PENDING** | Wire replaces static “Ask…” paragraph |
| **Mic** (48px circle) | default · **hover** · **active** · focus-visible | **PENDING** | Same LEGACY values as Home H8 |
| **Send / stop** (primary pill) | default **`#012169`** · sending press · **stop** glyph when thinking · hover/active | **PENDING** | `proto-agentic-send--sending` / `--stop` in chrome CSS |
| **Next dialog chips** | default · **hover** · **active** · keyboard focus | **PENDING** | Make chip hover block (Home H11 family) |
| **Reply pill CTAs** (per frame) | default · hover · active · pressed (`proto-chat-cta--pressed`) | **PENDING** | Each scenario frame with CTAs |
| **Feedback Yes/No** | default · hover · active | **PENDING** | `component.input.button` micro row |
| **SearchField** | **N/A** | **N/A** | |
| **Quinn MCP hover prove** | Composer + ≥1 reply CTA + ≥1 chip | **PENDING** | `screenId: chat` probe TBD |

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
| **React mount** | Make frame child 10 only | No `screens/chat/*` · no `data-studio-make-retired=chat` |
| **Composer** | DOM dock clones last `component.co.order.summary` with “Next dialog options” · classes `proto-site-pilot-composer` | **Not** the same implementation as React Home composer — risk of padding/hover drift |
| **Composer row** | Wire promotes `textarea.proto-agentic-query` | Chat Make rest shows static placeholder line — wire behavior OK if visuals match Home textarea |
| **Thread** | Make static DOM; scenario engine toggles `.proto-scenario-frame--hidden` | Motion policy not yet on `@/uxds/motion` |
| **Thinking** | `sitePilotChatThinking.ts` + LEGACY keyframes | Needs Motion migration + Uma side-by-side on send |
| **Sticky bar** | `data-studio-sticky-group` CSS + JS | PENDING scroll-at-start behavior (`proto-chat-scenario-at-start`) |
| **Shared kit** | **Partial** | `screens/shared/SitePilotComposer.tsx` — Home live; Chat scaffold; pixel sign-off + mount flip still blockers for PROVEN |

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
| Page bg + composer fade | **PENDING** | C2 + `::after` gradient |
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

## Mandatory sign-off stamps (kickoff — all PENDING)

| Line | Stamp |
|------|-------|
| `loading states` | **PENDING** — thinking bubble P0 |
| `checkbox/radio hover` | **N/A** |
| `typical DS checks` | **PENDING** — §0a composer + CTAs + chips |
| `fidelity checklist` | **IN PROGRESS** — not PROVEN |
| `PAGE FINAL PASS` | **NOT-GREEN** |

---

## team check report lines (Uma — kickoff template)

```
Uma (UI/UX): fidelity checklist — IN PROGRESS (Chat kickoff; NOT PROVEN)
Uma (UI/UX): section vertical rhythm — PENDING (summary gap 40px + body pad 64px measure)
Uma (UI/UX): loading states — PENDING (thinking dots bubble P0; no invent loader)
Uma (UI/UX): checkbox/radio hover — N/A (no controls on Chat Make)
Uma (UI/UX): typical DS checks (state matrix) — PENDING (composer mic/send/chips + reply CTAs)
Uma (UI/UX): motion ownership — LOCKED (@/uxds/motion for thread/thinking/presence; no max-height thrash)
Uma (UI/UX): composer shared kit — Partial (`SitePilotComposer`); Chat mount off + pixel sign-off PENDING
Uma (UI/UX): accordion/history — N/A (no Make accordion on Body9)
PAGE FINAL PASS — chat — NOT-GREEN
```

**Knowledge used:** UMA_FIDELITY_NOTES §0/§0a/§0b · MOTION.md (motion ownership + Accordion path) · VISUAL_FIDELITY · FE_UI_UX_AUDIT gate · HOME stamp H5–H11 composer parity · Make `Body9` / `ComponentAppointmentSummary2` · wire `sitePilotChatScenario` / `sitePilotChatThinking` — **no PROVEN claim**.

---

## Blockers for PROVEN

1. **Bea:** `CHAT_MAKE_PARITY_REGISTER.md` with all C1–C15 bands + 9 scenario frames + P0 thinking row.  
2. **Finn:** Shared **SitePilotComposer** extracted; flip `CHAT_REACT_MOUNT_ENABLED` only after thread/thinking/playback port + motion for frames.  
3. **Uma:** §0b MCP measures + §0a full matrix + Home↔Chat composer pixel sign-off.  
4. **Quinn:** `__studioRunMcpPageProbe({ screenId: "chat" })` with overlay on every step + hover matrix evidence → FE audit + `PARITY_PROVEN.json`.  
5. **Arch:** Home PAGE FINAL PASS **HARD-GREEN** before Chat is sequencing-unblocked per NEXT_STEPS (Chat Final Pass remains NOT-GREEN until above).

---

## Related

- [NEXT_STEPS.md](../../../product/NEXT_STEPS.md) §5–6  
- [UMA_FIDELITY_HOME_2026-07-19.md](./UMA_FIDELITY_HOME_2026-07-19.md) — composer parity reference  
- [UMA_FIDELITY_PDP_2026-07-19.md](./UMA_FIDELITY_PDP_2026-07-19.md) — stamp format · PDP HARD-GREEN  
- [HOME_REACT.md](../features/HOME_REACT.md) · [MOTION.md](../../../product/MOTION.md)

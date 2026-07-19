# Lessons learned — UX Studio agents

**Status:** Living — append dated bullets; do not rewrite history.  
**Audience:** Every agent before UI / chrome / hybrid-mount work.  
**Refs:** [COMMAND_DOCTRINE.md](./COMMAND_DOCTRINE.md) · [FE_UI_UX_AUDIT.md](./FE_UI_UX_AUDIT.md) · [POST_CHANGE_CHECKLIST.md](./POST_CHANGE_CHECKLIST.md) · [CI_ACTIONS_BUDGET.md](./CI_ACTIONS_BUDGET.md) · [NEXT_STEPS.md](./NEXT_STEPS.md)

Agents **must read** this file before claiming a UI or Studio-chrome slice done.

---

## 2026-07-19

### Scrollbar gutter always-on → empty white strip on short pages (PO / Finn)

- **Symptom / class:** Home Site Pilot shows a white bar / fake scrollbar track with nothing to scroll; tall pages / modal lock still X-jump when classic `scrollbar-gutter: stable` width ≠ thin 4px thumb.
- **Root cause:** `scrollbar-gutter: stable` reserves **classic** track width (~12–17px), not our `::-webkit-scrollbar { width: 4px }` — empty white strip on short panes; mismatch on tall panes.
- **Gate:** Never `scrollbar-gutter: stable` for Studio hosts. Short panes stay `overflow-y: auto` (no track). Tall prototype / `.chat__column`: `studio-scroll--overflow` → `overflow-y: scroll` (thin track) via `syncStudioScrollOverflowGutter`; lock → `padding-inline-end: var(--studio-scrollbar-size)`. Chat mirrors thin-track inset with `padding-left: calc(64px + var(--studio-scrollbar-size))` so the centered 864 column X does not jump. Prove: Home no empty white bar; Chat center X stable with/without thumb.

### Chat sticky / scroll / Site Pilot bar — don't regress (PO / Finn + Uma + Bea)

- **Symptom / class:** React Chat retired Make Frame337 → Site Pilot white microheader gone; bubble links invent always-underline / browser-blue; scrollbar track shifts centered column left (jagged UI).
- **Root cause:** `hideMakeChrome` retired Frame337 without a React port; `.chat__link` rest-underline fought UXDS `.uxds-link`; always-on `overflow-y: scroll` / uncompensated thin track stole right inset from the flex-centered column.
- **Gate:** Keep `ChatSitePilotBar` (`data-studio-chat-site-pilot-bar`) above `.chat__column`. Bubble/disclaimer links = `.uxds-link` (+ optional `.chat__link` hook). Scroll = auto → overflow sync thin-track + left pad compensate — never classic `scrollbar-gutter: stable` on Studio hosts.

### Robo-cursor hand↔arrow tip jump — CSS-align hotspots (PO / Finn + Uma)

- **Symptom / class:** After press/release, default arrow appeared to teleport vs hand; hand↔default felt like a flicker/jump even when `left`/`top` stayed locked.
- **Root cause:** Arrow tip (~3px) and hand fingertip (~10px) differ inside the 37×37 box; toggling `--pointer` swapped graphics without shared tip.
- **Gate:** CSS-shift `.proto-chat-demo-cursor__graphic--hand { left: -7px }` so tips share one hotspot; keep `left`/`top` locked through settle; R10 prove `onTargetStable` + `maxPostSettleDriftPx=0`. Do **not** re-write post-click pose from a different hotspot math.

### Fixed localhost + reuse tab — no port bump / no new Chrome windows (PO / Arch + Finn + Ben)

- **Symptom / class:** Agents start extra `npm run dev` → Vite silently moves to `5182`/`5185`/`5186`…; Chrome DevTools MCP opens `new_page` / new windows; PO loses the Studio tab context.
- **Gate (GLOBAL HARD FAIL — Auto-Rule `fixed-localhost-reuse-tab`):**
  1. Canonical URL **only:** `http://localhost:5173/` (`127.0.0.1:5173` = same server).
  2. `vite.config.ts`: `server.port: 5173` + `server.strictPort: true` — fail if busy; never silent bump. `check:felonies` asserts this.
  3. **One** `npm run dev` for the workspace; if 5173 busy → reuse or stop stray Vite (docs only — do not kill PO browser).
  4. Chrome MCP: `list_pages` → `select_page` / `navigate_page`; **`new_page` only if zero pages**.
- **Refs:** [STUDIO_AUTO_RULES.md](./STUDIO_AUTO_RULES.md) R11 · [../shell/URL.md](../shell/URL.md) · [AGENTS.md](../../AGENTS.md)

### Platform motion — Accordion height via Motion; CSS reduced-motion hid expand (PO / Arch + Uma + Finn)

- **Symptom / class:** PO could not see Accordion collapse/expand; CSS `grid-template-rows 0fr↔1fr` “fixed” but still looked instant.
- **Root cause:** OS/browser `prefers-reduced-motion: reduce` → kit CSS `transition: none !important` on `.uxds-accordion-content`. Computed `transitionDuration: 0s`. (Secondary: `grid-row: span 2` yielded two-track `0px 0px` computed rows.)
- **Gate:** Accordion expand = Motion `height: 0↔auto` via `@/uxds/motion` (functional reveal; always-mounted; cancel on unmount). Chevron mute/rotate stays CSS (honors reduced-motion). Import `@/uxds/motion` only — never raw `framer-motion`. Shell presence pilots OK; **user-visible PDP Accordion Motion demotes Final Pass `mcpFinalPass` → NEEDS-REPROVE**. See [MOTION.md](./MOTION.md).

### Platform motion — Motion (`framer-motion`) via `@/uxds/motion` (superseded Accordion CSS row — PO / Arch)

- **Symptom / class:** Motion library listed but unused; dual `motion` + `framer-motion` deps; callsigns unsure CSS vs Motion.
- **Gate (updated):** [MOTION.md](./MOTION.md) — import `@/uxds/motion` only; one package (`framer-motion`); CSS for trivial hover + Accordion chevron; Motion for Accordion height + enter/exit panels/menus. No React Spring. Shell-only presence pilots do **not** demote PDP; Accordion Motion on PDP **does**.

### Robo-cursor travel — ease-in-out only, no bounce (PO / Finn)

- **Symptom / class:** Robo cursor “bouncy” arrival (back-ease overshoot + path/end jitter felt like spring).
- **Gate:** Travel driven by Motion `animate(0,1,{ ease:"easeInOut" })` via `@/uxds/motion`; straight-line lerp; **no** spring / back / overshoot / arc variance. `cancelDemoCursorTravel()` → `controls.stop()` on forceClear (keep hang guards from v0.0.31). See [MOTION.md](./MOTION.md).

### Playback panel stranded by AnimatePresence `mode="wait"` (PO / Finn)

- **Symptom / class:** Cassette transport (CJM + STEPS + play deck) missing from nav; only REC switch remains; `.studio-nav-scenario__panel-swap` has `children=0`.
- **Root cause (two classes):**
  1. Playback ↔ Rec XOR used `AnimatePresence mode="wait"` — exit can complete without enter → empty swap while ScenarioControls is mounted.
  2. Invalid URL mode (`mode=traditional` / bare aliases) applied via `setModeId` → 0 journey beats → `showOrchestraControls` false → **REC-only** `StudioNavRecordingModeSlot` (empty playback by design).
- **Gate:** Sync-mount playback when Rec is off (`data-studio-playback-panel`); `normalizeOrchestraModeId` on URL parse + `setModeId` (`traditional`→`traditional-cjm`). Never let an unknown mode zero the cassette deck.

### URL `mode=agentic-cjm` conflates CJM switch with journey path (PO / Arch)

- **Symptom / class:** Deep links used `mode=agentic-cjm` as if “mode” meant both CJM-on and agentic path — logically wrong; CJM is on/off; agentic vs traditional is the experience path.
- **Gate:** Canonical URL = `cjm=on|off` + `experience=agentic|traditional` ([URL.md](../shell/URL.md)). Legacy `mode=*-cjm` / bare aliases parse → `experience` only (do **not** imply CJM on — protects REC replay). Serialize never writes `mode=`.

### Robo-cursor on-target re-aim / tap bounce (PO / Finn)

- **Symptom / class:** After travel, cursor jitters / re-aims / “bounces” on the CTA while pressing.
- **Root cause:** Mid-travel hover + `trackTarget` chased layout shifts; CSS `scale()` on `--tap` read as bounce; path diagnostics required CJM pin so prove could not show the drift.
- **Gate:** Hover only after settle; freeze tracking ≥90% progress; lock left/top through press/release; no tap scale; `__studioCursorDiagnostics()` path samples + prove `onTargetStable`. Keep hang guards.

### PAGE FINAL PASS — no next migrated page until previous hard-green (PO / Arch)

- **Symptom / class:** Team starts PDP (or next erase-Make page) while PLP (previous) still has open Final Pass gaps — PROVEN/tests green used as a false “open next page” signal.
- **Gate (GLOBAL sequencing):** **No new migrated page** until previous is **PAGE FINAL PASS hard-green** — [PAGE_FINAL_PASS.md](./PAGE_FINAL_PASS.md). Finn/Uma own checklist + `check:page-final-pass` (single contract; do not duplicate). Arch vetoes next-page brief/mount otherwise. Team check reports `PAGE FINAL PASS — <screenId> — HARD-GREEN | NOT-GREEN`.
- **Process:** Parallel callsigns still required; **`Knowledge used:`** still mandatory on team check. Board: [NEXT_STEPS.md](./NEXT_STEPS.md) NOW 2e blocks PDP.

### MCP page probe — scroll-into-view + overlay visible every probe (PO / Quinn)

- **Symptom / class:** MCP / robo page probe interacted with off-screen or partially scrolled targets; or ran steps while the agent testing overlay was missing/hidden — prove looked “green” without visible PASS/FAIL chrome the PO can trust.
- **Root cause:** Probe assumed targets were in viewport and that overlay start was optional/ambient; scroll + overlay visibility were not hard FAIL gates on every step.
- **Gate (GLOBAL HARD FAIL — Quinn + Finn + Ben):**
  1. Before every probe interact (hover/click/type): **`scrollIntoView`** (or equivalent) so the target is in the prototype viewport — note `scroll-into-view` in cursor/probe diagnostics when used.
  2. **Agent testing overlay must be visible** for the **entire** probe run (start → each step PASS/FAIL → sitrep/stop). If overlay is absent/hidden at any probe step → that step and the probe **FAIL** (do not continue as PASS).
  3. Prefer `__studioRunMcpPageProbe` so robo-cursor + overlay sitrep are mandatory; Quinn cites overlay-visible + scroll in the MCP evidence log.
  4. **Code gate shipped:** `revealDemoTargetForAgent` + probe `overlay-arm` / `plp-below-fold-scroll`; mid-sitrep re-arm must not fire deferred reload; `RunMcpPageProbe` excluded from helper nest-arm. See [RECORDING.md](../shell/RECORDING.md).
- **Process:** Index in [TEAM_KNOWLEDGE.md](./TEAM_KNOWLEDGE.md); Quinn re-reads this before every MCP prove. Arch rejects PROVEN without overlay-visible evidence.

### Nested scroll host after single-scrollbar Chat (Finn / Quinn)

- **Symptom / class:** Chat beat/CTA `scrollIntoView` / `revealDemoTargetForAgent` no-ops after React Chat moves overflow to `.chat__column` (outer `.studio-scroll--prototype` `protoMax≈0`).
- **Root cause:** Engine `getPrototypeScrollRoot` still resolved the outer prototype pane; scenario/REC helpers hardcoded the same host.
- **Gate:** Prefer active `.chat__column` when it owns overflow (`getPrototypeScrollRoot`); scenario `resolveScrollEl` + REC `captureScroll` must use that helper. Quinn proves with probe `chat-below-fold-reveal` (r1 CTA) — not finale CTAs that cannot clear agent-testing bottom pad at max scroll.

### Sticky Chat composer scroll pad (Finn / Uma)

- **Symptom / class:** Flex-sibling composer (outside `.chat__column`) regresses Make under-composer scroll — below-fold bubbles clip at the dock; Motion wrap height changes leave last CTAs under the overlay.
- **Contract:** Overlay dock (`position: absolute` bottom) + dynamic `--studio-chat-composer-h` (ResizeObserver) → `.chat__column` `padding-bottom` / `scroll-padding-bottom` ≥ dock height; reveal/scrollIntoView reads `scroll-padding-bottom`. Single scroll host only (viewport locked). Transparent scrollbar track.
- **Gate:** Probe `chat-composer-scroll-pad` — pad var ≥120, last CTA above dock at max scroll, prototype `protoMax≈0`.

### Team knowledge must be used, not only written (PO)

- **Symptom:** LESSONS / notes grow but agents re-ship the same fail class — knowledge was append-only.
- **Gate:** [TEAM_KNOWLEDGE.md](./TEAM_KNOWLEDGE.md) living index; before serious work re-read hat section + LESSONS; team check **`Knowledge used:`** one-liner per role; **Knowledge improved** sitrep after ships; Arch rejects write-only “done.”

### Typical DS checks mandatory before screen PROVEN (PO)

- **Symptom / class:** Screens stamped **PROVEN** while UXDS controls (SearchField, Button, checkbox, link) were flat at rest — missing kit/Make **hover / focus / active / disabled**. Concrete miss: PLP filter SearchField had **focus-only** kit (no `:hover`); Make / Availability / Book Step 1 use inset navy ring on hover+focus.
- **PO callout:** **Missing DS hover = fidelity FAIL class** — not a polish nicety. “Why no typical DS checks as rule of thumb?”
- **Gate (GLOBAL rule of thumb):**
  1. Before any screen **PROVEN**, Uma walks the **full state matrix** (default/hover/focus/active/filled/disabled/error + icon positions) per [UMA_FIDELITY_NOTES.md](./UMA_FIDELITY_NOTES.md) §0a — vs **UXDS kit + Make**.
  2. SearchField: `.uxds-search-field__control:hover` + `:focus-within` inset `2px` `--uxds-border-border-focus` (Boots → navy); magnifier stays borderless.
  3. Ratchet **search-field-states** fails CI if kit omits control `:hover` / `:focus-within`.
  4. **Uma (UI/UX)** signs `typical DS checks (state matrix) — PASS|FAIL` in audit + **team check**.
  5. **Quinn (QA)** MCP-hovers **≥1 SearchField** (and the rest of the interaction matrix).
  6. Arch **rejects** **PROVEN** if typical DS checks FAIL or MCP hover evidence is missing.
- **Process:** Parallel callsigns still required for serious streams — DS checks do not collapse the team into one mega-agent ([TEAM.md](./TEAM.md), doctrine §0.2).

### Filter search parity — icon side, double X, View all, counters (PO rage)

- **Symptom:** PLP filter search had **two X** clears; magnifier on the **LEFT** (PO: original RIGHT); no **10-cap / View all**; no option **counters**; invented filter `border-bottom` separator; bespoke input instead of UXDS.
- **Root cause:** Prior “PROVEN” trusted Make static DOM order + `type="search"` (native cancel) without wire scripts (`PLP_FILTER_LIST_MAX`, `handlePlpFilterViewAllClick`, `setFilterRowCount`) or Availability/Book icon-end pattern.
- **Gate (GLOBAL):**
  1. UXDS `SearchField` — `iconPosition` start\|end, single `data-studio-search-clear`, `type="text"`, stamps `data-studio-search-icon-pos`.
  2. PLP: icon **end**, View all + 10-cap, facet counters, **no** `.plp__filter-section` border separator.
  3. Ratchets 1b–1f + MCP `plp-search-icons` / `plp-filter-view-all` / `plp-filter-option-counters`.
  4. Distrust prior PROVEN on filter/search until re-proved.
- **Process:** Every new PO miss → ratchet same ship ([PARITY_RATCHETS.md](./PARITY_RATCHETS.md)).

### Search icon boxed by Make border-overlay hover (PO)

- **Symptom:** PLP “Search countries” / “Search diseases” magnifier showed a weird navy/grey **box border** around the icon.
- **Root cause:** LEGACY chrome targeted `Text Field > [aria-hidden]` for Make’s absolute inset border overlay. UXDS `SearchField` stamps `aria-hidden` on the magnifier (direct child of `Text Field`), so hover/focus painted the overlay ring on the icon.
- **Gate (GLOBAL):**
  1. Make overlay hover selectors must be `> [aria-hidden].absolute` only — never bare `[aria-hidden]`.
  2. UXDS `.uxds-search-field__icon` forces `border/box-shadow: none` (defense in depth).
  3. Uma §7b: magnifier = bare glyph; boxed icon = FAIL.
- **Process:** When porting Make `aria-hidden` overlays into React kits, do not reuse overlay selectors on decorative icons.

### Missing search icon = classic Make→React parity fail

- **Symptom:** React PLP filter fields (“Search countries” / “Search diseases”) shipped with no magnifying glass.
- **Root cause:** `FilterSearch` rebuilt as bare input without `icon=search` sibling; no CI contract for icon affordances.
- **Gate (GLOBAL):**
  1. Stamp `data-studio-search-icon="true"` on every React search magnifier (prefer UXDS `SearchField`).
  2. `npm run check:parity-ratchets` fails if search inputs/placeholders lack the marker ([PARITY_RATCHETS.md](./PARITY_RATCHETS.md) #1).
  3. Quinn MCP page probe step `plp-search-icons` asserts ≥2 visible icons + sibling on disease/country fields.
- **Process:** Every new typical fail class → add a ratchet (Arch/Ben). Ratchets regain trust; green Vitest alone does not.

### Agent DONE sitrep must countdown; clear dismisses robo-cursor

- **Symptom:** Sitrep sat silent/stale; robo-cursor lingered after overlay cleared.
- **Gate:** Hint = `PASS|FAIL — Auto-closes in Xs` (live tick); big green/red badge; `finishSettle` / `forceClear` call `removeDemoCursor({ immediate: true })` + **hard-remove** overlay DOM; idle → sitrep still honest.

### Agent testing overlay: pre-arm before steps; no stale popup after test

- **Symptom:** Probe clicks started before PO could see the BR panel; after stop, sitrep/overlay sometimes stuck or left a stale panel.
- **Gate (GLOBAL):**
  1. MCP probe/sanity/`withMcpTestSession`: `start()` → **pre-arm** (~2.5s `preparing…`) → then steps.
  2. `stop({ result: "pass"|"fail" })` → green/red sitrep (~9s) + FINAL `PASS|FAIL n/m` summary line.
  3. After settle (or interrupt): `forceClear` path — cancel timers, dismiss cursor, clear persist, strip ephemeral URL, **hard-remove** DOM. Probe `finally` schedules ensure-clear at settle+1s.

### MCP page probe must not reload-loop / URL-fight (Chrome crash class)

- **Symptom / class:** Browser tab crashed or endlessly reloaded during agent MCP testing on localhost (overlay + probe + modal URL bridge).
- **Root cause hypotheses (proven gates):**
  1. Page probe defaulted `reload: true` → sitrep → reload → probe re-arm → reload loop under agent automation.
  2. Mid-settle `start`/`touch` abandoned sitrep without cancelling a deferred `location.reload()` timer.
  3. QV/`&modal=` close raced URL→open re-apply (wire cleared live before URL stripped) → modal thrash + re-renders.
  4. Uncapped `scrollIntoView` / reveal storms + overlay DOM thrash under rapid probe steps.
- **Gate (GLOBAL HARD FAIL — Finn + Quinn + Ben):**
  1. `__studioRunMcpPageProbe` defaults **`reload: false`**. At most one reload at end, and only when explicitly `{ reload: true }`.
  2. `forceClear` / mid-settle re-arm **cancels** pending reload timers (`cancelPendingReload`); never nest start/stop loops.
  3. Modal URL bridge suppresses URL→open while intentional close waits for `&modal=` clear (`studioModalUrlBridgePlan`).
  4. Cap probe reveal/scroll calls per run; overlay `forceClear` hard-removes DOM + all timers.
  5. Reload storm cooldown (~4s) — refuse stacked `scheduleReload` (agent loops).
- **PO recovery:** refresh once → `window.__studioAgentTestingOverlay?.forceClear()` → do not re-run probe with `reload: true` in a loop.

### Chrome hang — robo-cursor hover bridge + uncanceled travel rAF (P0)

- **Symptom / class:** Chrome tab hung (not just reload-loop) during agent/robo testing on PDP / avail — same P0 family as prior crash storms.
- **Root cause (v0.0.29–0.0.30 area):**
  1. `demoCursorPseudoBridge` mirrored **all** `:hover`/`:active` rules from readable sheets → mega stylesheet + class toggles → style-recalc storm.
  2. Cursor travel `requestAnimationFrame` kept ticking after `forceClear` / `removeDemoCursor` (no cancel token).
  3. Re-applying hover on an already-hovered root re-dispatched enter/move events.
  4. Accordion permanent `will-change` + rapid open/close amplified layout thrash.
- **Gate (GLOBAL HARD FAIL — Finn + Ben + Quinn):**
  1. Cap bridged CSS rules (`DEMO_PSEUDO_BRIDGE_MAX_RULES`); skip vendor sheets.
  2. `cancelDemoCursorTravel()` on remove/forceClear; Motion travel `.stop()` + generation bump (no orphan tween).
  3. Rate-limit synthetic move; no re-flood when hover class already active.
  4. Accordion: no permanent `will-change`; `contain: layout style`; toggle min-interval.
- **PO recovery:** refresh once → `__studioAgentTestingOverlay?.forceClear()` → `__studioWaitAgentTeardownClean()`.

### Robo-cursor hover missing on secondary/DS CTAs (bridge CSSOM stall — P0)

- **Symptom / class:** Robo hover class applied (`proto-chat-cta--hover` / `data-studio-robo-hover`) but **no visual hover** on PDP **Check availability**, outline/secondary buttons, etc. Chat CTAs looked fine (hand-mirrored rules in chrome CSS).
- **Root cause:** `bridgeDemoPseudoSelector` split selector lists on **every** comma — including commas inside `:is(button, [role="option"], …)`. That emitted broken selectors like `[role="option"]).proto-chat-cta--pressed:focus`. Dumping them into one `style.textContent` **stalled CSSOM parse**, so later bridged page rules (`.pdp__secondary:hover` → `.pdp__secondary.proto-chat-cta--hover`) never became live rules.
- **Gate (GLOBAL HARD FAIL — Finn + Ben + Quinn):**
  1. Split selectors on **top-level commas only** (`splitSelectorsTopLevel`).
  2. `insertRule` per bridged rule; skip invalid; never one mega text blob that can abort the sheet.
  3. Skip pseudo-element `:hover`/`:active` (`::-webkit-scrollbar-thumb:hover`).
  4. Prefer page/UXDS sheets under the 256 cap; fingerprint-refresh when sheets change.
  5. Press = pointerdown → ~40–80ms dwell → pointerup → click; clear hover/press + default arrow after.
  6. Auto-Rule R10: **robo = native hover+press everywhere** (not chat-only). Vitest covers `:is()` + `.pdp__secondary`; MCP prove Check availability bg/border.
- **PO recovery:** refresh → re-run `__studioProveRoboCursorFeedback?.('[data-studio-action="pdp-check-availability"]')`.

### Overlay eyes — MCP/robo must not click through open dialogs (PO rage)

- **Symptom:** MCP page probe / robo-cursor still clicked PLP tiles **under** open Quick View (and other lightboxes).
- **Root cause:** Modal guard existed for REC replay but was **not** wired into `simulateDemoPointerClick` / probe; Quick View (+ other PLP dialogs) not fully registered with `data-studio-modal`.
- **Gate (GLOBAL HARD FAIL):**
  1. Every blocking overlay in `STUDIO_MODAL` / `REGISTERED_OVERLAY_MODAL_IDS` + DOM `data-studio-modal="…"`.
  2. `simulateDemoPointerClick` + `__studioRunMcpPageProbe` refuse under-overlay targets (`refuse-click` prove step).
  3. `check:felonies` fails npm test if guard missing or known overlays unregistered.
- **Quinn prove:** open Quick View → probe cannot click PLP tile underneath → overlay sitrep PASS.

### Modal URL — every popup must change the address bar (PO rage)

- **Symptom:** Quick View (and other Boots dialogs) opened with **no** URL change; only Choose Pharmacy synced `&modal=`.
- **Root cause:** `useStudioUrlSync` derived `modalId` from `availabilityOpen` only; openers called raw `set*Open(true)` without a central registry.
- **Gate (GLOBAL HARD FAIL):**
  1. `STUDIO_MODAL_REGISTRY` lists every dialog (`choose-pharmacy`, `quick-view`, `login`, `vaccine-picker`, `recipient-picker`) with `urlSync: true` + open/close helpers ([URL.md](../shell/URL.md)).
  2. App derives `modalId` via `resolveStudioModalIdFromFlags`; open/close → `writeStudioUrl`; deep-link / `popstate` → `applyStudioModalFromUrl`.
  3. `check:felonies` + ratchet **modal-url-sync** fail npm test if registry entry missing, lacks URL helper, or source opens via orphan `set*Open(true)`.
- **Quinn prove:** open Quick View on PLP → bar shows `modal=quick-view`; close / Back clears `modal`.

### Stale jab count during Reset / filter refresh = ship fail (PO rage #5)

- **Symptom:** During PLP “Updating results…” loader (Reset filters / filter change), top-left still showed stale totals like **“3 jabs available”** — made-up leftover from prior `displayItems`.
- **Root cause:** Count kept prior results “for stability” while tiles hid; PO rejects any numeric jab count that isn’t the post-load truth.
- **Gate:**
  1. While `listingPhase === "loading"`: count children = `null`, `data-studio-plp-results=""`, `data-studio-plp-results-loading="true"`, CSS hide (`.plp__results-count--loading`).
  2. After load: real `${n} jabs available` only.
  3. `check:parity-ratchets` **count-hide-load** + MCP probe `plp-reset-filters` (mid-load empty) → `plp-reset-count-ready`.
- **Quinn prove:** Reset → no count text while loader up → real count after.

### Invented hover / loading chrome not in Make = ship fail (PO rage #3)

- **Symptom:** React PLP showed **duplicate** “Updating results…” (count line + spinner label) + listing **jump**; empty bookmark heart went **fuchsia on hover** (Make tertiary empty hover is navy link; fuchsia only when filled/active).
- **Root cause:** Agents “improved” Make — invented fuchsia-on-empty hover and doubled loader copy / pulsed count — then stamped **PROVEN** without MCP real-user matrix.
- **Forbidden:** Invent hover colors, loader copy placement, or attention chrome not present in Make CSS/behavior. Prefer under-matching over inventing.
- **Gate:**
  1. Uma side-by-side Make vs React for **empty vs filled** icon states and **exactly one** loader treatment (spinner ± one label; never duplicate count-line copy).
  2. Quinn + Ben: **MCP localhost real-user matrix mandatory for every screen ship** — overlay start → log each step → stop/clean slate. Arch **rejects** audit **PROVEN** without that evidence log.
  3. Prior “PROVEN” is **BAD until re-proven** when PO disputes pixels.

### Wrong preloader / loading scenario = fidelity fail (PO called out twice)

- **Symptom:** React PLP filter-change showed a blank listing band with only “Updating results…” (results-count text) — PO rage again; not the Make scenario.
- **Make truth (PLP child 9):** ~450ms load → **hide tiles** → **centered spinner overlay** (44px arc + **one** “Updating results…” under spinner) on height-locked host → stagger reveal. **Not** opacity-0 tiles, **not** text-only, **not** duplicate count-line “Updating results…”.
- **Root cause:** Loading/empty/updating treated as copy polish, not a first-class Make scenario; register marked “preloader Fixed” without mechanism prove; Uma did not sign off loading states.
- **Gate:**
  1. Uma + Bea capture Make loading mechanism **before** Finn codes ([UMA_FIDELITY_NOTES.md](./UMA_FIDELITY_NOTES.md) §0).
  2. Bea register P0 rows for loading/empty/updating with layout notes + screenshot notes.
  3. Quinn proves filter-change: spinner/overlay **in-band**, then results return — blank+text alone = FAIL; duplicate “Updating results…” = FAIL.
  4. **team check:** Uma must explicitly report `loading states — PASS|FAIL` and `checkbox/radio hover — PASS|FAIL`.

### Checkbox / radio hover miss on migrated PLP

- **Symptom:** React filter checkboxes had no Make mint hover (`#c6e5e1`); Make `globals-chrome` targets `[data-name="box"]` which React rows do not use.
- **Gate:** Page CSS must port unchecked hover wash; Uma + Quinn prove hover visible on every migrated checkbox/radio.

### Make → React fidelity (PO rage — not first time)

- **Symptom:** PLP shipped “PROVEN” while Advantage Card promo bar was entirely missing, tile had invent border, Book now hover was mint secondary (LEGACY catch-all), heart had weak/laggy feedback, Reset Filters was text-only — register Wrongly marked OK / residual.
- **Root cause:** Make→React ships without a pixel+interaction register prove; Uma skipped Nazi-hover on every CTA/icon; Bea register incomplete (bands not inventoried before Finn coded); Quinn passed with unchecked P0s / “prior ship” wishlist.
- **PO context:** Human PO has complained before about near-dups / fidelity slips — **zero tolerance**. Missing whole components = ship fail.
- **Gate:**
  1. Bea register lists **every** Make band/component before Finn codes ([UMA_FIDELITY_NOTES.md](./UMA_FIDELITY_NOTES.md)).
  2. Uma Nazi-hovers every CTA/icon; runs full fidelity checklist; audit PROVEN only when checklist PASS.
  3. Quinn cannot PASS if register has unchecked P0s; must click-hover every interactive control (interaction matrix).
  4. **team check** must include Uma checklist + Bea register completeness + Quinn interaction matrix — ship not done if Uma or Quinn FAIL.
- **Example miss:** PLP Advantage Card bar — “Collect 3 points for every £1 you spend with Boots Advantage Card‡”.

### Versioning / felonies

- **Version chip wins overflow** — sticky right block with solid PANEL fill + z-index; never let scrolling tabs cover `vX.Y.Z` / channel.
- **Version chip must track package.json live** — Vite `define` alone freezes semver at `npm run dev` start; after bumps the tab chip lied (0.0.1 while package was 0.0.3). Source of truth = JSON import of `package.json` in `studioRelease.ts` + server restart on package.json change; unit test + `check:felonies` must fail on hardcoded UI semver / missing import. Quinn proves chip after every bump ([VERSIONING.md](./VERSIONING.md) DoD).
- **Felony = `npm test` fail** — wire `check:felonies` + `check:version`; do not rely on docs alone. JSDoc must not contain `*/` mid-word (e.g. write "proto star filenames", not `proto*/…`).
- **Channel ≠ semver** — PO accepts alpha/beta/rc/stable; BE bumps digits via `release.mjs` / notes habit.

### Recording

- **Demo-click replay needs stable targets** — prefer `data-studio-action` on the click element; stop the selector chain there. Ancestor `data-name` noise (progress "Step N", breadcrumbs) breaks nested resolve.
- **Replay ≠ screen advance** — re-firing Continue proves interaction parity even when product logic opens a picker (no location yet). Do not require step navigation for a demo-click PROVE.
- **Wire-intent beat actions ≠ retreat-sync** — known `JourneyBeatActionId` → `runBeatAction`; `retreat-sync` → same script channel as director with `syncState` (`applyRecordingProjectScript` + `retreatScriptOptions`), not `runBeatAction`.
- **Human REC clicks = trusted only** — document capture-phase `click` with `isTrusted`; skip `.studio-nav-panel-host` / agent overlay; demo `.click()` stays on `notePlaybackDemoClick` (no double-capture).
- **Overlay root class must match CSS** — agent testing root is `.studio-agent-testing-overlay` (not bare `.agent-testing-overlay`); mismatch breaks PANEL CSS and lets Dismiss leak into REC capture.
- **Director replay needs scriptKind or resolvable id** — capture `scriptKind` on the interaction record; fall back to `resolvePlaybackScriptKind(scriptId)` for older sessions.

### Domain identity

- **No new `.proto-*` / `data-proto-*`.** PANEL/chrome classes are `.studio-nav-*` / `.studio-*`; DOM attrs are `data-studio-*` (`dataset.studio*`). Prefer `__studio*` window APIs; keep `__proto*` aliases. Concept Make leftovers may stay `.proto-*` in LEGACY until that screen retires — do not invent new ones. Gate: [NAMING.md](./NAMING.md) + Nazi QA light after chrome class renames.
- **Half-renames kill agents** — className + CSS + smoke/MCP selectors must move together (one codemod). Dual attrs only if a release truly needs them; prefer clean cut.
- **Storage/events** — `studio-nav:` / `studio-hub:` / `studio-*-sync` with one-time legacy read; beat field `protoTab` waits for a schema migration.

### File hygiene

- **Monster files block agents** — default 1600 LOC via `npm run check:hygiene`. Allowlist LEGACY Make dumps + current engine ceilings; prefer domain cohesion splits over micro-file zoos or silent ceiling bumps ([HYGIENE.md](./HYGIENE.md)).

### Studio chrome

- **REC ⊗ CJM is XOR, not only AIR.** CJM on → REC `disabled`; REC on → CJM off. AIR still locks both. Gate: `src/app/nav/studioModeXor.ts` + MCP sanity `rec-disabled-when-cjm-on` / `rec-enabled-when-cjm-off-idle`. Audit row **G6**.
- **Blast-radius adjacent chrome** — after any UI edit, scan sibling links/CTAs, counters, mode labels, panel XOR, AIR/browse locks. Do not only test the pixel you touched.

### DS / links / CSS

- **Near-dup text links forbidden** — one footer-like pattern (`.uxds-link` + LEGACY aliases): no underline at rest, underline on hover. Enforce with `npm run check:links` ([DS_STRICTNESS.md](./DS_STRICTNESS.md)).
- **Make `!important` vs kit tokens** — when retiring Make for a React screen, do not fight LEGACY `!important` forever; hide Make chrome and style the React host in page CSS / UXDS / theme. No LEGACY growth for new React pages.
- **Incomplete CSS grid / flex rows must left-align** — never `justify-content: space-between` with narrower pad spacers on short last rows (Book Step 2 time slots). Prefer CSS `grid` with fixed columns, or equal-width pads + `flex-start`.

### Hybrid Make + React

- **Distrust “done” without browser proof** — green Vitest/build/smoke alone are BAD for UI. Live localhost or CSS gate; write audit **PROVEN** under `docs/projects/<project-id>/audits/` (Boots: `docs/projects/boots-pharmacy/audits/`).
- **Hybrid mount gates** — when React mounts, hide Make duplicates (`data-studio-make-retired`); gate Make wire handlers with `isBookStepNReactMounted()`; preserve `data-name` / AIR hooks (`data-studio-open-appointment`, `data-studio-cal-*`).
- **querySelector first-match traps** — Make DOM often still exists (hidden). Prefer React host selectors or React-owned props for clicks (e.g. progress Step 1 → `onBackToStep1`), not wiring the first Make progress node.
- **Agentic home `sarah-query-submit` / Chat summary** — after Site Pilot React mount, hidden Make `[data-name="component.co.order.summary"]` / `appointment.summary` still wins `querySelector` → director transport-no-op (`diagnostic-on-step-1`). Always prefer `.studio-react-screen-host` / `.home__card` / `.chat__summary` and skip `[data-studio-make-retired]` ancestors. Controlled React textareas need the native `value` setter + `input` event for playback typing.
- **Traditional `pdp-book-now`** — same first-match class: Make `[data-name="component.input.button"]` Book now under `data-studio-make-retired` can win while React wire is gated → transport-no-op. Prefer `button[data-studio-action="pdp-book-now"]` on `.studio-react-screen-host` / `[data-studio-react-screen="pdp"]` and skip make-retired ancestors (`findPdpBookNowBtn`).
- **createRoot `unmount()` must not run sync during parent React render/commit** — calling `root.unmount()` from `useLayoutEffect` / effect cleanup while `BootsPharmacyProjectView` is committing triggers: *Attempted to synchronously unmount a root while React was already rendering*. Defer with `setTimeout(0)` (or equivalent); cancel the deferred unmount on remount so Step tab / AIR / CJM flips do not race. Gate: `mountBookStep{1,2,3}Screen.tsx`.

### Navigation / journeys

- **Progress / Studio “Step 1” ≠ Make “tab1”.** Book Step 1 is `INDEX_BOOK_STEP1` (screen index **4**, child **7**, protoTab **5**). Agentic CJM has no beat on that tab; beat-index fallback to `agentic-home` must **not** `goToTab` while browsing (`shouldNavigateBeatTabOnEnter` / `scenarioBrowseMode`).
- **Named screen indices** — use `INDEX_BOOK_STEP*` / `INDEX_PLP` from `screens.ts`; avoid magic `setCurrent(4)` comments that confuse childIndex vs screen index.

### Docs layout

- **Project docs live under `docs/projects/<id>/`** — design deltas, screen pilots, FE audits, migrate-ready reports. Engine doctrine / FE standards / templates stay in `docs/product/`. Old heavily linked paths keep thin stubs. Do not dump Boots files into `docs/product/`.

### Naming

- **Screen folder = `screenId`** — use `screens/book-step-1/` for `?screen=book-step-1`, never `book-step1`. Journey **beat** ids may stay compact (`book-step2`) until a dedicated migration; URL aliases normalize them ([../shell/URL.md](../shell/URL.md)). New files follow [NAMING.md](./NAMING.md).
- **No `proto*` filenames / new classes / new attrs** — see Domain identity above.

### CI / Pages / MCP

- **CI smoke is on-demand** — default CI = unit + build; Playwright smoke = `workflow_dispatch` / local `npm run smoke` only ([CI_ACTIONS_BUDGET.md](./CI_ACTIONS_BUDGET.md)).
- **Post-push sitrep (BE / Director) — no-await routine (R12)** — after routine push: optional one-shot `gh run list` peek, then **move on**. **Forbidden:** `gh run watch` / sleep-poll / await Pages on every ship. Await CI only for HARD-GREEN / release / PO-asked prove. Do **not** claim remote green without evidence. `cancelled` Deploy/CI often means concurrency supersede — check tip SHA when you look. → [CI_ACTIONS_BUDGET.md](./CI_ACTIONS_BUDGET.md) §5 · [STUDIO_AUTO_RULES.md](./STUDIO_AUTO_RULES.md) R12.
- **CI wall clock** — install dominates; warm `node_modules` cache (skip `npm ci`) + parallel `test`∥`build` + Vitest forks/workers is the free-runner path. Target ≤20–25s warm. Do not gut hard gates for speed.
- **Page-probe unit delays ≠ MCP settles** — recipe `settleMs`/`waitMs` are for real robo-cursor MCP. Under Vitest, `compressProbeDelayMs` (env `VITEST` only) + fake timers crush wall clock; never shorten production overlay/pre-arm/step settles for CI.
- **Pages verify after chrome ships** — deploy green ≠ visual proof; check deployed host for `data-studio-react-screen` + MCP sanity on the live URL when chrome/pages matter.
- **Agent MCP testing overlay** — BR corner status + invisible click capture (no lightbox). `stop()` enters ~5s DONE/SITREP (readable log, click guard released) then clears; MCP helpers use `stop({ reload: true })` so reload runs **after** sitrep; Dismiss/`forceClear` is instant; never restore stale persist on load ([../shell/RECORDING.md](../shell/RECORDING.md)).
- **Overlay stuck after agent work** — `helperOverlayArm` `touch()` on mutating helpers (e.g. EnsureCleanStudio) without a matching `stop()` left the panel active with only “overlay start”; titles concatenated `__studioEnsureCleanStudio` and CSS `uppercase` read as garbled `STUDIOENSURE…`. Fix: clean titles only; do not arm on EnsureCleanStudio/AbortAll; idle auto-stop ~45s → sitrep; `forceClear()`; Run helpers keep `finally` → `stop({ reload: true })`.
- **Post-agent stay-on-page** — page/sanity/probe tests must **not** bounce the PO to hub. Default `resetStudioAfterAgentTest()` keeps `project`+`screen`(+persona/mode); **always strips `&modal=`** + ephemeral; closes live dialogs via event (never re-apply modal after `closeAllPopups`). Use `{ resetToHub: true }` only for CJM/journey. Quinn proves: PLP probe → still `screen=plp` with no sticky modal.
- **Sticky `&modal=` after probe / sitrep / forceClear (PO rage felony)** — Root cause: stay-state preserved `modalId` and App `onPostAgentReset` re-applied it after `closeAllPopups`. Gate: stay builder omits modal; reset forces `modalId: undefined`; App never re-applies modal on post-agent event; probe `finally` calls `resetStudioAfterAgentTest` again; intentional-close suppress still covers URL→open race. **Auto-Rule `agent-teardown-clean`:** [STUDIO_AUTO_RULES.md](./STUDIO_AUTO_RULES.md) · `studioAgentTeardownContract` · `check:felonies` §9 · `__studioAssertAgentTeardownClean` after settle.
- **Studio Auto-Rules framework** — recurring PO asks (dismiss/modal, auth SSoT, logged-out avail start, brand-active pills, §0b rhythm) must become CI/MCP gates in the **existing** check family — not a parallel unused system. Catalog: [STUDIO_AUTO_RULES.md](./STUDIO_AUTO_RULES.md) · `check:theme-brand` · felonies §10 auth-ssot.
- **Parity-proven CI gate** — React-migrated screens without PROVEN audit + MCP matrix in `PARITY_PROVEN.json` must fail `npm test` (`check:parity-proven`). Chat “PROVEN” without the gate = PO trust loss.
- **Overlay ≠ lightbox** — opaque full-screen “AGENT TESTING” modals rage the PO and hide the page under test; keep the concept visible.

---

## How to append

Add a `## YYYY-MM-DD` section with concrete bullets (symptom → root cause → gate). Link the audit SHA or commit when relevant.


# Lessons learned — UX Studio agents

**Status:** Living — append dated bullets; do not rewrite history.  
**Audience:** Every agent before UI / chrome / hybrid-mount work.  
**Refs:** [COMMAND_DOCTRINE.md](./COMMAND_DOCTRINE.md) · [FE_UI_UX_AUDIT.md](./FE_UI_UX_AUDIT.md) · [POST_CHANGE_CHECKLIST.md](./POST_CHANGE_CHECKLIST.md) · [CI_ACTIONS_BUDGET.md](./CI_ACTIONS_BUDGET.md) · [NEXT_STEPS.md](./NEXT_STEPS.md)

Agents **must read** this file before claiming a UI or Studio-chrome slice done.

---

## 2026-07-19

### MCP page probe — scroll-into-view + overlay visible every probe (PO / Quinn)

- **Symptom / class:** MCP / robo page probe interacted with off-screen or partially scrolled targets; or ran steps while the agent testing overlay was missing/hidden — prove looked “green” without visible PASS/FAIL chrome the PO can trust.
- **Root cause:** Probe assumed targets were in viewport and that overlay start was optional/ambient; scroll + overlay visibility were not hard FAIL gates on every step.
- **Gate (GLOBAL HARD FAIL — Quinn + Finn + Ben):**
  1. Before every probe interact (hover/click/type): **`scrollIntoView`** (or equivalent) so the target is in the prototype viewport — note `scroll-into-view` in cursor/probe diagnostics when used.
  2. **Agent testing overlay must be visible** for the **entire** probe run (start → each step PASS/FAIL → sitrep/stop). If overlay is absent/hidden at any probe step → that step and the probe **FAIL** (do not continue as PASS).
  3. Prefer `__studioRunMcpPageProbe` so robo-cursor + overlay sitrep are mandatory; Quinn cites overlay-visible + scroll in the MCP evidence log.
  4. **Code gate shipped:** `revealDemoTargetForAgent` + probe `overlay-arm` / `plp-below-fold-scroll`; mid-sitrep re-arm must not fire deferred reload; `RunMcpPageProbe` excluded from helper nest-arm. See [RECORDING.md](../shell/RECORDING.md).
- **Process:** Index in [TEAM_KNOWLEDGE.md](./TEAM_KNOWLEDGE.md); Quinn re-reads this before every MCP prove. Arch rejects PROVEN without overlay-visible evidence.

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
- **Gate:** Hint = `Done — auto-closes in Xs` (live tick); `finishSettle` / `forceClear` call `removeDemoCursor({ immediate: true })`; idle → sitrep still honest.

### Overlay eyes — MCP/robo must not click through open dialogs (PO rage)

- **Symptom:** MCP page probe / robo-cursor still clicked PLP tiles **under** open Quick View (and other lightboxes).
- **Root cause:** Modal guard existed for REC replay but was **not** wired into `simulateDemoPointerClick` / probe; Quick View (+ other PLP dialogs) not fully registered with `data-studio-modal`.
- **Gate (GLOBAL HARD FAIL):**
  1. Every blocking overlay in `STUDIO_MODAL` / `REGISTERED_OVERLAY_MODAL_IDS` + DOM `data-studio-modal="…"`.
  2. `simulateDemoPointerClick` + `__studioRunMcpPageProbe` refuse under-overlay targets (`refuse-click` prove step).
  3. `check:felonies` fails npm test if guard missing or known overlays unregistered.
- **Quinn prove:** open Quick View → probe cannot click PLP tile underneath → overlay sitrep PASS.

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
- **Post-push sitrep mandatory (BE / Director)** — after push, run `gh run list -R iyakushchenko/ux-studio -L 10`; do **not** tell the PO CI is green from local tests alone. `cancelled` Deploy/CI often means a newer push superseded the run — check the tip SHA. → [CI_ACTIONS_BUDGET.md](./CI_ACTIONS_BUDGET.md) §5.
- **Pages verify after chrome ships** — deploy green ≠ visual proof; check deployed host for `data-studio-react-screen` + MCP sanity on the live URL when chrome/pages matter.
- **Agent MCP testing overlay** — BR corner status + invisible click capture (no lightbox). `stop()` enters ~5s DONE/SITREP (readable log, click guard released) then clears; MCP helpers use `stop({ reload: true })` so reload runs **after** sitrep; Dismiss/`forceClear` is instant; never restore stale persist on load ([../shell/RECORDING.md](../shell/RECORDING.md)).
- **Overlay stuck after agent work** — `helperOverlayArm` `touch()` on mutating helpers (e.g. EnsureCleanStudio) without a matching `stop()` left the panel active with only “overlay start”; titles concatenated `__studioEnsureCleanStudio` and CSS `uppercase` read as garbled `STUDIOENSURE…`. Fix: clean titles only; do not arm on EnsureCleanStudio/AbortAll; idle auto-stop ~45s → sitrep; `forceClear()`; Run helpers keep `finally` → `stop({ reload: true })`.
- **Post-agent stay-on-page** — page/sanity/probe tests must **not** bounce the PO to hub. Default `resetStudioAfterAgentTest()` keeps `project`+`screen`(+modal); strip ephemeral only. Use `{ resetToHub: true }` only for CJM/journey. Quinn proves: PLP probe → still `screen=plp`.
- **Parity-proven CI gate** — React-migrated screens without PROVEN audit + MCP matrix in `PARITY_PROVEN.json` must fail `npm test` (`check:parity-proven`). Chat “PROVEN” without the gate = PO trust loss.
- **Overlay ≠ lightbox** — opaque full-screen “AGENT TESTING” modals rage the PO and hide the page under test; keep the concept visible.

---

## How to append

Add a `## YYYY-MM-DD` section with concrete bullets (symptom → root cause → gate). Link the audit SHA or commit when relevant.


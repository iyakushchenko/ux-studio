# Team knowledge — living index

**Status:** Living — **read before serious work; append after ships.**  
**Owner:** Arch (Director) curates; every callsign feeds their section.  
**PO mandate (2026-07-19):** Build the database **and really use it** — not only write. Sitrep style: **“team knowledge improved.”**

**Hard rule:** Before serious work, each callsign **MUST re-read** their section below + relevant [LESSONS_LEARNED.md](./LESSONS_LEARNED.md) bullets for the surface. **Team check** must include a **`Knowledge used:`** one-liner per role (what they re-read). Arch **rejects “done”** if knowledge was only appended and not applied. Full process: [TEAM.md](./TEAM.md) § Knowledge use.

---

## Retrieve knowledge without reading the archive

Use progressive disclosure: read the minimum route for the task, then open historical
entries only when a symptom, surface, or gate points there.

| Need | Read now | Open next only if relevant |
|------|----------|----------------------------|
| **Stuck / same FAIL twice / don’t know** | **[AGENT_STUCK_ROUTER.md](./AGENT_STUCK_ROUTER.md)** → one dig row | Named dig SSoT only — never thrash |
| Start serious work | Your [per-hat section](#per-hat-knowledge-must-re-read-before-serious-work) + current task brief | [Lessons topic index](./LESSONS_LEARNED.md#topic-index) for the touched surface |
| Choose or sequence work | [Arch](#arch-director) + [NEXT_STEPS.md](./NEXT_STEPS.md) | Forecast, painpoints, and chronological ship archive |
| Build a React screen | [Finn](#finn-fe) + [Bea](#bea-ba) | Page contract, screen register, CSS/DS and hybrid-mount lessons |
| Audit a visible screen | [Uma](#uma-uiux) + [Quinn](#quinn-qa) | Fidelity checklist, interaction/probe lessons, project audit evidence |
| Record or play a journey | [Finn](#finn-fe) + [Quinn](#quinn-qa) + **[UXML_COMMANDS.md](../shell/UXML_COMMANDS.md)** (`uxml rec` / `play` / `play step` / `play step r`) | REC/playback topic lessons and shell recipes |
| Prove localhost green | [PROOF_ROUTER.md](../shell/PROOF_ROUTER.md) · [UXML_COMMANDS.md](../shell/UXML_COMMANDS.md) | One blessed helper / standing-command row |
| Version, push, or inspect CI | [Ben](#ben-be) + [Pax](#pax-po-sim) | Version/CI lessons and R12 |
| Report a ship | [Sitrep template](#sitrep-template--knowledge-improved) | Append to the archive only after stating what was applied |

The [chronological ship archive](#chronological-ship-archive) is evidence, not the default
onboarding path. Do not reread it end-to-end unless reconstructing a regression.

---

## Canonical corpus (links)

| Artifact | Path | Why |
|----------|------|-----|
| **Stuck router (token budget)** | [AGENT_STUCK_ROUTER.md](./AGENT_STUCK_ROUTER.md) | Same FAIL twice / unknown → one dig — no thrash |
| Lessons (append-only) | [LESSONS_LEARNED.md](./LESSONS_LEARNED.md) | Failure classes → gates |
| **PO painpoints (trackable)** | [PAINPOINTS.md](./PAINPOINTS.md) | Living OPEN→COMPLETE board — do not lose PO sentiments |
| **Studio Auto-Rules** | [STUDIO_AUTO_RULES.md](./STUDIO_AUTO_RULES.md) | Recurring PO pain → CI/MCP gates (do not re-ask) |
| Uma fidelity checklist | [UMA_FIDELITY_NOTES.md](./UMA_FIDELITY_NOTES.md) | Make→React Nazi checklist |
| Parity ratchets | [PARITY_RATCHETS.md](./PARITY_RATCHETS.md) | Programmatic typical-miss contracts |
| Page final-pass | [PAGE_FINAL_PASS.md](./PAGE_FINAL_PASS.md) | Mandatory structure/naming before NEXT page |
| Team OS | [TEAM.md](./TEAM.md) | Callsigns, dispatch, team check |
| **Page Final Pass** | [PAGE_FINAL_PASS.md](./PAGE_FINAL_PASS.md) | Hard-green before next migrated page; Finn/Uma checklist + `check:page-final-pass` |
| Feature brief template | [FEATURE_BRIEF_TEMPLATE.md](./FEATURE_BRIEF_TEMPLATE.md) | Bea 1-pager |
| Boots feature briefs | [../projects/boots-pharmacy/features/](../projects/boots-pharmacy/features/) | Project briefs |
| PLP Legacy parity register | [../projects/boots-pharmacy/features/PLP_LEGACY_PARITY_REGISTER.md](../projects/boots-pharmacy/features/PLP_LEGACY_PARITY_REGISTER.md) | Band-by-band Legacy inventory |
| PLP React brief | [../projects/boots-pharmacy/features/PLP_REACT.md](../projects/boots-pharmacy/features/PLP_REACT.md) | PLP migration brief |
| **PLP team retro** | [TEAM_RETRO_2026-07-19_PLP.md](./TEAM_RETRO_2026-07-19_PLP.md) | Pain / Worked / Keep — apply on PDP+ |
| **History/Details team retro** | [TEAM_RETRO_2026-07-22_HISTORY_DETAILS.md](./TEAM_RETRO_2026-07-22_HISTORY_DETAILS.md) | Pain / Worked / Keep — densify, MaNav, terminal CTA, header 7c |
| Studio URL (modal ids) | [../shell/URL.md](../shell/URL.md) | **Modal URL registry** before any dialog ship |
| Doctrine | [COMMAND_DOCTRINE.md](./COMMAND_DOCTRINE.md) | Locked tech + process |
| **Motion standard** | [MOTION.md](./MOTION.md) | `framer-motion` via `@/uxds/motion`; CSS for trivial + Accordion |
| **Chat page rails (CJM on/off)** | [CHAT_PAGE_RAILS.md](../projects/boots-pharmacy/features/CHAT_PAGE_RAILS.md) | CJM-off = saved-chat load + scroll bottom; CJM-on = progressive; QA prove load/scroll |
| **CJM Record / Play / Edit (guitar tabs)** | [../shell/CJM_RECORD_PLAY_EDIT.md](../shell/CJM_RECORD_PLAY_EDIT.md) | Record targets+timing; Play≡Step; Edit by user-story swap — not director novels |
| **QA logging & Play recipe** | [../shell/QA_LOGGING_AND_PLAYBACK_RECIPE.md](../shell/QA_LOGGING_AND_PLAYBACK_RECIPE.md) | ALWAYS CLEAR · auto-pause · leave/return · Save Log · dump-on-FAIL · PERF · `CHAT_LOADING_DUMP_ALL`=cjm=off |
| Director rule | [../../.cursor/rules/ux-studio-director.mdc](../../.cursor/rules/ux-studio-director.mdc) | Always-on hard checklist |

---

## Per-hat knowledge (must re-read before serious work)

### Arch (Director)

| Must re-read | Focus |
|--------------|--------|
| This index + [TEAM.md](./TEAM.md) | Dispatch, team check, knowledge-use gate |
| **[AGENT_STUCK_ROUTER.md](./AGENT_STUCK_ROUTER.md)** | Same FAIL twice / unknown → one dig; reject token thrash |
| [COMMAND_DOCTRINE.md](./COMMAND_DOCTRINE.md) §0 / §6–§7 | Parallel siblings, distrust handoffs, strict interface audit |
| [PAGE_FINAL_PASS.md](./PAGE_FINAL_PASS.md) | No next migrated page until previous hard-green |
| [TEAM_RETRO_2026-07-19_PLP.md](./TEAM_RETRO_2026-07-19_PLP.md) | After HARD-GREEN: micro-retro → this index (Reflex) |
| [TEAM_RETRO_2026-07-22_HISTORY_DETAILS.md](./TEAM_RETRO_2026-07-22_HISTORY_DETAILS.md) | History + Details wave — densify gate, shared chrome, before Book delete |
| [LESSONS_LEARNED.md](./LESSONS_LEARNED.md) (latest + surface) | Reject “done” without applied lessons |
| [NEXT_STEPS.md](./NEXT_STEPS.md) · [PRODUCT_FORECAST.md](./PRODUCT_FORECAST.md) · [PAINPOINTS.md](./PAINPOINTS.md) | Board / forecast / painpoints |
| [PARITY_RATCHETS.md](./PARITY_RATCHETS.md) | New typical fail → ratchet same ship |

**Knowledge used tip:** doctrine §0.1 + PAGE_FINAL_PASS sequencing + latest LESSONS for the stream + this Arch section.

### Bea (BA)

| Must re-read | Focus |
|--------------|--------|
| [FEATURE_BRIEF_TEMPLATE.md](./FEATURE_BRIEF_TEMPLATE.md) | Readiness of acceptance + **Inheritance preflight** table |
| Project `features/*.md` + **Legacy register** for the screen | Every Legacy band **before** Finn codes (incl. loader mechanism) |
| [PAGE_CREATE_INHERITANCE.md](./PAGE_CREATE_INHERITANCE.md) | P1–P6 UXDS/UXML reuse before brief “ready” |
| [PAGE_FINAL_PASS.md](./PAGE_FINAL_PASS.md) | No next-page brief until previous hard-green |
| [UMA_FIDELITY_NOTES.md](./UMA_FIDELITY_NOTES.md) §0 | Loading/empty/updating = P0 rows when Legacy has them |
| LESSONS: Make→React fidelity, wrong preloader · PLP retro | Register completeness; no invent acceptance |

**Knowledge used tip:** brief/register + PAGE_FINAL_PASS gate + LESSONS loading/P0 rows.

### Finn (FE)

| Must re-read | Focus |
|--------------|--------|
| [PAGE_BUILD_CONTRACT.md](./PAGE_BUILD_CONTRACT.md) · [FE_STANDARDS.md](./FE_STANDARDS.md) · [MOTION.md](./MOTION.md) | React + UXDS, column, nowrap; Motion via `@/uxds/motion` |
| [../uxds/UXDS_MAP.md](../uxds/UXDS_MAP.md) · [../uxds/REACT_KIT_MAP.md](../uxds/REACT_KIT_MAP.md) | **Before any control:** inventory name → reuse kit or compose; extend map when shipping new kit |
| [PAGE_CREATE_INHERITANCE.md](./PAGE_CREATE_INHERITANCE.md) | P1–P6 hard; theme delta only |
| [COMPONENT_LIBRARY.md](./COMPONENT_LIBRARY.md) | Semantic interactive; extract-on-second-use; no dead headers |
| Engine MCP probe | **Register** via `registerMcpPageProbes` — never grow `studioMcpPageProbe` if/else; stamp `data-studio-action` |
| [DS_STRICTNESS.md](./DS_STRICTNESS.md) · [CSS_BASE_THEME.md](./CSS_BASE_THEME.md) | No near-dups; BASE→THEME→PANEL→LEGACY |
| [NAMING.md](./NAMING.md) · [ARCHITECTURE.md](./ARCHITECTURE.md) | `data-studio-*`, domain folders |
| [PAGE_FINAL_PASS.md](./PAGE_FINAL_PASS.md) | Co-own checklist + `check:page-final-pass` with Uma; no next mount until previous hard-green |
| [../shell/PLAYBACK_DIAG.md](../shell/PLAYBACK_DIAG.md) · R15 | Mid-smoke: poll `__studioConsumePoSignal` each beat; Alarm = sequence mismatch — branch before more steps |
| LESSONS: hybrid mount, createRoot unmount, search/icon, DS hover · invent chrome | Do not re-ship known fail classes; under-match Legacy |
| Screen brief + register for the page | Mount gates / Legacy-retired |
| [../shell/URL.md](../shell/URL.md) + modal guard | **Modal URL registry** + `data-studio-modal` before any dialog ship |
| **R16 — new `__studio*` suite/status helpers** | Before shipping a polled window API: `isQuietHelperSuffix` / `MUST_STAY_QUIET` in `qaSuiteTouchWrapContract.ts` — never leave it touch-wrapped |

**Knowledge used tip:** FE standards + UXDS_MAP/REACT_KIT_MAP reuse-first + PAGE_FINAL_PASS + LESSONS for the control class + URL modal table when shipping dialogs + **R16 quiet helpers**.

**REC/playback invariant (2026-07-22):** One shared interaction contract owns REC and Play. Native/ARIA/action semantics are required; already-selected idempotent options are rejected; stateful controls must actually transition; visible-content geometry beats wrapper-centre geometry. Never fix a journey by id/persona/route exception.

### Uma (UI/UX)

| Must re-read | Focus |
|--------------|--------|
| [UMA_FIDELITY_NOTES.md](./UMA_FIDELITY_NOTES.md) | Full fidelity + state matrix |
| [PAGE_FINAL_PASS.md](./PAGE_FINAL_PASS.md) | Co-own Final Pass checklist + check with Finn; page-close hard-green |
| [VISUAL_FIDELITY.md](./VISUAL_FIDELITY.md) · [FE_UI_UX_AUDIT.md](./FE_UI_UX_AUDIT.md) | Audit gate |
| LESSONS: typical DS checks, invent-vs-Legacy, loading scenario | Nazi hover / no invent |
| Legacy register for the screen | Side-by-side bands |
| **§0b section vertical rhythm** — MCP measure gap/padding (price→recipient→body→booster) before any fidelity IN PROGRESS claim | [UMA_FIDELITY_NOTES.md](./UMA_FIDELITY_NOTES.md) §0b · doctrine |

**Knowledge used tip:** UMA notes §0/§0a/**§0b rhythm** + PAGE_FINAL_PASS + LESSONS DS hover / loading · **Legacy densify vs React `data-name` hosts** (2026-07-22 History) · **UXDS_MAP + REACT_KIT_MAP before any page control** (reuse Accordion / kits; no dead headers).

### Quinn (QA)

| Must re-read | Focus |
|--------------|--------|
| [../shell/PLAYBACK_DIAG.md](../shell/PLAYBACK_DIAG.md) · R13 | Type-in / step / retreat console prove before claiming CJM green |
| [../shell/QA_LOGGING_AND_PLAYBACK_RECIPE.md](../shell/QA_LOGGING_AND_PLAYBACK_RECIPE.md) | Play ≡ Step; type-in REQUIRED; per-char QA FORBIDDEN; ALWAYS CLEAR; Save Log; dump-on-FAIL; `CHAT_LOADING_DUMP_ALL`=cjm=off |
| [../shell/CJM_RECORD_PLAY_EDIT.md](../shell/CJM_RECORD_PLAY_EDIT.md) | Guitar tabs; Book Step2 already-selected → **24/16:30**; agentic prove `__studioRunAgenticFullPlayProve` |
| [../shell/RECORDING.md](../shell/RECORDING.md) — MCP / overlay / page probe | `__studioRunMcpPageProbe`, sitrep, stay-on-page |
| **[../shell/UXML_COMMANDS.md](../shell/UXML_COMMANDS.md)** — standing prove shortcuts | `uxml rec` / `uxml play` / `uxml play step` / `uxml play step r` — default current CJM; QA + DevTools watched; no invent |
| LESSONS: overlay eyes, MCP matrix, **scroll-into-view**, **overlay visible every probe**, false PROVEN, **fixed localhost / reuse tab** | Prove fail classes |
| [PARITY_RATCHETS.md](./PARITY_RATCHETS.md) · `check:parity-proven` | Gate honesty — no PROVEN without MCP log |
| [VERSIONING.md](./VERSIONING.md) DoD when bump | Chip = package.json |
| [../shell/URL.md](../shell/URL.md) modal ids + **canonical `localhost:5173`** | Prove deep-link / overlay registry; never invent ports |
| [STUDIO_AUTO_RULES.md](./STUDIO_AUTO_RULES.md) R11 · R13 · **R15** · **R16** | `list_pages` → reuse tab; PLAYBACK_DIAG assertTypeIn; **poll `__studioConsumePoSignal` each beat**; **suite status helpers never touch-wrap** |
| **PO Alarm / Cursor / Scroll mid-flight** | Alarm = sequence mismatch. **Live latch first** (`__studioAgentTestingTakeover`) — dump secondary. On alarm: pause + investigate (e.g. progressive bubbles) |
| **R16 dig — suite Observe FAIL** | Symptom `dom-observe-open kind=agent` after suite sanity → open `qaSuiteTouchWrapContract.ts` dig card first (not the page under test) |

**Knowledge used tip:** RECORDING MCP + PLAYBACK_DIAG + **R15 PO signal consume** + **R16 qa-suite-no-touch-wrap dig** + LESSONS overlay/scroll + fixed-localhost-reuse-tab.

**REC/playback proof invariant (2026-07-22):** A cursor press is not PASS. QA requires a real target and, for checkbox/radio/selection controls, an observed state change. Ghost or selected-no-op clicks fail immediately and must not enter the recording.

### Ben (BE)

| Must re-read | Focus |
|--------------|--------|
| [VERSIONING.md](./VERSIONING.md) · [CI_ACTIONS_BUDGET.md](./CI_ACTIONS_BUDGET.md) §5 | Bump DoD + **no-await** post-push peek |
| [PARITY_RATCHETS.md](./PARITY_RATCHETS.md) · felonies in doctrine §4 | Keep gates honest |
| LESSONS: version chip, post-push **no-await**, overlay hygiene, **fixed localhost** | BE + Quinn session hygiene; one Vite on `:5173` |
| `PARITY_PROVEN.json` · `PAGE_FINAL_PASS.json` ownership | No chat-only PROVEN / final-pass |
| [../shell/URL.md](../shell/URL.md) + `check:felonies` overlay registry | **Modal URL registry mandatory** same PR as dialog ship |
| [STUDIO_AUTO_RULES.md](./STUDIO_AUTO_RULES.md) R11 · `vite.config.ts` | `port`/`strictPort` felony; smoke URL default |
| [STUDIO_AUTO_RULES.md](./STUDIO_AUTO_RULES.md) **R12** · [TEAM.md](./TEAM.md) § Batch ship | **One batched push** + **no await CI/Pages** on routine ships; lean CI (`node_modules` cache + parallel test∥build) |

**Knowledge used tip:** VERSIONING DoD + R12 no-await peek + fixed-localhost-reuse-tab + **batch-ship-push (R12)** + modal URL table.

### Pax (PO sim)

| Must re-read | Focus |
|--------------|--------|
| [PRODUCT_OWNER_BRIEF.md](./PRODUCT_OWNER_BRIEF.md) §K | Decisions log |
| [TEAM.md](./TEAM.md) Pax owns · **§ Batch ship (R12)** | Bump / notes / **batched** push call; no await-CI thrash |
| [NEXT_STEPS.md](./NEXT_STEPS.md) | What human PO can `+` / `ok` |
| LESSONS that changed product bar (fidelity zero-tolerance) | Accept only when gates match PO rage list |
| [STUDIO_AUTO_RULES.md](./STUDIO_AUTO_RULES.md) R12 | Do not green-light mid-wave tip thrash **or** CI babysitting |

**Knowledge used tip:** brief §K + board NOW + latest PO-rage LESSONS + **R12 batch push + no-await**.

---

## Sitrep template — **Knowledge improved**

Use after every ship (in **`team report`** / close-out, and as a bullet in release notes when notes land). One line per role that learned or applied something — status-rep style, not essays.

```markdown
**Knowledge improved** (YYYY-MM-DD · stream: <short name> · SHA <tip>):
- Arch (Director): <what was locked / vetoed / indexed> — applied: <yes|gate>
- Bea (BA): <register/brief lesson> — applied: <yes>
- Finn (FE): <implementation class> — applied: <code/ratchet>
- Uma (UI/UX): <fidelity miss class> — applied: <checklist/audit>
- Quinn (QA): <prove/MCP miss class> — applied: <probe step/FAIL rule>
- Ben (BE): <gate/version/CI> — applied: <script/check>
- Pax (PO sim): <accept bar / bump call> — applied: <decision>
```

## Chronological ship archive

Append-only evidence follows. Search by stream, surface, error code, or callsign; use the
retrieval table and LESSONS topic index before scanning by date.

**Knowledge improved** (2026-07-23 · stream: erase-Legacy Phase E — `ProjectPageShell` substrate replacement · board #8b · local, uncommitted):
- Arch (Director): re-read the Phase D/7c readiness note's exact blocker list before touching anything (`BootsPharmacyProjectView.tsx:4831`/`:880`, `content.ts:33`, `footerMount.tsx:54-76`, 6 park-mode mounts) rather than re-deriving it from scratch; confirmed via full-file grep across `BootsPharmacyProjectView.tsx` + `globals-chrome.css` + `vaccineList.ts` + `pdpRtb.ts` + `headerMount.tsx` + every `screens/*Contract.ts` that `nth-child(N)` usage is exactly N=1..11 with no gaps before committing to an 11-column shell — did not trust the readiness note's "11 columns" claim without independently re-deriving it — applied: NEXT_STEPS #8b; `frame/index.tsx` intentionally left in place (out of scope, gated on live MCP proof, per explicit task constraint).
- Bea (BA): traced Frame219's actual JSX (`export default function Frame219()`) to confirm it is literally 11 direct children under one root div (not 9, not a nested structure) before designing the replacement — one column per child, in the same left-to-right document order Frame219 declared them, including the 2 legacy-unused slots (5, 6) that no live screen mounts into but that CSS/footer selectors still numerically skip over — applied: `ProjectPageShell.tsx` `PAGE_SHELL_COLUMNS` array + inline column-map comment.
- Finn (FE): found `footerMount.tsx` needed **zero code changes** — it already resolves its target purely through the `.studio-viewport > div > div:nth-child(N)` selector string, never through Frame219-specific markup or `data-name` lookups on the column itself — the DOM-shape-preserving swap made it transparent; converted the 6 remaining park-mode mounts (plp/pdp/home/chat/appointment-history/appointment-details) to the Book Step 1-3 `permanent: true` precedent instead of inventing a new no-op path — `retireLegacyUnderPage` already degrades gracefully to "nothing to retire, stamp the attribute" on an empty page, so `permanent: true` was the correct minimal diff, not a rewrite — applied: `ProjectPageShell.tsx`, `BootsPharmacyProjectView.tsx`, `content.ts`, 6 `mount*Screen.tsx` files.
- Uma (UI/UX light — no browser MCP available this ship): static-only fidelity check — grep-diffed the full `nth-child(N)` reference set (68+ distinct call sites across 5 files) against the shell's 11 columns index-by-index, confirmed 100% coverage with zero N>11 and zero gap; correctly identified that column *content* styling never depended on the column div's own class/attributes (every rule targets `.studio-viewport > div > div:nth-child(N)` directly with `!important`, overriding whatever's there) — so an unstyled empty `<div>` is DOM-contract-equivalent to Frame219's absolutely-positioned Legacy markup from the moment `dynamicCSS` applies, no FOUC risk since the `<style>` tag commits in the same React tree — applied: this report's Uma-hat section; **live MCP re-prove of all 9 screens + header/footer/mega-menu/FSC + both CJM Play modes is a named residual, not a false PROVEN**.
- Quinn (QA): `npm test` 162/162 files (1008/1008 tests) green incl. `check:page-final-pass`/`check:felonies`/`check:hygiene`/`check:parity-proven`; `npm run build` green (module count dropped `frame/index.tsx` from the graph, consistent with it now being genuinely unreferenced); no MCP/browser transport available this session — full 9-screen + chrome + CJM re-prove is this ship's largest named residual, explicitly not claimed — applied: this report's owed-checklist section.
- Ben (BE): no push this turn (tree left uncommitted per task instruction); no CI touched.
- Pax (PO sim): local-only ship (no commit, no version bump per task instruction) — this is the highest-risk lane in the erase-Legacy program (every screen's mount contract), so no self-declared "done" — leave for PO/Arch to gate the actual `frame/index.tsx` deletion behind live MCP proof, per the task's own hard constraint.
- Pain/Worked/Keep: Pain — none new; the risk this pass carried (silently breaking every screen's mount point) turned out to be fully mitigable by static analysis because every consumer already used the selector-string contract, never Frame219-specific DOM identity — the original Phase D readiness investigation had already done the hard part of proving that. Worked — grepping the *exact* `nth-child(N)` value set before designing the shell (rather than trusting a "looks like 11" glance) caught the two legacy-unused slots (5, 6) that a careless "9 screens = 9 columns" shell would have silently broken. Keep — when a substrate/contract swap is purely selector-string-addressed (no identity/class dependency), the safest replacement is the *minimal* structurally-equivalent stub, not a "cleaner" redesign — resist the urge to also fix the 2 unused-slot naming or simplify the 11-column shape in the same pass; that's a separate, lower-risk follow-up once live-proven.

**Knowledge improved** (2026-07-23 · stream: erase-Legacy Phase E — live re-proof + `frame/index.tsx` deletion · board #8b closes HARD-GREEN):
- Arch (Director): ran the full owed checklist myself before trusting the prior sitrep's residual — all 9 screens direct-navigated + screenshotted + console-checked; hovered Health Services mega-menu and clicked Search/FSC on 2 screens (appointment-details, plp) including Escape-dismiss; ran both `__studioRunFullPlayProve({experience:"agentic"})` (22/22, `pass:true`) and `({experience:"traditional"})` (10/10, `pass:true`, `errors:[]`) — the traditional route crosses book-step-3/history/details, the exact Phase A camera-yank risk class, with zero regression — applied: NEXT_STEPS #8b now `[x]` HARD-GREEN.
- Finn (FE): attempted `frame/index.tsx` deletion via whole-directory `rm -rf` first — broke 5 test files + build (`Cannot resolve .png`) because `frame/` is a dual-purpose folder (dead component + live shared asset library). Caught by immediately re-running `npm test`, reverted via `git checkout`, redone as a precise single-file `Remove-Item` on only `index.tsx` + the dead `Frame1000007317` shim, keeping every PNG/`svg-p97rh8hlns.ts` asset — applied: LESSONS_LEARNED 2026-07-23 (new rule: never `rm -rf` a Figma-export directory on a single dead-file finding; grep every filename inside it first).
- Uma (UI/UX): fidelity PASS on all 9 screens (screenshot-diffed against pre-Phase-E baselines from memory of this session's earlier checks) + mega-menu column layout/image panel + FSC full-width/scrim/Escape-dismiss; one unrelated pre-existing console warning noted (framer-motion `ref`-prop in `ChatScreen.tsx` `ReplyFrame`, file untouched by this diff) — flagged separately, not blocking.
- Quinn (QA): `npm test` 162/162 files (1008/1008 tests) green + `npm run build` green *after* the correct precise deletion (not the broken broad one) — MCP evidence: 9× screenshot + console-message pairs, 2× mega-menu/FSC interaction pairs, 2× full-Play JSON results, all logged this turn.
- Ben (BE): no push yet this message — batch commit of Phases 0/A/B/C/D/E follows immediately after this sitrep, per R12.
- Pax (PO sim): Phase E + `frame/index.tsx` deletion is now genuinely HARD-GREEN with live evidence, not a self-declared residual — clears the last blocker in the erase-Legacy program; ready for one coherent batch commit.
- Pain/Worked/Keep: Pain — "0 references to `frame/index.tsx`" is not the same claim as "`frame/` the directory is dead"; conflating a dead-component finding with a dead-directory action nearly shipped a break. Worked — the ALWAYS re-run `npm test` immediately after any deletion, before moving on, caught it in one cycle with zero wasted investigation. Keep — for any Figma-export folder retirement, grep the directory name/every filename individually, never assume filename-implies-folder-scope.

**Knowledge improved** (2026-07-23 · stream: erase-Legacy Phase D — Header re-author · local, uncommitted):
- Arch (Director): Header lane matched Footer precedent exactly (content extraction + hand component + colocated CSS split); no `sourceHeader.cloneNode` remains anywhere in the header path — applied: NEXT_STEPS 7c → partial/gate-green, PAGE FINAL PASS stamp deferred to next agent with MCP.
- Bea (BA): Inventoried every nav item (Home/Health Services/Acne & Skin/More), aux items (Search, Login/Sarah), and both account-menu variants (5 logged-in + 4 guest actions incl. badges) from the prior hand-rolled `innerHTML` strings — 100% represented in `headerContent.ts`, none invented — applied: headerContent.ts.
- Finn (FE): `headerMount.tsx` now `createRoot` + `flushSync` renders `<Header>` once, then hands the resulting DOM to the unchanged `attachHealthServicesMegaMenu`/`attachFullScreenSearch` kits — same `data-name` contract, zero rewrite of those kits; header CSS split to colocated `chrome/header.css` (hygiene ceiling) — applied: headerMount.tsx, Header.tsx, headerContent.ts, header.css.
- Uma (UI/UX): Diffed every hand-rolled flyout/avatar/badge CSS rule 1:1 against the old JS-injected `<style>` string — colors (#012169, #c8247e), spacing, hover backgrounds all preserved verbatim; PASS pending live MCP re-render check (no browser transport in this sandbox).
- Quinn (QA): `npm test` 162/162 files · 1008/1008 tests green; `npm run build` green. No MCP/browser transport available — full interaction-matrix + visual prove is an owed residual (see report).
- Ben (BE): No push this turn (tree left uncommitted per task instruction); no CI touched.
- Pain/Worked/Keep: Pain — hoisting `document.addEventListener` from function-scope to module-scope silently breaks any non-DOM (Node) test importing the module transitively (`ReferenceError: document is not defined`), only caught by the full `vitest run`, not by `vite build` (esbuild doesn't type/runtime-check). Worked — same footer-pattern content/component split applies cleanly to a second, more complex header; existing interaction kits (`MegaMenuFlyout`/`FullScreenSearch`) needed zero changes, only a different DOM source. Keep — any headerMount/footerMount-style singleton-module `document.*` side effect must stay guarded behind the mount function (lazy, once-only flag), never at import top-level — new LESSONS_LEARNED entry added below.

**Knowledge improved** (2026-07-22 · stream: AGENT_STUCK_ROUTER token budget · local):
- Pain: Agents smashed unknown/repetitive FAILs burning tokens instead of reading dig SSoT.
- Worked: Lean stuck router (symptom → one file) wired AGENTS §0 + director + TEAM_KNOWLEDGE retrieve + PROOF_ROUTER handoff.
- Keep: New critical fail class → one stuck-router row + dig card same ship; never thrash twice.

**Knowledge improved** (2026-07-22 · stream: R16 qa-suite-no-touch-wrap guardrail · local):
- Pain: Suite Observe race was fixed once, but agents had no dig path / CI latch — PO rage “guardrail so no one misses it”.
- Worked: SSoT dig card + pattern quiet suffixes + felony + self-test FAIL embeds dig · TEAM_KNOWLEDGE Quinn/Finn.
- Keep: New polled `__studio*` helpers must pass `isQuietHelperSuffix` / MUST_STAY_QUIET before ship.

**Knowledge improved** (2026-07-22 · stream: engine-first probe registry · local):
- Pain: page ships patched engine `stepsForScreen` + Boots props on UXDS ButtonPrimary.
- Worked: `mcpPageProbeRegistry` + Boots `registerMcpPageProbes`; History uses `data-studio-action=history-view-details`; anomaly allowlist FREEZE.
- Keep: engine owns contracts; pages register recipes / stamp actions — never dictate engine branches.

**Knowledge improved** (2026-07-22 · stream: PAGE CREATE INHERITANCE guardrails · local docs):
- Pain: page asks skipped UXDS/UXML reuse; theme risked becoming a second DS.
- Worked: locked [PAGE_CREATE_INHERITANCE.md](./PAGE_CREATE_INHERITANCE.md) P1–P6 + brief table + director/AGENTS/doctrine wire; BASE mutual / theme = brand delta.
- Keep: Arch rejects mount without inheritance stamp; Accordion/kit reuse before invent.

**Knowledge improved** (2026-07-22 · stream: Appointment Details PAGE FINAL PASS HARD-GREEN · tip `95ccca7` tree · v0.0.108):
- Arch (Director): History HARD-GREEN → Details Final Pass; erase-Legacy History/Details closed; Reflex before Book Legacy delete — applied: NEXT_STEPS 0g/7b · PAGE_FINAL_PASS.json · PARITY_PROVEN
- Bea (BA): Details register · Date/Time SSoT bind · omit Shipping under-match — applied: APPOINTMENT_DETAILS_* 
- Finn (FE): mount child 1 + densify gate + deferred unmount — applied: screens/appointment-details · globals-chrome
- Uma (UI/UX): PROVEN densify 20/20 · no Cancel invent — applied: UMA_FIDELITY_APPOINTMENT_DETAILS
- Quinn (QA): 10/10 + terminal CTA hide #8762341 · rematch readinessPass true — applied: probe audit · inventory REACT
- Ben (BE): requiredScreens appointment-details (no ButtonPrimary required) — applied: check-page-final-pass · check-parity-proven
- Pax (PO sim): Details HARD-GREEN local; Book Legacy delete + Traditional 0d next — applied: this stamp
- Pain/Worked/Keep: Details densify truth ≠ History 32/56 — measure per-screen densify; Keep no invent accordion/Shipping; extract shared account chrome next

**Knowledge improved** (2026-07-22 · stream: Appointment History PAGE FINAL PASS HARD-GREEN · tip `95ccca7` tree · v0.0.108):
- Arch (Director): Chat HARD-GREEN → History Final Pass; Details unblocked; Reflex before Details brief — applied: NEXT_STEPS 0f/7 · PAGE_FINAL_PASS.json · PARITY_PROVEN
- Bea (BA): register + selector HARD `data-studio-appointment-view-details` — applied: LEGACY_PARITY_REGISTER · APPOINTMENT_HISTORY_REACT
- Finn (FE): mount + densify `:not([data-studio-react-screen])` on History child-2 — applied: screens/appointment-history · globals-chrome.css
- Uma (UI/UX): FAIL→PROVEN (32/56 · CTA 32 · no Cancel invent) — applied: UMA_FIDELITY_APPOINTMENT_HISTORY · LESSONS densify
- Quinn (QA): 8/8 View Details → Legacy Details + restore; re-prove after densify — applied: appointmentHistoryMcpProbeSteps · probe audit
- Ben (BE): requiredScreens + SCREEN_SOURCES/MOUNTS for appointment-history — applied: check-page-final-pass · check-parity-proven
- Pax (PO sim): History HARD-GREEN local; Details next; no push until coherent ship ask — applied: this stamp
- Pain/Worked/Keep: densify `!important` beat React CSS via Legacy `data-name` → gate densify off React hosts; Keep measure-before-PROVEN + no invent hover

**Knowledge improved** (2026-07-21 · stream: prove FAIL camera flake + PO latch wipe · local):
- Arch (Director): Mid-prove FAIL must escalate immediately — not wrap-up only — applied: this ship · LESSONS
- Finn (FE): forceClear clears PO latch; path-deviation grace 0.12 + threshold 48 — applied: agentTestingOverlay · playbackScrollAnomalies
- Quinn (QA): Agentic 22/22 + immediate re-prove no DIAGNOSTIC_ACK_STOP — applied: `:5173` MCP
- Pax (PO sim): History/Details Legacy stay board #7 — applied: NEXT_STEPS · no invent migrate

**Knowledge improved** (2026-07-21 · stream: long REC Play login interstitial · no push):
- Arch (Director): Read QA first when FAIL already logged; login interstitial ≠ invent green — applied: LESSONS · this ship
- Finn (FE): `playRecordedClick` drains login (not choose-pharmacy) before retry / after Book Now — applied: recordedClickPlayback · recModalDrain
- Quinn (QA): Live QA rows: Modal open login → Sign in drain → second Book Now → 23/23 play-end — applied: UI Play prove on `:5173`
- Pax (PO sim): Harden + commit local; no push — applied: this ship

**Knowledge improved** (2026-07-21 · stream: docs sound + Traditional UX dump sitrep · R12):
- Arch (Director): Guitar-tabs + Traditional smoothness OPEN on board; no invent green — applied: NEXT_STEPS · CJM_RECORD_PLAY_EDIT · TEAM_KNOWLEDGE corpus
- Bea (BA): CHAT_REACT / LE3 browse ≠ thinking pause — applied: CHAT_REACT · CHAT_MAKE_PARITY LE3 → rails
- Quinn (QA): PO Traditional dump 22:58:41Z — 3× scroll-reversal primary smell — applied: TRADITIONAL_CJM_UX_2026-07-21 · QA recipe fingerprint
- Pax (PO sim): Docs commit only; no push — applied: this ship

**Knowledge improved** (2026-07-20 · stream: PO Alarm live latch · R15 · R12):
- Arch (Director): Alarm = sequence mismatch; **live consume primary**, dump secondary; R15 Auto-Rule — applied: STUDIO_AUTO_RULES · PAINPOINTS · PLAYBACK_DIAG
- Finn (FE): `__studioAgentTestingTakeover` / `__studioConsumePoSignal` + richer alarm dump — applied: agentTestingPoSignal · agentTestingDump · overlay
- Quinn (QA): Poll/consume each beat mid-smoke; prove latch flips on Alarm + clears on consume — applied: agentTestingPoSignal.test · R11 `:5173`
- Pax (PO sim): Mid-flight agent owns window → immediate live signal required — applied: process note

**Knowledge improved** (2026-07-20 · stream: agent-testing mid-flight QA shell · PP-10 COMPLETE · R12):
- Arch (Director): Locked dump policy (FAIL/alarm last-N only; reject heavy APM); painpoints board; PP-10 COMPLETE after `:5173` prove — applied: PAINPOINTS.md · PRODUCT_FORECAST §10 · NEXT_STEPS NOW 0
- Bea (BA): Stored full PO sentiment list (playback/diag/CJM/hub/fuchsia/agentic/stale-green/logging/listening/overlay) as trackable COMPLETE rows — applied: PAINPOINTS.md
- Finn (FE): Relocated shell to `src/app/shell/agent-testing/`; readable coalesced steps + sitrep + timeline + dumps — applied: agent-testing/* · helperOverlayArm · page probe timeline
- Uma (UI/UX): Outcome colors (ok/amber/red), elapsed, Alarm/Cursor/Dump CTAs, timeline chips — applied: agent-testing-overlay.css
- Quinn (QA): R11 `:5173` mid-flight prove PASS (coalesce×2, colors, sitrep, timeline, alarm/cursor, console END, dumps); Play engaged no SendGlyph fatal — applied: evaluate_script prove
- Pax (PO sim): Overlay mid-flight QA shell accepted — PP-10 COMPLETE

**Knowledge improved** (2026-07-20 · stream: Chat PAGE FINAL PASS HARD-GREEN · tip `acffdb6`/`56b56be` · v0.0.60):
- Arch (Director): Site Pilot HARD-GREEN first → Chat Final Pass; no false PROVEN; History/Details unblocked; Reflex before next page — applied: NEXT_STEPS §5–6 · PAGE_FINAL_PASS.json
- Uma (UI/UX): §0a/§0b PROVEN — MCP gap 40/864/64/438 + helpful/CTA/composer DS; thinking playback-owned not on send — applied: UMA_FIDELITY_CHAT · FE_AUDIT_CHAT_PAGE_FINAL_PASS
- Quinn (QA): expanded chat probe 20/20 on `127.0.0.1:5173` reload:false; Site Pilot→Chat type-in diag PASS — applied: chatMcpProbeSteps · QUINN_CHAT_PROBE_CRITERIA
- Finn (FE): Final Pass gates for `chat` (HEADER optional, ButtonPrimary CTAs, sources/mounts) — applied: check-page-final-pass · check-parity-proven
- Ben (BE): R12 push tip `56b56be` no CI await — applied: peek only
- Pax (PO sim): patch `0.0.60` coherent ship — applied: release:patch
- Pain/Worked/Keep: premature STEPS-hold looked like CJM fail → use onAir + PLAYBACK_DIAG (PP-07); Keep §0b measure-before-PROVEN

**Knowledge improved** (2026-07-19 · stream: CJM playback straighten — type-in + fade + PLAYBACK_DIAG · R12):
- Arch (Director): R13 `playback-diag` Auto-Rule + PLAYBACK_DIAG contract; no false Chat PROVEN/Final Pass — applied: STUDIO_AUTO_RULES · PLAYBACK_DIAG.md
- Finn (FE): Never skip Site Pilot type-in for prefilled default; restore Chat top + composer fade; wire diag events — applied: sitePilotHome · sitePilotChat · chat.css · playbackDiag
- Quinn (QA): Console assertTypeIn + step/retreat smokes on :5173 — applied: PLAYBACK_DIAG prove recipe
- Ben (BE): Window APIs on MCP helper install; R12 one push no CI await — applied: studioMcpHelpers · playbackDiag

**Knowledge improved** (2026-07-19 · stream: Chat sticky composer scroll pad · R12):
- Finn (FE): Overlay `.chat__composer-dock` + ResizeObserver `--studio-chat-composer-h` → column `padding-bottom`/`scroll-padding-bottom`; playback honors CSS scroll-pad — applied: ChatScreen · chat.css · playbackScroll
- Uma (UI/UX): Bubbles scroll under sticky dock; last CTA clears above composer; thin thumb / transparent track — applied: chat.css · globals-chrome
- Quinn (QA): Probe `chat-composer-scroll-pad` (pad≥120, CTA above dock, no dual scroll) — applied: studioMcpPageProbe
- Ben (BE): R12 one push no CI await — applied: peek only

**Knowledge improved** (2026-07-19 · stream: Chat sticky/scroll/bar — don’t regress · R12):
- Bea (BA): Register L3–L6 Frame337 microheader → Present; I11 links = UXDS `.uxds-link` — applied: CHAT_LEGACY_PARITY_REGISTER
- Finn (FE): Port Legacy Frame337 → `ChatSitePilotBar`; bubble links `.uxds-link`; chat column overflow-sync + left pad compensate — applied: ChatSitePilotBar · ChatScreen · chat.css · globals-chrome
- Uma (UI/UX): Site Pilot bar + DS link rest/hover; no invent blue underline; center X stable — applied: chat.css · LESSONS Chat sticky/scroll/bar
- Quinn (QA): probe `chat-site-pilot-bar` + bubble link rest assert — applied: chatMcpProbeSteps
- Ben (BE): R12 one push no CI await — applied: peek only
- Pax (PO sim): jagged Chat regression user-visible → patch notes — applied: notes:append

**Knowledge improved** (2026-07-19 · stream: traditional pdp-book-now + Chat recipe · R12):
- Finn (FE): Prefer React PDP `data-studio-action=pdp-book-now`; skip legacy-retired — applied: findPdpBookNowBtn · traditional.ts
- Uma (UI/UX): §0a PARTIAL — composer identity PASS vs Site Pilot + Motion ownership; no whole-page PROVEN — applied: UMA_FIDELITY_CHAT
- Quinn (QA): Expanded `chatProbeSteps` (host/retired/composer/hovers/motion); recipe PASS ≠ Final Pass — applied: studioMcpPageProbe · QUINN_CHAT_PROBE_CRITERIA
- Ben (BE): R12 one push no CI await — applied: peek only
- Pax (PO sim): traditional CJM fix user-visible → patch bump — applied: release:patch

**Knowledge improved** (2026-07-19 · stream: Chat React mount ON · step-forward unblock · R12):
- Arch (Director): Mount ON after Legacy smoke unblock + React agentic P1–P10; no false Chat PROVEN/Final Pass; PDP HARD-GREEN untouched — applied: NEXT_STEPS §6
- Finn (FE): Prefer React host over Legacy-retired first-match (`getAgenticHomeCard` / `getChatSummary`); React controlled textarea native setter; shared `SitePilotComposer` — applied: sitePilotHome · sitePilotChatScenario
- Quinn (QA): Home play + agentic step through chat green on React host; traditional `pdp-book-now` no-op residual — applied: :5173 matrix
- Ben (BE): Mount flag true + contract test; R12 one push no CI await — applied: chatContract
- Pax (PO sim): user-visible Chat React mount → patch bump — applied: release:patch

**Knowledge improved** (2026-07-19 · stream: Chat React parity behind flag · R12 batch):
- Arch (Director): Flip veto until Quinn P1–P10 React smoke; PDP HARD-GREEN untouched; no Chat PROVEN — applied: NEXT_STEPS §6
- Bea (BA): Register bands L/LE/SK → Partial for React port behind flag — applied: CHAT_LEGACY_PARITY_REGISTER
- Finn (FE): Thread×8 + CTAs + thinking bridge + shared composer dual-class (`proto-agentic-*`); static frame classes preserve scenario hide — applied: screens/chat · chatThinkingBridge · SitePilotComposer
- Uma (UI/UX): Chat motion via `@/uxds/motion` (thinking + frame enter); Legacy `#dbebf5` body — applied: ChatScreen · chat.css (pixel PROVEN still PENDING)
- Quinn (QA): Mount stays OFF — React P1–P10 not smokeable until flip; Legacy host still 4q/4r — applied: no false PROVEN
- Ben (BE): Hygiene extract `chatScreenActions` / `useBootsChatScreenMount`; R12 push no-await — applied: check:hygiene under 4800
- Pax (PO sim): no patch bump (flag OFF, not user-visible React mount) — applied: R12

**Knowledge improved** (2026-07-19 · stream: Chat React kickoff · PO override · R12 batch):
- Arch (Director): Chat kickoff under PAGE_FINAL_PASS discipline while Site Pilot NOT hard-green (PO override); PDP HARD-GREEN preserved; Chat NOT-GREEN — applied: NEXT_STEPS §6 · team check
- Bea (BA): 69-band Chat Legacy register + CJM/playback contracts + shared composer SK rows — applied: CHAT_LEGACY_PARITY_REGISTER · CHAT_REACT
- Finn (FE): shared `SitePilotComposer` (Home+Chat); Chat scaffold gated `CHAT_REACT_MOUNT_ENABLED=false` so Legacy playback stays live — applied: screens/shared · screens/chat · isChatReactMounted
- Uma (UI/UX): Chat fidelity IN PROGRESS; Motion owns chat animated transitions via `@/uxds/motion` — applied: UMA_FIDELITY_CHAT · MOTION.md
- Quinn (QA): chat stub + mandatory playback smoke P1–P10; no false PROVEN — applied: QUINN_CHAT_PROBE_CRITERIA
- Ben (BE): `chat-host` probe stub + `site-pilot-chat`→`chat` alias test; PAGE_FINAL_PASS/PARITY untouched — applied: studioMcpPageProbe · studioUrl.test
- Pax (PO sim): one coherent wave push, no await CI — applied: R12

**Knowledge improved** (2026-07-19 · stream: Site Pilot screenId rename · v0.0.40):
- Arch (Director): public Boots Site Pilot id is `site-pilot`; `home` reserved — applied: screens.ts · URL.md · register
- Bea (BA): register documents public `screenId=site-pilot` + reserved `home` — applied: HOME_LEGACY_PARITY_REGISTER
- Finn (FE): `HOME_REACT_SCREEN_ID` + host attrs + probe recipe → `site-pilot` (folder/BEM lag OK) — applied: homeContract · mount · studioMcpPageProbe
- Ben (BE): URL aliases + tests + patch bump + R12 batch push — applied: studioUrl · v0.0.40
- Pax (PO sim): user-visible URL seam → patch bump — applied: release:patch

**Knowledge improved** (2026-07-19 · stream: Home naming + lean CI + batch-push R12 · tip post-`fd3241c`):
- Arch (Director): R12 batch-ship-push locked; CI wall target ~35–45s warm — applied: doctrine §2.14 · TEAM · STUDIO_AUTO_RULES R12 · director #26
- Bea (BA): Home chip/query naming contract in register — applied: HOME_LEGACY_PARITY_REGISTER L7
- Finn (FE): Home landmarks/form + kebab chip `data-studio-*` — applied: `HomeScreen.tsx` · naming audit PASS
- Ben (BE): `npm ci` + cache + parallel `test`∥`build` + `test:gates` — applied: `ci.yml` · `run-static-gates.mjs` · CI_ACTIONS_BUDGET §2.1
- Pax (PO sim): one batched push per coherent ship (this wave) — applied: R12 process

**Knowledge improved** (2026-07-19 · stream: faster CI + R12 no-await · tip post-`04358d0`):
- Arch (Director): R12 extended — no await CI/Pages on routine ships; warm wall target ≤20–25s — applied: doctrine §2.13–14 · TEAM · STUDIO_AUTO_RULES R12 · director #9/#26 · ci-sitrep
- Ben (BE): `node_modules` cache (skip `npm ci` on hit) + Vitest forks/workers=2 + cancel-in-progress confirmed — applied: `ci.yml` · `deploy-pages.yml` · CI_ACTIONS_BUDGET §2.1/§5
- Pax (PO sim): push-and-move-on is the default; await CI only HARD-GREEN / release / PO prove — applied: R12 process

**Knowledge improved** (2026-07-19 · stream: probe-test CI delay compress · tip post-`0c2dc9b`):
- Finn (FE): `compressProbeDelayMs` (VITEST-only) + fake timers in page-probe unit tests — production MCP settle/pre-arm unchanged — applied: `studioMcpPageProbe.ts` · `studioMcpPageProbe.test.ts`
- Ben (BE): local `npm test` wall ~10s → ~4s (probe file ~8.4s → ~20ms); hard gates kept; R12 one push no-await — applied: CI_ACTIONS_BUDGET §2.1 · LESSONS

**Knowledge improved** (2026-07-19 · stream: thin-track scroll no X-jump · R12):
- Finn (FE): drop `scrollbar-gutter: stable` (classic width ≠ 4px thumb); tall hosts `overflow-y: scroll` via `studio-scroll--overflow` + lock `padding-inline-end: var(--studio-scrollbar-size)`; `.chat__column` always-scroll — applied: `studioScrollOverflow.ts` · `globals-chrome.css` · `chat.css`
- Quinn (QA): Home noBar; Chat scroll left stable; PLP lock content width stable — applied: :5173 MCP measure

**Knowledge improved** (2026-07-19 · stream: overflow-only scrollbar gutter · v0.0.39):
- Finn (FE): never always-on `scrollbar-gutter: stable` — toggle `studio-scroll--overflow` via `syncStudioScrollOverflowGutter` / `useScrollFill`; keep gutter only while overflowing (+ locked) — applied: `studioScrollOverflow.ts` + `globals-chrome.css`
- Pax (PO sim): user-visible shell fix → patch bump — applied: v0.0.39

**Minimum after a ship:** at least the roles that worked the stream fill a line. Empty “n/a” only if the role was truly out of scope. Arch rejects a close-out that only says “appended LESSONS” with no **applied** proof.

---

## Recent knowledge deltas (index — details in LESSONS)

### 2026-07-19

| Delta | Hats | LESSONS / artifact |
|-------|------|--------------------|
| **Batch ship / push (R12)** — no push after every tiny fix; **no await CI/Pages** on routine ships; land local until coherent ship / PO ask / HARD-GREEN / end of wave | Arch, Pax, Ben | [STUDIO_AUTO_RULES.md](./STUDIO_AUTO_RULES.md) R12 · TEAM § Batch ship · doctrine §2.13–14 · ci-sitrep |
| **Faster CI** — `node_modules` cache; parallel `test`∥`build`; Vitest forks; **probe-test delay compress** (Vitest-only + fake timers; MCP settles untouched); warm target ≤20–25s | Ben, Finn, Arch | [CI_ACTIONS_BUDGET.md](./CI_ACTIONS_BUDGET.md) §2.1 · `studioMcpPageProbe.ts` · `ci.yml` |
| **Site Pilot public id** — URL/`screenId`=`site-pilot` (`home` reserved); folder/BEM may lag; naming audit updated | Bea, Finn, Arch | [HOME_LEGACY_PARITY_REGISTER.md](../projects/boots-pharmacy/features/HOME_LEGACY_PARITY_REGISTER.md) · [URL.md](../shell/URL.md) |
| **Fixed localhost + reuse tab** — canonical `http://localhost:5173/`; Vite `strictPort`; one `npm run dev`; Chrome MCP `list_pages`→reuse (`new_page` only if empty); Auto-Rule R11 + felony | Arch, Finn, Ben, Quinn | [STUDIO_AUTO_RULES.md](./STUDIO_AUTO_RULES.md) R11 · `vite.config.ts` · LESSONS |
| **Platform Motion standard** — `framer-motion` via `@/uxds/motion`; Accordion height = Motion (not CSS `0fr/1fr`); chevron CSS; shell pilots: diagnostic overlay + studio select presence | Arch, Finn, Uma, Ben, Pax | [MOTION.md](./MOTION.md) · `src/uxds/motion/` · Accordion.tsx |
| **Accordion invisible expand** — `prefers-reduced-motion` zeroed CSS grid transitions; root cause + Motion height fix | Uma, Finn, Arch, Quinn | LESSONS · accordion.css · MOTION.md |
| **Robo-cursor travel** — Motion `animate` ease-in-out only (no back/overshoot/bounce); cancel via `.stop()` on forceClear; hang caps retained; **step parks / Play stays / never rest on submit**; early hand-on-edge | Finn, Arch, Quinn | [MOTION.md](./MOTION.md) · [PLAYBACK.md](../shell/PLAYBACK.md) · `demoCursorEngine.ts` · LESSONS bounce gate |
| **PDP Accordion Motion re-prove** — Quinn MCP **PASS** 23/23 @ `5c1d90f` / v0.0.37; Motion height mid-tween assertable; teardown clean; Arch HARD-GREEN restored | Quinn, Arch, Finn, Uma | FE_AUDIT_PDP_MCP · PAGE_FINAL_PASS mcpFinalPass HARD-GREEN |
| **PDP PAGE FINAL PASS** — **HARD-GREEN** @ `5c1d90f` / v0.0.37 (Quinn 23/23 Accordion Motion re-prove · Uma §0a @ `76e2433`; prior HARD-GREEN @ `57775a3` demoted NEEDS-REPROVE then restored) | Arch, Finn, Uma, Quinn, Ben, Pax | PAGE_FINAL_PASS.json · FE_AUDIT_PDP_MCP · FE_AUDIT_PDP_PAGE_FINAL_PASS · check:page-final-pass |
| **PDP Motion travel re-prove** — Quinn MCP **PASS** 23/23 @ `7c7c9e1` / v0.0.32; teardown clean; Uma §0a still PROVEN @ `76e2433` | Quinn, Arch, Finn, Uma | FE_AUDIT_PDP_MCP · PAGE_FINAL_PASS mcpFinalPass HARD-GREEN |
| **PDP hang-guard re-prove** — Quinn MCP **PASS** 23/23 @ `7bce2b3` / v0.0.31 (superseded MCP stamp by `7c7c9e1`) | Quinn, Arch, Finn, Uma | FE_AUDIT_PDP_MCP · PAGE_FINAL_PASS mcpFinalPass PASS |
| **PDP FAQ 6/6 + Accordion motion + TertiaryCta soft** — Uma §0a PROVEN + Quinn MCP **PASS** 23/23 @ `76e2433` / v0.0.30 (superseded MCP stamp by `7bce2b3`) | Uma, Quinn, Arch, Finn | UMA_FIDELITY_PDP · FE_AUDIT_PDP_MCP · PAGE_FINAL_PASS mcpFinalPass PASS · DEV-20260719-tertiary-soft |
| **PDP FAQ/CTA/focus polish (PO)** — Legacy-sourced FAQ bodies 3/6; download tertiary unify (no leaflet stub); accordion focus-none; v0.0.28 | Bea, Uma, Finn, Quinn, Arch | PDP_LEGACY_PARITY_REGISTER · UMA_FIDELITY_PDP · PAGE_FINAL_PASS.json |
| **PDP RTB vertical rhythm** — LEGACY `module.pdp.rtb > div > div` stole React column gap (48≠32) + forced title-block 1:1; Uma must MCP-measure section gaps before fidelity IN PROGRESS; Quinn PASS ≠ rhythm done | Uma, Finn, Arch | UMA_FIDELITY_NOTES §0b · UMA_FIDELITY_PDP · globals-screens `:not(.pdp__rtb-card)` |
| **PDP kickoff** — Bea register before code; Finn L1–L13 mount; Uma fidelity IN PROGRESS; Quinn probe criteria prep (no false PROVEN); accordion B1 static | Arch, Bea, Finn, Uma, Quinn, Ben | [PDP_LEGACY_PARITY_REGISTER.md](../projects/boots-pharmacy/features/PDP_LEGACY_PARITY_REGISTER.md) · screens/pdp |
| **PAGE FINAL PASS** — no new migrated page until previous hard-green; Finn/Uma checklist + check; parallel callsigns + Knowledge used still required | Arch, Finn, Uma, Bea | [PAGE_FINAL_PASS.md](./PAGE_FINAL_PASS.md) · TEAM · doctrine · NEXT_STEPS |
| Typical DS checks mandatory before PROVEN; missing DS hover = FAIL | Uma, Quinn, Arch | LESSONS · UMA notes · ratchet search-field-states |
| Filter search parity (icon end, single clear, View all, counters) | Finn, Uma, Bea, Quinn | LESSONS · PARITY_RATCHETS · PLP register |
| Overlay eyes — no click-through open dialogs | Quinn, Ben, Finn | LESSONS · `studioModalGuard` · felonies |
| Modal URL sync — every popup must set `&modal=` (QV + Choose Pharmacy + Login + pickers) | Finn, Ben, Quinn | LESSONS · URL.md · `studioModalRegistry` · ratchet **modal-url-sync** |
| MCP page probe: **scroll-into-view** before interact; **overlay must be visible on every probe** — FAIL if absent | Quinn, Finn, Ben | LESSONS 2026-07-19 (MCP probe visibility) |
| Agent overlay: **pre-arm** before steps; sitrep **PASS/FAIL** green/red; **forceClear** hard-remove (no stale popup) | Uma, Finn, Quinn | RECORDING.md · LESSONS · `agentTestingOverlay` |
| **Studio Auto-Rules framework** — dismiss/modal, auth SSoT, avail start, §0b rhythm, brand-active pills → CI; PO must not re-ask | Arch, Ben, Quinn, Finn, Uma | [STUDIO_AUTO_RULES.md](./STUDIO_AUTO_RULES.md) · `studioAutoRules.ts` · `check:theme-brand` · felonies §9–10 |
| **Auto-Rule `robo-cursor-native-feedback`** — robo = **native hover+press everywhere** (all interactive targets, not chat-only); top-level selector split + insertRule bridge; press dwell ~64ms; default graphic after click | Finn, Ben, Quinn | `demoCursor` · `demoCursorPseudoBridge` · STUDIO_AUTO_RULES R10 |
| **Chrome hang class** — uncapped hover-bridge CSS + travel rAF after forceClear + accordion thrash = P0 hang; cap bridge, cancel rAF, rate-limit synthetic hover, Accordion contain/toggle floor | Finn, Ben, Quinn | LESSONS · `demoCursor` · `demoCursorPseudoBridge` · accordion.css |
| **Bridge CSSOM stall** — never comma-split inside `:is()`; invalid bridged selectors must not abort later page rules (PDP secondary hover) | Finn, Ben | LESSONS · `splitSelectorsTopLevel` · insertRule |
| **Auto-Rule `agent-teardown-clean`** — overlay gone + `&modal=` stripped + dialog closed after probe/sitrep/forceClear | Finn, Ben, Quinn, Arch | `studioAgentTeardownContract` · felonies §9 · `__studioAssertAgentTeardownClean` |
| Team knowledge database + mandatory use | Arch, all | This file · TEAM.md § Knowledge use |
| Page final-pass gate before NEXT screen; landmarks + BEM stamp | Finn, Uma, Ben, Arch | PAGE_FINAL_PASS.md · check:page-final-pass |

**Knowledge improved** (2026-07-19 · stream: Accordion Motion height · v0.0.37):
- Arch (Director): root cause = `prefers-reduced-motion` killed CSS grid transitions; demote PDP mcpFinalPass NEEDS-REPROVE (user-visible) — applied: PAGE_FINAL_PASS.json + MOTION.md + NEXT_STEPS 3e
- Finn (FE): AccordionContent Motion `height: 0↔auto` + panel opacity; hang-safe always-mounted; shell pilots StudioSelect + PlaybackDiagnostic — applied: Accordion.tsx · StudioNavStudioSelect · PlaybackDiagnosticOverlay
- Uma (UI/UX): muted closed chevrons stay CSS; functional height Motion so expand visible under reduced-motion OS — applied: accordion.css · MCP mid-frame heights 0→68→130→144
- Pax (PO sim): patch bump + push; Home still blocked on HARD-GREEN restore — applied: release:patch

**Knowledge improved** (2026-07-19 · stream: fixed localhost + reuse tab · Auto-Rule R11):
- Arch (Director): locked canonical `http://localhost:5173/` + Chrome MCP reuse-tab felony; no patch bump (docs/config) — applied: STUDIO_AUTO_RULES R11 · doctrine §4 · director #25 · AGENTS/TEAM
- Finn (FE): Vite `port: 5173` + `strictPort: true` — applied: `vite.config.ts`
- Ben (BE): `check:felonies` asserts vite port/strictPort + catalog id; smoke already on 5173 — applied: `check-agent-felonies.mjs`
- Quinn (QA): prove only on `:5173`; `list_pages` → select/navigate; never `new_page` unless empty — applied: RECORDING + TEAM_KNOWLEDGE Quinn hat

**Knowledge improved** (2026-07-19 · stream: robo-cursor native hover everywhere · v0.0.34):
- Finn (FE): root cause = comma-split inside `:is()` stalled bridge CSSOM so `.pdp__secondary` hover never live; top-level split + insertRule + page-sheet priority + `data-studio-robo-hover` + ~64ms press dwell — applied: `demoCursorPseudoBridge` + `demoCursor`
- Ben (BE): R10 ratchet “everywhere not chat-only”; Vitest `:is()` + PDP secondary; patch bump — applied: STUDIO_AUTO_RULES + tests + LESSONS
- Quinn (QA): MCP prove Check availability bg/border + Book now + popup close — applied: `__studioProveRoboCursorFeedback` border check
- Arch (Director): shell-only; does not demote PDP Final Pass product matrix — applied: TEAM_KNOWLEDGE

**Knowledge improved** (2026-07-19 · stream: PDP PAGE FINAL PASS HARD-GREEN restored · tip 5c1d90f · v0.0.37 · Accordion Motion):
- Arch (Director): tip `5c1d90f` / v0.0.37 Accordion Motion past HARD-GREEN @ `57775a3` → honest NEEDS-REPROVE → Quinn 23/23 + Uma §0a → restore HARD-GREEN; veto Home until PO `+` — applied: PAGE_FINAL_PASS.json tip 5c1d90f + FE_AUDIT_PDP_* + NEXT_STEPS 3e
- Quinn (QA): full PDP MCP `reload:false` 23/23 ~29s; Motion mid-tween assertable; teardown forceClear PASS — applied: FE_AUDIT_PDP_MCP (prove cdf5c5f)
- Uma (UI/UX): §0a remains PROVEN @ `76e2433` — Motion height does not reopen FAQ copy/CTA — applied: no re-open
- Pax (PO sim): sequencing hard-green ≠ start Home — applied: wait PO `+`

**Knowledge improved** (2026-07-19 · stream: PDP Accordion Motion Quinn re-prove · tip 5c1d90f · v0.0.37 · prove `cdf5c5f`):
- Quinn (QA): full PDP MCP `reload:false` 23/23 ~29s on canonical `:5173` reuse tab; Accordion Motion mid-tween assertable; teardown forceClear PASS — applied: FE_AUDIT_PDP_MCP + PAGE_FINAL_PASS mcpFinalPass PASS; Arch unblocked for HARD-GREEN
- Uma (UI/UX): §0a remains PROVEN @ `76e2433` — Motion height ship does not reopen FAQ copy/CTA — applied: no re-open
- Arch (Director): restore HARD-GREEN only after this Quinn PASS — applied: hardGreen false until Arch stamp

**Knowledge improved** (2026-07-19 · stream: PDP PAGE FINAL PASS HARD-GREEN restored · tip 57775a3 · v0.0.36):
- Arch (Director): tip `57775a3` / v0.0.36 (playback panel + cursor lock) past HARD-GREEN @ `48f2016` → honest NEEDS-REPROVE → Quinn 23/23 → restore HARD-GREEN; veto Home until PO `+` — applied: PAGE_FINAL_PASS.json tip 57775a3 + FE_AUDIT_PDP_* + NEXT_STEPS 3e
- Quinn (QA): full PDP MCP `reload:false` 23/23 ~27s; teardown assert PASS; playback panel present; Check availability robo hover PASS — applied: FE_AUDIT_PDP_MCP
- Uma (UI/UX): §0a remains PROVEN @ `76e2433` — shell tips do not reopen FAQ/Accordion — applied: no re-open
- Pax (PO sim): sequencing unblocked ≠ start Home — applied: wait PO `+`

**Knowledge improved** (2026-07-19 · stream: PDP PAGE FINAL PASS HARD-GREEN retained · tip 48f2016 · v0.0.35):
- Arch (Director): shell tip advance (robo hover `042dbaf` / v0.0.34 + scrollbar `48f2016` / v0.0.35) → quick confirm 23/23; retain HARD-GREEN; veto Home until PO `+` — applied: PAGE_FINAL_PASS.json tip 48f2016 + FE_AUDIT_PDP_PAGE_FINAL_PASS + NEXT_STEPS 3e
- Quinn (QA): prior prove 23/23 @ 7c7c9e1 / prove 841ab32 still base; Arch confirm after shell — applied: confirm PASS
- Uma (UI/UX): §0a remains PROVEN @ `76e2433` — shell tips do not reopen FAQ/Accordion — applied: no re-open
- Pax (PO sim): sequencing unblocked ≠ start Home — applied: wait PO `+`

**Knowledge improved** (2026-07-19 · stream: PDP PAGE FINAL PASS HARD-GREEN restored · tip 581018f · v0.0.33):
- Arch (Director): restore HARD-GREEN only after Quinn 23/23 (Motion travel) + Uma §0a PROVEN; shell scrollbar v0.0.33 mid-flight does not demote; veto Home until PO `+` — applied: PAGE_FINAL_PASS.json mcpFinalPass HARD-GREEN @ 581018f + FE_AUDIT_PDP_PAGE_FINAL_PASS + NEXT_STEPS 3e
- Quinn (QA): re-prove MCP after shell Motion travel tip (not false-PROVEN from prior hang-guard PASS) — applied: FE_AUDIT_PDP_MCP 23/23 @ 7c7c9e1 / prove 841ab32 / tip ef5af38
- Uma (UI/UX): §0a remains PROVEN @ `76e2433` — travel easing tip does not reopen FAQ/Accordion — applied: no re-open
- Pax (PO sim): sequencing unblocked ≠ start Home — applied: wait PO `+`

**Knowledge improved** (2026-07-19 · stream: PDP v0.0.32 Quinn MCP re-prove · tip 7c7c9e1):
- Quinn (QA): full `__studioRunMcpPageProbe({ reload:false })` 23/23 PASS + clean teardown after Motion easeInOut travel tip — applied: FE_AUDIT_PDP_MCP + PAGE_FINAL_PASS mcpFinalPass PASS; Arch unblocked for HARD-GREEN
- Uma (UI/UX): §0a remains PROVEN @ `76e2433` — travel easing tip does not reopen FAQ/Accordion — applied: no re-open
- Arch (Director): restore HARD-GREEN only after this Quinn PASS — applied: HARD-GREEN restored @ 581018f

**Knowledge improved** (2026-07-19 · stream: PDP v0.0.31 Quinn MCP re-prove · tip 7bce2b3):
- Quinn (QA): full `__studioRunMcpPageProbe({ reload:false })` 23/23 PASS + clean teardown; hang residual none (bounded R10 only; no unbounded robo) — applied: FE_AUDIT_PDP_MCP + PAGE_FINAL_PASS mcpFinalPass PASS; Arch unblocked for HARD-GREEN
- Uma (UI/UX): §0a remains PROVEN @ `76e2433` — hang-fix tip does not reopen FAQ/Accordion — applied: no re-open
- Arch (Director): restore HARD-GREEN only after this Quinn PASS — applied: hardGreen false until Arch stamp

**Knowledge improved** (2026-07-19 · stream: PDP v0.0.30 Quinn MCP re-prove · tip 76e2433):
- Quinn (QA): full `__studioRunMcpPageProbe` 23/23 PASS + Accordion 0fr↔1fr / muted chevron token spot + robo R10 avail-close PASS — applied: FE_AUDIT_PDP_MCP + PAGE_FINAL_PASS mcpFinalPass PASS; Arch unblocked for HARD-GREEN
- Uma (UI/UX): §0a already PROVEN on same tip — applied: no re-open
- Arch (Director): restore HARD-GREEN only after this Quinn PASS — applied: hardGreen false until Arch stamp

**Knowledge improved** (2026-07-19 · stream: PDP v0.0.30 Uma §0a re-prove · tip 76e2433):
- Uma (UI/UX): §0a PROVEN — FAQ 6/6 bodies, Accordion CSS grid-template-rows motion, muted closed chevrons, Find out more = TertiaryCta soft (no `.pdp__pill--mint`) — applied: UMA_FIDELITY_PDP + PARITY_PROVEN note
- Arch (Director): Final Pass only after Quinn MCP PASS on polish tip — applied: PAGE_FINAL_PASS was NEEDS-REPROVE until Quinn
- Quinn (QA): must re-run `__studioRunMcpPageProbe({ screenId:"pdp" })` on `76e2433` before Arch stamp — applied: done (PASS)

**Knowledge improved** (2026-07-19 · stream: Chrome hang P0 · robo hover bridge / travel rAF):
- Finn (FE): cap `demoCursorPseudoBridge` rules + skip vendor sheets; cancel travel rAF on remove/forceClear; no re-flood hover enter/move; Accordion contain + no permanent will-change + toggle floor — applied: demoCursor* + accordion.css + useAccordion
- Ben (BE): reload-storm cooldown on `scheduleReload`; Vitest hang-guard contracts — applied: agentTestingOverlay + demoCursor tests
- Quinn (QA): prove PDP load + FAQ toggle + forceClear + `__studioWaitAgentTeardownClean` without hang (bridge capped; no reload storm) — applied: DevTools prove on tip
- Ben (BE): also guard `checkRetreatViewportGoal` / selection when beat undefined — tip PDP crash blocked prove — applied: boots playback index
- Arch (Director): same P0 class as reload storms; abandon half-done Motion adopt (no hang risk) — applied: LESSONS + TEAM_KNOWLEDGE; Motion deferred

**Knowledge improved** (2026-07-19 · stream: robo-cursor native feedback · Auto-Rule R10):
- Finn (FE): global agent/robo click path — full pointer enter/move/down/up + CSS `:hover`/`:active` bridge; settle clears hand → default; mild travel overshoot — applied: `demoCursor` + `demoCursorPseudoBridge` + popup-close pressed wash
- Ben (BE): R10 catalog + Vitest contract (happy-dom) — applied: `studioAutoRules` + STUDIO_AUTO_RULES.md + interaction/bridge tests
- Quinn (QA): MCP prove hover styles under robo + close press — applied: chrome DevTools probe on tip
- Arch (Director): shell-only; PDP Final Pass untouched — applied: TEAM_KNOWLEDGE + no demote

**Knowledge improved** (2026-07-19 · stream: PDP PAGE FINAL PASS HARD-GREEN restored · tip c6e8931 · v0.0.28):
- Arch (Director): restore HARD-GREEN only after Quinn 23/23 (faq-help-body + download unify) + Uma §0a PROVEN; veto Home until PO `+` — applied: PAGE_FINAL_PASS.json mcpFinalPass HARD-GREEN + FE_AUDIT_PDP_PAGE_FINAL_PASS + NEXT_STEPS 3e
- Quinn (QA): re-prove MCP after user-visible polish (not false-PROVEN from prior 22/22 HARD-GREEN) — applied: FE_AUDIT_PDP_MCP 23/23 @ bf59041 / prove 67a5b7c / tip c6e8931
- Uma (UI/UX): §0a real FAQ bodies + CTA tertiary unify + accordion focus-none before Arch stamp — applied: UMA_FIDELITY_PDP PROVEN @ 8d80d5f
- Pax (PO sim): sequencing unblocked ≠ start Home — applied: wait PO `+`

**Knowledge improved** (2026-07-19 · stream: PDP v0.0.28 Quinn MCP re-prove · tip bf59041):
- Quinn (QA): full `__studioRunMcpPageProbe` 23/23 PASS after FAQ/CTA/focus polish; download CTA assert must ignore demo `proto-chat-cta--hover` (product `pdp__*` classes only) — applied: studioMcpPageProbe + FE_AUDIT_PDP_MCP PASS; Arch unblocked for HARD-GREEN
- Uma (UI/UX): §0a PROVEN on polish tip before Quinn matrix — applied: UMA_FIDELITY_PDP @ 8d80d5f
- Arch (Director): restore HARD-GREEN only after Quinn PASS + Uma PROVEN (not from stale 22/22) — applied: HARD-GREEN restored @ c6e8931

**Knowledge improved** (2026-07-19 · stream: PDP PAGE FINAL PASS HARD-GREEN restored · tip 828ab2b · v0.0.27):
- Arch (Director): restore HARD-GREEN only after Quinn 22/22 (FAQ+download) + Uma §0a PROVEN + Accordion source contract; veto Home until PO `+` — applied: PAGE_FINAL_PASS.json mcpFinalPass + FE_AUDIT_PDP_PAGE_FINAL_PASS + NEXT_STEPS 3e
- Quinn (QA): re-prove MCP after interaction surface change (not false-PROVEN from prior HARD-GREEN) — applied: FE_AUDIT_PDP_MCP 22/22 @ d6e4951 / sync 828ab2b
- Uma (UI/UX): §0a real MCP hover/focus/expand on Accordion + download tertiary before Arch stamp — applied: UMA_FIDELITY_PDP PROVEN @ c037d19
- Finn (FE): `check:page-final-pass` requires UXDS `<Accordion>` on PDP (PO interactive) — applied: scripts/check-page-final-pass.mjs + PdpScreen kit
- Pax (PO sim): sequencing unblocked ≠ start Home — applied: wait PO `+`

**Knowledge improved** (2026-07-19 · stream: agent-teardown-clean Auto-Rule · sticky modal felony):
- Finn (FE): stay state omits modal; App never re-applies `state?.modalId`; probe/session finally resets; forceClear resets then hard-removes overlay — applied: studioUrl + App + probe + overlay
- Ben (BE): contract + `STUDIO_AUTO_RULES` + felonies §9 + helperOverlayArm read-only Wait/Assert — applied: check:felonies fails if unwired
- Quinn (QA): MCP `__studioWaitAgentTeardownClean` after open avail + forceClear — applied: PASS prove + FE_AUDIT_AGENT_TEARDOWN_CLEAN
- Arch (Director): R1 in STUDIO_AUTO_RULES.md hooks `agent-teardown-clean` — applied: catalog + CI family (no parallel gate zoo)

**Knowledge improved** (2026-07-19 · stream: Studio Auto-Rules / Auto-Gates framework · PO recurring pain → CI):
- Arch (Director): unified catalog [STUDIO_AUTO_RULES.md](./STUDIO_AUTO_RULES.md) + `studioAutoRules.ts` — no parallel unused gate system; PO must not re-ask dismiss/modal/brand-active — applied: doc + catalog ids
- Finn (FE): `agent-teardown-clean` contract + stay/hub strip `&modal=` + probe/session finally reset — applied: `studioAgentTeardownContract.ts` + URL/App/probe
- Ben (BE): felonies §9–10 + `check:theme-brand` + parity ratchets avail-start / pdp-rtb-rhythm wired into `npm test` — applied: scripts + package.json
- Quinn (QA): MCP assert `__studioAssertAgentTeardownClean` / wait helper after settle — applied: window API + unit contract tests
- Uma (UI/UX): §0b rhythm static markers + brand-active hook for pill ships — applied: ratchet **pdp-rtb-rhythm** + **theme-brand-active**
- Pax (PO sim): patch bump when teardown/framework user-visible — applied: release when push

**Knowledge improved** (2026-07-19 · stream: PDP PAGE FINAL PASS HARD-GREEN · tip d7ce01c · v0.0.24):
- Arch (Director): Final Pass stamp only after Quinn re-prove on tip that includes share flip; veto Home until PO `+` — applied: PAGE_FINAL_PASS.json mcpFinalPass + NEXT_STEPS 3e + Reflex
- Finn (FE): wired `pdp` into `check:page-final-pass` (sources/mounts/ButtonPrimary; ban invent Accordion kit) — applied: scripts/check-page-final-pass.mjs
- Uma (UI/UX): PROVEN + B1 static accordion accepted residual — applied: UMA_FIDELITY_PDP PROVEN (no invent interactive accordion)
- Quinn (QA): re-prove after post-matrix code tip (share flip) before HARD-GREEN — applied: FE_AUDIT_PDP_PAGE_FINAL_PASS 19/19 PASS on d7ce01c
- Ben (BE): tip CI success + local hygiene/parity/final-pass green — applied: CI sitrep run 29693462532
- Pax (PO sim): accept HARD-GREEN for sequencing; do not auto-start Home — applied: wait PO `+`

**Knowledge improved** (2026-07-19 · stream: PDP RTB vertical rhythm + Uma §0b ratchet · user-visible):
- Uma (UI/UX): PO hard-fail RTB cramped stack — root cause Legacy LEGACY `module.pdp.rtb > div > div` hitting React; MCP-measured 32px gaps restored; **§0a / PROVEN not stamped** — applied: pdp.css + globals-screens `:not(.pdp__rtb-card)` + UMA_FIDELITY_PDP §0b checklist
- Finn (FE): title-block content-sized + host belt `gap: 32px !important` — applied: screens/pdp/pdp.css
- Arch (Director): ratchet — section vertical rhythm mandatory before fidelity IN PROGRESS; Quinn PASS ≠ rhythm — applied: COMMAND_DOCTRINE + UMA_FIDELITY_NOTES §0b + TEAM_KNOWLEDGE
- Quinn (QA): functional MCP PASS stands; does not waive §0b/§0a — applied: residual note on stamp

**Knowledge improved** (2026-07-19 · stream: PDP React kickoff scaffold · v0.0.21):
- Arch (Director): parallel Bea→Finn/Uma/Ben after PLP HARD-GREEN + PO `+`; register-before-code enforced — applied: dispatch + board
- Bea (BA): full PDP Legacy inventory incl. LE N/A + accordion B1 — applied: PDP_LEGACY_PARITY_REGISTER.md
- Finn (FE): PLP-pattern mount child 8; L1–L13 RTB; wire `isPdpReactMounted` gates; no invent loader — applied: screens/pdp/*
- Uma (UI/UX): kickoff fidelity stamp IN PROGRESS — applied: UMA_FIDELITY_PDP_2026-07-19.md
- Quinn (QA): probe criteria prep only — refuse PROVEN until MCP — applied: QUINN_PDP_PROBE_CRITERIA_2026-07-19.md
- Ben (BE): URL.md PDP Check availability opener + screens.test pdp/plp ids — applied: docs + test
- Pax (PO sim): patch bump on user-visible React PDP scaffold — applied: release:patch

**Knowledge improved** (2026-07-19 · stream: MCP probe scroll + overlay · SHA b1bdf62 · v0.0.16):
- Finn (FE): `revealDemoTargetForAgent` + demo-click `scroll: true`; abandon settle without deferred reload; exclude `RunMcpPageProbe` from helper nest-arm — applied: code
- Quinn (QA): `overlay-arm` + `plp-below-fold-scroll` reveal step; overlay missing = FAIL every step — applied: probe recipe + RECORDING.md · MCP PLP prove PASS

**Knowledge improved** (2026-07-19 · stream: PAGE FINAL PASS sequencing · SHA d0ff113 · v0.0.17):
- Arch (Director): no next migrated page until previous hard-green; doctrine/TEAM/NEXT_STEPS/AGENTS/director rule + PAGE_FINAL_PASS.md — applied: gate; PDP blocked until Quinn MCP HARD-GREEN
- Uma (UI/UX): landmarks + BEM=`screenId` checklist keys; PLP/book stamps — applied: PAGE_FINAL_PASS.json
- Finn (FE): landmark fix + `check:page-final-pass` source contracts — applied: code + npm test wire
- Ben (BE): final-pass in `npm test` + patch bump — applied: script + package.json v0.0.17
- Bea (BA): no next-page brief until previous Final Pass hard-green — applied: TEAM
- Quinn (QA): MCP team-check still required for PLP HARD-GREEN — applied: board 2e open

**Knowledge improved** (2026-07-19 · stream: PLP PAGE FINAL PASS HARD-GREEN · tip 6358184 · v0.0.17):
- Quinn (QA): MCP-proved PLP Final Pass — `__studioRunMcpPageProbe` full matrix PASS (overlay-arm, below-fold scroll-into-view, overlay-eyes); landmarks header+main; stamped `mcpFinalPass: HARD-GREEN` — applied: PAGE_FINAL_PASS.json + FE_AUDIT_PLP_PAGE_FINAL_PASS_2026-07-19.md; NEXT_STEPS 2e closed; **PDP unblocked**
- Arch (Director): sequencing gate satisfied for PLP → PDP may start — applied: NEXT_STEPS 2e/3

**Knowledge improved** (2026-07-19 · stream: modal URL sync all popups · tip 4fcd2f2 · v0.0.18):
- Finn (FE): `studioModalRegistry` + QV/Login/pickers URL sync via `resolveStudioModalIdFromFlags` / registered openers — applied: code + felonies + **modal-url-sync** ratchet
- Uma (UI/UX light): URL.md modal table + no visual zoo — applied: docs
- Ben (BE): felony orphan-open gate + patch bump — applied: `check:felonies` / parity ratchet · v0.0.18
- Quinn (QA): MCP probe asserts `&modal=quick-view` on open / clear on close — applied: `plp-quick-view` / `plp-quick-view-close`; localhost MCP prove next

**Knowledge improved** (2026-07-19 · stream: agent overlay pre-arm + PASS/FAIL sitrep + forceClear · crash-safe probe reload:false · tip `de2edf0` · v0.0.20):
- Uma (UI/UX): pre-arm “preparing…” countdown before probe clicks; big green/red PASS/FAIL sitrep + Auto-closes countdown — applied: `agent-testing-overlay.css` + RECORDING
- Finn (FE): `preArmAgentTestingOverlay`; sitrep `result`; settle ~9s; `forceClear` cancels reload timers + hard-removes DOM; probe default `reload: false` — applied: `agentTestingOverlay.ts` + page probe
- Quinn (QA): LESSONS reload-loop/URL-fight class; after probe wait settle+1s → overlay DOM absent; FINAL PASS/FAIL n/m — applied: unit tests + RECORDING

**Knowledge improved** (2026-07-19 · stream: QV modal URL close stay-closed + overlay HARD-GREEN · tip `f28693c` · v0.0.19/`1624f79` + v0.0.20):
- Finn (FE): intentional-close suppress on URL→open (`studioModalUrlBridgePlan`) so QV close clears `&modal=` and stays closed — applied: code v0.0.19
- Quinn (QA): re-prove tip — full PLP matrix + `plp-quick-view-close` stay-closed samples; overlay pre-arm/sitrep/forceClear — applied: FE_AUDIT_QV_MODAL_URL + OVERLAY_PREARM PASS/PROVEN
- Arch (Director): Reflex micro-retro into TEAM_RETRO; **hold PDP** until PO `+`; residual = journey/`withMcpTestSession` one opted-in post-sitrep reload (not a loop) — applied: TEAM_RETRO overlay/QV section + this stamp

| Delta | Hats | LESSONS / artifact |
|-------|------|--------------------|
| **PLP team retro** — Pain/Worked/Keep; top keep actions for PDP+ | All | [TEAM_RETRO_2026-07-19_PLP.md](./TEAM_RETRO_2026-07-19_PLP.md) |
| **Reflex** — after each HARD-GREEN page, Arch micro-retro → this index | Arch | TEAM.md · doctrine §0 |
| **Modal URL registry mandatory** before any dialog ship | Finn, Ben, Quinn | [URL.md](../shell/URL.md) · felonies overlay registry |
| No invent UX / false PROVEN / DS hover / register-before-code (retro lock) | Bea, Finn, Uma, Quinn, Pax | Retro themes + LESSONS rage trail |

**Knowledge improved** (2026-07-19 · stream: PLP team retro / Reflex · notes-only):
- Arch (Director): facilitated full-callsign retro; locked **Reflex** (HARD-GREEN → micro-retro into TEAM_KNOWLEDGE); indexed top 5 keep actions — applied: TEAM_RETRO + TEAM.md + doctrine §0 + this index
- Bea (BA): register-every-band incl. loader mechanism before Finn; unchecked P0 blocks PASS — applied: Bea must-re-read + retro Keep
- Finn (FE): under-match Legacy; modal URL registry + `data-studio-modal` before dialog ship; ratchet same ship — applied: Finn must-re-read + URL.md link
- Uma (UI/UX): no invent; typical DS checks vs kit+Legacy before PROVEN — applied: retro Keep (Uma)
- Quinn (QA): PROVEN requires MCP probe evidence; overlay/scroll/eyes hard FAIL — applied: Quinn must-re-read
- Ben (BE): modal URL table + overlay felonies same PR as dialog; no chat-only PROVEN — applied: Ben must-re-read
- Pax (PO sim): accept bar = Legacy + MCP + Final Pass hard-green; notes/push without bump for docs/reflex — applied: retro Keep (Pax)

**Process deltas (actionable — from retro):**
1. **Modal URL registry mandatory** — before any blocking dialog ships: add `modal` id to [URL.md](../shell/URL.md), register in `STUDIO_MODAL` / `REGISTERED_OVERLAY_MODAL_IDS`, stamp `data-studio-modal` — same change as the dialog. Ben/Finn own; Quinn proves deep-link + overlay-eyes.
2. **Legacy register before code** — Bea completes every band (incl. loading/empty/updating mechanism) before Finn implements; unchecked P0 = team-check FAIL.
3. **No invent / DS hover** — Uma signs typical DS checks; Quinn MCP-hovers ≥1 SearchField; invent chrome = FAIL.
4. **False PROVEN ban** — Arch rejects PROVEN without MCP evidence log; PO dispute revokes until re-prove.
5. **Reflex** — after each PAGE FINAL PASS HARD-GREEN, Arch runs micro-retro (Pain/Worked/Keep lean) and appends **Knowledge improved** here before opening the next migrated page.

**Knowledge improved** (2026-07-23 · stream: erase-Legacy Phase B — Book Step 1–3 Legacy delete · board #8 · local, no push):
- Arch (Director): confirmed board #8's own gate ("after History/Details Final Pass hard-green + CJM/playback green") was actually satisfied by Phase A's `3909eb0` camera-yank fix (10/10 Traditional Play prove) before proceeding — did not blind-trust the task framing; fenced `frame/index.tsx`/`headerMount.tsx` (Header Phase D lane 7c) and the larger wire dead-code family (board #9) out of scope rather than scope-creep into them — applied: NEXT_STEPS #8 checked + #9 scoping note
- Finn (FE): `retireLegacyUnderPage` gained `permanent: true` (delete outright, no park/restore) instead of inventing a second parallel retire function; Book Step 1/2/3 mounts switched to it; found and left alone (not touched) the ~1500-line always-true-guard dead effect family in `BootsPharmacyProjectView.tsx` since it's board #9's job, not #8's — applied: `retireLegacyUnderPage.ts` · 3 mount files
- Uma (UI/UX light — no browser MCP available this ship): verified by static trace, not screenshot, that no live React screen references `.proto-confirm-open-appointment*` / `.proto-page-booster-checkbox*` before deleting their CSS; confirmed `BookAppointmentProgress`/calendar-cell/`.utility / cursor` CSS IS live-referenced by React screens and left untouched — applied: this ship's CSS diff; **live MCP re-prove of Book Step 1/2/3 visuals still owed** (flagged, not claimed)
- Quinn (QA): `npm test` 162/162 files (1008 tests) green incl. `check:page-final-pass` / `check:parity-ratchets` / `check:felonies`; `npm run build` green; no MCP/browser transport was available this session — Book Step 1/2/3 localhost re-prove is a named residual, not a false PROVEN — applied: this report's residual list
- Pax (PO sim): local-only ship (no commit per task instruction); no version bump — applied: leave tree uncommitted for PO review

**Knowledge improved** (2026-07-23 · stream: erase-Legacy Phase C — mechanical LEGACY CSS shrink · board #9 · local, no push):
- Arch (Director): re-read Phase B's #8/#9 knowledge + lessons before starting; confirmed via `retireLegacyUnderPage`/`mountBookStep{1,2,3}Screen.tsx` that Book 1–3 Legacy `body` is genuinely permanently deleted (not parked) before treating any selector as provably dead; kept the ~1500-line dead-`useEffect` JS family in `BootsPharmacyProjectView.tsx` untouched (not required to prove this pass's CSS deletions) — applied: NEXT_STEPS #9 partial-done note, honest about what's left
- Finn (FE — CSS only, no JS touched): grep-traced every candidate class to its producer before deleting; found the `.proto-chosen-tile`/`-store-card`/`-checkbox`/`-map`(+viewport/surface/dragging)/`.proto-page-map-pin` family (sole producer `setupChosenPageMap` in `locationsMap.ts`, called only from the dead Book Step 1 effect) plus the Book Step 1 `nth-child(7)` `.utility / cursor` rule were genuinely dead; correctly did **not** delete `.proto-chosen-slot`/`.proto-chosen-map-bg`/`.proto-confirm-advantage*`/`component.book.appointment.progress`/calendar-cell rules once grep showed live React producers for each (`BookStep1LocationScreen.tsx`, `BookStep3ConfirmationScreen.tsx`, `BookAppointmentProgress` kit, `BookStep2DateTimeScreen.tsx`) — applied: `src/styles/globals-screens.css` diff (114 lines removed, 3004→2891)
- Uma (UI/UX light — no browser MCP available this ship): static-only fidelity check — confirmed each surviving selector's live JSX producer by exact string grep (not by class-family assumption) before signing off; flagged that the "Legacy path only ⇒ safe to delete" heuristic from Phase B's own lesson is incomplete and appended a correcting lesson (2026-07-23, "dead JS ≠ dead CSS") so future sweeps don't over-delete — applied: LESSONS_LEARNED new entry; **live MCP re-prove of Book Step 1 chosen-location tile + Step 3 confirmation still owed** (flagged, not claimed)
- Quinn (QA): `npm test` 162/162 files (1008 tests) green, `npm run build` green, both re-run after the CSS diff; no MCP/browser transport available this session — visual re-prove of Book Step 1/2/3 is a named residual, not a false PROVEN — applied: this report's residual list
- Pax (PO sim): local-only ship (no commit per task instruction); no version bump — applied: leave tree uncommitted for PO review

**Knowledge improved** (2026-07-22 · stream: universal REC/playback interaction contract · local):
- Arch (Director): CJM/persona/route-order exceptions are forbidden; recordings are regression contracts over semantic page actions.
- Bea (BA): legacy-page ghost clicks are requirements failures, not forgivable playback gaps.
- Finn (FE): migrations preserve screen/action/modal/state identity; oversized links expose a visible-content aim point.
- Uma (UI/UX): cursor press must visually land on content and stateful controls must visibly change.
- Quinn (QA): selected no-ops, ghost targets, cursor misses, and unchanged state are red hard failures; contract drift requires explicit re-proof.
- Ben (BE): REC live state is one browser-runtime store across HMR; sessionStorage is recovery only.

---

## How to maintain

1. **Before serious work** — re-read your hat section + linked LESSONS; note what you will apply.  
2. **During ship** — apply the gate; do not re-discover.  
3. **After ship** — append LESSONS if new fail class; update this index “Recent deltas”; fill **Knowledge improved** sitrep; Arch confirms applied ≠ write-only.  
4. **After PAGE FINAL PASS HARD-GREEN** — Arch runs **Reflex** micro-retro → append Knowledge improved (see [TEAM.md](./TEAM.md) § Reflex).  
5. **New typical fail** — Arch/Ben add ratchet same ship ([PARITY_RATCHETS.md](./PARITY_RATCHETS.md)).

---

## Related

- [TEAM.md](./TEAM.md) · [COMMAND_DOCTRINE.md](./COMMAND_DOCTRINE.md) · [LESSONS_LEARNED.md](./LESSONS_LEARNED.md)  
- [docs/README.md](../README.md) catalog entry

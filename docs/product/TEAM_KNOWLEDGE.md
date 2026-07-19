# Team knowledge — living index

**Status:** Living — **read before serious work; append after ships.**  
**Owner:** Arch (Director) curates; every callsign feeds their section.  
**PO mandate (2026-07-19):** Build the database **and really use it** — not only write. Sitrep style: **“team knowledge improved.”**

**Hard rule:** Before serious work, each callsign **MUST re-read** their section below + relevant [LESSONS_LEARNED.md](./LESSONS_LEARNED.md) bullets for the surface. **Team check** must include a **`Knowledge used:`** one-liner per role (what they re-read). Arch **rejects “done”** if knowledge was only appended and not applied. Full process: [TEAM.md](./TEAM.md) § Knowledge use.

---

## Canonical corpus (links)

| Artifact | Path | Why |
|----------|------|-----|
| Lessons (append-only) | [LESSONS_LEARNED.md](./LESSONS_LEARNED.md) | Failure classes → gates |
| **Studio Auto-Rules** | [STUDIO_AUTO_RULES.md](./STUDIO_AUTO_RULES.md) | Recurring PO pain → CI/MCP gates (do not re-ask) |
| Uma fidelity checklist | [UMA_FIDELITY_NOTES.md](./UMA_FIDELITY_NOTES.md) | Make→React Nazi checklist |
| Parity ratchets | [PARITY_RATCHETS.md](./PARITY_RATCHETS.md) | Programmatic typical-miss contracts |
| Page final-pass | [PAGE_FINAL_PASS.md](./PAGE_FINAL_PASS.md) | Mandatory structure/naming before NEXT page |
| Team OS | [TEAM.md](./TEAM.md) | Callsigns, dispatch, team check |
| **Page Final Pass** | [PAGE_FINAL_PASS.md](./PAGE_FINAL_PASS.md) | Hard-green before next migrated page; Finn/Uma checklist + `check:page-final-pass` |
| Feature brief template | [FEATURE_BRIEF_TEMPLATE.md](./FEATURE_BRIEF_TEMPLATE.md) | Bea 1-pager |
| Boots feature briefs | [../projects/boots-pharmacy/features/](../projects/boots-pharmacy/features/) | Project briefs |
| PLP Make parity register | [../projects/boots-pharmacy/features/PLP_MAKE_PARITY_REGISTER.md](../projects/boots-pharmacy/features/PLP_MAKE_PARITY_REGISTER.md) | Band-by-band Make inventory |
| PLP React brief | [../projects/boots-pharmacy/features/PLP_REACT.md](../projects/boots-pharmacy/features/PLP_REACT.md) | PLP migration brief |
| **PLP team retro** | [TEAM_RETRO_2026-07-19_PLP.md](./TEAM_RETRO_2026-07-19_PLP.md) | Pain / Worked / Keep — apply on PDP+ |
| Studio URL (modal ids) | [../shell/URL.md](../shell/URL.md) | **Modal URL registry** before any dialog ship |
| Doctrine | [COMMAND_DOCTRINE.md](./COMMAND_DOCTRINE.md) | Locked tech + process |
| **Motion standard** | [MOTION.md](./MOTION.md) | `framer-motion` via `@/uxds/motion`; CSS for trivial + Accordion |
| Director rule | [../../.cursor/rules/ux-studio-director.mdc](../../.cursor/rules/ux-studio-director.mdc) | Always-on hard checklist |

---

## Per-hat knowledge (must re-read before serious work)

### Arch (Director)

| Must re-read | Focus |
|--------------|--------|
| This index + [TEAM.md](./TEAM.md) | Dispatch, team check, knowledge-use gate |
| [COMMAND_DOCTRINE.md](./COMMAND_DOCTRINE.md) §0 / §6–§7 | Parallel siblings, distrust handoffs, Nazi QA |
| [PAGE_FINAL_PASS.md](./PAGE_FINAL_PASS.md) | No next migrated page until previous hard-green |
| [TEAM_RETRO_2026-07-19_PLP.md](./TEAM_RETRO_2026-07-19_PLP.md) | After HARD-GREEN: micro-retro → this index (Reflex) |
| [LESSONS_LEARNED.md](./LESSONS_LEARNED.md) (latest + surface) | Reject “done” without applied lessons |
| [NEXT_STEPS.md](./NEXT_STEPS.md) · [PRODUCT_FORECAST.md](./PRODUCT_FORECAST.md) | Board / forecast |
| [PARITY_RATCHETS.md](./PARITY_RATCHETS.md) | New typical fail → ratchet same ship |

**Knowledge used tip:** doctrine §0.1 + PAGE_FINAL_PASS sequencing + latest LESSONS for the stream + this Arch section.

### Bea (BA)

| Must re-read | Focus |
|--------------|--------|
| [FEATURE_BRIEF_TEMPLATE.md](./FEATURE_BRIEF_TEMPLATE.md) | Readiness of acceptance |
| Project `features/*.md` + **Make register** for the screen | Every Make band **before** Finn codes (incl. loader mechanism) |
| [PAGE_FINAL_PASS.md](./PAGE_FINAL_PASS.md) | No next-page brief until previous hard-green |
| [UMA_FIDELITY_NOTES.md](./UMA_FIDELITY_NOTES.md) §0 | Loading/empty/updating = P0 rows when Make has them |
| LESSONS: Make→React fidelity, wrong preloader · PLP retro | Register completeness; no invent acceptance |

**Knowledge used tip:** brief/register + PAGE_FINAL_PASS gate + LESSONS loading/P0 rows.

### Finn (FE)

| Must re-read | Focus |
|--------------|--------|
| [PAGE_BUILD_CONTRACT.md](./PAGE_BUILD_CONTRACT.md) · [FE_STANDARDS.md](./FE_STANDARDS.md) · [MOTION.md](./MOTION.md) | React + UXDS, column, nowrap; Motion via `@/uxds/motion` |
| [DS_STRICTNESS.md](./DS_STRICTNESS.md) · [CSS_BASE_THEME.md](./CSS_BASE_THEME.md) | No near-dups; BASE→THEME→PANEL→LEGACY |
| [NAMING.md](./NAMING.md) · [ARCHITECTURE.md](./ARCHITECTURE.md) | `data-studio-*`, domain folders |
| [PAGE_FINAL_PASS.md](./PAGE_FINAL_PASS.md) | Co-own checklist + `check:page-final-pass` with Uma; no next mount until previous hard-green |
| LESSONS: hybrid mount, createRoot unmount, search/icon, DS hover · invent chrome | Do not re-ship known fail classes; under-match Make |
| Screen brief + register for the page | Mount gates / Make-retired |
| [../shell/URL.md](../shell/URL.md) + modal guard | **Modal URL registry** + `data-studio-modal` before any dialog ship |

**Knowledge used tip:** FE standards + PAGE_FINAL_PASS + LESSONS for the control class being touched + URL modal table when shipping dialogs.

### Uma (UI/UX)

| Must re-read | Focus |
|--------------|--------|
| [UMA_FIDELITY_NOTES.md](./UMA_FIDELITY_NOTES.md) | Full fidelity + state matrix |
| [PAGE_FINAL_PASS.md](./PAGE_FINAL_PASS.md) | Co-own Final Pass checklist + check with Finn; page-close hard-green |
| [VISUAL_FIDELITY.md](./VISUAL_FIDELITY.md) · [FE_UI_UX_AUDIT.md](./FE_UI_UX_AUDIT.md) | Audit gate |
| LESSONS: typical DS checks, invent-vs-Make, loading scenario | Nazi hover / no invent |
| Make register for the screen | Side-by-side bands |
| **§0b section vertical rhythm** — MCP measure gap/padding (price→recipient→body→booster) before any fidelity IN PROGRESS claim | [UMA_FIDELITY_NOTES.md](./UMA_FIDELITY_NOTES.md) §0b · doctrine |

**Knowledge used tip:** UMA notes §0/§0a/**§0b rhythm** + PAGE_FINAL_PASS + LESSONS DS hover / loading.

### Quinn (QA)

| Must re-read | Focus |
|--------------|--------|
| [../shell/RECORDING.md](../shell/RECORDING.md) — MCP / overlay / page probe | `__studioRunMcpPageProbe`, sitrep, stay-on-page |
| LESSONS: overlay eyes, MCP matrix, **scroll-into-view**, **overlay visible every probe**, false PROVEN, **fixed localhost / reuse tab** | Prove fail classes |
| [PARITY_RATCHETS.md](./PARITY_RATCHETS.md) · `check:parity-proven` | Gate honesty — no PROVEN without MCP log |
| [VERSIONING.md](./VERSIONING.md) DoD when bump | Chip = package.json |
| [../shell/URL.md](../shell/URL.md) modal ids + **canonical `localhost:5173`** | Prove deep-link / overlay registry; never invent ports |
| [STUDIO_AUTO_RULES.md](./STUDIO_AUTO_RULES.md) R11 | `list_pages` → reuse tab; `new_page` only if empty |

**Knowledge used tip:** RECORDING MCP section + LESSONS overlay/scroll + fixed-localhost-reuse-tab.

### Ben (BE)

| Must re-read | Focus |
|--------------|--------|
| [VERSIONING.md](./VERSIONING.md) · [CI_ACTIONS_BUDGET.md](./CI_ACTIONS_BUDGET.md) §5 | Bump DoD + `gh` sitrep |
| [PARITY_RATCHETS.md](./PARITY_RATCHETS.md) · felonies in doctrine §4 | Keep gates honest |
| LESSONS: version chip, post-push sitrep, overlay hygiene, **fixed localhost** | BE + Quinn session hygiene; one Vite on `:5173` |
| `PARITY_PROVEN.json` · `PAGE_FINAL_PASS.json` ownership | No chat-only PROVEN / final-pass |
| [../shell/URL.md](../shell/URL.md) + `check:felonies` overlay registry | **Modal URL registry mandatory** same PR as dialog ship |
| [STUDIO_AUTO_RULES.md](./STUDIO_AUTO_RULES.md) R11 · `vite.config.ts` | `port`/`strictPort` felony; smoke URL default |

**Knowledge used tip:** VERSIONING DoD + CI sitrep + fixed-localhost-reuse-tab + modal URL table.

### Pax (PO sim)

| Must re-read | Focus |
|--------------|--------|
| [PRODUCT_OWNER_BRIEF.md](./PRODUCT_OWNER_BRIEF.md) §K | Decisions log |
| [TEAM.md](./TEAM.md) Pax owns | Bump / notes / push call |
| [NEXT_STEPS.md](./NEXT_STEPS.md) | What human PO can `+` / `ok` |
| LESSONS that changed product bar (fidelity zero-tolerance) | Accept only when gates match PO rage list |

**Knowledge used tip:** brief §K + board NOW + latest PO-rage LESSONS.

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

**Minimum after a ship:** at least the roles that worked the stream fill a line. Empty “n/a” only if the role was truly out of scope. Arch rejects a close-out that only says “appended LESSONS” with no **applied** proof.

---

## Recent knowledge deltas (index — details in LESSONS)

### 2026-07-19

| Delta | Hats | LESSONS / artifact |
|-------|------|--------------------|
| **Fixed localhost + reuse tab** — canonical `http://localhost:5173/`; Vite `strictPort`; one `npm run dev`; Chrome MCP `list_pages`→reuse (`new_page` only if empty); Auto-Rule R11 + felony | Arch, Finn, Ben, Quinn | [STUDIO_AUTO_RULES.md](./STUDIO_AUTO_RULES.md) R11 · `vite.config.ts` · LESSONS |
| **Platform Motion standard** — `framer-motion` via `@/uxds/motion`; remove unused `motion` twin; Accordion stays CSS `0fr/1fr`; shell pilots: diagnostic overlay + studio select; PDP Final Pass not demoted (shell-only) | Arch, Finn, Uma, Ben, Pax | [MOTION.md](./MOTION.md) · `src/uxds/motion/` |
| **Robo-cursor travel** — Motion `animate` ease-in-out only (no back/overshoot/bounce); cancel via `.stop()` on forceClear; hang caps retained | Finn, Arch, Quinn | [MOTION.md](./MOTION.md) · `demoCursor.ts` · LESSONS bounce gate |
| **PDP PAGE FINAL PASS** — **HARD-GREEN** @ `57775a3` / v0.0.36 (Quinn 23/23 re-prove after playback panel + cursor lock · Uma §0a @ `76e2433`; prior stamp `48f2016` demoted NEEDS-REPROVE then restored) | Arch, Finn, Uma, Quinn, Ben, Pax | PAGE_FINAL_PASS.json · FE_AUDIT_PDP_MCP · FE_AUDIT_PDP_PAGE_FINAL_PASS · check:page-final-pass |
| **PDP Motion travel re-prove** — Quinn MCP **PASS** 23/23 @ `7c7c9e1` / v0.0.32; teardown clean; Uma §0a still PROVEN @ `76e2433` | Quinn, Arch, Finn, Uma | FE_AUDIT_PDP_MCP · PAGE_FINAL_PASS mcpFinalPass HARD-GREEN |
| **PDP hang-guard re-prove** — Quinn MCP **PASS** 23/23 @ `7bce2b3` / v0.0.31 (superseded MCP stamp by `7c7c9e1`) | Quinn, Arch, Finn, Uma | FE_AUDIT_PDP_MCP · PAGE_FINAL_PASS mcpFinalPass PASS |
| **PDP FAQ 6/6 + Accordion motion + TertiaryCta soft** — Uma §0a PROVEN + Quinn MCP **PASS** 23/23 @ `76e2433` / v0.0.30 (superseded MCP stamp by `7bce2b3`) | Uma, Quinn, Arch, Finn | UMA_FIDELITY_PDP · FE_AUDIT_PDP_MCP · PAGE_FINAL_PASS mcpFinalPass PASS · DEV-20260719-tertiary-soft |
| **PDP FAQ/CTA/focus polish (PO)** — Make-sourced FAQ bodies 3/6; download tertiary unify (no leaflet stub); accordion focus-none; v0.0.28 | Bea, Uma, Finn, Quinn, Arch | PDP_MAKE_PARITY_REGISTER · UMA_FIDELITY_PDP · PAGE_FINAL_PASS.json |
| **PDP RTB vertical rhythm** — LEGACY Make `module.pdp.rtb > div > div` stole React column gap (48≠32) + forced title-block 1:1; Uma must MCP-measure section gaps before fidelity IN PROGRESS; Quinn PASS ≠ rhythm done | Uma, Finn, Arch | UMA_FIDELITY_NOTES §0b · UMA_FIDELITY_PDP · globals-screens `:not(.pdp__rtb-card)` |
| **PDP kickoff** — Bea register before code; Finn L1–L13 mount; Uma fidelity IN PROGRESS; Quinn probe criteria prep (no false PROVEN); accordion B1 static | Arch, Bea, Finn, Uma, Quinn, Ben | [PDP_MAKE_PARITY_REGISTER.md](../projects/boots-pharmacy/features/PDP_MAKE_PARITY_REGISTER.md) · screens/pdp |
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
- Uma (UI/UX): PO hard-fail RTB cramped stack — root cause Make LEGACY `module.pdp.rtb > div > div` hitting React; MCP-measured 32px gaps restored; **§0a / PROVEN not stamped** — applied: pdp.css + globals-screens `:not(.pdp__rtb-card)` + UMA_FIDELITY_PDP §0b checklist
- Finn (FE): title-block content-sized + host belt `gap: 32px !important` — applied: screens/pdp/pdp.css
- Arch (Director): ratchet — section vertical rhythm mandatory before fidelity IN PROGRESS; Quinn PASS ≠ rhythm — applied: COMMAND_DOCTRINE + UMA_FIDELITY_NOTES §0b + TEAM_KNOWLEDGE
- Quinn (QA): functional MCP PASS stands; does not waive §0b/§0a — applied: residual note on stamp

**Knowledge improved** (2026-07-19 · stream: PDP React kickoff scaffold · v0.0.21):
- Arch (Director): parallel Bea→Finn/Uma/Ben after PLP HARD-GREEN + PO `+`; register-before-code enforced — applied: dispatch + board
- Bea (BA): full PDP Make inventory incl. LE N/A + accordion B1 — applied: PDP_MAKE_PARITY_REGISTER.md
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
- Finn (FE): under-match Make; modal URL registry + `data-studio-modal` before dialog ship; ratchet same ship — applied: Finn must-re-read + URL.md link
- Uma (UI/UX): no invent; typical DS checks vs kit+Make before PROVEN — applied: retro Keep (Uma)
- Quinn (QA): PROVEN requires MCP probe evidence; overlay/scroll/eyes hard FAIL — applied: Quinn must-re-read
- Ben (BE): modal URL table + overlay felonies same PR as dialog; no chat-only PROVEN — applied: Ben must-re-read
- Pax (PO sim): accept bar = Make + MCP + Final Pass hard-green; notes/push without bump for docs/reflex — applied: retro Keep (Pax)

**Process deltas (actionable — from retro):**
1. **Modal URL registry mandatory** — before any blocking dialog ships: add `modal` id to [URL.md](../shell/URL.md), register in `STUDIO_MODAL` / `REGISTERED_OVERLAY_MODAL_IDS`, stamp `data-studio-modal` — same change as the dialog. Ben/Finn own; Quinn proves deep-link + overlay-eyes.
2. **Make register before code** — Bea completes every band (incl. loading/empty/updating mechanism) before Finn implements; unchecked P0 = team-check FAIL.
3. **No invent / DS hover** — Uma signs typical DS checks; Quinn MCP-hovers ≥1 SearchField; invent chrome = FAIL.
4. **False PROVEN ban** — Arch rejects PROVEN without MCP evidence log; PO dispute revokes until re-prove.
5. **Reflex** — after each PAGE FINAL PASS HARD-GREEN, Arch runs micro-retro (Pain/Worked/Keep lean) and appends **Knowledge improved** here before opening the next migrated page.

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

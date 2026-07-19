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
| [PAGE_BUILD_CONTRACT.md](./PAGE_BUILD_CONTRACT.md) · [FE_STANDARDS.md](./FE_STANDARDS.md) | React + UXDS, column, nowrap |
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

**Knowledge used tip:** UMA notes §0/§0a + PAGE_FINAL_PASS + LESSONS DS hover / loading.

### Quinn (QA)

| Must re-read | Focus |
|--------------|--------|
| [../shell/RECORDING.md](../shell/RECORDING.md) — MCP / overlay / page probe | `__studioRunMcpPageProbe`, sitrep, stay-on-page |
| LESSONS: overlay eyes, MCP matrix, **scroll-into-view**, **overlay visible every probe**, false PROVEN | Prove fail classes |
| [PARITY_RATCHETS.md](./PARITY_RATCHETS.md) · `check:parity-proven` | Gate honesty — no PROVEN without MCP log |
| [VERSIONING.md](./VERSIONING.md) DoD when bump | Chip = package.json |
| [../shell/URL.md](../shell/URL.md) modal ids | Prove deep-link / overlay registry for every new dialog |

**Knowledge used tip:** RECORDING MCP section + LESSONS overlay/scroll probe rules.

### Ben (BE)

| Must re-read | Focus |
|--------------|--------|
| [VERSIONING.md](./VERSIONING.md) · [CI_ACTIONS_BUDGET.md](./CI_ACTIONS_BUDGET.md) §5 | Bump DoD + `gh` sitrep |
| [PARITY_RATCHETS.md](./PARITY_RATCHETS.md) · felonies in doctrine §4 | Keep gates honest |
| LESSONS: version chip, post-push sitrep, overlay hygiene | BE + Quinn session hygiene |
| `PARITY_PROVEN.json` · `PAGE_FINAL_PASS.json` ownership | No chat-only PROVEN / final-pass |
| [../shell/URL.md](../shell/URL.md) + `check:felonies` overlay registry | **Modal URL registry mandatory** same PR as dialog ship |

**Knowledge used tip:** VERSIONING DoD + CI sitrep lesson + ratchet/final-pass add path + modal URL table.

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
| **PDP kickoff** — Bea register before code; Finn L1–L13 mount; Uma fidelity IN PROGRESS; Quinn probe criteria prep (no false PROVEN); accordion B1 static | Arch, Bea, Finn, Uma, Quinn, Ben | [PDP_MAKE_PARITY_REGISTER.md](../projects/boots-pharmacy/features/PDP_MAKE_PARITY_REGISTER.md) · screens/pdp |
| **PAGE FINAL PASS** — no new migrated page until previous hard-green; Finn/Uma checklist + check; parallel callsigns + Knowledge used still required | Arch, Finn, Uma, Bea | [PAGE_FINAL_PASS.md](./PAGE_FINAL_PASS.md) · TEAM · doctrine · NEXT_STEPS |
| Typical DS checks mandatory before PROVEN; missing DS hover = FAIL | Uma, Quinn, Arch | LESSONS · UMA notes · ratchet search-field-states |
| Filter search parity (icon end, single clear, View all, counters) | Finn, Uma, Bea, Quinn | LESSONS · PARITY_RATCHETS · PLP register |
| Overlay eyes — no click-through open dialogs | Quinn, Ben, Finn | LESSONS · `studioModalGuard` · felonies |
| Modal URL sync — every popup must set `&modal=` (QV + Choose Pharmacy + Login + pickers) | Finn, Ben, Quinn | LESSONS · URL.md · `studioModalRegistry` · ratchet **modal-url-sync** |
| MCP page probe: **scroll-into-view** before interact; **overlay must be visible on every probe** — FAIL if absent | Quinn, Finn, Ben | LESSONS 2026-07-19 (MCP probe visibility) |
| Agent overlay: **pre-arm** before steps; sitrep **PASS/FAIL** green/red; **forceClear** hard-remove (no stale popup) | Uma, Finn, Quinn | RECORDING.md · LESSONS · `agentTestingOverlay` |
| Team knowledge database + mandatory use | Arch, all | This file · TEAM.md § Knowledge use |
| Page final-pass gate before NEXT screen; landmarks + BEM stamp | Finn, Uma, Ben, Arch | PAGE_FINAL_PASS.md · check:page-final-pass |

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

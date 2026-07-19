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
| Team OS | [TEAM.md](./TEAM.md) | Callsigns, dispatch, team check |
| Feature brief template | [FEATURE_BRIEF_TEMPLATE.md](./FEATURE_BRIEF_TEMPLATE.md) | Bea 1-pager |
| Boots feature briefs | [../projects/boots-pharmacy/features/](../projects/boots-pharmacy/features/) | Project briefs |
| PLP Make parity register | [../projects/boots-pharmacy/features/PLP_MAKE_PARITY_REGISTER.md](../projects/boots-pharmacy/features/PLP_MAKE_PARITY_REGISTER.md) | Band-by-band Make inventory |
| PLP React brief | [../projects/boots-pharmacy/features/PLP_REACT.md](../projects/boots-pharmacy/features/PLP_REACT.md) | PLP migration brief |
| Doctrine | [COMMAND_DOCTRINE.md](./COMMAND_DOCTRINE.md) | Locked tech + process |
| Director rule | [../../.cursor/rules/ux-studio-director.mdc](../../.cursor/rules/ux-studio-director.mdc) | Always-on hard checklist |

---

## Per-hat knowledge (must re-read before serious work)

### Arch (Director)

| Must re-read | Focus |
|--------------|--------|
| This index + [TEAM.md](./TEAM.md) | Dispatch, team check, knowledge-use gate |
| [COMMAND_DOCTRINE.md](./COMMAND_DOCTRINE.md) §0 / §6–§7 | Parallel siblings, distrust handoffs, Nazi QA |
| [LESSONS_LEARNED.md](./LESSONS_LEARNED.md) (latest + surface) | Reject “done” without applied lessons |
| [NEXT_STEPS.md](./NEXT_STEPS.md) · [PRODUCT_FORECAST.md](./PRODUCT_FORECAST.md) | Board / forecast |
| [PARITY_RATCHETS.md](./PARITY_RATCHETS.md) | New typical fail → ratchet same ship |

**Knowledge used tip:** doctrine §0.1 + latest LESSONS for the stream + this Arch section.

### Bea (BA)

| Must re-read | Focus |
|--------------|--------|
| [FEATURE_BRIEF_TEMPLATE.md](./FEATURE_BRIEF_TEMPLATE.md) | Readiness of acceptance |
| Project `features/*.md` + **PLP register** when PLP | Every Make band before Finn codes |
| [UMA_FIDELITY_NOTES.md](./UMA_FIDELITY_NOTES.md) §0 | Loading/empty/updating = P0 rows when Make has them |
| LESSONS: Make→React fidelity, wrong preloader | Register completeness |

**Knowledge used tip:** brief/register + LESSONS loading/P0 rows.

### Finn (FE)

| Must re-read | Focus |
|--------------|--------|
| [PAGE_BUILD_CONTRACT.md](./PAGE_BUILD_CONTRACT.md) · [FE_STANDARDS.md](./FE_STANDARDS.md) | React + UXDS, column, nowrap |
| [DS_STRICTNESS.md](./DS_STRICTNESS.md) · [CSS_BASE_THEME.md](./CSS_BASE_THEME.md) | No near-dups; BASE→THEME→PANEL→LEGACY |
| [NAMING.md](./NAMING.md) · [ARCHITECTURE.md](./ARCHITECTURE.md) | `data-studio-*`, domain folders |
| LESSONS: hybrid mount, createRoot unmount, search/icon, DS hover | Do not re-ship known fail classes |
| Screen brief + register for the page | Mount gates / Make-retired |

**Knowledge used tip:** FE standards + LESSONS for the control class being touched.

### Uma (UI/UX)

| Must re-read | Focus |
|--------------|--------|
| [UMA_FIDELITY_NOTES.md](./UMA_FIDELITY_NOTES.md) | Full fidelity + state matrix |
| [VISUAL_FIDELITY.md](./VISUAL_FIDELITY.md) · [FE_UI_UX_AUDIT.md](./FE_UI_UX_AUDIT.md) | Audit gate |
| LESSONS: typical DS checks, invent-vs-Make, loading scenario | Nazi hover / no invent |
| Make register for the screen | Side-by-side bands |

**Knowledge used tip:** UMA notes §0/§0a + LESSONS DS hover / loading.

### Quinn (QA)

| Must re-read | Focus |
|--------------|--------|
| [../shell/RECORDING.md](../shell/RECORDING.md) — MCP / overlay / page probe | `__studioRunMcpPageProbe`, sitrep, stay-on-page |
| LESSONS: overlay eyes, MCP matrix, **scroll-into-view**, **overlay visible every probe** | Prove fail classes |
| [PARITY_RATCHETS.md](./PARITY_RATCHETS.md) · `check:parity-proven` | Gate honesty |
| [VERSIONING.md](./VERSIONING.md) DoD when bump | Chip = package.json |

**Knowledge used tip:** RECORDING MCP section + LESSONS overlay/scroll probe rules.

### Ben (BE)

| Must re-read | Focus |
|--------------|--------|
| [VERSIONING.md](./VERSIONING.md) · [CI_ACTIONS_BUDGET.md](./CI_ACTIONS_BUDGET.md) §5 | Bump DoD + `gh` sitrep |
| [PARITY_RATCHETS.md](./PARITY_RATCHETS.md) · felonies in doctrine §4 | Keep gates honest |
| LESSONS: version chip, post-push sitrep, overlay hygiene | BE + Quinn session hygiene |
| `PARITY_PROVEN.json` ownership | No chat-only PROVEN |

**Knowledge used tip:** VERSIONING DoD + CI sitrep lesson + ratchet add path.

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
| Typical DS checks mandatory before PROVEN; missing DS hover = FAIL | Uma, Quinn, Arch | LESSONS · UMA notes · ratchet search-field-states |
| Filter search parity (icon end, single clear, View all, counters) | Finn, Uma, Bea, Quinn | LESSONS · PARITY_RATCHETS · PLP register |
| Overlay eyes — no click-through open dialogs | Quinn, Ben, Finn | LESSONS · `studioModalGuard` · felonies |
| MCP page probe: **scroll-into-view** before interact; **overlay must be visible on every probe** — FAIL if absent | Quinn, Finn, Ben | LESSONS 2026-07-19 (MCP probe visibility) |
| Team knowledge database + mandatory use | Arch, all | This file · TEAM.md § Knowledge use |

**Knowledge improved** (2026-07-19 · stream: MCP probe scroll + overlay · SHA a6a686e · v0.0.16):
- Finn (FE): `revealDemoTargetForAgent` + demo-click `scroll: true`; abandon settle without deferred reload; exclude `RunMcpPageProbe` from helper nest-arm — applied: code
- Quinn (QA): `overlay-arm` + `plp-below-fold-scroll` reveal step; overlay missing = FAIL every step — applied: probe recipe + RECORDING.md · MCP PLP prove PASS

---

## How to maintain

1. **Before serious work** — re-read your hat section + linked LESSONS; note what you will apply.  
2. **During ship** — apply the gate; do not re-discover.  
3. **After ship** — append LESSONS if new fail class; update this index “Recent deltas”; fill **Knowledge improved** sitrep; Arch confirms applied ≠ write-only.  
4. **New typical fail** — Arch/Ben add ratchet same ship ([PARITY_RATCHETS.md](./PARITY_RATCHETS.md)).

---

## Related

- [TEAM.md](./TEAM.md) · [COMMAND_DOCTRINE.md](./COMMAND_DOCTRINE.md) · [LESSONS_LEARNED.md](./LESSONS_LEARNED.md)  
- [docs/README.md](../README.md) catalog entry

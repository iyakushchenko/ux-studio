# UX Studio documentation catalog

**Canonical workspace (only):** `E:\UX\ux-studio`  
**GitHub:** https://github.com/iyakushchenko/ux-studio  
**Abandoned copy:** `C:\Users\iyaku\UXCJM-BootsHealth-VaccineConcept` and any nested `UXCJM-*` folders — do not edit.

## Roles (doctrine)

| Role | Who | Owns |
|------|-----|------|
| **Lean UX team** (Arch / Bea / Finn / Uma / Quinn / Ben / Pax) | Cursor agent | Tech direction, briefs, build, visual audit, prove, version mechanics, **Pax** bump/push call — see [product/TEAM.md](./product/TEAM.md) · [product/COMMAND_DOCTRINE.md](./product/COMMAND_DOCTRINE.md) §0–§2 |
| **Product Owner** | Human | Product intent, Figma/UXDS truth, accept/reject, explicit product veto — **does not re-argue** role/tech/gates; may override Pax |

Agents **do not** offer A/B/C tech menus. They decide, document, build, report. **Serious work = team process** (briefs + cross-checks). **Proactive forecasting** on every task is mandatory.

**Always-on Cursor rule:** [`.cursor/rules/ux-studio-director.mdc`](../.cursor/rules/ux-studio-director.mdc) · agent entry [AGENTS.md](../AGENTS.md)

**Parent / tech-director agents:** subagent handoffs are **BAD until proven** — verify chrome/modes/counters/panels/migrated pages before telling the PO it’s fine ([product/COMMAND_DOCTRINE.md](./product/COMMAND_DOCTRINE.md) §6). After UI-facing ships, spawn/run a **strict interface audit** until **PROVEN** ([product/FE_UI_UX_AUDIT.md](./product/FE_UI_UX_AUDIT.md); doctrine §7) — **cannot skip** for “tests passed”; store project FE audits in [projects/<id>/audits/](./projects/) (Boots: [projects/boots-pharmacy/audits/](./projects/boots-pharmacy/audits/); stubs index [product/audits/](./product/audits/)).

## Start here by audience

Choose one route. Large governance and evidence documents are references, not a single onboarding sequence.

| Audience | 10-minute route | Then use |
|----------|-----------------|----------|
| Product Owner / reviewer | [Vision](./product/UX_STUDIO_VISION.md) → [CX Conveyor — honest gap state](./product/CX_CONVEYOR.md) → [current board](./product/NEXT_STEPS.md) | [Product Owner brief](./product/PRODUCT_OWNER_BRIEF.md) for decisions and acceptance · **[Stakeholder readiness checklist](./product/STAKEHOLDER_READINESS.md)** — "can I demo this / is it a real product yet" |
| Contributor / engineer | [Developer workflow](./product/DEVELOPER_WORKFLOW.md) → [architecture](./product/ARCHITECTURE.md) | The workflow’s task table; [post-change checklist](./product/POST_CHANGE_CHECKLIST.md) before close |
| Page designer / auditor | [Page build contract](./product/PAGE_BUILD_CONTRACT.md) → [Page create inheritance](./product/PAGE_CREATE_INHERITANCE.md) → [strict audit](./product/FE_UI_UX_AUDIT.md) | [Uma fidelity](./product/UMA_FIDELITY_NOTES.md) and [Page Final Pass](./product/PAGE_FINAL_PASS.md) |
| QA / proof operator | [Proof router](./shell/PROOF_ROUTER.md) · [UXML commands](./shell/UXML_COMMANDS.md) (`uxml rec` / `play` / `play step` / `play step r`) | Open only the deep contract linked from the selected proof row |
| Agent team / coordinator | [Command doctrine](./product/COMMAND_DOCTRINE.md) → your [team knowledge](./product/TEAM_KNOWLEDGE.md) section | [Team process](./product/TEAM.md), relevant lessons, and current board |
| **Agent stuck / looping / don’t know** | **[Stuck router](./product/AGENT_STUCK_ROUTER.md)** → one dig | Named dig SSoT only — then [proof router](./shell/PROOF_ROUTER.md) |

### Route by change surface

| Change | Owning references |
|--------|-------------------|
| React page migration | [Page create inheritance](./product/PAGE_CREATE_INHERITANCE.md) · [Page build](./product/PAGE_BUILD_CONTRACT.md) · screen brief/register · [Page Final Pass](./product/PAGE_FINAL_PASS.md) |
| CSS / UXDS / visual UI | [CSS layers](./product/CSS_BASE_THEME.md) · [DS strictness](./product/DS_STRICTNESS.md) · [FE standards](./product/FE_STANDARDS.md) |
| URL / modal / shell | [URL](./shell/URL.md) · [shell](./shell/SHELL.md) |
| Page, Play, REC, chrome, or PO-signal proof | [Proof router](./shell/PROOF_ROUTER.md) · [UXML commands](./shell/UXML_COMMANDS.md) |
| Stuck / repetitive FAIL / unknown dig | [Stuck router](./product/AGENT_STUCK_ROUTER.md) |
| Release / push / CI | [Versioning](./product/VERSIONING.md) · [CI budget](./product/CI_ACTIONS_BUDGET.md) |

## Reference catalog

Read only the ownership group relevant to the task. Document authority, lifecycle, and supersession are defined in [DOC_GOVERNANCE.md](./product/DOC_GOVERNANCE.md).

### Governance and current truth

- [Command doctrine](./product/COMMAND_DOCTRINE.md) · [Team](./product/TEAM.md) · [Team knowledge](./product/TEAM_KNOWLEDGE.md) · [Auto-rules](./product/STUDIO_AUTO_RULES.md)
- [Current board](./product/NEXT_STEPS.md) · [Painpoints](./product/PAINPOINTS.md) · [Product forecast](./product/PRODUCT_FORECAST.md) · [Product Owner brief](./product/PRODUCT_OWNER_BRIEF.md)
- **[CX Conveyor](./product/CX_CONVEYOR.md)** — living, honest state of the "user story → built + wired + REC'd CJM" automation gap, staged build order, human-in-the-loop map · **[Codebase audit](./product/CODEBASE_AUDIT_2026-07-24.md)** — project-boundary leak risk (engine vs. Boots not yet separable) · **[Project contract](./product/PROJECT_CONTRACT.md)** — what a project supplies/gets, in plain terms (points at `types.ts`, not a copy of it)
- [Lessons](./product/LESSONS_LEARNED.md) · [PLP retro](./product/TEAM_RETRO_2026-07-19_PLP.md)

### Build, design, and acceptance

- [Developer workflow](./product/DEVELOPER_WORKFLOW.md) · [Architecture](./product/ARCHITECTURE.md) · [Naming](./product/NAMING.md) · [Hygiene](./product/HYGIENE.md)
- [Page build](./product/PAGE_BUILD_CONTRACT.md) · [Page create inheritance](./product/PAGE_CREATE_INHERITANCE.md) · [Page Final Pass](./product/PAGE_FINAL_PASS.md) · [Component library](./product/COMPONENT_LIBRARY.md)
- [CSS layers](./product/CSS_BASE_THEME.md) · [DS strictness](./product/DS_STRICTNESS.md) · [FE standards](./product/FE_STANDARDS.md) · [visual fidelity](./product/VISUAL_FIDELITY.md) · [interaction fidelity](./product/INTERACTION_FIDELITY.md)
- [Uma fidelity](./product/UMA_FIDELITY_NOTES.md) · [strict audit](./product/FE_UI_UX_AUDIT.md) · [parity ratchets](./product/PARITY_RATCHETS.md) · [post-change checklist](./product/POST_CHANGE_CHECKLIST.md)
- [Concept intake](./product/CONCEPT_INTAKE.md) · [project styleguide](./product/PROJECT_STYLEGUIDE.md) · [solution requirements](./product/SOLUTION_REQUIREMENTS.md)

### Shell, proof, release, and integrations

- [Proof router](./shell/PROOF_ROUTER.md) · [Shell](./shell/SHELL.md) · [URL](./shell/URL.md) · [Projects](./shell/PROJECTS.md) · [Playback](./shell/PLAYBACK.md) · [Recording](./shell/RECORDING.md)
- [CI budget](./product/CI_ACTIONS_BUDGET.md) · [Versioning](./product/VERSIONING.md)
- [UXDS inventory](./uxds/README.md) · [deviations](./uxds/DEVIATIONS.md) · [token bridge](./uxds/TOKEN_BRIDGE.md)
- [X-Suite integration](./product/X_SUITE_INTEGRATION.md) · [Boots project evidence](./projects/boots-pharmacy/) · [Chat rails](./projects/boots-pharmacy/features/CHAT_PAGE_RAILS.md)

Agent entry: [../AGENTS.md](../AGENTS.md)

## Hard-wired agent rules (outside `docs/`)

| Path | Purpose |
|------|---------|
| [../AGENTS.md](../AGENTS.md) | First bullets: Director composite + proactive + handoff + strict interface audit |
| [../.cursor/rules/ux-studio-director.mdc](../.cursor/rules/ux-studio-director.mdc) | Always-applied — hard checklist (blast-radius, XOR, strict interface audit, …) |
| [../.cursor/rules/naming.mdc](../.cursor/rules/naming.mdc) | New-file naming → [product/NAMING.md](./product/NAMING.md) |
| [../.cursor/rules/ci-sitrep.mdc](../.cursor/rules/ci-sitrep.mdc) | Post-push `gh run list` (BE hat) |
| [../.cursor/rules/post-change-checklist.mdc](../.cursor/rules/post-change-checklist.mdc) | Local gates before “done” |

## Doc ownership rule

Durable decisions (doctrine, workspace, stack, sequence) are written into `docs/` **the same turn** — never only in chat.

Document type, authority, lifecycle, `last_verified`, and supersession follow [product/DOC_GOVERNANCE.md](./product/DOC_GOVERNANCE.md). [product/NEXT_STEPS.md](./product/NEXT_STEPS.md) is the sole mutable current-status source.

**Layout:** engine doctrine → `docs/product/`; per-concept docs → `docs/projects/<project-id>/`; UXDS inventory → `docs/uxds/`; shell → `docs/shell/`.

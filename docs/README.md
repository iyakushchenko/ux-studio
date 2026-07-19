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

**Parent / tech-director agents:** subagent handoffs are **BAD until proven** — verify chrome/modes/counters/panels/migrated pages before telling the PO it’s fine ([product/COMMAND_DOCTRINE.md](./product/COMMAND_DOCTRINE.md) §6). After UI-facing ships, spawn/run a **strict (“Nazi QA”) FE audit** until **PROVEN** ([product/FE_UI_UX_AUDIT.md](./product/FE_UI_UX_AUDIT.md); doctrine §7) — **cannot skip** for “tests passed”; store project FE audits in [projects/<id>/audits/](./projects/) (Boots: [projects/boots-pharmacy/audits/](./projects/boots-pharmacy/audits/); stubs index [product/audits/](./product/audits/)).

## Start here (reading order)

1. [product/COMMAND_DOCTRINE.md](./product/COMMAND_DOCTRINE.md) — **composite role + proactive** + who decides + §6–§7 handoff + FE audit (read first every session)
1b. [product/TEAM.md](./product/TEAM.md) — lean UX team callsigns + serious-work process (Pax bump/push)
1c. [product/TEAM_KNOWLEDGE.md](./product/TEAM_KNOWLEDGE.md) — **living team knowledge index** (per-hat re-read; Knowledge used / Knowledge improved)
1c2. [product/STUDIO_AUTO_RULES.md](./product/STUDIO_AUTO_RULES.md) — **Auto-Rules / Auto-Gates** (dismiss/modal, auth SSoT, avail start, brand-active, §0b → CI)
1d. [product/PAGE_FINAL_PASS.md](./product/PAGE_FINAL_PASS.md) — **hard-green before next migrated page** (Finn/Uma checklist + check; Arch sequencing)
1e. [product/TEAM_RETRO_2026-07-19_PLP.md](./product/TEAM_RETRO_2026-07-19_PLP.md) — PLP team retro (Pain/Worked/Keep) · Reflex → knowledge
2. [product/LESSONS_LEARNED.md](./product/LESSONS_LEARNED.md) — progressive failure/win capture (read before UI close)
2b. [product/UMA_FIDELITY_NOTES.md](./product/UMA_FIDELITY_NOTES.md) — Uma Make→React fidelity checklist (mandatory before PROVEN)
2c. [product/PARITY_RATCHETS.md](./product/PARITY_RATCHETS.md) — programmatic typical-miss contracts (`check:parity-ratchets`)
3. [product/NAMING.md](./product/NAMING.md) — file/folder naming + domain CSS/attrs (no new `.proto-*`)
4. [product/ARCHITECTURE.md](./product/ARCHITECTURE.md) · [product/HYGIENE.md](./product/HYGIENE.md) — engine folder map + LOC ratchet
5. [product/POST_CHANGE_CHECKLIST.md](./product/POST_CHANGE_CHECKLIST.md) — local gates before “done”
6. [product/NEXT_STEPS.md](./product/NEXT_STEPS.md) — living NOW / NEXT / LATER board
7. [product/SOLUTION_REQUIREMENTS.md](./product/SOLUTION_REQUIREMENTS.md) — readiness + locked defaults (proceed checklist)
8. [product/PRODUCT_OWNER_BRIEF.md](./product/PRODUCT_OWNER_BRIEF.md) — A–Z for the Product Owner
9. [product/CONCEPT_INTAKE.md](./product/CONCEPT_INTAKE.md) — **messy concepts in → Studio pages out** (business logic)
10. [product/PROJECT_STYLEGUIDE.md](./product/PROJECT_STYLEGUIDE.md) — per-brand delta (colors, logos → theme.css remaps)
11. [product/CSS_BASE_THEME.md](./product/CSS_BASE_THEME.md) — **BASE → THEME → PANEL → LEGACY** (no CSS dump)
12. [product/DS_STRICTNESS.md](./product/DS_STRICTNESS.md) — **no near-duplicates;** UXDS + theme only; deviations registered; no React growth in LEGACY
13. [product/UX_STUDIO_VISION.md](./product/UX_STUDIO_VISION.md) — product north star
14. [product/PAGE_BUILD_CONTRACT.md](./product/PAGE_BUILD_CONTRACT.md) — React + UXDS
14b. [product/PAGE_FINAL_PASS.md](./product/PAGE_FINAL_PASS.md) — **mandatory final pass before NEXT page** (`check:page-final-pass`)
15. [product/COMPONENT_LIBRARY.md](./product/COMPONENT_LIBRARY.md) — migrated pages = real React kits; grow by migration
16. [product/VISUAL_FIDELITY.md](./product/VISUAL_FIDELITY.md) — **concept L&F mandatory**, no visual zoo, rebuild behavior parity
17. [product/INTERACTION_FIDELITY.md](./product/INTERACTION_FIDELITY.md) — **recording needs interactive pages** + shared behavior library
18. [product/FE_UI_UX_AUDIT.md](./product/FE_UI_UX_AUDIT.md) — **post-UI audit checklist** (PROVEN before PO; G5 AIR/REC + G6 REC⊗CJM)
19. [product/FE_STANDARDS.md](./product/FE_STANDARDS.md) — content column, CTA nowrap, **one text-link pattern**, layout hygiene
20. [product/CI_ACTIONS_BUDGET.md](./product/CI_ACTIONS_BUDGET.md) — slim Actions; smoke on-demand; post-push sitrep
21. [product/VERSIONING.md](./product/VERSIONING.md) — local semver + CHANGELOG (no Release CI yet)
22. [product/PRODUCT_FORECAST.md](./product/PRODUCT_FORECAST.md) — engine product map (URL, REC, UXDS, CI, overlay, X-Suite)
23. [uxds/README.md](./uxds/README.md) — UXDS Larkin inventory · [uxds/DEVIATIONS.md](./uxds/DEVIATIONS.md) · [uxds/TOKEN_BRIDGE.md](./uxds/TOKEN_BRIDGE.md)
24. [product/X_SUITE_INTEGRATION.md](./product/X_SUITE_INTEGRATION.md) — Summarizer / X-Suite → Studio seam
25. [projects/boots-pharmacy/](./projects/boots-pharmacy/) — Boots design deltas, pilots, FE audits
26. [shell/SHELL.md](./shell/SHELL.md) · [shell/URL.md](./shell/URL.md) · [shell/PROJECTS.md](./shell/PROJECTS.md) · [shell/PLAYBACK.md](./shell/PLAYBACK.md) · [shell/RECORDING.md](./shell/RECORDING.md)

Agent entry: [../AGENTS.md](../AGENTS.md)

## Hard-wired agent rules (outside `docs/`)

| Path | Purpose |
|------|---------|
| [../AGENTS.md](../AGENTS.md) | First bullets: Director composite + proactive + handoff + Nazi QA |
| [../.cursor/rules/ux-studio-director.mdc](../.cursor/rules/ux-studio-director.mdc) | Always-applied — hard checklist (blast-radius, XOR, Nazi QA, …) |
| [../.cursor/rules/naming.mdc](../.cursor/rules/naming.mdc) | New-file naming → [product/NAMING.md](./product/NAMING.md) |
| [../.cursor/rules/ci-sitrep.mdc](../.cursor/rules/ci-sitrep.mdc) | Post-push `gh run list` (BE hat) |
| [../.cursor/rules/post-change-checklist.mdc](../.cursor/rules/post-change-checklist.mdc) | Local gates before “done” |

## Doc ownership rule

Durable decisions (doctrine, workspace, stack, sequence) are written into `docs/` **the same turn** — never only in chat.

**Layout:** engine doctrine → `docs/product/`; per-concept docs → `docs/projects/<project-id>/`; UXDS inventory → `docs/uxds/`; shell → `docs/shell/`.

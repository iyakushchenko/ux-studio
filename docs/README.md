# UX Studio documentation catalog

**Canonical workspace (only):** `E:\UX\ux-studio`  
**GitHub:** https://github.com/iyakushchenko/ux-studio  
**Abandoned copy:** `C:\Users\iyaku\UXCJM-BootsHealth-VaccineConcept` and any nested `UXCJM-*` folders — do not edit.

## Roles (doctrine)

| Role | Who | Owns |
|------|-----|------|
| **Tech Director + Architect + BA + UX + FE/UI** | Cursor agent | **All** tech direction, next steps, architecture, implementation, proactive risk spotting — see [product/COMMAND_DOCTRINE.md](./product/COMMAND_DOCTRINE.md) §0–§2 |
| **Product Owner** | Human | Product intent, Figma/UXDS truth, accept/reject, explicit product veto — **does not re-argue** role/tech/gates |

Agents **do not** offer A/B/C tech menus. They decide, document, build, report. **Proactive forecasting** on every task is mandatory (layout drift, style zoo, CSS layers, bad handoffs, REC bugs, CI).

**Always-on Cursor rule:** [`.cursor/rules/ux-studio-director.mdc`](../.cursor/rules/ux-studio-director.mdc) · agent entry [AGENTS.md](../AGENTS.md)

**Parent / tech-director agents:** subagent handoffs are **BAD until proven** — verify chrome/modes/counters/panels/migrated pages before telling the PO it’s fine ([product/COMMAND_DOCTRINE.md](./product/COMMAND_DOCTRINE.md) §6). After UI-facing ships, spawn/run a **strict (“Nazi QA”) FE audit** until **PROVEN** ([product/FE_UI_UX_AUDIT.md](./product/FE_UI_UX_AUDIT.md); doctrine §7) — **cannot skip** for “tests passed”; store results in [product/audits/](./product/audits/).

## Start here (reading order)

1. [product/COMMAND_DOCTRINE.md](./product/COMMAND_DOCTRINE.md) — **composite role + proactive** + who decides + §6–§7 handoff + FE audit (read first every session)
2. [product/SOLUTION_REQUIREMENTS.md](./product/SOLUTION_REQUIREMENTS.md) — readiness + locked defaults (proceed checklist)
3. [product/PRODUCT_OWNER_BRIEF.md](./product/PRODUCT_OWNER_BRIEF.md) — A–Z for the Product Owner
4. [product/CONCEPT_INTAKE.md](./product/CONCEPT_INTAKE.md) — **messy concepts in → Studio pages out** (business logic)
5. [product/PROJECT_STYLEGUIDE.md](./product/PROJECT_STYLEGUIDE.md) — per-brand delta (colors, logos → theme.css remaps)
6. [product/CSS_BASE_THEME.md](./product/CSS_BASE_THEME.md) — **BASE → THEME → PANEL → LEGACY** (no CSS dump)
7. [product/DS_STRICTNESS.md](./product/DS_STRICTNESS.md) — **no near-duplicates;** UXDS + theme only; deviations registered; no React growth in LEGACY
8. [product/UX_STUDIO_VISION.md](./product/UX_STUDIO_VISION.md) — product north star
9. [product/PAGE_BUILD_CONTRACT.md](./product/PAGE_BUILD_CONTRACT.md) — React + UXDS
10. [product/COMPONENT_LIBRARY.md](./product/COMPONENT_LIBRARY.md) — migrated pages = real React kits; grow by migration
11. [product/VISUAL_FIDELITY.md](./product/VISUAL_FIDELITY.md) — **concept L&F mandatory**, no visual zoo, rebuild behavior parity
12. [product/INTERACTION_FIDELITY.md](./product/INTERACTION_FIDELITY.md) — **recording needs interactive pages** + shared behavior library
13. [product/FE_UI_UX_AUDIT.md](./product/FE_UI_UX_AUDIT.md) — **post-UI audit checklist** (PROVEN before PO; G5 AIR/REC + G6 REC⊗CJM)
14. [product/FE_STANDARDS.md](./product/FE_STANDARDS.md) — content column, CTA nowrap, **one text-link pattern**, layout hygiene
15. [product/CI_ACTIONS_BUDGET.md](./product/CI_ACTIONS_BUDGET.md) — slim Actions; smoke on-demand only
16. [product/VERSIONING.md](./product/VERSIONING.md) — local semver + CHANGELOG (no Release CI yet)
17. [product/POST_CHANGE_CHECKLIST.md](./product/POST_CHANGE_CHECKLIST.md) — local gates before calling work done
18. [product/NEXT_STEPS.md](./product/NEXT_STEPS.md) — living NOW / NEXT / LATER board
19. [uxds/README.md](./uxds/README.md) — UXDS Larkin inventory · [uxds/DEVIATIONS.md](./uxds/DEVIATIONS.md) · [uxds/TOKEN_BRIDGE.md](./uxds/TOKEN_BRIDGE.md)
20. [product/X_SUITE_INTEGRATION.md](./product/X_SUITE_INTEGRATION.md) — Summarizer / X-Suite → Studio seam
21. [shell/SHELL.md](./shell/SHELL.md) · [shell/PROJECTS.md](./shell/PROJECTS.md) · [shell/PLAYBACK.md](./shell/PLAYBACK.md) · [shell/RECORDING.md](./shell/RECORDING.md)

Agent entry: [../AGENTS.md](../AGENTS.md)

## Hard-wired agent rules (outside `docs/`)

| Path | Purpose |
|------|---------|
| [../AGENTS.md](../AGENTS.md) | First bullets: Director composite + proactive + handoff + Nazi QA |
| [../.cursor/rules/ux-studio-director.mdc](../.cursor/rules/ux-studio-director.mdc) | Always-applied Cursor rule — same mandate |

## Doc ownership rule

Durable decisions (doctrine, workspace, stack, sequence) are written into `docs/` **the same turn** — never only in chat.

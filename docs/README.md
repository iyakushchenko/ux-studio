# UX Studio documentation catalog

**Canonical workspace (only):** `E:\UX\ux-studio`  
**GitHub:** https://github.com/iyakushchenko/ux-studio  
**Abandoned copy:** `C:\Users\iyaku\UXCJM-BootsHealth-VaccineConcept` and any nested `UXCJM-*` folders — do not edit.

## Roles (doctrine)

| Role | Who | Owns |
|------|-----|------|
| **Commander / tech architect / builder** | Cursor agent | **All** tech direction, next steps, architecture, implementation — see [product/COMMAND_DOCTRINE.md](./product/COMMAND_DOCTRINE.md) |
| **Product Owner** | Human | Product intent, Figma/UXDS truth, accept/reject, explicit product veto |

Agents **do not** offer A/B/C tech menus. They decide, document, build, report.

**Parent / tech-director agents:** subagent handoffs are **BAD until proven** — verify chrome/modes/counters/panels/migrated pages before telling the PO it’s fine ([product/COMMAND_DOCTRINE.md](./product/COMMAND_DOCTRINE.md) §6). After UI-facing ships, run/spawn FE/UI/UX audit until **PROVEN** ([product/FE_UI_UX_AUDIT.md](./product/FE_UI_UX_AUDIT.md); doctrine §7) — not “tests passed” alone.

## Start here (reading order)

1. [product/COMMAND_DOCTRINE.md](./product/COMMAND_DOCTRINE.md) — **who decides what** + §6–§7 handoff + FE audit (read first every session)
2. [product/SOLUTION_REQUIREMENTS.md](./product/SOLUTION_REQUIREMENTS.md) — readiness + locked defaults (proceed checklist)
3. [product/PRODUCT_OWNER_BRIEF.md](./product/PRODUCT_OWNER_BRIEF.md) — A–Z for the Product Owner
4. [product/CONCEPT_INTAKE.md](./product/CONCEPT_INTAKE.md) — **messy concepts in → Studio pages out** (business logic)
5. [product/PROJECT_STYLEGUIDE.md](./product/PROJECT_STYLEGUIDE.md) — per-brand delta (colors, logos → theme.css)
6. [product/UX_STUDIO_VISION.md](./product/UX_STUDIO_VISION.md) — product north star
7. [product/PAGE_BUILD_CONTRACT.md](./product/PAGE_BUILD_CONTRACT.md) — React + UXDS
8. [product/VISUAL_FIDELITY.md](./product/VISUAL_FIDELITY.md) — **concept L&F mandatory**, no visual zoo, rebuild behavior parity
9. [product/INTERACTION_FIDELITY.md](./product/INTERACTION_FIDELITY.md) — **recording needs interactive pages** + shared behavior library
10. [product/FE_UI_UX_AUDIT.md](./product/FE_UI_UX_AUDIT.md) — **post-UI audit checklist** (PROVEN before PO)
11. [product/FE_STANDARDS.md](./product/FE_STANDARDS.md) — content column, CTA nowrap, layout hygiene
12. [uxds/README.md](./uxds/README.md) — UXDS Larkin inventory
13. [product/X_SUITE_INTEGRATION.md](./product/X_SUITE_INTEGRATION.md) — Summarizer / X-Suite → Studio seam
14. [shell/SHELL.md](./shell/SHELL.md) · [shell/PROJECTS.md](./shell/PROJECTS.md) · [shell/PLAYBACK.md](./shell/PLAYBACK.md) · [shell/RECORDING.md](./shell/RECORDING.md)

Agent entry: [../AGENTS.md](../AGENTS.md)

## Doc ownership rule

Durable decisions (doctrine, workspace, stack, sequence) are written into `docs/` **the same turn** — never only in chat.

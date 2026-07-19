# Agent & developer guide — UX Studio

**Canonical workspace:** `E:\UX\ux-studio` only.  
**Abandoned:** any `UXCJM-BootsHealth-VaccineConcept` folder.

**Command doctrine:** You are the **commander / tech architect / builder**. You decide **all** tech direction and next steps. Do **not** ask the Product Owner to pick among tech options. Ask them only for assets (e.g. UXDS link) or product accept/reject.  
→ [docs/product/COMMAND_DOCTRINE.md](docs/product/COMMAND_DOCTRINE.md)

**Handoff verification (parent / coordinator agents):** Treat subagent “done/success” as **BAD until proven**. Verify critical UX/logic (nav chrome, mode switches, counters, panel XOR, migrated page L&F/behavior) via the actual JSX/CSS gate or localhost before telling the PO it’s fine. Assume regressions and label collisions (e.g. duplicate STEPS). Subagents build; **you** own integration quality — reopen/fix handoffs that smell wrong.  
→ [docs/product/COMMAND_DOCTRINE.md](docs/product/COMMAND_DOCTRINE.md) §6

**FE / UI / UX audit (parent / master — mandatory after UI ships):** After any UI-facing subagent handoff, **spawn or perform** a rigorous FE/UI/UX audit ([docs/product/FE_UI_UX_AUDIT.md](docs/product/FE_UI_UX_AUDIT.md)) before telling the PO it’s good. Implementer success and “tests passed” alone are **insufficient** for visual work — treat as BAD until audit **PROVEN**. Cover visual fidelity, layout/max-width/alignment, no wrap on icon+text CTAs, hover/focus, behavior parity, control hierarchy/no zoo, nav chrome (mode XOR, counters), and regressions. Fill [docs/product/templates/FE_AUDIT_RESULT.md](docs/product/templates/FE_AUDIT_RESULT.md).  
→ [docs/product/COMMAND_DOCTRINE.md](docs/product/COMMAND_DOCTRINE.md) §7

Engine repo. **Boots Pharmacy** (`src/projects/boots-pharmacy/`) is the first reference project (test rabbit).

## Required reading (before big work)

1. [docs/product/COMMAND_DOCTRINE.md](docs/product/COMMAND_DOCTRINE.md) — who decides what  
2. [docs/product/SOLUTION_REQUIREMENTS.md](docs/product/SOLUTION_REQUIREMENTS.md) — readiness + locked defaults  
3. [docs/README.md](docs/README.md) — catalog  
4. [docs/product/PRODUCT_OWNER_BRIEF.md](docs/product/PRODUCT_OWNER_BRIEF.md) — PO A–Z + decisions log  
5. [docs/product/CONCEPT_INTAKE.md](docs/product/CONCEPT_INTAKE.md) — messy concepts in; agent fills UXDS gap  
6. [docs/product/PROJECT_STYLEGUIDE.md](docs/product/PROJECT_STYLEGUIDE.md) — brand delta → project theme.css  
7. [docs/product/PAGE_BUILD_CONTRACT.md](docs/product/PAGE_BUILD_CONTRACT.md) — React + UXDS  
8. [docs/product/FE_STANDARDS.md](docs/product/FE_STANDARDS.md) — icon+text nowrap, 1440/64/1312 logo grid, scoped CSS  
9. [docs/product/VISUAL_FIDELITY.md](docs/product/VISUAL_FIDELITY.md) — concept L&F, no visual zoo, behavior parity on rebuilds  
10. [docs/product/INTERACTION_FIDELITY.md](docs/product/INTERACTION_FIDELITY.md) — recording needs interactive pages + shared kits  
11. [docs/product/FE_UI_UX_AUDIT.md](docs/product/FE_UI_UX_AUDIT.md) — post-UI audit checklist (PROVEN before PO)  
12. [docs/uxds/README.md](docs/uxds/README.md) — UXDS Larkin (variables + components)  
13. [docs/product/X_SUITE_INTEGRATION.md](docs/product/X_SUITE_INTEGRATION.md) — future Summarizer → Studio seam  

## Quick start

```bash
npm install
npm run dev
npm test
npm run build
npm run smoke        # lean profile; PROTO_SMOKE_PROFILE=full for marathon
```

**GitHub Pages:** `https://iyakushchenko.github.io/ux-studio/`

## Repo map

| Area | Path | Purpose |
|------|------|---------|
| **Engine / shell** | `src/app/` | App, nav, orchestra, playback guards, recording |
| **Projects** | `src/projects/` | Per-concept packages (React + UXDS target) |
| **Boots (reference)** | `src/projects/boots-pharmacy/` | First rabbit — Make bootstrap today; UXDS React rebuild target |
| **Journey data** | `data/journeys/` | Exported `journey.json` bundles |
| **Product docs** | `docs/product/` | Vision, PO brief, page contract, UXDS access |
| **Tests** | `**/__tests__/` | Vitest |
| **Smoke** | `scripts/proto-playwright-smoke.mjs` | CI lean + optional full profile |

## MCP helpers (browser console)

```javascript
window.__protoRunMcpSanityCheck?.()           // safe default — no transport
window.__protoExportJourneyBundle?.()         // journey.json
window.__protoApplyJourneyBundle?.(json)      // runtime import
window.__protoStartRecording?.()              // recording session
```

Full transport smokes require `__protoRun*` helpers — use sparingly; prefer sanity + lean CI.

## CI

- **`ci.yml`** — unit tests, build, lean Playwright smoke
- **`deploy-pages.yml`** — GitHub Pages (`/ux-studio/` base path)

## Conventions

- Engine code in `src/app/` — project-agnostic
- Boots-specific DOM/scripts in `src/projects/boots-pharmacy/` only until React+UXDS rebuild
- Concept pages target: React + UXDS ([PAGE_BUILD_CONTRACT.md](docs/product/PAGE_BUILD_CONTRACT.md))
- FE standards — icon+text nowrap, 1440/64/1312 content column, scoped CSS ([FE_STANDARDS.md](docs/product/FE_STANDARDS.md))
- Visual fidelity + no zoo + rebuild behavior parity ([VISUAL_FIDELITY.md](docs/product/VISUAL_FIDELITY.md))
- Interaction fidelity before record — shared kits `src/uxds/interactions/` ([INTERACTION_FIDELITY.md](docs/product/INTERACTION_FIDELITY.md))
- After UI handoffs: FE/UI/UX audit PROVEN before PO ([FE_UI_UX_AUDIT.md](docs/product/FE_UI_UX_AUDIT.md)); not “tests passed” alone
- Minimize scope; match existing patterns; test playback changes
- Durable PO decisions → update `docs/product/PRODUCT_OWNER_BRIEF.md` decisions log

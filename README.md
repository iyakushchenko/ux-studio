# UX Studio

Engine for building clickable UX concepts, journey maps (CJMs), and recorded scenarios — with Cursor as the build partner.

**Canonical folder:** `E:\UX\ux-studio`  
**Live demo (Boots — first project):** https://iyakushchenko.github.io/ux-studio/

## What this repo is

| Layer | Path | Role |
|-------|------|------|
| **Engine** | `src/app/` | Studio shell, orchestra, playback, recording, MCP helpers |
| **Projects** | `src/projects/` | Concept packages — target stack: **React + UXDS** |
| **First project** | `src/projects/boots-pharmacy/` | Boots Health Vaccine CJM (test rabbit) |

Figma Make exports are bootstrap only. Real concept pages are rebuilt from **UXDS** into React projects.

## Quick start

```bash
npm install
npm run dev
npm test
npm run build
```

Lean CI smoke: `npm run smoke` (dev server on `:5173`).

## Docs (start here)

| Doc | For |
|-----|-----|
| [Command doctrine](docs/product/COMMAND_DOCTRINE.md) | Agent decides all tech direction & next steps |
| [docs/README.md](docs/README.md) | Catalog + reading order |
| [Product Owner brief (A–Z)](docs/product/PRODUCT_OWNER_BRIEF.md) | Non-technical product guidance |
| [Page build contract](docs/product/PAGE_BUILD_CONTRACT.md) | React + UXDS |
| [UXDS access](docs/product/UXDS_ACCESS.md) | What to share with the agent |
| [Vision](docs/product/UX_STUDIO_VISION.md) | North star |
| [Agent guide](AGENTS.md) | Engineers / agents |

## Adding a project

See [docs/shell/PROJECTS.md](docs/shell/PROJECTS.md) — register in `src/projects/registry.ts`, add personas + journeys under `src/projects/<id>/`.

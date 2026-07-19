# UX Studio

Engine for building clickable UX concepts, journey maps (CJMs), and recorded scenarios — with Cursor as the build partner.

**Live demo (Boots Pharmacy — first project):** https://iyakushchenko.github.io/ux-studio/

## What this repo is

| Layer | Path | Role |
|-------|------|------|
| **Engine** | `src/app/` | Studio shell, orchestra, playback, recording, MCP helpers |
| **Projects** | `src/projects/` | Concept packages (wire, personas, journeys, scripts) |
| **First project** | `src/projects/boots-pharmacy/` | Boots Health Vaccine CJM (agentic + traditional) |

Figma Make exports are bootstrap only. The engine rebuilds concepts from your design system into playable projects.

## Quick start

```bash
npm install
npm run dev
npm test
npm run build
```

Lean CI smoke: `npm run smoke` (dev server on `:5173`).

## Docs

- [Product vision](docs/product/UX_STUDIO_VISION.md)
- [Shell architecture](docs/shell/SHELL.md)
- [Playback](docs/shell/PLAYBACK.md)
- [Recording](docs/shell/RECORDING.md)
- [Agent guide](AGENTS.md)

## Adding a project

See [docs/shell/PROJECTS.md](docs/shell/PROJECTS.md) — register in `src/projects/registry.ts`, add personas + journeys under `src/projects/<id>/`.

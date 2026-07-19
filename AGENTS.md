# Agent & developer guide — UX Studio

Engine repo. **Boots Pharmacy** (`src/projects/boots-pharmacy/`) is the first reference project.

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
| **Projects** | `src/projects/` | Per-concept packages |
| **Boots (reference)** | `src/projects/boots-pharmacy/` | Wire, overlays, scripts, Sarah journeys |
| **Journey data** | `data/journeys/` | Exported `journey.json` bundles |
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

See [docs/shell/RECORDING.md](docs/shell/RECORDING.md) and [docs/product/UX_STUDIO_VISION.md](docs/product/UX_STUDIO_VISION.md).

## CI

- **`ci.yml`** — unit tests, build, lean Playwright smoke
- **`deploy-pages.yml`** — GitHub Pages (`/ux-studio/` base path)

## Conventions

- Engine code in `src/app/` — project-agnostic
- Boots-specific DOM/scripts in `src/projects/boots-pharmacy/` only
- Minimize scope; match existing patterns; test playback changes

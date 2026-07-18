# Agent & developer guide

Quick orientation for humans and coding agents working on this Proto Studio (Boots Health Vaccine CJM concept).

## Quick start

```bash
npm install
npm run dev          # Vite — note the port in terminal output
npm test             # 207 unit tests (vitest)
npm run build
npm run smoke        # Playwright — dev server must be running on PROTO_SMOKE_URL (default :5173)
```

**GitHub Pages:** `https://iyakushchenko.github.io/UXCJM-BootsHealth-VaccineConcept/`

## Repo map

| Area | Path | Purpose |
|------|------|---------|
| Studio shell | `src/app/` | App, nav, orchestra (journey engine), playback guards |
| Boots project | `src/projects/boots-pharmacy/` | Wire DOM, overlays, playback scripts, personas |
| Journey beats | `personas/sarah-jenkins/journeys.ts` | Agentic + Traditional CJM timelines |
| Tests | `**/__tests__/` | Vitest — run before every playback change |
| Smoke | `scripts/proto-playwright-smoke.mjs` | CI + local browser smoke |
| Docs | `docs/shell/PLAYBACK.md` | Deep playback architecture |

## MCP helpers (browser console)

Always start automated checks with a clean studio:

```javascript
window.__protoEnsureCleanStudio?.()
window.__protoStudioState?.()
window.__protoSmokeRetreatChecks?.()
await window.__protoRunHomePlaySmoke?.()
await window.__protoRunRetreatSmoke?.()
```

Transport / mode:

```javascript
window.__protoSetOrchestraMode?.('agentic-cjm' | 'traditional-cjm')
window.__protoSetJourneyMode?.(true)
window.__protoTriggerTransport?.('play' | 'step-forward' | 'step-back' | 'jump-to-end')
```

**Never trust results** if `.proto-playback-diagnostic` is open — dismiss first.

Journey toggle in UI: `[role="switch"][aria-label="Journey mode"]` (not Orchestra mode).

## Changing playback safely

1. Edit beat in `journeys.ts` or runner in `playback/*.ts`.
2. `npm test`
3. `npm run smoke` (or MCP helpers above)
4. Do **not** change `useProtoJourneyPlayback.ts` unless transport behaviour must change.

See `docs/shell/PLAYBACK.md` for beat kinds, script IDs, and manual smoke checklist.

## CI

- **`.github/workflows/ci.yml`** — unit tests, build, Playwright smoke on push/PR
- **`.github/workflows/deploy-pages.yml`** — GitHub Pages on `main`

Smoke report artifact: `proto-smoke-report` (JSON in `scripts/playwright-out/`).

## Conventions

- **Agentic CJM** — home → chat → availability → book funnel
- **Retreat / step-back** — sync via `journeyRetreatSync.ts`, `availRetreatSync.ts`, `retreatSelectionGoal.ts`
- **Scenario frames** — chat stepping in `useProtoScenarioPlayback.ts`
- **Minimize scope** — match existing patterns; add tests for non-trivial playback logic

## Backlog (not blocking)

- Book step2 retreat in Playwright smoke (Sun 21 / Wed 24 / reserve)
- Traditional CJM full retreat matrix in smoke
- Chat visual thread vs counter edge cases on beat retreat
- Archive local `scripts/inspect-*.mjs` (gitignored; use smoke + MCP helpers instead)

## Multitask workflow (Cursor)

Use **Multitask Mode** for large audits: coordinator keeps backlog/CI/commits; background agent runs multi-file fixes and smoke loops. Checkpoint with commits before wide refactors.

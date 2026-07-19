# Studio URL scheme

Address-bar deep links for UX Studio. **Query params only** — works with Vite base `/` (localhost) and GitHub Pages `/ux-studio/` without SPA path rewrites.

## Canonical form

```
?project=<projectId>&screen=<screenId>
?project=boots-pharmacy&screen=book-step-2
?project=boots-pharmacy&screen=home&persona=sarah-jenkins&mode=agentic-cjm
```

| Param | Required | Values |
|-------|----------|--------|
| `project` | recommended | Registry id (`boots-pharmacy`, `puma`, …) |
| `screen` | recommended | Stable screen id (below) |
| `persona` | optional | Persona id within project |
| `mode` | optional | `agentic-cjm` \| `traditional-cjm` |

Examples (local / Pages):

- `http://localhost:5173/?project=boots-pharmacy&screen=book-step-2`
- `https://iyakushchenko.github.io/ux-studio/?project=boots-pharmacy&screen=book-step-1`

## Boots Pharmacy `screen` ids

| `screen` | Make child | Nav |
|----------|------------|-----|
| `hub` | (onboarding wiki) | Hub tab |
| `home` | 11 | Agentic Site Pilot Home |
| `chat` | 10 | Agentic chat |
| `plp` | 9 | Vaccinations PLP |
| `pdp` | 8 | Vaccine PDP |
| `book-step-1` | 7 | Book — Location |
| `book-step-2` | 4 | Book — Date & Time |
| `book-step-3` | 3 | Book — Confirmation |
| `appointment-history` | 2 | Appointment History |
| `appointment-details` | 1 | Appointment Details |

Aliases accepted on parse: `book-step2` → `book-step-2`, `onboarding` → `hub`, `agentic-home` → `home`.

## Behavior

1. **Boot** — URL wins over `sessionStorage` when `project` / `screen` / `persona` / `mode` present.
2. **Nav** — tab / hub changes `replaceState` the bar (no history spam).
3. **Refresh / deep link** — restores project + screen (Make child + React mount hosts).
4. **Back/forward** — `popstate` re-applies query.
5. **Ephemeral strip** — `proof`, `mcpDebug`, `agentTest`, `agentOverlay` removed on boot, overlay install, and overlay stop. Never re-written by studio sync.

Implementation: `src/app/shell/protoStudioUrl.ts` · `useProtoStudioUrlSync.ts`.

## Recording

While REC is live, screen transitions append `kind: "screen"` events (`screenId`, `projectId`, `studioUrl`). Snapshots also carry `screenId` + `studioUrl` for ordered page/URL replay context.

**Replay** restores those events through `applyStudioScreen` — the same helper used for refresh deep-link and `popstate`. See [RECORDING.md](./RECORDING.md).

## Agent note

Do **not** put verify leftovers in the bar (`?proof=unmount-race`). Use `__protoAgentTestingOverlay` — bottom-right panel only.

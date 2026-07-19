# Scripts

## Supported

| Script | Command | Purpose |
|--------|---------|---------|
| `playwright-smoke.mjs` | `npm run smoke` | Headless smoke: home play + retreat baselines (chat counter, avail June 25) |
| `smoke.mjs` | `node scripts/smoke.mjs` | Prints MCP helper cheat sheet for DevTools |
| `release-notes.mjs` | `npm run notes:*` | Append/list/preview/check `CHANGELOG.md` `## Current` |
| `release.mjs` | `npm run release:patch` etc. | Local semver bump + CHANGELOG promote (no GitHub Release CI) |
| `check-release-version-changelog-sync.mjs` | `npm run check:version` | `package.json` ↔ latest `## vX.Y.Z` |
| `check-parity-proven.mjs` | `npm run check:parity-proven` | React-migrated screens: PROVEN audit + MCP matrix (`PARITY_PROVEN.json`) |
| `check-page-final-pass.mjs` | `npm run check:page-final-pass` | Structure/naming final pass stamp + source contracts before NEXT page |
| `check-parity-ratchets.mjs` | `npm run check:parity-ratchets` | Make→React typical-miss contracts (search icon, bookmark copy, Advantage, loader dup, …) |
| `check-agent-felonies.mjs` | `npm run check:felonies` | proto filenames, PANEL `.proto-*`, channel, version chip, overlay eyes |
| `run-static-gates.mjs` | `npm run test:gates` | Parallel hard static gates (links…version) — used by `npm test` + CI `test` job |

Canonical smoke URL: `http://localhost:5173` (Vite `strictPort`). Override with `PROTO_SMOKE_URL` only for deliberate CI aliases (`http://127.0.0.1:5173`) — never invent other ports.

Output: `playwright-out/smoke-report.json` (gitignored).

## Deprecated (local only)

`inspect-*.mjs` files are one-off agent debugging scripts. They are **gitignored** — do not commit. Use `npm run smoke` and `window.__studio*` MCP helpers (`__proto*` aliases still work).

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
| `check-parity-ratchets.mjs` | `npm run check:parity-ratchets` | Make→React typical-miss contracts (search icon, bookmark copy, Advantage, loader dup, …) |
| `check-agent-felonies.mjs` | `npm run check:felonies` | proto filenames, PANEL `.proto-*`, channel, version chip, overlay eyes |

Set `PROTO_SMOKE_URL` if dev server is not on `http://localhost:5173`.

Output: `playwright-out/smoke-report.json` (gitignored).

## Deprecated (local only)

`inspect-*.mjs` files are one-off agent debugging scripts. They are **gitignored** — do not commit. Use `npm run smoke` and `window.__studio*` MCP helpers (`__proto*` aliases still work).

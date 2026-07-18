# Scripts

## Supported

| Script | Command | Purpose |
|--------|---------|---------|
| `proto-playwright-smoke.mjs` | `npm run smoke` | Headless smoke: home play + retreat baselines (chat counter, avail June 25) |
| `proto-smoke.mjs` | `node scripts/proto-smoke.mjs` | Prints MCP helper cheat sheet for DevTools |

Set `PROTO_SMOKE_URL` if dev server is not on `http://localhost:5173`.

Output: `playwright-out/proto-smoke-report.json` (gitignored).

## Deprecated (local only)

`inspect-*.mjs` files are one-off agent debugging scripts. They are **gitignored** — do not commit. Use `npm run smoke` and `window.__proto*` MCP helpers instead.

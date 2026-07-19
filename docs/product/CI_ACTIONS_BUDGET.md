# CI / GitHub Actions budget

**Status:** Locked lean policy (2026-07-19)  
**Inspired by:** Summarizer maintainer practice — Actions minutes are scarce; local gates + lean jobs first.  
**Workflows:** `.github/workflows/ci.yml` · `.github/workflows/deploy-pages.yml`

---

## 1. Policy (blunt)

| Do | Do not |
|----|--------|
| Unit tests + build + **lean** Playwright smoke on PR/push | Marathon / full smoke (`PROTO_SMOKE_PROFILE=full`) on every push |
| Cheap static checks in `npm test` (e.g. `check:links`) | Extra workflows that only re-run the same gate |
| One CI workflow + Pages deploy | Parallel sitrep / audit / “notify” workflows that burn minutes |
| `timeout-minutes` on smoke | Unbounded browser jobs |
| Node **22** everywhere (`.nvmrc`, Actions) | Node 20 (deprecated) |

Sitreps and deep verification run **locally** or via **lean** CI signals — not a second marathon job.

---

## 2. Current shape (allowed)

| Job | When | Cost intent |
|-----|------|-------------|
| `ci.yml` → `test` | push `main` + PRs | `npm test` (includes `check:links`) + `npm run build` |
| `ci.yml` → `smoke` | push `main` + PRs | Playwright Chromium, `PROTO_SMOKE_PROFILE=ci` only, 15m cap |
| `deploy-pages.yml` | push `main` (+ manual) | Production build → Pages |

Full smoke: **manual / local** — `PROTO_SMOKE_PROFILE=full npm run smoke` when investigating, not default CI.

---

## 3. Adding CI (checklist)

Before adding a workflow or job:

1. Can this be a **local** `npm run check:*` instead?
2. If CI: is it **&lt; ~2–3 minutes** and non-redundant with `test` / lean `smoke`?
3. Does it need to run on **every** push, or only `workflow_dispatch` / release?
4. Will it install Playwright or a second Node matrix? Prefer **no**.

If the account hits Actions billing limits (Summarizer precedent): narrow triggers to `workflow_dispatch` and keep local `npm test` / lean smoke as the real gate — document the change in this file the same turn.

---

## 4. Agent obligations

- Do not add “helpful” CI jobs that re-smoke the world.
- Prefer ratcheting **static** contracts (Summarizer-style `scripts/check-*.mjs`) over new browser jobs.
- Keep `engines.node` / `.nvmrc` / Actions `node-version` on **22**.

---

## Related

- [COMMAND_DOCTRINE.md](./COMMAND_DOCTRINE.md) — quality bar = lean CI  
- [SOLUTION_REQUIREMENTS.md](./SOLUTION_REQUIREMENTS.md)  
- [../../AGENTS.md](../../AGENTS.md) — Quick start / CI  
- [../../scripts/proto-playwright-smoke.mjs](../../scripts/proto-playwright-smoke.mjs)  

# CI / GitHub Actions budget

**Status:** Locked slim policy (2026-07-19)  
**Inspired by:** Summarizer maintainer practice — Actions minutes are scarce; local gates + lean jobs first.  
**Workflows:** `.github/workflows/ci.yml` · `.github/workflows/deploy-pages.yml`

---

## 1. Policy (blunt)

| Do | Do not |
|----|--------|
| Unit tests + build on every PR/push | Playwright smoke on every push (Actions burn + false confidence) |
| Day-to-day chrome QA via **local MCP / agent** (`__protoRunMcpSanityCheck`, localhost) | Treat green CI smoke as proof of nav XOR / REC⊗CJM |
| On-demand lean smoke via `workflow_dispatch` | Marathon / full smoke (`PROTO_SMOKE_PROFILE=full`) in Actions |
| Cheap static checks in `npm test` (e.g. `check:links`) | Extra workflows that only re-run the same gate |
| One CI workflow + Pages deploy | Parallel sitrep / audit / “notify” workflows that burn minutes |
| `timeout-minutes` on smoke | Unbounded browser jobs |
| Node **22** everywhere (`.nvmrc`, Actions) | Node 20 (deprecated) |

**Why smoke left default CI:** Auto Playwright on every push cost minutes, slowed feedback, and still missed Studio chrome bugs (e.g. REC usable while CJM on). Script kept; trigger is manual.

---

## 2. Current shape (allowed)

| Job | When | Cost intent |
|-----|------|-------------|
| `ci.yml` → `test` | push `main` + PRs | `npm test` (includes `check:links`) + `npm run build` |
| `ci.yml` → `smoke` | **`workflow_dispatch` only** | Playwright Chromium, `PROTO_SMOKE_PROFILE=ci`, 15m cap — run when investigating, not every commit |
| `deploy-pages.yml` | push `main` (+ manual) | Production build → Pages |

Local lean smoke: `npm run smoke` against `npm run dev`.  
Full smoke: **manual / local** — `PROTO_SMOKE_PROFILE=full npm run smoke` when investigating.

**Merge bar:** `npm test` + `npm run build` green. Chrome XOR / REC⊗CJM proven locally (unit + MCP sanity / FE audit), not by auto CI smoke.

---

## 3. Adding CI (checklist)

Before adding a workflow or job:

1. Can this be a **local** `npm run check:*` instead?
2. If CI: is it **&lt; ~2–3 minutes** and non-redundant with `test`?
3. Does it need to run on **every** push, or only `workflow_dispatch` / release?
4. Will it install Playwright or a second Node matrix? Prefer **no** (smoke is already on-demand).

If the account hits Actions billing limits (Summarizer precedent): keep `workflow_dispatch` for browsers; document the change in this file the same turn.

---

## 4. Agent obligations

- Do not add “helpful” CI jobs that re-smoke the world on every push.
- Prefer ratcheting **static** contracts (Summarizer-style `scripts/check-*.mjs`) + unit XOR gates over new browser jobs.
- Keep `engines.node` / `.nvmrc` / Actions `node-version` on **22**.
- Prove Studio chrome (REC⊗CJM, AIR locks) with unit tests + local MCP — not by re-enabling auto smoke.

---

## Related

- [COMMAND_DOCTRINE.md](./COMMAND_DOCTRINE.md) — quality bar = lean CI  
- [SOLUTION_REQUIREMENTS.md](./SOLUTION_REQUIREMENTS.md)  
- [VERSIONING.md](./VERSIONING.md) — local changelog/semver only; **no** tag→Release CI yet  
- [POST_CHANGE_CHECKLIST.md](./POST_CHANGE_CHECKLIST.md) — local gates before “done”  
- [NEXT_STEPS.md](./NEXT_STEPS.md) — living board  
- [../../AGENTS.md](../../AGENTS.md) — Quick start / CI  
- [../../scripts/proto-playwright-smoke.mjs](../../scripts/proto-playwright-smoke.mjs)  

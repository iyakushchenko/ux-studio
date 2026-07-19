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
| Node **22** everywhere (`.nvmrc`, Actions `node-version`) + `actions/checkout@v5` / `setup-node@v5` (action runtime off Node 20) | Node 20 app runtime or `@v4` actions that still warn on Node 20 |

**Why smoke left default CI:** Auto Playwright on every push cost minutes, slowed feedback, and still missed Studio chrome bugs (e.g. REC usable while CJM on). Script kept; trigger is manual.

---

## 2. Current shape (allowed)

| Job | When | Cost intent |
|-----|------|-------------|
| `ci.yml` → `test` | push `main` + PRs | `npm ci` (cached) → `npm run test:gates` (parallel hard gates) → `vitest run` |
| `ci.yml` → `build` | push `main` + PRs | **Parallel** Vite build (`npm ci` cached) — not sequential after unit |
| `ci.yml` → `smoke` | **`workflow_dispatch` only** | Playwright Chromium + browser cache, `PROTO_SMOKE_PROFILE=ci`, 15m cap — never on push |
| `deploy-pages.yml` | push `main` (+ manual) | `npm ci` + cache → production build → Pages |

**Hard gates unchanged** (still fail CI): `check:links` · `hygiene` · `felonies` · `parity-ratchets` · `parity-proven` · `page-final-pass` · `theme-brand` · `version`. Only **parallelized** via `scripts/run-static-gates.mjs`.

Local lean smoke: `npm run smoke` against `npm run dev`.  
Full smoke: **manual / local** — `PROTO_SMOKE_PROFILE=full npm run smoke` when investigating.

**Merge bar:** `test` + `build` jobs green (`npm test` locally = gates + vitest; also run `npm run build`). Chrome XOR / REC⊗CJM proven locally (unit + MCP sanity / FE audit), not by auto CI smoke.

### 2.1 Speed (2026-07-19)

| Lever | Change |
|-------|--------|
| npm | Tracked `package-lock.json` → `npm ci` + `actions/setup-node` `cache: npm` (CI + Pages + smoke) |
| Parallel jobs | `test` ∥ `build` (same ref concurrency group; cancel in-progress) |
| Gates | Parallel `test:gates` — fail-fast report, no sequential `&&` chain |
| Smoke | Remains dispatch-only; Playwright browser dir cached |
| Not done | Vitest shard (suite ~10s local — shard would **cost** extra installs) |

| Metric | Before (tip `fd3241c` era) | After (this ship) |
|--------|----------------------------|-------------------|
| CI wall (push, warm cache expected) | ~60–70s sequential install → `npm test` → build | **~35–45s** wall (`test` ∥ `build`; install cached) |
| Cold cache | ~60–90s | ~45–60s (still parallel build) |
| Smoke on push | already off | still off |

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

## 5. Post-push sitrep (mandatory — BE / Director)

**Do not assume green.** After any `git push` (or merge) that can trigger Actions, the agent **must** check the latest GitHub Actions status before telling the PO CI is fine.

```bash
gh run list -R iyakushchenko/ux-studio -L 10
# on failure / cancelled:
gh run view <id> --log-failed
```

| Outcome | Report as… |
|---------|------------|
| `failure` on `CI` | **Broken** — diagnose + fix; do not claim green |
| `cancelled` on Deploy / CI while a newer run exists | Usually **concurrency supersede** — say so; check the newer run |
| `success` on latest `CI` for the pushed SHA | Green for that SHA |
| `in_progress` | Wait / re-check; do not invent a result |

**Owner:** BE-hat / Tech Director owns CI health sitrep (lean budget + real status). Local `npm test` / build green ≠ Actions green until `gh run list` proves it.

---

## Related

- [COMMAND_DOCTRINE.md](./COMMAND_DOCTRINE.md) — quality bar = lean CI; BE owns post-push sitrep  
- [SOLUTION_REQUIREMENTS.md](./SOLUTION_REQUIREMENTS.md)  
- [VERSIONING.md](./VERSIONING.md) — local changelog/semver only; **no** tag→Release CI yet  
- [POST_CHANGE_CHECKLIST.md](./POST_CHANGE_CHECKLIST.md) — local gates before “done”  
- [NEXT_STEPS.md](./NEXT_STEPS.md) — living board  
- [../../AGENTS.md](../../AGENTS.md) — Quick start / CI  
- [../../scripts/playwright-smoke.mjs](../../scripts/playwright-smoke.mjs)  

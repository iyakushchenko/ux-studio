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
| `ci.yml` → `test` | push `main` + PRs | `node_modules` cache (skip `npm ci` on hit) → `test:gates` → `vitest --pool=forks` |
| `ci.yml` → `build` | push `main` + PRs | **Parallel** Vite build (same nm cache) — not sequential after unit |
| `ci.yml` → `smoke` | **`workflow_dispatch` only** | Playwright Chromium + browser cache, `PROTO_SMOKE_PROFILE=ci`, 15m cap — never on push |
| `deploy-pages.yml` | push `main` (+ manual) | same nm cache → production build → Pages (cancel-in-progress) |

**Hard gates unchanged** (still fail CI): `check:links` · `hygiene` · `felonies` · `parity-ratchets` · `parity-proven` · `page-final-pass` · `theme-brand` · `version`. Only **parallelized** via `scripts/run-static-gates.mjs`.

Local lean smoke: `npm run smoke` against `npm run dev`.  
Full smoke: **manual / local** — `PROTO_SMOKE_PROFILE=full npm run smoke` when investigating.

**Merge bar:** `test` + `build` jobs green (`npm test` locally = gates + vitest; also run `npm run build`). Chrome XOR / REC⊗CJM proven locally (unit + MCP sanity / FE audit), not by auto CI smoke.

### 2.1 Speed (2026-07-19 → tip this ship)

| Lever | Change |
|-------|--------|
| npm | Tracked `package-lock.json` → `actions/setup-node` `cache: npm` **+** `node_modules` cache (skip `npm ci` on exact lockfile hit) |
| Parallel jobs | `test` ∥ `build` (same ref concurrency group; **cancel-in-progress: true**) |
| Gates | Parallel `test:gates` — fail-fast report, no sequential `&&` chain |
| Vitest | `--pool=forks` + `maxWorkers=2` on CI (2-core `ubuntu-latest`) |
| Checkout | `fetch-depth: 1`; install uses `npm ci --no-audit --no-fund` on cache miss |
| Smoke | Remains dispatch-only; Playwright browser dir cached |
| Runners | Free floor = `ubuntu-latest` (no paid larger runners assumed) |
| Not done | Vitest shard (would **cost** extra job installs); gutting hard gates |

| Metric | Before parallel (`fd3241c` era) | After `6b952e4` parallel | Target / honest floor (this ship) |
|--------|--------------------------------|--------------------------|-----------------------------------|
| CI wall (push, **warm** `node_modules`) | ~60–70s sequential | ~35–45s | **≤20–25s** expected; honest floor ~**18–22s** (setup ~6–8s + vitest ~9–11s) |
| Cold / first lockfile | ~60–90s | ~35–45s | ~30–40s (`npm ci` still dominates) |
| Smoke on push | already off | still off | still off |

**Honest floor:** GitHub job boot + checkout + setup-node ≈ 6–8s; Vitest suite ≈ 9–11s local/CI. Sub-15s warm wall needs probe-test delay cuts (not done here — hard gates stay).

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

## 5. Post-push sitrep (BE / Director) — R12 no-await

**Do not assume green. Do not await routine CI.**

| Mode | When | Behavior |
|------|------|----------|
| **Routine ship (default)** | Normal push after coherent batch | Push → **move on**. Optional one-shot `gh run list -L 5` peek. **Forbidden:** `gh run watch`, sleep/poll loops, waiting for Pages, blocking the next task on `in_progress`. |
| **Await prove** | PAGE FINAL PASS HARD-GREEN · release/version · human PO asked to prove remote green | Then watch/re-check until tip SHA `CI` concludes; on red → `gh run view --log-failed`. |

```bash
# Routine peek (non-blocking) — optional
gh run list -R iyakushchenko/ux-studio -L 5
# Only when already red/cancelled on tip, or in await-prove mode:
gh run view <id> --log-failed
```

| Outcome | Report as… |
|---------|------------|
| `failure` on tip `CI` (when you looked) | **Broken** — diagnose + fix; do not claim green |
| `cancelled` on Deploy / CI while a newer run exists | Usually **concurrency supersede** — say so; check the newer run |
| `success` on latest `CI` for the pushed SHA | Green for that SHA |
| `in_progress` on **routine** ship | **Move on** — do not invent green; do not wait |
| `in_progress` in **await-prove** mode | Re-check until tip concludes |

**Owner:** BE-hat / Tech Director. Local `npm test` / build green ≠ Actions green — do not *claim* remote green without evidence; also do not *burn PO time* waiting on every push. Concurrency **cancel-in-progress** is ON for CI + Pages.

---

## Related

- [COMMAND_DOCTRINE.md](./COMMAND_DOCTRINE.md) — quality bar = lean CI; BE owns post-push sitrep  
- [SOLUTION_REQUIREMENTS.md](./SOLUTION_REQUIREMENTS.md)  
- [VERSIONING.md](./VERSIONING.md) — local changelog/semver only; **no** tag→Release CI yet  
- [POST_CHANGE_CHECKLIST.md](./POST_CHANGE_CHECKLIST.md) — local gates before “done”  
- [NEXT_STEPS.md](./NEXT_STEPS.md) — living board  
- [../../AGENTS.md](../../AGENTS.md) — Quick start / CI  
- [../../scripts/playwright-smoke.mjs](../../scripts/playwright-smoke.mjs)  

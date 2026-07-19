# Post-change checklist (UX Studio)

**Status:** Lean spine — 2026-07-19  
**Inspired by:** Summarizer `.cursor/rules/post-change-checklist.mdc` (full gate suite)  
**Rule of thumb:** Local gates first; do not burn GitHub Actions to discover breakage.

---

## After code / UI / config changes

Complete before calling the task **done** (including late in a long session):

1. **`npm test`** — static contracts (`check:links` + `check:hygiene`) + Vitest. Fix failures.
2. **`npm run build`** — Vite production build must stay green (same signal Pages uses; base `/ux-studio/` on deploy).
3. **Behavior / docs** — if product behavior changed, update matching `docs/product/*` or `docs/projects/<id>/` the same turn. New files follow [NAMING.md](./NAMING.md).
4. **UI-facing handoff** — strict FE audit per [FE_UI_UX_AUDIT.md](./FE_UI_UX_AUDIT.md) until **PROVEN** under `docs/projects/<id>/audits/` (doctrine §7). Green tests alone are not enough. Domain CSS renames → Nazi QA **light** on chrome. On Make→React: Uma signs off **loading/empty/updating** + **checkbox/radio hover**; Bea register has loading states as P0; Quinn proves filter-change loader in-band (blank+text alone = FAIL) — [UMA_FIDELITY_NOTES.md](./UMA_FIDELITY_NOTES.md).
5. **Blast-radius + chrome XOR** — adjacent links/CTAs/counters/panel XOR; **REC ⊗ CJM ⊗ AIR** (`studioModeXor.test.ts`, sanity `rec-disabled-when-cjm-on`, audit G5–G6).
6. **Interactive / chrome / playback** — local MCP (`__studioRunMcpSanityCheck` / `__protoRunMcpSanityCheck`) or lean `npm run smoke` against `npm run dev`. Full marathon (`PROTO_SMOKE_PROFILE=full`) only when investigating. Agent runs: overlay touch + sitrep settle; strip ephemeral URL params. Selectors: `data-studio-*` / `.studio-nav-*` ([../shell/RECORDING.md](../shell/RECORDING.md), [../shell/URL.md](../shell/URL.md)).
7. **URL / hybrid / mounts** — navigable `?project=&screen=`; React host mounted; Make retired (`data-studio-make-retired`); createRoot unmount **deferred**; short grids left-aligned; Step tabs → `INDEX_BOOK_STEP*`. See [LESSONS_LEARNED.md](./LESSONS_LEARNED.md).
8. **CSS layers + domain CSS** — no new React styles in LEGACY; no new `.proto-*` / `data-proto-*` ([NAMING.md](./NAMING.md), [HYGIENE.md](./HYGIENE.md)).
9. **Changelog + lessons** — user-visible / durable seams: `npm run notes:append -- --lane=<lane> --intent="…"`. Append new failure classes to [LESSONS_LEARNED.md](./LESSONS_LEARNED.md).
10. **Commit** when coherent and allowed. **Batch push (R12):** do **not** push after every tiny fix — one push per coherent ship / PO ask / HARD-GREEN / end of wave ([STUDIO_AUTO_RULES.md](./STUDIO_AUTO_RULES.md) R12). After **push**: BE sitrep `gh run list -R iyakushchenko/ux-studio -L 10` ([CI_ACTIONS_BUDGET.md](./CI_ACTIONS_BUDGET.md) §5).

---

## Do not

- Add CI jobs to replace local gates (especially auto Playwright on every push).
- Run `PROTO_SMOKE_PROFILE=full` in GitHub Actions.
- Skip FE audit because “tests passed.”
- Trust subagent “done” without JSX/CSS or localhost proof.
- Grow LEGACY for new React page CSS.
- Work in abandoned `UXCJM-*` clones — canonical workspace is `E:\UX\ux-studio` only.

---

## Related

- [CI_ACTIONS_BUDGET.md](./CI_ACTIONS_BUDGET.md)  
- [NAMING.md](./NAMING.md)  
- [VERSIONING.md](./VERSIONING.md)  
- [COMMAND_DOCTRINE.md](./COMMAND_DOCTRINE.md) §6–§7  
- [LESSONS_LEARNED.md](./LESSONS_LEARNED.md)  
- [../../AGENTS.md](../../AGENTS.md)  


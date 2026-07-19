# UX Studio — PO painpoints (trackable)

**Status:** Living board — mark → COMPLETE when shipped + proven.  
**Owner:** Arch (curate) · Bea (acceptance language) · callsigns execute.  
**Updated:** 2026-07-20  
**Related:** [NEXT_STEPS.md](./NEXT_STEPS.md) · [PRODUCT_FORECAST.md](./PRODUCT_FORECAST.md) · [UX_STUDIO_VISION.md](./UX_STUDIO_VISION.md) · [TEAM_KNOWLEDGE.md](./TEAM_KNOWLEDGE.md) · [STUDIO_AUTO_RULES.md](./STUDIO_AUTO_RULES.md) · [../shell/PLAYBACK_DIAG.md](../shell/PLAYBACK_DIAG.md)

Do **not** lose this list. New PO rage → append a row here **and** stamp TEAM_KNOWLEDGE. Prefer COMPLETE over silent delete.

---

## How to read status

| Status | Meaning |
|--------|---------|
| OPEN | Still hurts; not done |
| IN PROGRESS | Active ship / MVP landed but residuals remain |
| COMPLETE | Shipped + proven (cite tip / audit when useful) |
| WATCH | Mitigated but easy to regress — keep eyes |

---

## Board (2026-07-19 → 2026-07-20)

| ID | Pain | PO sentiment (compressed) | Status | Track / owner |
|----|------|---------------------------|--------|---------------|
| PP-01 | Playback engine reliability | CJM / step / retreat / play-end still feel fragile after React Site Pilot / Chat — “did it actually work?” | IN PROGRESS | PLAYBACK_DIAG R13 · Finn/Quinn · [PLAYBACK_DIAG.md](../shell/PLAYBACK_DIAG.md) |
| PP-02 | Diag-first culture | Prefer console + overlay evidence over “tests green / vibes green.” Agents must prove, not narrate. | IN PROGRESS | R13 + agent-testing shell · Quinn/Ben |
| PP-03 | CJM micro-fails | Small silent breaks (type-in skip, wrong scroll host, CTA off-by-one, fade missing) stack into “CJM broken.” | IN PROGRESS | LESSONS + assertTypeIn / step-retreat smokes |
| PP-04 | Hub vs journey-start | Play finish / jump must land **selected journey start**, never silent hub. | IN PROGRESS | `play-end` / `journey-reset` diag · Finn |
| PP-05 | Fuchsia invent / Step2 / retreat scroll | No invented fuchsia hover; book-step-2 dwell cursor law; retreat must scrollIntoView correctly. | WATCH | Uma no-invent · cursor QA · scroll host LESSONS |
| PP-06 | Agentic full chat | Agentic path must click progressive chat CTAs (no off-by-one / skipped frames). | IN PROGRESS | Chat playback · Finn/Quinn |
| PP-07 | Control-panel stale green | Transport / mode chrome can look “ok” while state is stale or wrong — PO distrusts green without fresh sitrep. | OPEN | Control-panel log + overlay sitrep pull |
| PP-08 | Insufficient logging | Not enough mid-flight signal; identical helper spam ≠ useful log. | IN PROGRESS | Agent-testing MVP landed; prove on `:5173` · Arch/Finn |
| PP-09 | Team listening | Team must **use** TEAM_KNOWLEDGE / LESSONS (Knowledge used), not only append. Write-only = FAIL. | WATCH | TEAM.md · Arch gate on team check |
| PP-10 | Agent testing overlay vision | Overlay must be a **mid-flight QA shell** (named steps, colors, timer, sitrep, alarm, cursor flag, timeline strip, console START/END, dump on FAIL/alarm) — not a monotonous `helper: __studioTriggerTransport` list. | COMPLETE | R11 `:5173` mid-flight prove 2026-07-20 — coalesced transport×2, ok/amber/red rows, sitrep, timeline chips, Alarm/Cursor, console END, dumps=3 · Uma/Finn/Quinn |

---

## Overlay vision acceptance (PP-10) — MVP checklist

Lean ship (this stream). Residuals stay OPEN until proven on `:5173`.

| # | Feature | MVP target | Status |
|---|---------|------------|--------|
| 1 | Readable step rows | Beat / touchpoint / action — not identical helper spam | COMPLETE (MVP) |
| 2 | Outcome colors | fail red-ish · soft-fail/unexpected amber · ok default/white | COMPLETE (MVP) |
| 3 | Elapsed timer | Mid-flight elapsed + cheap per-step duration | COMPLETE (MVP) |
| 4 | Control-panel sitrep | Mode / CJM / experience / screen / beat counter in panel | COMPLETE (MVP) |
| 5 | Alarm bell CTA | PO rings → log event + optional dump hook | COMPLETE (MVP) |
| 6 | Cursor weird flag | Clickable flag + auto-log known parks/issues → `__studioPlaybackDiag` error code | COMPLETE (MVP) |
| 7 | Script timeline strip | Touchpoint keys; white/amber/red after step | COMPLETE (MVP) |
| 8 | Console separators | Clear START/END per test sequence | COMPLETE (MVP) |
| 9 | Console dump auto-save | Opt-in / last-N to `sessionStorage` + downloadable JSON on FAIL or alarm — **not** every step | COMPLETE (MVP) |

**PP-10 COMPLETE** (2026-07-20): Quinn mid-flight prove on R11 `:5173` — BR panel active with named coalesced steps, outcome colors, elapsed, control-panel sitrep, Alarm/Cursor/Dump, timeline chips, console START/END, FAIL/alarm dumps. Residual wishlist rows remain OPEN.

### Dump policy (Arch — locked for MVP)

- **When:** FAIL sitrep (`stop({ result: "fail" })`) or PO **Alarm** / **Cursor weird** (explicit).
- **What:** last-N (default 5) JSON blobs in `sessionStorage` (`studioAgentTestingDumps`) + downloadable via overlay / `__studioDownloadAgentTestingDump`.
- **Why not every step:** noisy, hangs the tab, floods storage; mid-flight UI already shows steps. Diag-first ≠ spam-first.
- **Rejected overkill:** no heavy APM (Sentry/Datadog/full session replay). Prefer Motion (existing) + PLAYBACK_DIAG + this shell. Tiny util only if ROI is obvious.

### Free libs note (Arch)

Prefer **existing** `framer-motion` / `@/uxds/motion` + PLAYBACK_DIAG + control-panel snapshot. Optional tiny util OK. Rejected: full APM, log shippers, second overlay framework.

---

## Residual wishlist (post-MVP)

- Richer timeline scrub / jump-to-beat from strip
- Live mirror of full `[PLAYBACK_DIAG]` event table in-panel
- Alarm → optional screenshot hook (PO asset later)
- Stale-green detector that forces amber when snapshot vs DOM diverge (PP-07)
- Persist dumps across reload only behind explicit continue flag

---

## Completing a row

1. Ship + prove (Quinn MCP / PLAYBACK_DIAG / overlay on R11 `:5173` as relevant).  
2. Set status **COMPLETE** (or **WATCH** if regress-prone).  
3. One-liner in [TEAM_KNOWLEDGE.md](./TEAM_KNOWLEDGE.md) **Knowledge improved**.  
4. Link tip SHA or audit when useful — do not invent PROVEN.

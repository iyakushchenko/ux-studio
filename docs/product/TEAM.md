# Lean UX team — agent operating system

**Status:** Locked (PO mandate, 2026-07-19)  
**Why:** Agents operate as a **self-organizing lean UX project team**, not a lone coder. Briefs + cross-checks beat chat-only handoffs.  
**Hard-wired:** [COMMAND_DOCTRINE.md](./COMMAND_DOCTRINE.md) §0.1 · [`.cursor/rules/ux-studio-director.mdc`](../../.cursor/rules/ux-studio-director.mdc) · [AGENTS.md](../../AGENTS.md)

---

## Callsigns (use everywhere)

**Mandatory display format** (sitreps, checks, briefs, chat to PO) — role always next to name:

| Display (always) | Owns | Artifacts for teammates |
|------------------|------|-------------------------|
| **Arch (Director)** | Sequencing, forecast, distrust handoffs, veto sloppy ships | [NEXT_STEPS.md](./NEXT_STEPS.md), [PRODUCT_FORECAST.md](./PRODUCT_FORECAST.md), doctrine |
| **Bea (BA)** | Acceptance, flows, business logic | Lean feature briefs (`FEATURE_BRIEF_TEMPLATE.md` / `docs/projects/<id>/features/`) |
| **Finn (FE)** | React / engine implementation | Code + mount notes in brief or PR |
| **Uma (UI/UX)** | Chrome, concept fidelity, Nazi visual | FE audits under `docs/projects/<id>/audits/` |
| **Quinn (QA)** | Prove, MCP, felonies, CI sitrep | Prove notes (localhost / MCP / gate evidence). Owns prove for post-agent clean slate (no sticky Choose Pharmacy after `__protoRun*` / `stop({ reload: true })`). **After every version bump:** prove tab-bar chip `v` + `package.json` semver + channel (localhost; note Pages) |
| **Ben (BE)** | Version / changelog / CI / gates / push mechanics | [VERSIONING.md](./VERSIONING.md), check scripts, `gh run list` |
| **Pax (PO sim)** | Acts like this project’s human PO: intolerant of near-dups / missed chrome; wants hard guardrails, Pages truth, no Actions burn, decisive next steps. **Decides whether/when to bump version + changelog + push** (human PO overrides) | [PRODUCT_OWNER_BRIEF.md](./PRODUCT_OWNER_BRIEF.md) decisions log |

Never bare callsign alone in team output — always `Name (Role)` as above. One Cursor session may wear several hats — still **name the hat** when writing artifacts (“Finn (FE): mounted…”, “Quinn (QA): proved…”).

---

## Standing PO commands (hard process)

### `team report`

**Trigger:** human PO says **team report** (exact or clear equivalent: “sitrep”, “team status”, “full team report”).

**Owner:** Arch (Director) facilitates.

**Output (lean — no essays):**

1. Every callsign in mandatory display format — **1–3 sentences** status each.  
2. **Pax (PO sim):** short status + **decisions pending**.  
3. **Arch (Director)** closes with **Next steps** (NOW / NEXT) phrased so the human PO can reply only `+` / `ok` / `go` / `do`.

### `team check`

**Trigger (either):**

1. Human PO says **team check** (exact or clear equivalent), **or**  
2. **Automatically after each big task completion** — Arch (Director) **MUST** run this before declaring the ship done. Do **not** wait for the PO.

**Owner:** Arch (Director) runs the room; whole team reviews the current workstream.

**Output (short) — EACH callsign reports explicitly (roles next to names):**

1. Cross-check each others’ work; surface blockers; instruct the owning callsign.  
2. Per-role check result (same `Name (Role)` format) — **mandatory fidelity lines below**.  
3. **Quinn (QA):** verify CI / Pages if relevant + **interaction matrix** (hover/click feedback) PASS/FAIL.  
4. **Ben (BE):** `gh` sitrep when push/CI touched.  
5. **Arch (Director):** concrete task assignments until blockers cleared / stream green. Steer: Uma checklist + Bea register completeness + Quinn interaction matrix must all be green.

**Mandatory per-role fidelity lines (UI / Make→React / chrome ships):**

| Callsign | Must report |
|----------|-------------|
| **Uma (UI/UX)** | Fidelity checklist PASS/FAIL + failed items ([UMA_FIDELITY_NOTES.md](./UMA_FIDELITY_NOTES.md)). **Also mandatory on every migrated screen:** `loading states — PASS\|FAIL` and `checkbox/radio hover — PASS\|FAIL` |
| **Bea (BA)** | Register complete? Any Missing P0? (every Make band listed before Finn coded). **Loading / empty / updating states must be P0 rows** when Make has them — mechanism + layout, not copy-only |
| **Quinn (QA)** | Interaction matrix PASS/FAIL — **cannot PASS** without unchecked-P0-free register **and** a **MCP localhost real-user evidence log** for the screen matrix. **Always** use `__studioRunMcpPageProbe` (robo-cursor + overlay PASS/FAIL) for screen ships; cite MCP steps in team check. Gate: `check:parity-proven`. |
| **Ben (BE)** | Owns MCP session hygiene with Quinn (vite up, page probe overlay start/stop, stay-on-page prove); `gh` sitrep after push; keeps `PARITY_PROVEN.json` honest |
| **Finn (FE)** | Gaps fixed or blocked |

**Hard rules:**

- After big ships, Arch auto-runs **team check** before “done” — green tests alone do not skip it.  
- Ship **cannot** be “done” if **Uma (UI/UX)** or **Quinn (QA)** reports **FAIL**.  
- Blank listing + lone “Updating results…” (or equivalent) **without** Make’s spinner/overlay/skeleton = automatic Uma + Quinn **FAIL**.  
- **Forbidden to invent** hover/loading chrome not in Make.  
- **MCP real-user matrix mandatory for every screen ship** (Quinn + Ben). Prefer `__studioRunMcpPageProbe` so the PO sees the robo-cursor + overlay PASS/FAIL. Arch **rejects** audit **PROVEN** without MCP evidence log.  
- **No merge** without `npm run check:parity-proven` green (`PARITY_PROVEN.json` + audit PROVEN + MCP section).  
- **Parity ratchets (GLOBAL HARD FAIL):** `npm run check:parity-ratchets` — typical Make→React misses (search icon, bookmark copy, empty-heart fuchsia, Advantage bar, Book now primary, loader dup, make-retired). Every new typical fail class → Arch/Ben add a ratchet ([PARITY_RATCHETS.md](./PARITY_RATCHETS.md)). Overlay registry stays in `check:felonies`.  
- **Overlay eyes (GLOBAL HARD FAIL):** every blocking popup (Quick View, Choose Pharmacy, Login, pickers, …) must be in `studioModalGuard` registry + `data-studio-modal`. `__studioRunMcpPageProbe` / `simulateDemoPointerClick` **must refuse** clicks to targets under the topmost overlay (or only click inside it). Felony: `check:felonies` fails npm test if guard missing or known overlays unregistered. Quinn proves: open Quick View → under-tile refuse PASS.  
- **Version bump:** patch after user-visible bugfixes is correct ([VERSIONING.md](./VERSIONING.md) §6); skip bump only for docs/process-only.

---

## How they talk (lean, not chat-only)

1. **Brief first** — Bea (or Arch) drops a 1-pager before serious build.  
2. **Implement** — Finn builds; Uma watches chrome/L&F.  
3. **Cross-check before “done”** — Quinn↔Finn (behavior/gates), Uma↔Bea (acceptance vs pixels).  
4. **Pax accept** — for user-visible ships: bump? changelog? push? Pax decides; human PO can override.  
5. **Close the board** — Arch updates NEXT_STEPS; Ben executes notes/release/push when Pax says yes.

Serious work = this loop. Trivial typos / one-line docs may skip briefs; **do not** skip for chrome, URL, REC, or page behavior.

---

## Artifact map

| Artifact | Path | Owner |
|----------|------|-------|
| Team OS (this file) | `docs/product/TEAM.md` | Arch |
| Feature brief template | `docs/product/FEATURE_BRIEF_TEMPLATE.md` | Bea |
| Project feature briefs | `docs/projects/<id>/features/*.md` | Bea |
| Living board | `docs/product/NEXT_STEPS.md` | Arch |
| Forecast | `docs/product/PRODUCT_FORECAST.md` | Arch |
| FE audit | `docs/projects/<id>/audits/` | Uma |
| Version / CHANGELOG | `package.json` + `CHANGELOG.md` | Ben (Pax decides bump) |
| PO decisions | `docs/product/PRODUCT_OWNER_BRIEF.md` §K | Pax / human PO |

---

## Process guardrail (serious change)

```
Bea brief → Finn (+ Uma) build → Quinn prove + Uma audit (if UI)
        → Pax: bump / notes / push? → Ben executes → Arch board update
```

| Step | Fail if… |
|------|----------|
| Briefs | Chat-only “we’ll fix it” with no acceptance |
| Cross-check | Finn “done” with no Quinn evidence; Uma skipped on UI |
| Pax | Version/push on user-visible ship without Pax (or human PO) call |
| Version bump | Ben bumps `package.json` but Quinn did not prove UI chip matches (chip lie = felony) |
| Board | NEXT_STEPS / notes stale after Pax said bump |

---

## LATER — real-user persona (stub)

**Do not implement now.** A real end-user persona (from X-Suite CJM / Summarizer handshake) will eventually sit beside Pax as a **product truth** input — not a replace for Pax’s release decisions. Tracked in [PRODUCT_FORECAST.md](./PRODUCT_FORECAST.md) LATER + [X_SUITE_INTEGRATION.md](./X_SUITE_INTEGRATION.md).

---

## Related

- [COMMAND_DOCTRINE.md](./COMMAND_DOCTRINE.md)  
- [FEATURE_BRIEF_TEMPLATE.md](./FEATURE_BRIEF_TEMPLATE.md)  
- [VERSIONING.md](./VERSIONING.md)  
- [FE_UI_UX_AUDIT.md](./FE_UI_UX_AUDIT.md)  
- [CI_ACTIONS_BUDGET.md](./CI_ACTIONS_BUDGET.md)

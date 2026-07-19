# Lean UX team — agent operating system

**Status:** Locked (PO mandate, 2026-07-19)  
**Why:** Agents operate as a **self-organizing lean UX project team**, not a lone coder. Briefs + cross-checks beat chat-only handoffs.  
**Hard-wired:** [COMMAND_DOCTRINE.md](./COMMAND_DOCTRINE.md) §0.1 · [`.cursor/rules/ux-studio-director.mdc`](../../.cursor/rules/ux-studio-director.mdc) · [AGENTS.md](../../AGENTS.md)

---

## Callsigns (use everywhere)

| Callsign | Role | Owns | Artifacts for teammates |
|----------|------|------|-------------------------|
| **Arch** | Director / Tech Arch | Sequencing, forecast, distrust handoffs, veto sloppy ships | [NEXT_STEPS.md](./NEXT_STEPS.md), [PRODUCT_FORECAST.md](./PRODUCT_FORECAST.md), doctrine |
| **Bea** | BA | Acceptance, flows, business logic | Lean feature briefs (`FEATURE_BRIEF_TEMPLATE.md` / `docs/projects/<id>/features/`) |
| **Finn** | FE | React / engine implementation | Code + mount notes in brief or PR |
| **Uma** | UI/UX | Chrome, concept fidelity, Nazi visual | FE audits under `docs/projects/<id>/audits/` |
| **Quinn** | QA | Prove, MCP, felonies, CI sitrep | Prove notes (localhost / MCP / gate evidence) |
| **Ben** | BE | Version / changelog / CI / gates / push mechanics | [VERSIONING.md](./VERSIONING.md), check scripts, `gh run list` |
| **Pax** | PO (simulated) | Acts like this project’s human PO: intolerant of near-dups / missed chrome; wants hard guardrails, Pages truth, no Actions burn, decisive next steps. **Decides whether/when to bump version + changelog + push** (human PO overrides) | [PRODUCT_OWNER_BRIEF.md](./PRODUCT_OWNER_BRIEF.md) decisions log |

One Cursor session may wear several hats — still **name the hat** when writing artifacts (“Finn: mounted…”, “Quinn: proved…”).

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

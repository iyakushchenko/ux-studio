# Stakeholder readiness — the honest checklist

**Status:** Living. Update this file whenever a gap below closes or a new one is found — don't let it go stale like a snapshot audit would. Last full pass: 2026-07-24.
**Ask for this again anytime** — this file is the answer, not something reconstructed from conversation memory.

Two different questions, answered separately, because they have different bars:

1. **Can I demo Boots to a stakeholder today?** — yes, with caveats below.
2. **Is this a real, repeatable product (not one hand-nursed demo)?** — no, not yet. See Part B.

---

## Part A — Demoing Boots today

| Item | State | Evidence |
|---|---|---|
| 9 Boots screens built, structurally sound | ✅ | `check:page-final-pass` hard-green, all 9 screens `status: "proven"` — [PAGE_FINAL_PASS.json](../projects/boots-pharmacy/audits/PAGE_FINAL_PASS.json) |
| Every clickable control has a stable, recordable identity | ✅ | `check:interactive-identity` — zero-tolerance static gate, 25→0 gaps burned down |
| No duplicate/ambiguous controls (real browser layout, not guessed) | ✅ | `npm run smoke` → Playwright + `__studioMapAllInteractions()`, 1 documented exception only — [CX_CONVEYOR.md](./CX_CONVEYOR.md) Stage 1 |
| CJM playback (agentic + traditional) | ✅ | `npm test` 164/164 files, 1019/1019 tests |
| A real recorded walkthrough exists as a regression fixture | ✅ | `src/app/recording/__tests__/thoroughRecJourney.test.ts` — 19-beat real REC, not synthetic |
| UXDS token/brand compliance enforced, not just written | ✅ | `check:theme-brand` gate, `DS_STRICTNESS.md` |
| **Caveat: this is one hand-built project, hand-nursed over weeks** | ⚠️ | See Part B — none of the above proves the *pipeline* works on the next page or the next brand |

**Bottom line for a demo:** yes, walk a stakeholder through a Boots journey (booking, PLP/PDP, appointment history) live or via a saved REC replay — it will hold up, gates are real, not aspirational. Do not claim "and we can do this for any brand/page in days" — that part isn't proven yet (Part B).

---

## Part B — What's still missing before this is a repeatable product

Ordered roughly by how much it blocks the "repeatable" claim, not by ease.

| # | Gap | Why it matters | Reference |
|---|---|---|---|
| 1 | **No second real project exists.** `puma`/"UXDS - Larkin" (refapp) is a registered-but-empty stub — proves the registry works, proves nothing about building a second brand. | The core sales pitch is "works for any project," and that's untested beyond one. | [PROJECT_CONTRACT.md](./PROJECT_CONTRACT.md), [CX_CONVEYOR.md](./CX_CONVEYOR.md) "Project-boundary leak" |
| 2 | **No genuinely *new* page has been built end-to-end since the checklist existed.** All 9 Boots screens were migrated/hardened over time, not proven from a cold concept through the full intake→build→gate→REC pipeline in one pass. | This is step 2 of the agreed bootstrap sequence (§ below) and hasn't happened yet — everything today is retrofit, not a proven forward pipeline. | [CX_CONVEYOR.md](./CX_CONVEYOR.md) "The refapp bootstrap sequence" |
| 3 | **Content/copy layer is partial.** `BOOTS_PHARMACY_CONTENT_PACK` (2026-07-24) is real and wired for **footer + primary nav** — both `Footer.tsx` and `Header.tsx` render straight from the pack, live-verified (click-through, mega-menu hover, gates, smoke). `hub/hubContent.ts` (568 lines) and header account-menu/icons aren't wired/modeled yet. | Footer + nav copy can now be edited/forked in one place; hub copy and account-menu chrome still need code surgery for a second project. | [PROJECT_CONTRACT.md](./PROJECT_CONTRACT.md) § Content/copy layer |
| 4 | **X-Suite intake is fully manual.** PO hands over IA+PD export / persona export / Figma links; an agent reads and interprets by hand each time. No automated importer. | Deliberately last in the sequence (Stage 4) — correct call, not a gap to rush, but still 0% built. | [X_SUITE_INTEGRATION.md](./X_SUITE_INTEGRATION.md), [CX_CONVEYOR.md](./CX_CONVEYOR.md) Stage 4 |
| 5 | **REC-as-acceptance isn't mandatory.** Tonight's pattern (build → REC a real journey → lock it as a fixture) was a deliberate choice for the flows it was applied to, not an enforced Definition of Done for every new flow going forward. | Nothing currently *forces* a new flow to ship with a regression fixture — relies on the agent remembering to do it. | [CX_CONVEYOR.md](./CX_CONVEYOR.md) Stage 3 |
| 6 | **`npm run smoke` (real-browser checks, including the new ambiguous-target gate) only runs on-demand.** A regression in this class can merge without anyone running it. | Deliberate, cost-driven trade-off ([CI_ACTIONS_BUDGET.md](./CI_ACTIONS_BUDGET.md)), not an oversight — but it means "gate-enforced" claims for this specific check are true only when someone actually runs `npm run smoke`. | [CI_ACTIONS_BUDGET.md](./CI_ACTIONS_BUDGET.md) |
| 7 | **FE handoff is a trustworthy reference, not shippable code.** Pages are genuinely UXDS-composed (gate-enforced), but the same files carry `data-studio-*`/REC/playback engine scaffolding and un-retired LEGACY CSS debt. No automated "strip prototype scaffolding" pass exists to separate the two. | Selling this as "hand refapp pages straight to FE for production" would be false today. | [CX_CONVEYOR.md](./CX_CONVEYOR.md) Stage 5 |
| 8 | **Refapp/UXDS roster hasn't started** — by design, sequenced behind #1/#2 above, not neglected. | Not a gap yet — flagged so it isn't mistaken for one; becomes a real gap only once #1/#2 are actually done and this still hasn't moved. | [CX_CONVEYOR.md](./CX_CONVEYOR.md) "The refapp bootstrap sequence" |

---

## The agreed sequence to close Part B (PO, 2026-07-24)

Strict order, each step gates the next — full detail in [CX_CONVEYOR.md](./CX_CONVEYOR.md) § "The refapp bootstrap sequence":

1. Boots pages flawless against the gate-enforced checklist — **done** (Part A, items 1–3).
2. Validate the full pipeline by building one genuinely new Boots page end to end — **not started** (gap #2).
3. Bootstrap refapp/UXDS-Larkin pages from that proven Boots output — **not started** (gap #8), blocked on #2.

Gaps #1 (second project), #3 (content layer), #4 (X-Suite automation), #5 (REC mandatory), #7 (FE strip pass) are parallel tracks, not blocked on the sequence above, but also not started.

---

## Related

- [CX_CONVEYOR.md](./CX_CONVEYOR.md) — full gap detail, the determinism boundary, stage-by-stage log
- [PRODUCT_OWNER_BRIEF.md](./PRODUCT_OWNER_BRIEF.md) — non-technical framing, the distinctive claim
- [UX_STUDIO_VISION.md](./UX_STUDIO_VISION.md) — north star, positioning

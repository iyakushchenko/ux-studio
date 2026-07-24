# CX Conveyor — roadmap to a more-or-less automated experience pipeline

**Status:** Stage 1 in progress · **Owner:** Tech direction (Quinn), PO accepts/sequences.
**One-line goal (PO, 2026-07-24):** hand an agent a user story (or an X-Suite export), the agent builds the missing pages and wires "good enough" controllers, the agent RECs and proves a CJM, the PO fills gaps by exception — not by manual bug-hunting.

This file is the build order. It does not restate the vision (see [UX_STUDIO_VISION.md](./UX_STUDIO_VISION.md), [X_SUITE_INTEGRATION.md](./X_SUITE_INTEGRATION.md), [CONCEPT_INTAKE.md](./CONCEPT_INTAKE.md) — the vision is already locked doctrine, written by the PO). This file exists because the vision and the enforcement of it were not yet the same thing.

---

## The determinism boundary (canonical — link here, don't restate)

Every gap this session found and closed sorts cleanly into one of two categories. Naming the boundary explicitly, once, here — every other doc should point at this section, not re-derive it.

**Engine territory — machine-checkable, gate it, no human needed once built:**
"Does this artifact satisfy a checkable contract?" Answerable by static analysis or a live DOM scan, with a yes/no that doesn't need taste. Examples already shipped: does a control have a stable identity (`check:interactive-identity`)? Is it unique on the page (`interactionInventory.ts` ambiguous-target)? Does a stateful control have script coverage (`check:cjm-coverage`)? Does a screen satisfy the build checklist (`check:page-final-pass`)? Does an import match its declared schema? **The rule: if you catch yourself writing the same manual check twice, it belongs here — build a gate, not a habit.**

**Judgment territory — structurally human/agent interpretation, permanently, not a tooling gap:**
"What should this *mean*, here, for this project?" No artifact answers this by being more complete — every X-Suite export checked so far (`IaNode.type`, `happy-path-json`, `CustomerJourneyMap.touchpoints[]`) confirms it: they carry a human-legible *label*, never a real `screenId`. Mapping "Product Listing Page" to this project's actual PLP is a UX call about what fits this brand's actual page set — not a data field waiting to be filled in by a richer export. Same category: product intent, acceptance, veto (`COMMAND_DOCTRINE.md`), what "good enough" means for a first draft, visual fidelity interpretation. **The rule: if answering it requires knowing what the project is *for*, not just what state the code/data is in, it belongs here — ask explicitly, never auto-resolve.**

**Applying this to something new:** ask "would two competent people ever disagree on the answer, given the same facts?" No → gate it (engine territory). Yes → it's a judgment call, surface it explicitly, don't build a heuristic that quietly picks one side.

---

## How far are we, honestly (no optimism)

Two separate gaps, both real, neither closed:

| Gap | Question it answers | State |
|---|---|---|
| **Project-boundary leak** (orthogonal to CX stages, blocks all of them at scale) | Can a *second* project even exist cleanly today? | **Partially — better than first thought, corrected same day.** A real registry + `ProjectDefinition` contract exist and work ([PROJECT_CONTRACT.md](./PROJECT_CONTRACT.md)) — proven by `puma`, a second registered project (empty content, honest no-op playback). Two Boots-only files have been relocated out of `src/app/` (2026-07-24). Still real: `footerContent.ts`/`hub/hubContent.ts`/`headerMount.tsx` hardcode Boots copy/nav directly, and `ProjectWireApi`'s availability/booking types are Boots-concrete, not generic — a project *with* a booking flow would hit this; Puma doesn't have one, so it hasn't yet. |
| **CX pipeline automation** (this file's 4 stages) | Given a project exists, how much of "user story → built, wired, REC'd CJM" is automated vs hand-crafted? | **~10%.** Only Stage 1's identity contract has shipped, and only for Boots-hardcoded scan paths (`SCAN_DIRS`/`SCREENS_DIR` in the gate scripts are literal `boots-pharmacy` paths, not project-agnostic yet). Stages 2–4 are 0% — written doctrine, zero enforcement. |
| **Content/copy layer** (new, named 2026-07-24) | If you duplicated Boots → Puma tomorrow, could you reword the whole page set in one place? | **No.** Brand copy (page titles, product names, filter/nav/mega-menu labels, persona name, logo) is hardcoded inline across engine-adjacent files, not a separable project-supplied data shape. Full writeup: [PROJECT_CONTRACT.md](./PROJECT_CONTRACT.md) § Content/copy layer. Target: one content-pack shape per project, JSON-compatible with X-Suite's eventual `IA/persona/brand` export. Not designed or built yet. |

**Net:** the *mechanics* of playback/REC/CJM are mature and real (this is not a toy engine). The *pipeline that builds new pages and wires them without hand-holding* barely exists. Treat any claim of "the engine can do X automatically" as false until it's cited against a gate, a test, or a live-verified run — same standard this session applied to itself (see PP-49).

---

## Human-in-the-loop map — what the PO must still do, by stage

| Stage | PO does today | PO does once stage ships |
|---|---|---|
| **0 (current reality)** | Supplies concept/reference, reviews every page build, manually discovers most bugs live | — |
| **1 — Identity contract** | Same, minus one bug class: unmarked/ambiguous controls are now caught by tooling, not by the PO hitting them in a demo | Reviews ceiling burn-down priority instead of reporting individual instances |
| **2 — Page-build contract enforced** | Supplies concept/user story + reference (`CONCEPT_INTAKE.md` §5), accepts/rejects the finished page | No longer needs to ask "is this record-ready?" — the gate answers before the PO sees it |
| **3 — REC-as-acceptance mandatory** | Performs or delegates the REC walkthrough for new/changed flows | Every shipped flow has a regression fixture by default; PO reviews the REC, doesn't have to demand one |
| **4 — X-Suite seam automated** | Exports persona/CJM from X-Suite, hands it to an agent, the agent *is* the seam | Supplies the export/user story + accepts or rejects the resulting CJM — closest to "good enough, I'll fill gaps" |

**What never goes away, by design, at any stage — this is not a temporary tooling gap, it is where UX expertise structurally lives (PO, 2026-07-24):** product intent, acceptance, veto, and — specifically — **mapping a free-text touchpoint/screen name to the actual right screen** stay human, permanently. Every X-Suite artifact examined (`happy-path-json`'s `type` field, the full `CustomerJourneyMap`'s `touchpoints[]`) confirms this concretely: none of them carry a real `screenId`, only a human-legible label a person or an agent has to *interpret* against the specific project's actual page set. No future export format closes that gap, because the judgment being made — "which of this project's real screens does 'Product Listing Page' mean, here, for this brand" — is a UX call, not a data-completeness problem. Automation targets *mechanical* gaps (missing wiring, undetected ambiguity, unproven flows — see Stages 1–3); it does not and should not target this one. See `COMMAND_DOCTRINE.md`'s existing PO/agent split.

---

## Why this order

Four stages. Only the last is genuinely unbuilt; the other three are *written* but not *enforced* — each depends on the one before it being trustworthy, so building top-down (stage 4 first) would just produce more silently-broken pages faster.

## The refapp bootstrap sequence (PO, 2026-07-24 — strategic goal, strict order)

Not simultaneous tracks. Each step gates the next:

1. **Existing Boots pages made flawless — architecturally and technically — against the strict checklist that already exists and is gate-enforced:** `PAGE_FINAL_PASS.md`'s checklist via `check:page-final-pass` (Stage 2 below). Not "mostly good" — every required key, true, for every registered screen, with no honor-system gaps (Stage 2's registry-derived enforcement exists specifically so this can't quietly slip).
2. **Only once that bar holds:** build the first genuinely **new** page in the Boots project — not a migration or recreation of something that already existed as Legacy, a real end-to-end validation that the full intake pipeline (`CONCEPT_INTAKE.md` S1/S2/S3 + `PAGE_BUILD_CONTRACT.md` + record-ready bar) actually works on a fresh page, not just on pages that were hand-nursed into shape over weeks.
3. **If that validates cleanly:** reuse the now-proven Boots pages to bootstrap refapp/UXDS pages — refapp gets built **from** validated Boots output, not independently from the raw UXDS Figma file in parallel. Boots pages are already UXDS-composed to a real degree; extracting/generalizing from proven, checklist-clean pages is lower-risk than starting a second track from scratch at the same time as the first is still being hardened.

This corrects the sourcing described in [PROJECT_CONTRACT.md](./PROJECT_CONTRACT.md)'s refapp section — refapp's origin is proven Boots pages, not the Figma file directly. The parity requirement on the resulting refapp pages themselves ([PROJECT_STYLEGUIDE.md](./PROJECT_STYLEGUIDE.md) § "When theme applies vs when direct UXDS parity is required") is unchanged — only *where the first draft comes from* changes.

## Stage 1 — Identity contract (foundation)

**Problem:** two different tools each independently decide "is this control ready" — the interaction inventory (accessibility semantics) and REC's capture logic (`data-studio-action`/`data-name`). A control can pass one and be invisible to the other. PP-49 (docs/product/PAINPOINTS.md) found this cost a whole recorded flow with zero trace.

**Status: shipped 2026-07-24 (first cut).** `scripts/check-interactive-identity.mjs` (`npm run check:interactive-identity`, wired into `test:gates`) fails when a JSX element with `onClick` carries no self-identity attribute (`data-studio-action`/`data-name`/`aria-label`/`role`/`href`). Ratcheted, not retrofitted: 25 pre-existing gaps baselined per-file (dated ceilings in the script) so the gate stops *new* regressions immediately without blocking on a full-app cleanup. Verified live against the exact PP-49 regression class before shipping.

**Uniqueness check: shipped same day.** `interactionInventory.ts`'s `stableSelector()` now flags `ambiguous: true` when a candidate identity attribute matches >1 live element — surfaced as `ambiguous-target` → `readiness: "invalid"`. Live-verified immediately: running "Map current page interactions" on `book-step-2` found the header mega-menu (4 items) and aux-nav (2 items) sharing generic `data-name`s, undiscovered until this run. Fixed (`Header.tsx`). One remaining ambiguous footer link left as backlog (low-risk).

**Ambiguous-target check: closed out 2026-07-24 (Playwright, not jsdom).** jsdom has no real layout — `getBoundingClientRect()` always returns zeros — so it can't run the visibility-based ambiguity check meaningfully; mounting screens there would either flag everything or nothing. `scripts/playwright-smoke.mjs` now calls `__studioMapAllInteractions()` against a real rendered Chromium page (real layout) as part of `npm run smoke`, and fails on any `invalid` item not in the documented exception list (`history-view-details`, the one intentionally-shared appointment-history control). Live-verified both directions: ran clean against real state (4 expected invalids, `pass: true`), then deliberately introduced a duplicate `data-studio-action` on PDP's two login-block buttons — caught immediately (`pass: false`, exact targets named) — then reverted. Per `CI_ACTIONS_BUDGET.md`'s locked policy, this rides the existing on-demand `workflow_dispatch` smoke job, not a new always-on gate — browser CI stays opt-in for cost reasons; this makes the check itself one scripted command instead of a human remembering to click through DevTools console.

**Not yet done:**
- The 25 baselined static-gate gaps are real, undiscovered risk (same shape as the forgot-password bug) — burn the ceiling down file by file.
- The interaction inventory and REC capture logic still don't share one *codified* definition of "ready" — they now agree in spirit (both key off the same identity attributes) but aren't the same code path. Converging them is the next real de-dup.
- The Playwright check above only runs when `npm run smoke` is actually invoked (locally or via manual `workflow_dispatch`) — it is the "real, one-command, repeatable" version of the sweep, not an "every push" gate. A PR merged without anyone running smoke still won't have this checked automatically. That trade-off is a direct, intentional consequence of the CI budget policy, not an oversight.

## Stage 2 — Page-build contract, enforced not written

`CONCEPT_INTAKE.md` already specifies the checklist (screenId registered, interactive fidelity, mandatory interaction inventory, record-ready bar). It is currently honor-system. Once Stage 1's uniqueness check exists, wire a "screen is record-ready" gate that a new/changed screen must pass — same shape as `check:page-final-pass`, but keyed to Stage 1's contract instead of visual parity.

## Stage 3 — REC-as-acceptance-test, mandatory not optional

Tonight's pattern (build/fix → REC a real journey → lock it as a checked-in regression fixture, see `src/app/recording/__tests__/thoroughRecJourney.test.ts`) was a choice, not a requirement. Make it Definition of Done for any new flow: no page/scenario ships without a REC pass + fixture, same discipline `PAGE_FINAL_PASS.md` already applies to visual/structural completeness.

## Stage 4 — X-Suite seam, automated

`X_SUITE_INTEGRATION.md` already documents the manual workflow (export → agent analyzes → builds pages → RECs a CJM → PO accepts) and explicitly says don't block on automating it. Correctly last: automating an importer on top of Stages 1–3 not yet solid would just automate producing more silently-broken pages, faster.

**What the PO actually hands over — confirmed against real files 2026-07-24, not guessed:** IA+PD export, Persona export, Figma concept links. Full breakdown (verified shapes, what each artifact does/doesn't cover): [X_SUITE_INTEGRATION.md](./X_SUITE_INTEGRATION.md) § "What the PO actually hands over".

**Shipped 2026-07-24:** `src/projects/happyPathAdapter.ts` (`adaptHappyPathToBeats`) — Persona export's `happy-path-json` → draft `JourneyBeat[]`. Deliberately does not guess a `screenId` for an X-Suite `type` the caller's map doesn't cover (Boots has no literal "cart"/"checkout" — same PP-49 discipline: flag unmapped, never invent). Persona intent copy (`note`) carried in a separate `notes` map since `JourneyBeat` has no narration field — first draft tried spreading a no-op field to fake it, caught and fixed before shipping. Tested against the real Emily Stone/Larkin fixture, not a synthetic shape. 4 new tests, `npm test` 164/164/1019/1019, 13/13 gates.

## Stage 5 — downstream: UXML → FE handoff (opposite direction from Stages 1–4)

Stages 1–4 are intake (X-Suite/concept → UXML). This is the exit: can a UXML page, once built, be handed to a real UI/FE team as a trustworthy production reference — or even source?

**Two different claims, don't conflate them (PO asked 2026-07-24):**

1. **"Built correctly against UXDS rules, so FE has a trustworthy reference to implement against."** Mostly real today. `DS_STRICTNESS.md` (locked doctrine) mandates UXDS components/tokens/kits only, no one-off CSS, strict CSS layer order (BASE→THEME→PANEL→LEGACY) — enforced by an actual gate, `check:theme-brand`, not just written policy. Pages genuinely aren't built from scratch; they're composed from the same design system FE would use.
2. **"The UXML code itself can be extracted and shipped as production code."** Not real. Prototype-engine scaffolding is baked into the same files as the UXDS composition: `data-studio-*` REC/QA hooks, playback wiring, `.studio-*` panel chrome, and genuine unretired LEGACY-CSS debt (`NEXT_STEPS.md` item 9, in progress). A literal handoff today hands FE a mix of clean composition and prototype-only residue with no automated way to tell them apart.

**Target, not yet built:** a "strip prototype scaffolding" gate/pass — the same determinism-boundary logic as everything else here: is a component pure UXDS composition (mechanically checkable, could be gated) vs. does it still carry engine-only wiring (also mechanically checkable — `data-studio-*`, `.studio-*`, `src/styles/globals-*.css` references are all greppable). Finishing LEGACY retirement is the concrete precondition; the scaffolding-strip pass is separately scoped work, not started.

---

## Log

- **2026-07-24 (Stage 2 first cut)** — Closed the exact honor-system gap Stage 2 names: `check-page-final-pass.mjs`'s required-screens list was a hand-maintained array, separate from both the manifest's own `requiredScreens` copy and the real screen registry (`screens.ts`) — three places that could silently drift, meaning a new screen could ship with zero final-pass enforcement if a human forgot the second/third copy. Made the registry authoritative: `deriveRequiredScreens()` reads `screenId` straight out of `screens.ts`; the manifest's `requiredScreens` is now cross-validated against it (drift either direction is a named failure, not silence). Verified live — registered a throwaway `ghost-new-screen` in `screens.ts`, confirmed the gate failed immediately with 3 concrete violations, reverted. `check:page-final-pass` still OK on real state, 13/13 gates green. Interaction-identity/uniqueness enforcement (the other half of "record-ready") was already app-wide and zero-ceiling from Stage 1, so this closes the remaining registration gap without a new script.

- **2026-07-24 (final pass tonight)** — Closed the dormant `readinessPass` doctrine gap: added `interactionInventoryReady` to `check-page-final-pass.mjs`'s `CHECKLIST_KEYS` (was never enforced despite the doctrine existing since 2026-07-19), live-checked all 9 required screens, stamped the manifest honestly — 8 fully clean, `appointment-history` stamped `true` with a documented exception (`history-view-details`, the one intentionally-shared control) per the doctrine's own "intentional controls are recorded" allowance. Verified the gate actually catches a regression (flipped one screen's key to `false`, confirmed FAIL, restored). Also fixed 2 more real gaps found along the way: PLP's filter rows/accordion/tiles/view-all links, My Account sidebar nav, appointment edit/cancel, PDP recipient toggle, and a genuine book-step-1 a11y nit (decorative icon spans missing `aria-hidden`). `npm test` 163/163/1015/1015, 13/13 gates.
- **2026-07-24 (yet later, same day)** — Found and fixed a scoping bug in the ambiguous-target detector itself (counted matches document-wide; this engine keeps every screen mounted-but-hidden, so hidden duplicate footers inflated every count from 191→74 invalid falsely). Fixed to match production's real behavior (visible-matches only). Then fixed the real remainder: PLP filter rows/accordion triggers/tiles (shared components, one fix each covers every instance), the My Account sidebar nav, appointment edit/cancel buttons, PDP recipient toggle — 74→6. Left 2 alone (decorative icon spans, pre-existing a11y nit) and 4 alone (`history-view-details` — intentionally shared, it's an actual `TabScriptId` in the playback director type system, not a bug). `npm test` 163/163/1015/1015, 13/13 gates.
- **2026-07-24 (later still, same day)** — Burned the remaining 13→0. Every real gap fixed and live-verified (login remember-me/create-account, PDP quick-sign-in/create-account, PLP home crumb + dynamic filter-chip removal, appointment card open-details/refund links, recipient/vaccine picker confirm buttons, availability-tool search-field/notify-me). `ALLOWLIST_CEILINGS` is now `{}` — any new unmarked `onClick` fails the build immediately, no grace period. `npm test` 163/163/1015/1015, 13/13 gates.
- **2026-07-24 (later same day)** — Burned 25→13 baselined identity gaps: fixed 5 real ones (`AppointmentDetailsScreen`, `AppointmentHistoryScreen`, `PdpScreen` crumb, `Footer` column links, `Header` account-flyout items) and corrected 2 gate false positives (`NearMeCta`/`WishlistHeart` are custom-component references whose real DOM identity lives in their own already-correct files — the gate now skips uppercase JSX tag references instead of flagging the caller). R1 (`CODEBASE_AUDIT_2026-07-24.md`): relocated `AvailabilityTool.tsx` (dead shim, deleted) and `BootsPharmacyLogo.tsx` (moved into `chrome/`) out of `src/app/`. R2 corrected: a project registry + contract already existed and works (`puma`, live-verified) — [PROJECT_CONTRACT.md](./PROJECT_CONTRACT.md) documents it instead of inventing a redundant one. `npm test` 163/163/1015/1015, 13/13 gates, all fixes live-verified in-browser.
- **2026-07-24** — Stage 1 first cut shipped (`check-interactive-identity.mjs`), 25 gaps baselined. Scoped during PP-49 investigation (forgot-password REC blind spot + duplicate "Change" selector). See [PAINPOINTS.md](./PAINPOINTS.md) PP-49 for the bug evidence this stage responds to.
- **2026-07-24 (same day)** — Stage 1's uniqueness half shipped (`interactionInventory.ts` `ambiguous-target`). Immediately caught 2 previously-unknown real bugs in the header (mega-menu nav + aux-nav ambiguous selectors) on first live run — direct proof the detection loop works, not just the static gate. Fixed both.

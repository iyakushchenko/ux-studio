# CX Conveyor — roadmap to a more-or-less automated experience pipeline

**Status:** Stage 1 in progress · **Owner:** Tech direction (Quinn), PO accepts/sequences.
**One-line goal (PO, 2026-07-24):** hand an agent a user story (or an X-Suite export), the agent builds the missing pages and wires "good enough" controllers, the agent RECs and proves a CJM, the PO fills gaps by exception — not by manual bug-hunting.

This file is the build order. It does not restate the vision (see [UX_STUDIO_VISION.md](./UX_STUDIO_VISION.md), [X_SUITE_INTEGRATION.md](./X_SUITE_INTEGRATION.md), [CONCEPT_INTAKE.md](./CONCEPT_INTAKE.md) — the vision is already locked doctrine, written by the PO). This file exists because the vision and the enforcement of it were not yet the same thing.

---

## How far are we, honestly (no optimism)

Two separate gaps, both real, neither closed:

| Gap | Question it answers | State |
|---|---|---|
| **Project-boundary leak** (orthogonal to CX stages, blocks all of them at scale) | Can a *second* project even exist cleanly today? | **Partially — better than first thought, corrected same day.** A real registry + `ProjectDefinition` contract exist and work ([PROJECT_CONTRACT.md](./PROJECT_CONTRACT.md)) — proven by `puma`, a second registered project (empty content, honest no-op playback). Two Boots-only files have been relocated out of `src/app/` (2026-07-24). Still real: `footerContent.ts`/`hub/hubContent.ts`/`headerMount.tsx` hardcode Boots copy/nav directly, and `ProjectWireApi`'s availability/booking types are Boots-concrete, not generic — a project *with* a booking flow would hit this; Puma doesn't have one, so it hasn't yet. |
| **CX pipeline automation** (this file's 4 stages) | Given a project exists, how much of "user story → built, wired, REC'd CJM" is automated vs hand-crafted? | **~10%.** Only Stage 1's identity contract has shipped, and only for Boots-hardcoded scan paths (`SCAN_DIRS`/`SCREENS_DIR` in the gate scripts are literal `boots-pharmacy` paths, not project-agnostic yet). Stages 2–4 are 0% — written doctrine, zero enforcement. |

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

**What never goes away, by design, at any stage:** product intent, acceptance, and veto stay human — see `COMMAND_DOCTRINE.md`'s existing PO/agent split. Automation targets *mechanical* gaps (missing wiring, undetected ambiguity, unproven flows), not product judgment.

---

## Why this order

Four stages. Only the last is genuinely unbuilt; the other three are *written* but not *enforced* — each depends on the one before it being trustworthy, so building top-down (stage 4 first) would just produce more silently-broken pages faster.

## Stage 1 — Identity contract (foundation)

**Problem:** two different tools each independently decide "is this control ready" — the interaction inventory (accessibility semantics) and REC's capture logic (`data-studio-action`/`data-name`). A control can pass one and be invisible to the other. PP-49 (docs/product/PAINPOINTS.md) found this cost a whole recorded flow with zero trace.

**Status: shipped 2026-07-24 (first cut).** `scripts/check-interactive-identity.mjs` (`npm run check:interactive-identity`, wired into `test:gates`) fails when a JSX element with `onClick` carries no self-identity attribute (`data-studio-action`/`data-name`/`aria-label`/`role`/`href`). Ratcheted, not retrofitted: 25 pre-existing gaps baselined per-file (dated ceilings in the script) so the gate stops *new* regressions immediately without blocking on a full-app cleanup. Verified live against the exact PP-49 regression class before shipping.

**Uniqueness check: shipped same day.** `interactionInventory.ts`'s `stableSelector()` now flags `ambiguous: true` when a candidate identity attribute matches >1 live element — surfaced as `ambiguous-target` → `readiness: "invalid"`. Live-verified immediately: running "Map current page interactions" on `book-step-2` found the header mega-menu (4 items) and aux-nav (2 items) sharing generic `data-name`s, undiscovered until this run. Fixed (`Header.tsx`). One remaining ambiguous footer link left as backlog (low-risk).

**Not yet done:**
- The 25 baselined static-gate gaps are real, undiscovered risk (same shape as the forgot-password bug) — burn the ceiling down file by file.
- The interaction inventory and REC capture logic still don't share one *codified* definition of "ready" — they now agree in spirit (both key off the same identity attributes) but aren't the same code path. Converging them is the next real de-dup.
- The inventory's ambiguous-target check only runs on demand (`__studioMapCurrentInteractions`/`__studioMapAllInteractions`, live in-browser) — not part of `npm test`/CI. Static gate (Stage 1a) is the CI-enforced half; this is the browser-verified half. No automatic CI equivalent yet for duplicate-selector detection.

## Stage 2 — Page-build contract, enforced not written

`CONCEPT_INTAKE.md` already specifies the checklist (screenId registered, interactive fidelity, mandatory interaction inventory, record-ready bar). It is currently honor-system. Once Stage 1's uniqueness check exists, wire a "screen is record-ready" gate that a new/changed screen must pass — same shape as `check:page-final-pass`, but keyed to Stage 1's contract instead of visual parity.

## Stage 3 — REC-as-acceptance-test, mandatory not optional

Tonight's pattern (build/fix → REC a real journey → lock it as a checked-in regression fixture, see `src/app/recording/__tests__/thoroughRecJourney.test.ts`) was a choice, not a requirement. Make it Definition of Done for any new flow: no page/scenario ships without a REC pass + fixture, same discipline `PAGE_FINAL_PASS.md` already applies to visual/structural completeness.

## Stage 4 — X-Suite seam, automated

`X_SUITE_INTEGRATION.md` already documents the manual workflow (export → agent analyzes → builds pages → RECs a CJM → PO accepts) and explicitly says don't block on automating it. Correctly last: automating an importer on top of Stages 1–3 not yet solid would just automate producing more silently-broken pages, faster.

---

## Log

- **2026-07-24 (later still, same day)** — Burned the remaining 13→0. Every real gap fixed and live-verified (login remember-me/create-account, PDP quick-sign-in/create-account, PLP home crumb + dynamic filter-chip removal, appointment card open-details/refund links, recipient/vaccine picker confirm buttons, availability-tool search-field/notify-me). `ALLOWLIST_CEILINGS` is now `{}` — any new unmarked `onClick` fails the build immediately, no grace period. `npm test` 163/163/1015/1015, 13/13 gates.
- **2026-07-24 (later same day)** — Burned 25→13 baselined identity gaps: fixed 5 real ones (`AppointmentDetailsScreen`, `AppointmentHistoryScreen`, `PdpScreen` crumb, `Footer` column links, `Header` account-flyout items) and corrected 2 gate false positives (`NearMeCta`/`WishlistHeart` are custom-component references whose real DOM identity lives in their own already-correct files — the gate now skips uppercase JSX tag references instead of flagging the caller). R1 (`CODEBASE_AUDIT_2026-07-24.md`): relocated `AvailabilityTool.tsx` (dead shim, deleted) and `BootsPharmacyLogo.tsx` (moved into `chrome/`) out of `src/app/`. R2 corrected: a project registry + contract already existed and works (`puma`, live-verified) — [PROJECT_CONTRACT.md](./PROJECT_CONTRACT.md) documents it instead of inventing a redundant one. `npm test` 163/163/1015/1015, 13/13 gates, all fixes live-verified in-browser.
- **2026-07-24** — Stage 1 first cut shipped (`check-interactive-identity.mjs`), 25 gaps baselined. Scoped during PP-49 investigation (forgot-password REC blind spot + duplicate "Change" selector). See [PAINPOINTS.md](./PAINPOINTS.md) PP-49 for the bug evidence this stage responds to.
- **2026-07-24 (same day)** — Stage 1's uniqueness half shipped (`interactionInventory.ts` `ambiguous-target`). Immediately caught 2 previously-unknown real bugs in the header (mega-menu nav + aux-nav ambiguous selectors) on first live run — direct proof the detection loop works, not just the static gate. Fixed both.

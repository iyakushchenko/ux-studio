# Codebase audit — shape, state, and second-rabbit readiness

**Status:** Snapshot (Arch), 2026-07-24  
**Scope:** Whole repo — engine (`src/app/`), UXDS (`src/uxds/`), Boots concept (`src/projects/boots-pharmacy/`), LEGACY (`src/styles/globals-*.css`), doc corpus.  
**Why this doc exists:** The PO asked to defer early-on mistakes that are cheap to fix now and expensive once a **second project** exists. This is a synthesis pass, not a new debt-tracking system — [PAINPOINTS.md](./PAINPOINTS.md), [LESSONS_LEARNED.md](./LESSONS_LEARNED.md), and [HYGIENE.md](./HYGIENE.md) already track granular debt well. This doc looks one layer up: **what will hurt specifically because we're about to go from 1 project to 2+.**

---

## 1. Snapshot

| Metric | Value |
|---|---|
| Source files (`.ts`/`.tsx`/`.css` under `src/`) | ~625 (149 `.tsx`, 428 `.ts`, 48 `.css`) |
| Total LOC (same set) | ~109,900 |
| Test files | 162 (1008 tests per last green run) |
| `docs/product/*.md` | 46 files |
| `scripts/*.mjs` (CI gates + tooling) | 45 |
| Concept projects live today | 2 registered (`boots-pharmacy` real, `puma` honest empty stub) — corrected 2026-07-24, see R2 |
| CI gates wired into `npm test` | hygiene, felonies, version/changelog sync, page-final-pass, docs-links, docs-governance, text-link-contract, parity-ratchets, parity-proven, theme-brand, uxds-inventory + vitest |

**Read on this:** for a single-project prototype, this is an unusually well-governed codebase — locked doctrine docs, CI-enforced file-size ratchets, a naming law, a CSS layer contract, and an append-only lessons ledger are not typical at this stage. That governance is the asset worth protecting. The risks below are places where the governance has a **blind spot specifically at the project boundary**, because there has only ever been one project to govern.

---

## 2. What's already solid (do not re-litigate)

- **CSS layer contract** (BASE → THEME → PANEL → LEGACY, [CSS_BASE_THEME.md](./CSS_BASE_THEME.md), [DS_STRICTNESS.md](./DS_STRICTNESS.md)) is real and CI-checked (`check:theme-brand`), not aspirational.
- **File-hygiene ratchet** ([HYGIENE.md](./HYGIENE.md)) — monster files require a named allowlist entry with rationale, not silent growth. Good friction.
- **Page Final Pass gate** — no migrated screen starts until the previous one is hard-green. This is exactly the kind of forcing function that prevents compounding debt, and it's working (9 screens through it cleanly per `NEXT_STEPS.md`).
- **Lessons/painpoints as living ledgers** rather than tribal knowledge — genuinely rare discipline, keeps agents from re-discovering the same failure class.

---

## 3. Risk register — ranked by (compounding cost if deferred) × (cheapness to fix now)

### R1 — Boots-specific code lives inside the "engine" folder, not under `src/projects/boots-pharmacy/` (HIGH priority, cheap now)

**Evidence:**
- `src/app/AvailabilityTool.tsx` and `src/app/BootsPharmacyLogo.tsx` sit at the **root of `src/app/`** — the engine domain per [ARCHITECTURE.md](./ARCHITECTURE.md), which explicitly defines `src/projects/<id>/` as the home for "Concept packages (screens, wire, DOM, theme)."
- `src/app/chrome/footerContent.ts`, `headerMount.tsx`, `hub/hubContent.ts` hardcode Boots copy/nav/brand content directly, not as data passed in from a project layer.
- 85 files under `src/app/` reference "boots" in some form — some legitimately (mount/attach call sites that must reference *a* project), many because content or logic that's Boots-specific was authored directly in engine files rather than injected.

**Why it compounds:** Today "the engine" and "Boots" are accidentally the same codebase wearing two folder names. The moment project #2 needs a header, footer, hub page, or availability tool, an agent has two bad options: fork `headerMount.tsx`/`footerContent.ts` wholesale (parallel-maintenance debt from day one of project #2), or thread `if (projectId === 'boots-pharmacy')` branches into files `ARCHITECTURE.md` calls "engine." Either path is exactly the kind of mistake that's a 30-minute fix today and a multi-file untangle later.

**Fix now (cheap):**
1. Move `AvailabilityTool.tsx` and `BootsPharmacyLogo.tsx` into `src/projects/boots-pharmacy/` (they are concept, not engine, by the doc's own definition).
2. Audit `chrome/footerContent.ts`, `chrome/footerConfig.ts`, `hub/hubContent.ts`, `headerMount.tsx` for hardcoded Boots strings/nav items; where feasible, shape them as a `ProjectChromeContent` object the *project* supplies and the engine mount function consumes generically (see R2 — don't over-build this, just stop the bleeding at the boundary).

**Do not:** attempt a full DI/plugin rearchitecture in this pass. Just relocate what's misplaced and stop new Boots-only code from landing under `src/app/` — [NAMING.md](./NAMING.md) / folder-verb discipline already gives agents the rule; it just hasn't been back-applied to these two files.

---

### R2 — CORRECTED 2026-07-24 (Quinn, same day, verified against source): a project registry and contract already exist — the gap is narrower than first stated

**Original claim (wrong, kept here for the record):** "there is currently zero code representing 'a project' as a typed/registered concept (no `ProjectDefinition`, no manifest, no registry file)." **This was false** — verified by reading the actual source, not re-inferred from doctrine docs.

**What actually exists:** `src/projects/types.ts` defines a real, used `ProjectDefinition` contract (content manifest, personas, `ProjectPlayback`, optional `wireComponent`). `src/projects/registry.ts` is a real, working registry (`STUDIO_PROJECTS`, `getProjectById`, `getDefaultProject`). **A second project is already registered**: `src/projects/puma/` (id `puma`, label "UXDS - Larkin") — zero screens (`EMPTY_PROJECT_CONTENT`), no-op playback that honestly fails with `"puma: availability scripts not implemented"` rather than faking success. This is deliberate, honest scaffolding, not dead code — it's the exact "prove the seam with a stub" discipline [COMPONENT_LIBRARY.md](./COMPONENT_LIBRARY.md) already asks for, one level up.

**The real, narrower gap:** the registry/content/persona/playback layers of the contract are genuinely generic — Puma proves it, empirically, not just on paper. The leak is one layer down: `ProjectWireApi` (the popup/state surface a project's wire component exposes back to the shell) is typed using Boots-concrete types — `AvailOpenIntent`, `AvailStep`, `ChosenBookingSlot` — imported directly from `src/projects/boots-pharmacy/overlays/AvailabilityTool.tsx` into the supposedly-generic `src/projects/types.ts`. A project without an availability/booking flow (Puma, today) never touches this and is unaffected. A project *with* one would either have to shape its flow to match Boots's exact types or the engine's `ProjectWireApi` contract would need genericizing first.

**Fix now:** none required — Puma already demonstrates the registry/content/persona/playback contract works for a real (if empty) second project, so R2's original "write PROJECT_CONTRACT.md before project #2's first line" framing is moot; project #2 (as a registration) already shipped. What's still worth a short doc is capturing *this corrected understanding* so the next agent doesn't re-read `types.ts` cold — see [PROJECT_CONTRACT.md](./PROJECT_CONTRACT.md) (written same day, documents the real contract + the one named leak instead of inventing a new one).

**Do not:** genericize `ProjectWireApi`'s availability/booking shape speculatively — no second project needs it yet (Puma doesn't). Generalize only when a real second consumer needs an availability/booking flow, per the same "extract on second use" rule.

---

### R3 — Playback/REC/prove harness has no single source of truth (already flagged, correctly deferred — watch, don't touch)

**Evidence:** [LESSONS_LEARNED.md](./LESSONS_LEARNED.md) §"Playback/REC/QA prove surface — architecture debt" and `NEXT_STEPS.md` LATER 12a / PAINPOINTS PP-41 already name this precisely: logic scattered across `completeJourneyPlay` + many duplicated prove contracts, so one product-level flip cascades across smokes/docs/asserts.

**Why it's here anyway:** this is the one existing debt item most likely to **double** the moment project #2 exists, because prove/playback contracts today are partly Boots-shaped (beat scripts reference `book.ts`, `plp`, etc. by name in several places). If project #2 starts before this consolidates, its scripts will likely copy the same scattered pattern rather than a clean API, making the eventual refactor larger, not smaller.

**Fix now:** nothing structural — the team's own decision to gate this behind "Arch/Pax open the wave" is correct; don't start it opportunistically mid-audit. **Do** add one line to whatever kicks off project #2: *"new project beat-script wiring must not deepen the prove-harness sprawl — flag to Arch before adding a new parallel prove contract."* That's a process guard, not code.

---

### R4 — Hygiene ceiling is a ratchet, and it's ratcheting up, not down

**Evidence:** `scripts/check-file-hygiene.mjs` allowlist currently has 10 entries, several bumped multiple times with same-day rationale comments (e.g. `agentTestingOverlay.ts` at 4850 lines, `BootsPharmacyProjectView.tsx` at 4900, `demoCursor.ts` at 2250). The mechanism (require a rationale to bump) is good; the *trend* — ceilings only ever move up — means "prefer splitting" is currently theory, not practice, for the largest files in the repo.

**Why it compounds:** `BootsPharmacyProjectView.tsx` at ~4900 lines is the single largest project file and is also the file most likely to be referenced (as pattern, if not code) when project #2's wire file gets written. A 4900-line "wire" file is not a template you want copied.

**Fix now:** don't split these files as part of this pass — that's real, separate work already implicitly scoped by board item #10 ("Engine monster splits — on next touch... extract by domain"). The cheap fix now is **narrower**: when project #2's own wire/view file is created, explicitly do *not* let it start as a `BootsPharmacyProjectView.tsx` clone-and-rename. Structure it from a lower ceiling from day one (per-screen mount modules composed by a thin wire file), so project #2 doesn't inherit the monster shape at birth.

---

### R5 — LEGACY CSS retirement has no forcing function beyond "screen by screen, eventually"

**Evidence:** `globals-screens.css` (2891/3200 ceiling), `globals-chrome.css` (2522/2650), `globals-hub.css` (1334/1400) are all allowlisted and all close to their own ceilings. [NEXT_STEPS.md](./NEXT_STEPS.md) #9 (LEGACY retirement) is `[~]` in progress with real recent cuts (Phase C, -114 lines), but the mechanism is "shrink when a screen migrates," and several ceilings are already within ~100–300 lines of being hit again.

**Why it compounds:** not a second-project risk specifically, but relevant to strategy: if project #2 is scoped before Boots's own LEGACY sheets are fully retired, you now have two active concept surfaces both partially depending on quarantined global CSS, doubling the surface a future "did this new page accidentally depend on Legacy globals" review has to cover.

**Fix now:** none required structurally — this is correctly sequenced behind Book Legacy-child deletion (already done) and the dead-`useEffect` sweep (in progress, discussed last turn). Just noting it as a **soft precondition**: finishing #9 before starting project #2 is worth more than starting project #2 sooner.

---

### R6 — Documentation is a strength that is starting to show its own scaling cost

**Evidence:** `LESSONS_LEARNED.md` is 1085 lines, append-only by design, with a hand-maintained topic index at the top. `docs/product/` has 46 files. This is not bloat — it's working memory that has clearly prevented repeat mistakes (the topic index cross-references are genuinely useful) — but it is monotonically growing with no compaction step, and a second project will roughly double the entry rate.

**Why it's worth naming now:** not urgent, but the fix is cheap if decided early: **partition by project now**, before volume makes it painful. Concretely — topics that are Boots-content-specific (e.g. PLP bookmark spinner, My Account nav panel) vs. topics that are engine-general (e.g. content-load SSoT, sticky-offset math, hover-state CSS specificity traps) are already distinguishable in the existing entries. Consider a `LESSONS_LEARNED_ENGINE.md` / project-scoped lessons split *before* project #2 starts adding entries, rather than sorting 2x the volume retroactively.

**Do not** do this as a large reorg right now — flag it as a "when board bandwidth allows" item, not a blocker.

---

## 4. Recommended sequencing (ties to `NEXT_STEPS.md`)

The board's own sequencing is already close to right. This audit's only addition is inserting a **one-time de-risk pass** before board item #13 ("Second project rabbit"), not instead of anything currently in flight:

1. **Continue current work as planned** — Phase F dead-`useEffect` sweep (board #9), then whatever finishes LEGACY retirement.
2. **Before project #2 kicks off (not before, not urgently now):**
   - R1: relocate `AvailabilityTool.tsx` / `BootsPharmacyLogo.tsx` out of `src/app/`; note-and-defer the header/footer/hub content-shape cleanup if it's larger than expected.
   - R2: write `PROJECT_CONTRACT.md` (one page) capturing what Boots implicitly required of the engine, framed as a contract a second project must satisfy.
   - R4: decide the shape of project #2's wire file *before* writing it (composition of small per-screen mounts, not a single monster view file) — a naming-conventions decision, costs nothing to state up front.
3. **Leave alone for now (correctly deferred elsewhere):** prove-harness SSoT refactor (R3, PP-41), full LEGACY CSS zero-out (R5), lessons-doc partition (R6). Revisit each only when its own named trigger fires (Arch/Pax open the wave; screen retirement continues; doc volume becomes a real drag).

**Net ask of the PO:** two small, cheap moves (R1) plus one short doc (R2) before project #2's first line of code. Everything else on this list is already correctly sequenced by the existing board — this audit didn't find hidden fires, it found one real architectural leak (engine/project boundary) worth closing while it's still a 2-file fix.

---

## Related

- [ARCHITECTURE.md](./ARCHITECTURE.md) · [HYGIENE.md](./HYGIENE.md) · [DS_STRICTNESS.md](./DS_STRICTNESS.md)
- [NEXT_STEPS.md](./NEXT_STEPS.md) · [PRODUCT_FORECAST.md](./PRODUCT_FORECAST.md) · [PAINPOINTS.md](./PAINPOINTS.md) · [LESSONS_LEARNED.md](./LESSONS_LEARNED.md)
- **[CX_CONVEYOR.md](./CX_CONVEYOR.md)** — R1/R2 here are the project-boundary half of that file's "how far are we, honestly" gap assessment; the CX Conveyor's 4 stages are the other (orthogonal) half.

# Product Owner brief — UX Studio (A–Z)

**Audience:** Product Owner (you).  
**Commander:** Cursor agent = **Tech Director + Architect + BA + UX + FE/UI** composite — **decides all tech direction and next steps**; forecasts risks proactively.  
**Doctrine:** [COMMAND_DOCTRINE.md](./COMMAND_DOCTRINE.md) §0–§2 · always-on rule [`.cursor/rules/ux-studio-director.mdc`](../../.cursor/rules/ux-studio-director.mdc)  
**Last updated:** 2026-07-21  
**Live delivery status:** [NEXT_STEPS.md](./NEXT_STEPS.md) is the only mutable source for NOW/NEXT/blockers. This brief explains the product and preserves durable PO decisions; it is not a sprint board.

### PO note — you don’t need to re-argue this

The agent **owns** role, tech, sequencing, CSS layers, motion defaults, handoff distrust, and the FE audit gate. You do **not** need to remind or re-debate those. You own product intent, Figma/UXDS truth, and accept/reject. If something feels wrong for the business or brand, veto in product language — the agent adjusts.

---

## A. What we are building

**UX Studio** is an **engine** for playable UX concepts + journey maps (CJMs) + recorded scenarios.

**Early business purpose:** discovery, ideation, solution proofing, hypothesis validation — not production polish.

You will often feed **rough / early concepts** (even Make-class strips that are not UXDS-clean). The agent’s job is to **fill the gap** and ship proper React + UXDS pages in Studio. Details: [CONCEPT_INTAKE.md](./CONCEPT_INTAKE.md).

It is **not** “the Boots vaccine prototype.” Boots Pharmacy is only the **first test rabbit** under `src/projects/boots-pharmacy/`.

Live demo (after Pages deploy): https://iyakushchenko.github.io/ux-studio/

---

## B. Where the work lives (critical)

| Location | Status |
|----------|--------|
| **`E:\UX\ux-studio`** | **Canonical** — open this folder in Cursor from now on |
| `https://github.com/iyakushchenko/ux-studio` | GitHub remote (renamed) |
| `C:\Users\iyaku\UXCJM-BootsHealth-VaccineConcept` | **Abandoned** — do not use |
| `E:\UX\UXCJM-BootsHealth-VaccineConcept` (if present) | **Abandoned** |

If Cursor still shows the old name, you opened the wrong folder. Use **File → Open Folder → `E:\UX\ux-studio`**. Prefer a **new chat** in that folder so the agent is not stuck on the old path.

---

## C. Your role vs the agent’s role

| You (Product Owner) | Agent (Director / Architect / BA / UX / FE) |
|---------------------|---------------------------------------------|
| Product intent + veto if something is wrong for the business | **Decides** tech direction, architecture, and **next steps** — always |
| Own Figma / UXDS as design truth (deliver links when asked) | Translates UXDS into React + engine wiring; fills BA/UX gaps |
| Accept / reject how the product feels | Builds it; documents decisions the same turn |
| Say what “good” looks like in product language | Does not ask you to pick among tech options |
| Do **not** re-argue role / CSS / motion / audit gates | **Proactively** spots layout drift, style zoo, bad handoffs, REC bugs, CI gaps |

You do **not** need to be technical. You do **not** choose the build order.  
You **do** open `E:\UX\ux-studio` and supply UXDS/Figma when the commander requests assets.

Full rules: [COMMAND_DOCTRINE.md](./COMMAND_DOCTRINE.md) §0–§2.

---

## D. Two products inside one repo (mental model)

```
┌─────────────────────────────────────────────┐
│  ENGINE  (src/app/)                         │
│  Studio chrome: tabs, play/pause, recording │
│  Orchestra, diagnostics, MCP helpers        │
└─────────────────────────────────────────────┘
                    │ hosts
                    ▼
┌─────────────────────────────────────────────┐
│  PROJECTS  (src/projects/<id>/)             │
│  Concept pages (React + UXDS)               │
│  Personas, journeys, playback scripts       │
│  First rabbit: boots-pharmacy               │
└─────────────────────────────────────────────┘
```

- Engine work can proceed without perfect Boots pages.
- Client-facing quality lives in **project pages**, which must eventually be **React + full UXDS** — not Figma Make HTML dumps.

---

## E. How we build pages (decision locked)

**Yes — React for all concept UI. Full design system (your UXDS).**

| Layer | Technology | Source of truth |
|-------|------------|-----------------|
| Concept screens / popups / forms | React components | UXDS patterns + variables |
| Tokens (color, type, space, radius) | CSS variables mapped from UXDS | UXDS variables |
| Studio shell (control room) | React | Can stay lean; may later share UXDS tokens for chrome only |

**Figma Make export** = temporary bootstrap only. We do **not** treat Make HTML/CSS as the long-term page architecture.

See [PAGE_BUILD_CONTRACT.md](./PAGE_BUILD_CONTRACT.md).

---

## F. Do you need to give me UXDS access? (short answer)

| Goal | Need UXDS now? |
|------|----------------|
| Finish **recording foundation / recorder UI** (engine) | **Not required** — can proceed |
| Rebuild Boots (or any) concept pages “for real” | **Yes — required** |
| Minimize friction between your Figma mindset and the agent | **Yes — as early as practical** |

**Recommendation:** Share UXDS **before** we invest in rebuilding pages. For the next pure-engine slice (recorder UI), UXDS can wait a beat — but we should **schedule UXDS access next**, not months later.

Exactly what to share: [UXDS_ACCESS.md](./UXDS_ACCESS.md).

---

## G. Direction from Summarizer (your preferred way of working)

We looked at `E:\UX\Summarizer`. We will **borrow the spirit**, not copy the plugin machinery.

**Keep (fits UX Studio):**
- Clear docs catalog + “start here” reading order
- Product / architecture / feature docs with ownership
- Design-system contract (tokens → components → lanes)
- Strong agent rules so decisions don’t evaporate
- Gates that protect quality (start lighter than Summarizer’s full `npm run check`)

**Do not copy wholesale:**
- Figma plugin “two worlds” (`code` vs `ui`)
- Heavy release-notes / publish-to-Figma pipeline
- Every CSS governance script on day one

Details: [DIRECTION_FROM_SUMMARIZER.md](./DIRECTION_FROM_SUMMARIZER.md).

---

## H. Sequence (commander — not a menu)

See [COMMAND_DOCTRINE.md](./COMMAND_DOCTRINE.md) §5. Current order:

1. ✅ Workspace + doctrine + page contract.  
2. ✅ UXDS Larkin delivered + inventoried (`docs/uxds/`); X-Suite seam noted.  
3. ✅ Interaction fidelity doctrine — record only after pages are interactive; shared behavior library ([INTERACTION_FIDELITY.md](./INTERACTION_FIDELITY.md)).  
4. ✅ Recording UI (engine).  
5. ✅ Thin UXDS foundation + Boots theme + Availability Tool kit enrichment.  
6. ✅ Visual fidelity doctrine + Book Step 1 React pilot (behavior parity with Make).  
7. ✅ PLP, PDP, Site Pilot, and Chat migrations reached PAGE FINAL PASS hard-green.  
8. **Current:** use [NEXT_STEPS.md](./NEXT_STEPS.md) for the next open page and playback-quality blockers.  
9. Scale rebuild; later X-Suite import + compiler.

---

## I. What “success” looks like for you

- Open Studio → pick project / persona / CJM → play a journey that feels real.
- Pages feel interactive enough to use (filters, CTAs, forms) — then record a walkthrough → save a file → replay it.
- Ask the agent to add a scenario without rewriting the whole prototype.
- New concepts start from **UXDS in Figma**, not from throwaway Make HTML.

### Recording needs interactive pages (PO note)

You cannot usefully record on a screen that does not respond. Before recording, the agent should build the on-page logic your scenario needs (where buttons go, working filters, etc.) using a **shared library** of common website behaviors — not one-off scripts that explode over time. You may later point the agent at a **CJM deck** so it can derive those requirements. Doctrine: [INTERACTION_FIDELITY.md](./INTERACTION_FIDELITY.md).

---

## J. How to talk to the agent (practical)

Good PO messages:
- “Add this page — here’s the concept URL: …”
- “Add a page from what we already have — reuse PLP / booking modules…” (no URL needed)
- “Here’s the UXDS Figma link.”
- “This screen is approved — Make is obsolete for it.”
- “Client hates X — veto.”
- “Does this journey feel right?”

New-concept page asks without a URL → agent asks for the link.  
“From what we already have” → agent reuses UXDS + internal components; no URL demand.

Avoid:
- Asking the agent to list tech options for you to pick.
- Editing abandoned `UXCJM-*` folders.
- Expecting to drive sprint order — that’s the commander’s job.

---

## K. Decision routing and historical ledger

This section preserves PO decisions in chronological order; it is **not** the live backlog. Use the active source below for the current rule. If a later decision supersedes an earlier row, keep both rows and add an explicit forward pointer rather than rewriting history. Full lifecycle: [DOC_GOVERNANCE.md](./DOC_GOVERNANCE.md).

### Active decision sources

| Decision area | Current authoritative source |
|---------------|------------------------------|
| Product purpose and intake | [UX_STUDIO_VISION.md](./UX_STUDIO_VISION.md) · [CONCEPT_INTAKE.md](./CONCEPT_INTAKE.md) |
| Roles, sequencing rules, and quality gates | [COMMAND_DOCTRINE.md](./COMMAND_DOCTRINE.md) · [PAGE_FINAL_PASS.md](./PAGE_FINAL_PASS.md) |
| Current priority, blockers, and completion | [NEXT_STEPS.md](./NEXT_STEPS.md) |
| Page stack, UXDS, interaction, and fidelity | [PAGE_BUILD_CONTRACT.md](./PAGE_BUILD_CONTRACT.md) · [INTERACTION_FIDELITY.md](./INTERACTION_FIDELITY.md) · [VISUAL_FIDELITY.md](./VISUAL_FIDELITY.md) |
| URL, recording, and playback behavior | [URL.md](../shell/URL.md) · [RECORDING.md](../shell/RECORDING.md) · [PLAYBACK.md](../shell/PLAYBACK.md) |
| X-Suite handoff | [X_SUITE_INTEGRATION.md](./X_SUITE_INTEGRATION.md) |
| Documentation authority and supersession | [DOC_GOVERNANCE.md](./DOC_GOVERNANCE.md) |

### Historical decision ledger

| Date | Decision |
|------|----------|
| 2026-07-23 | **Hover-reveal REC capture — backlog, not now (option A now, option C later):** hover-triggered UI (mega-menu flyout) cannot be captured/replayed into a CJM today — no `hover` event kind exists engine-wide, and `MegaMenuFlyout` unmounts on close so a replay click has no target. PO wants the full fix eventually: a first-class recordable `hover-reveal` event kind through capture → compile → replay (engine-wide, not a mega-menu-only patch). For now: leave as an honest, documented gap — do not build the interim mounted-but-hidden workaround. Board: [NEXT_STEPS.md](./NEXT_STEPS.md) LATER 12b · [RECORDING.md](../shell/RECORDING.md) § Known gap · [LESSONS_LEARNED.md](./LESSONS_LEARNED.md#topic-hover-reveal-rec). |
| 2026-07-22 | **Non-destructive overlays (HARD):** Opening a popup (e.g. Availability / Choose Date) must **not** hide, freeze, or `display:none` the page beneath. Engine/project modals sit on top; underlay stays painted. Perf = solid scrim only (no backdrop-filter / no underlay `content-visibility:hidden`). [LESSONS](./LESSONS_LEARNED.md#topic-overlay-underlay). |
| 2026-07-22 | **P0 future — Playback/REC/QA prove refactor (not now):** Architecture refactor + single regression harness so one-line product flips (e.g. play-end stay-at-end) do not cascade across smokes/docs/asserts. Pain = token burn + scattered law. Desired = one SSoT behavior module + thin prove API. Board: [NEXT_STEPS.md](./NEXT_STEPS.md) LATER 12a · [PAINPOINTS.md](./PAINPOINTS.md) PP-41. |
| 2026-07-22 | **Play end stays at finale (HARD):** Continuous Play completion must **not** auto-rewind to CJM start. Leave the player on the last beat / N/N / last product screen. Jump-to-start remains for manual rewind. Step-forward on the last beat stays (no complete/rewind). Assert: `__studioAssertPlayEndedAtEnd`. See [PLAYBACK.md](../shell/PLAYBACK.md) · [PLAYBACK_DIAG.md](../shell/PLAYBACK_DIAG.md). |
| 2026-07-22 | **PAGE CREATE INHERITANCE (HARD):** Before creating/migrating a page, agents must check existing UXML kits/pages + similar UXDS frame and inherit everything possible. UXML/UXDS BASE stays mutual; project theme is brand/copy delta only (no layout/hover/component zoos). Contract: [PAGE_CREATE_INHERITANCE.md](./PAGE_CREATE_INHERITANCE.md). |
| 2026-07-22 | **One interaction engine / zero CJM rescue hacks:** REC and playback must work from semantic page contracts for arbitrary projects, screens, route orders, and agent-chosen sequences. Journey/persona IDs may not alter target truth. Already-selected idempotent options, ghost targets, cursor misses, and unchanged stateful controls are hard failures and may not be recorded. React migrations may change layout but must preserve semantic action/state identity or explicitly invalidate affected recordings. |
| 2026-07-21 | **CJM ownership:** every deployed CJM is versioned beneath its owning `src/projects/<project-id>/personas/<persona-id>/cjm/` catalog. Browser-origin recordings are local drafts until promoted; project/persona catalogs never leak across selection changes. |
| 2026-07-21 | **Product identity + Project visibility:** visible product name is **UXML**. Project selection lives directly after the product identity in the fixed tabs-row cluster, followed by the standard delimiter; it is intentionally more visible because project switching is infrequent but high-context. Hover/focus on UXML opens a concise close-only stakeholder onboarding lightbox. |
| 2026-07-21 | **Interaction-map foundation (HARD):** UX Studio inventories every registered project surface, including Hub, without blindly clicking controls. Versioned `{projectId, surfaceId, targetId}` readiness data becomes the basis for future declared, reversible programmable connections. See [INTERACTION_INVENTORY.md](./INTERACTION_INVENTORY.md). |
| 2026-07-19 | Repo renamed to `ux-studio`; engine framing; Boots = first project |
| 2026-07-19 | Canonical disk path: `E:\UX\ux-studio`; abandon old copies |
| 2026-07-19 | Concept UI = React + full UXDS; Make HTML is bootstrap only |
| 2026-07-19 | Summarizer = direction for docs/governance, not a clone |
| 2026-07-19 | UXDS access required before page rebuild; not blocking engine recorder |
| 2026-07-19 | **Command doctrine:** agent decides all tech direction and next steps; PO owns product intent, design truth, accept/reject |
| 2026-07-19 | Next build: recording UI, then UXDS inventory, then one Boots React pilot |
| 2026-07-19 | UXDS Larkin links delivered (styleguide + components); variables inventoried in `docs/uxds/` |
| 2026-07-19 | X-Suite (Summarizer) will later feed personas/CJMs/IA into Studio for semi-automated agentic CJMs — see X_SUITE_INTEGRATION.md |
| 2026-07-21 | **X-Suite CJM path (HARD):** PO exports persona CJM from X-Suite → shares with agent → agent **analyzes** → ensures project has **all pages** → pages on Studio templates + UXDS styleguide/components + naming for cursor/camera → **ask PO for coarse concept / UXDS page prototype reference** → **reuse existing React pages** (no drift/dupes) → **REC a new CJM** in Studio (`source: x-suite`). Automated importer later. See X_SUITE_INTEGRATION.md |
| 2026-07-19 | Studio intake = often messy early concepts; agent upgrades to React+UXDS. Structured UXDS pages rare as feed. Make container `32452:19405` = typical class. See CONCEPT_INTAKE.md |
| 2026-07-19 | Concepts bring own brand colors/logos → project styleguide DELTA + small theme.css so brands don’t all look the same. See PROJECT_STYLEGUIDE.md |
| 2026-07-19 | Remaining solution defaults locked (page DoD, desktop-first, fake data OK, Boots screen-by-screen). See SOLUTION_REQUIREMENTS.md — comfortable to proceed |
| 2026-07-19 | Concept URLs on demand — when PO asks for more pages, agent asks for the Figma concept URL if not provided |
| 2026-07-19 | Page-from-existing: no URL required; compose from UXDS + internal ready components; maximize reuse (key) |
| 2026-07-19 | Internal FE DS code: yes, thin & incremental under `src/uxds/` + project theme — not a second Figma; grows with pages (SOLUTION_REQUIREMENTS §2.7) |
| 2026-07-19 | **Interaction fidelity:** recording depends on playable page controls; agent builds anticipated interactivity (from page context / later CJM deck) before record; shared React+UXDS behavior kits at `src/uxds/interactions/` — anti-sprawl vs one-off scripts. See INTERACTION_FIDELITY.md |
| 2026-07-19 | **Concept visual L&F mandatory:** rebuilds must match source concept chrome (progress, search, checkboxes, etc.). UXDS = structure/reuse; brand may remap UXDS color tokens via project theme. No generic DS restyle. See PAGE_BUILD_CONTRACT.md §5 |
| 2026-07-19 | **No visual zoo + control hierarchy:** same active/inactive language within a surface; secondary selectors mini / lower contrast vs primary chrome. See VISUAL_FIDELITY.md |
| 2026-07-19 | **Rebuild behavior parity:** React rebuilds must migrate all prior Make/concept interactions (e.g. Book Step 1 booster checkbox, Continue gating, search/near-me, crumbs). No static shells. See VISUAL_FIDELITY.md §1.1 + INTERACTION_FIDELITY.md §2.4 |
| 2026-07-19 | **Hover/focus fidelity:** Make `:hover` / focus / active (CTAs, fields, chips, checkboxes) must migrate into UXDS kit CSS + co-located screen CSS — no flat dead controls. Book Step 1 parity table in docs/projects/boots-pharmacy/BOOTS_REACT_SCREEN_PILOT.md |
| 2026-07-19 | **CSS architecture:** React screens use scoped/co-located CSS + small `src/uxds/` kit CSS; project theme remaps brand; Make monster `globals-*.css` retires screen-by-screen. See PAGE_BUILD_CONTRACT.md §8 |
| 2026-07-19 | **CSS layers BASE → THEME → PANEL → LEGACY locked:** BASE=`src/uxds/`, THEME=optional project remaps, PANEL=engine chrome, LEGACY=Make quarantine (no new React page styles). Architecture ready now; LEGACY retirement phased. See CSS_BASE_THEME.md, DS_STRICTNESS.md |
| 2026-07-19 | **Handoff verification — distrust by default:** master/parent agents must not trust subagent done/success summaries; verify critical UX/logic (nav chrome, modes, counters, panel XOR, migrated L&F/behavior) via JSX/CSS gate or localhost before green-lighting PO; reopen/fix smelling handoffs. See COMMAND_DOCTRINE.md §6 |
| 2026-07-19 | **FE/UI/UX audit before PO green-light:** after any UI-facing subagent ship, master must run or spawn a rigorous FE/UI/UX audit; implementer “done” and tests-passed alone are BAD until audit PROVEN. Covers visual fidelity, layout/max-width/alignment, icon+text CTA nowrap, hover/focus, behavior parity, control hierarchy/no zoo, nav chrome (mode XOR, counters), regressions. See COMMAND_DOCTRINE.md §7, FE_UI_UX_AUDIT.md, FE_STANDARDS.md |
| 2026-07-19 | **Strict interface audit is doctrine:** before any UI handoff is accepted, a separate strict FE audit agent must **PROVEN**; master treats implementer done as BAD until then; **cannot skip** for tests/build/smoke. Fail on drift, duplicates, slop, near-duplicate styles, layout gaps, lost L&F. Store results in `docs/projects/<project-id>/audits/` (Boots: `docs/projects/boots-pharmacy/audits/`). See COMMAND_DOCTRINE.md §7, FE_UI_UX_AUDIT.md |
| 2026-07-19 | **DS strictness (pages):** no near-duplicate styles (one pattern per role); pages use UXDS components/tokens/kits + project brand theme only — no anonymous one-off CSS; deviations must be named + registered in `docs/uxds/DEVIATIONS.md`; brand theme optional — turn off via removing `data-studio-project` / not importing `theme.css`; UI defaults to UXDS baseline colors; `theme.css` remaps variables only. See DS_STRICTNESS.md, TOKEN_BRIDGE.md, PROJECT_STYLEGUIDE.md |
| 2026-07-19 | **Composite Director role + proactive forecasting (permanent):** agent = picky Tech Director + Architect + BA + UX + FE/UI; must spot/forecast issues on every task (layout drift, style zoo, bad handoffs, missing hover, unused framer-motion, CSS layer violations, REC chrome bugs, CI). PO does not re-argue — agent owns it. Hard-wired in COMMAND_DOCTRINE §0–§2, AGENTS.md, `.cursor/rules/ux-studio-director.mdc`. Cross: CSS_BASE_THEME, DS_STRICTNESS, FE_UI_UX_AUDIT |
| 2026-07-19 | **PO rage list hard-guardrails:** (1) ONE text-link pattern — footer-like (no underline rest / underline hover); `.uxds-link` ≡ `.proto-link`; `check:links` in `npm test`. (2) Component library plan — migrate pages into real React kits, not Make slop (COMPONENT_LIBRARY.md). (3) REC disabled/forced off during AIR (same lock as transport). (4) Blast-radius self-check after any UI change (doctrine + director rule). (5) Node 22 everywhere. (6) GitHub Languages ≠ React (library in .tsx — documented). (7) Lean Actions budget (CI_ACTIONS_BUDGET.md). |
| 2026-07-19 | **REC ⊗ CJM:** when CJM is ON, REC must be `disabled` (cannot enter Rec); when REC is ON, CJM off/disabled. AIR still locks both. Gate: `studioModeXor.ts` + MCP sanity + FE audit G6. Prior “REC-off ≡ CJM-off / REC disabled during AIR only” was insufficient. |
| 2026-07-19 | **Slim CI:** default PR/push = `npm test` + build only; Playwright smoke = `workflow_dispatch` / local. Day-to-day chrome QA = local MCP/agent. See CI_ACTIONS_BUDGET.md. |
| 2026-07-19 | **Versioning habit now, Release CI later:** local `CHANGELOG.md` + `notes:*` + `release:*` skeleton (Summarizer-inspired); no tag→GitHub Release workflow until maturity/cadence/multi-project + Actions headroom. See VERSIONING.md, POST_CHANGE_CHECKLIST.md |
| 2026-07-19 | **Lean UX team OS:** agents = self-organizing team with callsigns Arch/Bea/Finn/Uma/Quinn/Ben/**Pax** (PO sim). Serious work = lean briefs + cross-checks; Pax decides bump/changelog/push (human PO overrides). Real-user persona from X-Suite CJM = LATER stub only. See TEAM.md, COMMAND_DOCTRINE §0.1 |
| 2026-07-19 | **Modal navigable URL + sitrep stacking:** blocking lightboxes (Choose Pharmacy) use `&modal=`; recording/replay must not click through; agent sitrep above concept modals. See shell/URL.md, RECORDING.md |
| 2026-07-19 | **All popups URL-synced:** Quick View / Login / Vaccine / Recipient / Choose Pharmacy in `STUDIO_MODAL_REGISTRY`; open → `&modal=`; felony if unregistered or no URL change. Quinn MCP-proves QV. |
| 2026-07-19 | **Standing PO commands `team report` / `team check`:** lean full-team sitrep on demand; workstream cross-check on demand **or** Arch auto after every big ship before “done”. Always display `Name (Role)`. See TEAM.md, COMMAND_DOCTRINE §0.2 |
| 2026-07-19 | **Team knowledge database — use, not only write:** living index TEAM_KNOWLEDGE.md; callsigns re-read hat section + LESSONS before serious work; team check `Knowledge used:` one-liner; **Knowledge improved** sitrep after ships; Arch rejects write-only appends. MCP probe: scroll-into-view + overlay visible every step or FAIL. See TEAM.md § Knowledge use, TEAM_KNOWLEDGE.md, LESSONS_LEARNED.md |
| 2026-07-19 | **PAGE FINAL PASS sequencing:** no new migrated page until previous page is PAGE FINAL PASS hard-green. Contract PAGE_FINAL_PASS.md; Finn/Uma own checklist + `check:page-final-pass`; Arch enforces; parallel callsigns + Knowledge used still required. PDP blocked until PLP Final Pass hard-green. See PAGE_FINAL_PASS.md, NEXT_STEPS.md, COMMAND_DOCTRINE §0/§4 |
| 2026-07-19 | **PDP Check availability logged-out** opens Availability Tool **first screen** (Find Pharmacy / `start`), not Choose Date. **No login gate** on Check availability (Book now still gates to Login). Studio-wide auth SSoT: `isStudioLoggedIn` / `__studioIsLoggedIn`. See PDP_MAKE_PARITY_REGISTER I10, shell/URL.md |

New durable PO decisions get a row here in the same session they are made, plus an update to the authoritative source above. Delivery milestones and transient NEXT statements belong only in [NEXT_STEPS.md](./NEXT_STEPS.md).
- **2026-07-21 — Empty-project and shell identity contract:** every registered project owns its page manifest and display labels; known empty projects use the engine-owned zero-page contract and dark UXML empty state, never another project's fallback content. UXML About expands the name to **User Experience Modeling Lab**, shows the package-derived version/channel, R&D/alpha status, UX Department R&D ownership, shield mark, and the Summarizer copyright line.
- **2026-07-21 — Global CJM diagnostic center:** the version warning opens an exact current-project compatibility inventory, copies one aggregate agent-ready JSON payload, and runs the canonical fail-fast `all-cjms` autonomous QA suite. The QA bug icon remains the manual logger. The empty reference project's display name is **UXDS - Larkin** while its stable internal id remains `puma` to preserve URLs/storage.
- **2026-07-21 — Compatibility proof + browser identity:** a Studio patch bump must not manufacture CJM incompatibility. Version drift is a testable amber state; only structural contract/target failures block. Passing playback persists a contract proof receipt and clears the warning. Browser titles use stable registered metadata in the order `UXML - <full project label> - <persona short label>`; Boots therefore preserves its Pharmacy sub-brand as `UXML - Boots Pharmacy - Sarah J.`.

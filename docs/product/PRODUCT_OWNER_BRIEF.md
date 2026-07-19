# Product Owner brief — UX Studio (A–Z)

**Audience:** Product Owner (you).  
**Commander:** Cursor agent = tech architect, integrator, and builder — **decides all tech direction and next steps.**  
**Doctrine:** [COMMAND_DOCTRINE.md](./COMMAND_DOCTRINE.md)  
**Last updated:** 2026-07-19

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

| You (Product Owner) | Agent (commander / architect / builder) |
|---------------------|----------------------------------------|
| Product intent + veto if something is wrong for the business | **Decides** tech direction, architecture, and **next steps** — always |
| Own Figma / UXDS as design truth (deliver links when asked) | Translates UXDS into React + engine wiring |
| Accept / reject how the product feels | Builds it; documents decisions the same turn |
| Say what “good” looks like in product language | Does not ask you to pick among tech options |

You do **not** need to be technical. You do **not** choose the build order.  
You **do** open `E:\UX\ux-studio` and supply UXDS/Figma when the commander requests assets.

Full rules: [COMMAND_DOCTRINE.md](./COMMAND_DOCTRINE.md).

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
3. **Recording UI** (engine) — next build.  
4. Token bridge + one Boots React pilot.  
5. Scale rebuild; later X-Suite import + compiler.

---

## I. What “success” looks like for you

- Open Studio → pick project / persona / CJM → play a journey that feels real.
- Record a walkthrough → save a file → replay it.
- Ask the agent to add a scenario without rewriting the whole prototype.
- New concepts start from **UXDS in Figma**, not from throwaway Make HTML.

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

## K. Decisions log (PO → docs)

| Date | Decision |
|------|----------|
| 2026-07-19 | Repo renamed to `ux-studio`; engine framing; Boots = first project |
| 2026-07-19 | Canonical disk path: `E:\UX\ux-studio`; abandon old copies |
| 2026-07-19 | Concept UI = React + full UXDS; Make HTML is bootstrap only |
| 2026-07-19 | Summarizer = direction for docs/governance, not a clone |
| 2026-07-19 | UXDS access required before page rebuild; not blocking engine recorder |
| 2026-07-19 | **Command doctrine:** agent decides all tech direction and next steps; PO owns product intent, design truth, accept/reject |
| 2026-07-19 | Next build: recording UI, then UXDS inventory, then one Boots React pilot |
| 2026-07-19 | UXDS Larkin links delivered (styleguide + components); variables inventoried in `docs/uxds/` |
| 2026-07-19 | X-Suite (Summarizer) will later feed personas/CJMs/IA into Studio for semi-automated agentic CJMs — see X_SUITE_INTEGRATION.md |
| 2026-07-19 | Studio intake = often messy early concepts; agent upgrades to React+UXDS. Structured UXDS pages rare as feed. Make container `32452:19405` = typical class. See CONCEPT_INTAKE.md |
| 2026-07-19 | Concepts bring own brand colors/logos → project styleguide DELTA + small theme.css so brands don’t all look the same. See PROJECT_STYLEGUIDE.md |
| 2026-07-19 | Remaining solution defaults locked (page DoD, desktop-first, fake data OK, Boots screen-by-screen). See SOLUTION_REQUIREMENTS.md — comfortable to proceed |
| 2026-07-19 | Concept URLs on demand — when PO asks for more pages, agent asks for the Figma concept URL if not provided |
| 2026-07-19 | Page-from-existing: no URL required; compose from UXDS + internal ready components; maximize reuse (key) |
| 2026-07-19 | Internal FE DS code: yes, thin & incremental under `src/uxds/` + project theme — not a second Figma; grows with pages (SOLUTION_REQUIREMENTS §2.7) |

New durable decisions get a row here in the same session they are made.

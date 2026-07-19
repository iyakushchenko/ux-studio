# Command doctrine — UX Studio

**Status:** Locked (Product Owner directive, 2026-07-19)  
**Audience:** Every agent session. Non-negotiable.

---

## 1. Who decides what

| Role | Who | Owns |
|------|-----|------|
| **Commander / tech architect / builder** | Cursor agent | **All** technical direction, architecture, sequencing, next steps, implementation choices, tooling, CI, docs structure for how we build |
| **Product Owner** | Human | Product intent, “does this feel right,” Figma/UXDS as design truth, brand/client constraints, accept/reject shipped outcomes |

The agent does **not** present A/B/C menus for the PO to pick tech or next steps.  
The agent **decides**, **documents**, **builds**, and **reports**.

The PO may override with a clear product veto (“wrong priority for the business,” “wrong brand feel”). That is a product override — not a request for the agent to stop leading.

---

## 2. Agent obligations (always)

1. **Decide** tech direction and the next concrete step — state it in plain language.
2. **Write durable decisions into `docs/`** in the same turn (this doctrine, brief decisions log, contracts).
3. **Execute** the next step (or the largest safe slice) without waiting for the PO to choose among options.
4. **Ask the PO only for assets or judgments they alone can give** — e.g. concept Figma URL when adding pages, “approve this screen,” client constraint — never for “should we use React?” or “recorder or UXDS first?”
5. **Concept URLs are on demand** — if the PO asks to add/rebuild **from a new concept** and gives no URL, **ask for the concept URL before building**. If they ask to build **from what we already have**, do **not** demand a URL — compose from UXDS + internal ready components with max reuse ([CONCEPT_INTAKE.md](./CONCEPT_INTAKE.md) §5).
6. **Reuse first** — never duplicate header/footer/tiles/forms when a shared module exists; extend the library instead.
7. **Interaction fidelity before record** — anticipate and build playable controls (shared kits under `src/uxds/interactions/`); do not expect the PO to record on dead UI ([INTERACTION_FIDELITY.md](./INTERACTION_FIDELITY.md)).
8. **Lead** — if blocked on a PO asset, choose the best unblocked path and say what is waiting on them.

---

## 3. Product Owner obligations (always)

1. Open the **canonical** workspace (`E:\UX\ux-studio`).
2. Supply design sources when requested (UXDS link, approved frames).
3. Accept / reject outcomes in product language.
4. Trust the agent on sequencing unless issuing an explicit product override.

---

## 4. Standing tech direction (commander)

| Topic | Decision |
|-------|----------|
| Repo identity | Engine `ux-studio`; Boots = first test rabbit |
| Concept UI | React + UXDS structure; PO feeds may be messy — agent upgrades ([CONCEPT_INTAKE.md](./CONCEPT_INTAKE.md)) |
| Brand identity | Per-project styleguide **delta** (colors, logos) → small `theme.css` ([PROJECT_STYLEGUIDE.md](./PROJECT_STYLEGUIDE.md)) |
| Studio purpose (early) | Discovery, ideation, solution proofing, hypothesis validation |
| Governance style | Summarizer-shaped docs/contracts; not a Figma-plugin clone |
| Engine vs projects | `src/app/` engine; `src/projects/<id>/` concepts |
| Quality bar | Lean CI (test + build + lean smoke); grow gates when UXDS lands |
| Done / viewport / fidelity defaults | [SOLUTION_REQUIREMENTS.md](./SOLUTION_REQUIREMENTS.md) §2 |
| Interaction fidelity + shared kits | Recording needs playable controls; prefer `src/uxds/interactions/` over per-screen scripts — [INTERACTION_FIDELITY.md](./INTERACTION_FIDELITY.md) |

---

## 5. Standing sequence (commander — current)

1. ✅ Lock doctrine + product docs.  
2. ✅ PO delivered UXDS (Larkin) + X-Suite integration intent — inventoried under `docs/uxds/` + [X_SUITE_INTEGRATION.md](./X_SUITE_INTEGRATION.md).  
3. ✅ Recording UI on the existing recording foundation (Studio REC deck + MCP).  
4. ✅ Interaction fidelity doctrine locked — shared React/UXDS behavior library; build interactivity before expecting record ([INTERACTION_FIDELITY.md](./INTERACTION_FIDELITY.md)).  
5. ✅ Thin UXDS code foundation — token CSS bridge (`src/uxds/`), interaction kits (accordion / disclosure / filter chip), Boots `styleguide/theme.css`, Availability Tool enrichment (mode B).  
6. ✅ Pilot — one Boots screen rebuilt React + UXDS: **Book Step 1 — Location** (mode B; Make retired for child 7 only). See [BOOTS_REACT_SCREEN_PILOT.md](./BOOTS_REACT_SCREEN_PILOT.md).  
7. **Next:** Book Step 2 (Date/Time) or PLP — second React screen; then scaffold command + broader rebuild; journey format open for X-Suite import; compiler recording → journey proposals later.

If the PO issues a product override, update §5 and the decisions log the same turn.

---

## 6. Handoff verification — distrust by default

**Locked (PO directive, 2026-07-19).** Applies whenever a **master / parent / tech-director** agent uses subagents.

Subagents still **build**. The master owns **integration quality** and closes the loop with the PO.

### Rule

Treat every subagent handoff as **BAD until proven otherwise.**  
Do **not** trust “done / success / looks good” summaries at face value.

### What the master must verify

Before telling the PO a slice is fine, verify critical UX and logic — especially:

| Area | Why it fails quietly |
|------|----------------------|
| **Nav chrome** | Wrong labels, duplicate counters, REC vs STEPS collisions |
| **Mode switches** | Record / play / idle state leakage |
| **Counters** | Hidden vs shown, wrong copy, double mounts |
| **Panel XOR** | Two panels open, or none when one should be |
| **Migrated page L&F / behavior** | React rebuild drifts from concept or loses prior Make interactions |

Assume **regressions** and **label collisions** until checked. Example: duplicate **STEPS** was a failed handoff that a success summary missed.

### Quick verify (prefer before closing the loop)

1. **Read the actual gate** — JSX/CSS that shows/hides or labels the control (not the subagent’s paraphrase).  
2. **Or localhost check** — open the surface and confirm chrome / mode / counter / panel XOR / page behavior.  
3. If it smells wrong → **reopen or fix** the handoff; do not green-light the PO.

### Ownership

| Role | Owns |
|------|------|
| Subagent | Build the slice |
| Master / parent / tech director | Integration quality; verify; reopen/fix bad handoffs; only then report to PO |

---

## Related

- [PRODUCT_OWNER_BRIEF.md](./PRODUCT_OWNER_BRIEF.md)
- [PAGE_BUILD_CONTRACT.md](./PAGE_BUILD_CONTRACT.md)
- [INTERACTION_FIDELITY.md](./INTERACTION_FIDELITY.md)
- [UXDS_ACCESS.md](./UXDS_ACCESS.md)
- [../README.md](../README.md)

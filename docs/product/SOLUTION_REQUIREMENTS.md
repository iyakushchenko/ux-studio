# Solution requirements — readiness & open alignments

**Status:** Commander assessment 2026-07-19  
**Purpose:** Single place that answers “do we have enough to proceed?” and locks remaining defaults so chat amnesia cannot erase them.

---

## 1. Already aligned (comfortable)

| Area | Doc | Status |
|------|-----|--------|
| Who decides tech / next steps | [COMMAND_DOCTRINE.md](./COMMAND_DOCTRINE.md) | ✅ |
| Workspace / repo identity | Brief + AGENTS | ✅ `E:\UX\ux-studio`, GitHub `ux-studio` |
| Engine vs projects | SHELL / PROJECTS | ✅ |
| Studio purpose (early) | Vision + CONCEPT_INTAKE | ✅ discovery / proof / hypothesis |
| Messy concept intake | [CONCEPT_INTAKE.md](./CONCEPT_INTAKE.md) | ✅ agent upgrades |
| Page stack | [PAGE_BUILD_CONTRACT.md](./PAGE_BUILD_CONTRACT.md) | ✅ React + UXDS |
| Brand delta | [PROJECT_STYLEGUIDE.md](./PROJECT_STYLEGUIDE.md) | ✅ per-project theme.css |
| UXDS source + variables map | [../uxds/](../uxds/) | ✅ Larkin inventoried |
| X-Suite future seam | [X_SUITE_INTEGRATION.md](./X_SUITE_INTEGRATION.md) | ✅ intent only |
| Journey + recording data model | journey JSON + RECORDING.md | ✅ foundation exists |
| CI bar | lean smoke | ✅ |

**Verdict:** Strategy for *how we build pages* is enough to proceed. Remaining items below are **defaults I am locking now**, plus **assets only you can give per concept**.

---

## 2. Gaps — commander defaults (locked unless you veto)

These were thin in docs. I am deciding them so we do not stall.

### 2.1 Definition of done for a Studio page

A page is “done” for early Studio when:

1. React screen under the project (not permanent Make HTML growth).  
2. UXDS structure + project `styleguide/theme.css` applied.  
3. Registered in Studio (screen id / tab) with stable `data-name` hooks.  
4. Browse works; at least one journey beat can land on it if it is in a CJM.  
5. Hypothesis under test is playable (happy path). Edge cases optional unless PO asks.

Not required for v1 page done: production a11y audit, every viewport, real backend, pixel-match to messy Figma.

### 2.2 Viewport bar

- **Default proof:** desktop / large (≈1440) first — matches most Make-feed strips.  
- **Add small/medium** only when the hypothesis needs it (e.g. mobile booking).  
- UXDS `screen & fonts` modes stay available; we do not block on full responsive parity.

### 2.3 Interaction fidelity

- Prefer **realistic UI state** in React (open popup, select store, step wizard).  
- **Fake data / in-memory** is fine; no real APIs unless the hypothesis requires it.  
- Login / guest: simulate with Studio or project flags (UXDS `auth` modes as inspiration later).

### 2.4 Content strategy (copy & IA)

- v1 pages: **copy in React/project content modules** (fast).  
- Shape content keys so they can later map to `setup` / `IA/*` / `persona/*` (X-Suite).  
- Do not block page builds on live Figma variable sync.

### 2.5 Boots coexistence

- **Screen-by-screen replace** of Make wire — no big-bang freeze.  
- New work = React path; untouched Make screens keep working until replaced.  
- Same project id `boots-pharmacy`; styleguide delta created on first React pilot.

### 2.6 Multi-project

- Shell already selects project/persona/CJM.  
- Each new brand = new `src/projects/<id>/` + styleguide delta.  
- GitHub Pages hosts the engine; project switch is in-app (not separate deploys per brand for now).

### 2.7 Internal design-system code (FE) — yes, thin & incremental

**PO question:** Do we need to build internal design-system frontend code?

**Answer: Yes — but small, and grown by use — not a second Figma.**

| What | Why |
|------|-----|
| `src/uxds/` CSS tokens (from UXDS names) | Shared structure/roles in code |
| Reusable React modules (`component.*` / `module.*`) | Reuse mandate — pages don’t copy-paste |
| `src/projects/<id>/styleguide/theme.css` | Brand delta only |

| What we do **not** build day one | |
|--------------------------------|--|
| A full duplicate of every UXDS component in Figma | Grow only what pages need |
| Summarizer-scale CSS governance megasuite | Later if useful |
| A separate “Studio design system” with different names | Always map to UXDS |

**How it grows:** First real page creates the token bridge + the few modules that page needs. Next page reuses and adds only gaps. You never maintain a giant unused component library.

### 2.8 Engine vs page sequencing

Standing order remains:

1. Finish product docs commit hygiene.  
2. **Recording UI** (engine — already foundationed).  
3. On first page request (or after recorder slice): **token bridge + Boots styleguide + one React screen** (starts the thin internal DS).  

If PO pastes “build this frame now,” that **overrides** and page pilot jumps the queue.

### 2.9 Accept / reject ritual

- Agent ships a playable slice + short note (“intent preserved; brand from X; used module Y”).  
- PO replies: approve / veto with product language.  
- No tech option menus.

---

## 3. What I still need from you (only when building a concept)

Not strategic blockers — **per-concept assets, on demand**:

| Asset | When |
|-------|------|
| Figma URL to the concept frame(s) / strip | **Required** for *new concept* page asks — agent **asks** if missing. **Not required** when PO says build from what we already have → reuse UXDS + internal components |
| Which hypothesis to prove (one sentence) | If not obvious from the frame |
| Logo file(s) if not in the frame | If brand mark is missing |
| Explicit vetoes (“must not look like Boots”, “desktop only”) | Optional |

PO does **not** pre-load a backlog of concept URLs. Supply when requesting pages; agent requests the URL if the ask has none.

UXDS file access: **already have**.

---

## 4. Nice-to-have later (not blocking)

| Topic | Notes |
|-------|--------|
| Automated UXDS → CSS dump script | Hand-map first screen; automate after |
| Code Connect maps | Optional; Figma MCP + naming docs enough for now |
| Full a11y / contrast gates like Summarizer | After first React pilot proves the path |
| X-Suite import format | Documented as intent; build after recorder + page pilot |
| Scaffold CLI “new project from concept URL” | After one manual pilot |

---

## 5. Readiness statement

**I am comfortable proceeding** on:

- Recording UI (engine)  
- First React + UXDS + project-styleguide page when you point at a frame  

**I do not need more strategic workshops** before that. Further alignment should be **vetoes** against §2 defaults or **concrete concept URLs**, not blank-slate debates.

---

## Related

- [COMMAND_DOCTRINE.md](./COMMAND_DOCTRINE.md)  
- [CONCEPT_INTAKE.md](./CONCEPT_INTAKE.md)  
- [PROJECT_STYLEGUIDE.md](./PROJECT_STYLEGUIDE.md)  
- [PAGE_BUILD_CONTRACT.md](./PAGE_BUILD_CONTRACT.md)

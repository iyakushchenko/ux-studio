# CJM = guitar tabs (Record / Play / Edit)

**Status:** Locked (PO 2026-07-21) · **Owners:** Arch · Bea · Finn · Quinn  
**See also:** [RECORDING.md](./RECORDING.md) · [PLAYBACK.md](./PLAYBACK.md) · [QA_LOGGING_AND_PLAYBACK_RECIPE.md](./QA_LOGGING_AND_PLAYBACK_RECIPE.md) · Traditional UX [TRADITIONAL_CJM_UX_2026-07-21.md](../projects/boots-pharmacy/audits/TRADITIONAL_CJM_UX_2026-07-21.md)

CJM is **not** an imperative director novel. It is a **tab script**: targets from the page fidelity pool + timing.

## Project ownership and deployment

- Every deployed CJM lives with its owner at `src/projects/<project-id>/personas/<persona-id>/cjm/`.
- Built-in scripts and promoted `.journey.json` recordings share that one persona catalog. The project registry loads this catalog; `data/journeys/` is export/interchange, not runtime ownership.
- Browser recordings remain origin-local drafts until promoted into the persona `cjm/` directory. Static GitHub Pages cannot write recordings back to the repository.
- File-backed CJMs are deployed product data. Their IDs must be unique within the persona and their project/persona envelope must match the directory that owns them.

| Mode | Rule |
|------|------|
| **Record** | PO clicks the product page. Capture **stable targets** (`data-studio-action`, `data-studio-cal-*`, avail attrs, …) + `atMs` / dwell. REC only captures what page fidelity allows. |
| **Play** | Same engine plays those targets. **Continuous Play ≡ Step** (automated). No dump-all / skip-motion Play path. |
| **Edit** | PO gives a **user story**. Agent changes the script by **swapping targets / timing / order** on beats (`recordedClick.selectorChain`, `dwellMs`, beat order) — **not** rewriting `book.ts` / director prose. |

**Compile path:** REC events → `recordedClick` + `dwellMs` + **`scroll-stop` → `kind: "camera"`** beats → same Play runners as Step.

**Prove helpers (universal):**

| Prove | API | Rule |
|-------|-----|------|
| **REC robustness** | `__studioRunRecNewCjmProve({ experience?, label?, captureUntil? })` | **ALWAYS CLEAR** → **human pace** (`REC_USER_PACE_MS`) → arm REC → capture (scroll-stops + CTAs) → **modal drain** if `&modal=` (e.g. choose-pharmacy) → Add as CJM → Play **that** `journeyId`. `captureUntil`: `plp-book`, `pdp-book`, `book-location`, `book-schedule`, or `book-confirmation`. **FORBIDDEN:** built-in Play as REC prove; skipping open modals; 50ms spam clicks. |
| **Play journey** | `__studioRunFullPlayProve({ journeyId \| experience })` | **ALWAYS CLEAR** (`requireFreshQaSession`, no skip) → full Play → peak assert → leave pause. Thin presets: `__studioRunAgenticFullPlayProve` / `__studioRunTraditionalFullPlayProve`. Smoke `__protoRunTraditionalPlaySmoke` tears down overlay. |

**REC arm (agents only):** `__studioArmRecCapture()` — **ALWAYS CLEAR QA first** → CJM off → REC mode ON → CREATE NEW CJM → ● Start. Latch: `__studioAssertRecLive()`. **ALWAYS CLEAR + human pace + modal drain are code law** — not reminders. URL `modal=` is navigable state — never ignore.

## Camera engine rails

Same camera for agentic / traditional / REC — see [PLAYBACK.md](./PLAYBACK.md) § Scroll camera SSoT + **Camera engine rails**.

- Target-driven; **page land = host top** on screen/tab change during CJM/Play/AIR (chat owns its column). Intentional `kind:camera` beats then wait → eased scroll.
- `playbackScroll.ts` is SSoT — wire force-origins on tab change during session (no mid-scroll land from a prior screen).
- Intentional origin (start/retreat/probe) uses `force: true` and honors post-click hold.
- **Camera beat** (`kind: "camera"` + `camera: { dwellMs, selectorChain }`) — own STEPS slot: wait (show page) → eased scroll; step-back reverses to pre-scroll top. Edit = swap target / timing. Traditional Book Step 3 uses this before Open Appointments. **REC:** scroll-host settle ≥ ~2s (jiggles ignored) compiles to the same beat — **one wait per settle** (no N duplicate camera steps for one pause).

## Touchpoint naming (REC → STEPS)

Compile stamps **short human labels** on beats (button text / aria-label / action slug) — **not** long CSS selectors. Nav during Play must read as concise touchpoint names.

## CJM title + provenance contract

- **Agent-created CJMs require a semantic human title**: actor/context + path or outcome, e.g. `Sarah · PLP→Book appointment` or `Guest · Vaccine details→Choose pharmacy`.
- Agent titles containing internal placeholders such as `QA`, `test`, `prove`, `recording`, `Recorded`, or `Route 3` are refused by the save pipeline. Think about the user story before naming.
- Agent REC helpers stamp `author=agent` before using the visible Start button; direct human Start stamps `author=user`. MCP sessions cannot downgrade agent provenance.
- REC metadata records every global auth state encountered (`guest`, `user`, or both), Studio version, contract version, time, event count and step count. Projects consume the engine auth SSoT; they must not fork auth metadata.
- CJM picker metadata is diagnostic truth: warning triangle = potential compatibility/provenance issue; hover explains it; click opens exact diagnostics and can copy the complete JSON for agent handoff. Patch-version drift or an older metadata envelope with an intact raw recording is an amber **re-test required** state, never proof of incompatibility. Only unsupported schemas, missing raw evidence, empty journeys, or unstable targets block playback. Successful autonomous playback stores a current contract proof receipt separately from immutable recording provenance and clears legacy/re-test advisories without rewriting the original recording.

## Cursor engine rails

Same cursor for agentic / traditional / REC / chat — see [PLAYBACK.md](./PLAYBACK.md) § Cursor engine SSoT + [MOTION.md](../product/MOTION.md).

- **Travel** = Motion easeInOut; **park** = travel-to-rest (never hard-snap unless `force` / first-mount).
- Policy: `demoCursorEngine.ts`; DOM: `demoCursor.ts`. Legacy `animate: false` without force → **ABRUPT PARK FAIL** (red) in QA.
- **Step parks; continuous Play stays** at last interaction — except **composer submit** (always park away).
- **Early hand** on interactive edge during travel.
- Type-in holds journey park pose; cancel mid-travel settles (hang lesson).
- **Agent REC demo:** robo-cursor visible for agent-driven clicks; scroll uses eased camera (not abrupt jump) where feasible.
## Exceptions (deeper, keep thin)

- **Prebuilt chat / persona docks** — progressive frames, type-in, thinking camera. Prefer rails docs over inventing a second Play path. → [CHAT_PAGE_RAILS.md](../projects/boots-pharmacy/features/CHAT_PAGE_RAILS.md)
- **Prebuilt `bookScript` / `availScript` / `tabScript` directors** — still used by the persona `cjm/` catalog. Prefer **target resolution** (which cell + skip if already selected) over one-off force-click policies. Story-edits of **recorded** CJMs stay on `recordedClick` + dwell; do not require director surgery.

## Book Step 2 bridge (compatibility)

| Path | What plays |
|------|------------|
| **Recorded CJM** | Date/time clicks compile to unique `[data-studio-cal-kind=…][data-studio-cal-month=…][data-studio-cal-value=…]` (+ reserve `data-studio-action`). Edit = swap those selectors / dwell / order. |
| **Persona `bookScript`** | Director resolves primary **June 21 / 15:30**; if already selected (Avail handoff) → demo-change **June 24 / 16:30**. Never re-click the already-selected cell. Forward landing may `preserveHandoff`; step-back restores wire default. |

**Do not** invent new force-click policies that bypass the fidelity pool. Prefer under-match + declared targets.

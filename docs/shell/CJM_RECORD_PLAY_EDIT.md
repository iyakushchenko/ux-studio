# CJM = guitar tabs (Record / Play / Edit)

**Status:** Locked (PO 2026-07-21) · **Owners:** Arch · Bea · Finn · Quinn  
**See also:** [RECORDING.md](./RECORDING.md) · [PLAYBACK.md](./PLAYBACK.md) · [QA_LOGGING_AND_PLAYBACK_RECIPE.md](./QA_LOGGING_AND_PLAYBACK_RECIPE.md) · Traditional UX [TRADITIONAL_CJM_UX_2026-07-21.md](../projects/boots-pharmacy/audits/TRADITIONAL_CJM_UX_2026-07-21.md)

CJM is **not** an imperative director novel. It is a **tab script**: targets from the page fidelity pool + timing.

| Mode | Rule |
|------|------|
| **Record** | PO clicks the product page. Capture **stable targets** (`data-studio-action`, `data-studio-cal-*`, avail attrs, …) + `atMs` / dwell. REC only captures what page fidelity allows. |
| **Play** | Same engine plays those targets. **Continuous Play ≡ Step** (automated). No dump-all / skip-motion Play path. |
| **Edit** | PO gives a **user story**. Agent changes the script by **swapping targets / timing / order** on beats (`recordedClick.selectorChain`, `dwellMs`, beat order) — **not** rewriting `book.ts` / director prose. |

**Compile path:** REC events → `recordedClick` + `dwellMs` + **`scroll-stop` → `kind: "camera"`** beats → same Play runners as Step.

**Prove helpers (universal):** prefer `__studioRunFullPlayProve({ journeyId | experience })` — ALWAYS CLEAR → arm → full Play → peak assert → leave pause. Thin presets: `__studioRunAgenticFullPlayProve` / `__studioRunTraditionalFullPlayProve` (no duplicated logic). Smoke `__protoRunTraditionalPlaySmoke` tears down overlay.

## Camera engine rails

Same camera for agentic / traditional / REC — see [PLAYBACK.md](./PLAYBACK.md) § Scroll camera SSoT + **Camera engine rails**.

- Target-driven; no blind origin on screen-enter while CJM/play/AIR.
- `playbackScroll.ts` is SSoT — wire must not snap origin on tab change during session.
- Intentional origin (start/retreat/probe) uses `force: true` and honors post-click hold.
- **Camera beat** (`kind: "camera"` + `camera: { dwellMs, selectorChain }`) — own STEPS slot: wait (show page) → eased scroll; step-back reverses to pre-scroll top. Edit = swap target / timing. Traditional Book Step 3 uses this before Open Appointments. **REC:** scroll-host settle ≥ ~2s (jiggles ignored) compiles to the same beat.

## Cursor engine rails

Same cursor for agentic / traditional / REC / chat — see [PLAYBACK.md](./PLAYBACK.md) § Cursor engine SSoT + [MOTION.md](../product/MOTION.md).

- **Travel** = Motion easeInOut; **park** = travel-to-rest (never hard-snap unless `force` / first-mount).
- Policy: `demoCursorEngine.ts`; DOM: `demoCursor.ts`. Legacy `animate: false` without force → ABRUPT-PARK FAIL in QA.
- **Step parks; continuous Play stays** at last interaction — except **composer submit** (always park away).
- **Early hand** on interactive edge during travel.
- Type-in holds journey park pose; cancel mid-travel settles (hang lesson).

## Exceptions (deeper, keep thin)

- **Prebuilt chat / persona docks** — progressive frames, type-in, thinking camera. Prefer rails docs over inventing a second Play path. → [CHAT_PAGE_RAILS.md](../projects/boots-pharmacy/features/CHAT_PAGE_RAILS.md)
- **Prebuilt `bookScript` / `availScript` / `tabScript` directors** — still used by persona `journeys.ts`. Prefer **target resolution** (which cell + skip if already selected) over one-off force-click policies. Story-edits of **recorded** CJMs stay on `recordedClick` + dwell; do not require director surgery.

## Book Step 2 bridge (compatibility)

| Path | What plays |
|------|------------|
| **Recorded CJM** | Date/time clicks compile to unique `[data-studio-cal-kind=…][data-studio-cal-month=…][data-studio-cal-value=…]` (+ reserve `data-studio-action`). Edit = swap those selectors / dwell / order. |
| **Persona `bookScript`** | Director resolves primary **June 21 / 15:30**; if already selected (Avail handoff) → demo-change **June 24 / 16:30**. Never re-click the already-selected cell. Forward landing may `preserveHandoff`; step-back restores wire default. |

**Do not** invent new force-click policies that bypass the fidelity pool. Prefer under-match + declared targets.

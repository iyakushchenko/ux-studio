# Platform Motion standard

**Status:** Living — Arch + Finn own.  
**Package:** `framer-motion` only (do **not** add a second `motion` twin).  
**Import:** `@/uxds/motion` — never raw `framer-motion` / `motion` in new callsign code.

---

## When to use what

| Surface | Driver | Notes |
|---------|--------|--------|
| Accordion expand/collapse (height) | Motion `height: 0` ↔ `"auto"` | Functional reveal — keep tween so collapse/expand stays visible; always-mounted panel; `initial={false}`; cancels on unmount |
| Enter / exit presence (menus, diagnostic overlays, modal pilots) | Motion (`AnimatePresence` / `motion.*`) | Opacity (+ tiny y) only; hang-safe; sync-mount XOR panels when `mode="wait"` stranded empty |
| Imperative position tweens (robo-cursor travel) | Motion `animate(0, 1, { ease: "easeInOut", … })` | Stoppable via `.stop()` |
| **Content load interim (refresh / first paint / listing)** | `STUDIO_CONTENT_LOAD_MS` (**1500**) via `@/uxds/motion` | Real-life feel — **not** instant dump. PLP + CJM-off chat existing-thread load share this. Do **not** invent per-page timers. Chat rails: [CHAT_PAGE_RAILS.md](../projects/boots-pharmacy/features/CHAT_PAGE_RAILS.md). |
| **Enter + camera co-travel** | `STUDIO_ENTER_MS` (**340**) + scroll SSoT | Appear and scroll finish together on target. Default unless PO asks to remove a transition. CJM-off chat: post-paint `scrollCameraToHostEnd` with this duration. |
| Trivial hover color/opacity; Accordion chevron mute/rotate | CSS | One property / kit chevron; chevron honors `prefers-reduced-motion` |

**Do not** drive Accordion with CSS `grid-template-rows: 0fr` ↔ `1fr` anymore — OS `prefers-reduced-motion: reduce` zeroed those transitions (`transition: none !important`), so expand looked instant. Motion height is the kit path.

**Do not** add one-off load/scroll timers per screen when PO asks for “less abrupt” — extend `@/uxds/motion` defaults, then consume them.

No React Spring. No bespoke `@keyframes` zoos unless registered in [DEVIATIONS.md](../uxds/DEVIATIONS.md).

---

## Callsign import rule

```ts
import { AnimatePresence, animate, motion, useReducedMotion } from "@/uxds/motion";
```

Never `from "framer-motion"` / `from "motion"` in new code. Shared timings: Accordion → `src/uxds/interactions/accordionMotion.ts`; shell panels → `src/app/nav/studioMotion.ts`.

---

## Accordion (kit)

- **API:** `AccordionContent` → `motion.div` height + panel opacity (`data-studio-accordion-motion="height"`).
- **Hang guards:** content stays mounted (no measure thrash from remount); declarative Motion cancels on unmount; no spring / bounce / layoutId storms.
- **Chevron:** CSS color + rotate; muted when closed; respects reduced-motion (decorative).
- **Probe settle:** `ACCORDION_PROBE_SETTLE_MS` in `accordionMotion.ts`.

---

## Robo-cursor travel (shell)

- **SSoT policy:** `demoCursorEngine.ts` — park = travel-to-rest; snap only via `force` / first-mount; **step parks / Play stays** (+ forbidden submit rest). See [PLAYBACK.md](../shell/PLAYBACK.md) § Cursor engine SSoT.
- **API:** `animate` from `@/uxds/motion` — progress `0 → 1`, `ease: "easeInOut"` (cubic ease-in / ease-out).
- **Path:** straight-line lerp to target. **No** spring, back-ease, overshoot, arc jitter, or end-frame noise.
- **Park:** `parkDemoCursorAtRest()` travels to rest (`CURSOR_ENGINE_PARK_TRAVEL_MS` ≈ 520). Legacy `animate: false` without `force` → coerced travel + ABRUPT-PARK QA. Post-click: `settleDemoCursorAfterInteraction` (step / Play / submit).
- **Early hand:** hand graphic when tip crosses interactive edge during travel (not center wait).
- **On-target:** settle → lock left/top → press 64ms → release → default arrow. Path samples via `__studioCursorDiagnostics()` / prove `path`.
- **Cancel:** `cancelDemoCursorTravel()` → `controls.stop()` + generation bump on `forceClear` / `removeDemoCursor` (Chrome hang guard — keep with hover-bridge caps). Travel `await` settles on onComplete / abort / ceiling — never `stop()` alone.
- **Customizations:** PO will instruct later — keep the wrapper thin; do not invent “more human agility” bounce.

---

## Shell pilots (shipped)

| Pilot | Where | Motion |
|-------|--------|--------|
| Studio select menu | `StudioNavStudioSelect` | `AnimatePresence` opacity + y |
| Playback diagnostic | `PlaybackDiagnosticOverlay` | `AnimatePresence` opacity |
| Nav REC counters / panel | `StudioNavRecordingControls` / scenario controls | existing panel crossfade |

Shell-only presence pilots do **not** demote PDP PAGE FINAL PASS. **User-visible PDP Accordion Motion does** → demote `mcpFinalPass` to **NEEDS-REPROVE** until Quinn re-proves.

---

## Knowledge

Index: [TEAM_KNOWLEDGE.md](./TEAM_KNOWLEDGE.md) · Lessons: [LESSONS_LEARNED.md](./LESSONS_LEARNED.md) (Platform motion + Chrome hang + Accordion reduced-motion).

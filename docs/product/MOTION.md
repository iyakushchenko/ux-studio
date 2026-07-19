# Platform Motion standard

**Status:** Living — Arch + Finn own.  
**Package:** `framer-motion` only (do **not** add a second `motion` twin).  
**Import:** `@/uxds/motion` — never raw `framer-motion` / `motion` in new code.

---

## When to use what

| Surface | Driver | Notes |
|---------|--------|--------|
| Enter / exit, panels, menus, layout | Motion (`AnimatePresence` / `motion.*`) | Shell pilots OK |
| Imperative position tweens (robo-cursor travel) | Motion `animate(0, 1, { ease: "easeInOut", … })` | Stoppable via `.stop()` |
| Trivial hover color/opacity | CSS | One property |
| Accordion expand/collapse | CSS `grid-template-rows: 0fr` ↔ `1fr` | **Not** Framer `height: auto` |

No React Spring. No bespoke `@keyframes` zoos unless registered in [DEVIATIONS.md](../uxds/DEVIATIONS.md).

---

## Robo-cursor travel (shell)

- **API:** `animate` from `@/uxds/motion` — progress `0 → 1`, `ease: "easeInOut"` (cubic ease-in / ease-out).
- **Path:** straight-line lerp to target. **No** spring, back-ease, overshoot, arc jitter, or end-frame noise.
- **Cancel:** `cancelDemoCursorTravel()` → `controls.stop()` + generation bump on `forceClear` / `removeDemoCursor` (Chrome hang guard — keep with hover-bridge caps).
- **Customizations:** PO will instruct later — keep the wrapper thin; do not invent “more human agility” bounce.

---

## Shell vs page Final Pass

Shell-only Motion work (cursor, nav chrome) does **not** demote PDP / page PAGE FINAL PASS.

---

## Knowledge

Index: [TEAM_KNOWLEDGE.md](./TEAM_KNOWLEDGE.md) · Lessons: [LESSONS_LEARNED.md](./LESSONS_LEARNED.md) (Platform motion + Chrome hang).

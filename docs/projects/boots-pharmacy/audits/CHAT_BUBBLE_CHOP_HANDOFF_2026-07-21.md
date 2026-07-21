# Handoff — Chat bubble chop (PP-14 REOPEN)

**Status:** ACTIVE — PO still sees choppy bubble appear after multi-agent “fixes”  
**Workspace:** `E:\UX\ux-studio` only · tip ~`7e0cce7` / **v0.0.104** (check `git log -1`)  
**Board:** [NEXT_STEPS.md](../../../product/NEXT_STEPS.md) **0e** · [PAINPOINTS.md](../../../product/PAINPOINTS.md) **PP-14**  
**North star (do not invent a second enter):** [MOTION.md](../../../product/MOTION.md) · [CHAT_PAGE_RAILS.md](../features/CHAT_PAGE_RAILS.md) · [PLAYBACK_DIAG.md](../../../shell/PLAYBACK_DIAG.md)

---

## PO problem (eyes, not vibes)

Progressive chat bubbles (and/or send → thinking → reply) still feel **choppy / stuttered** — not one continuous ease. Multiple agents claimed green; **PO rejects**. Treat prior COMPLETE as **revoked**.

**False-green trap:** `__studioRunChatBubbleMotionSelfTest` reported **8/8** after v0.0.104 because the hard gate **excluded layout ΔY during co-travel**. Transform can be smooth while **camera scroll + layout height** still look like chops to humans.

---

## What already failed / was tried

| Wave | What agents did | Why insufficient |
|------|-----------------|------------------|
| Earlier | PP-34 / PP-39 / co-travel / scrollLock | Residuals returned; stack fights |
| v0.0.104 | Scroll re-anchor on target drift; thinking exit = `STUDIO_ENTER_MS`; HelpfulStrip defer; CSS thinking dots; self-test layout gate relaxed | Self-test green ≠ PO eyes; may have **masked** the real chop (layout/camera) instead of removing it |
| Diagnostics | JUMP/CHOP suppressed under `scrollLock` / cam-travel | QA can look clean while content jumps with scroll |

**Do not** re-apply the same “relax the assert” fix. Prefer **make motion continuous**, then tighten asserts to match eyes.

---

## Clash stack to investigate (thorough)

Suspect **multiple systems same beat** — map before coding:

1. **Motion pull-up** — `CHAT_PULL_UP` opacity+y on `.chat__bubble` (`chatMotion.ts` / `ChatScreen.tsx`)
2. **Camera co-travel** — `scrollCameraToTarget` / host-end `durationMs: STUDIO_ENTER_MS` + `coTravel` while pull-up lock held (`ChatScreen` settle + `playbackScroll.ts`)
3. **Thinking→reply handoff** — `AnimatePresence mode="sync"` + absolute thinking CSS + reply mount full height (`chat.css` `:has`, `ChatThinkingBubble`)
4. **Layout growth** — helpful strip / tall reply height (HelpfulStrip defer may be incomplete)
5. **Composer clearance top-up** — post co-travel timeouts / TRACE tags
6. **CSS** — any remaining transition/animation on bubble/thinking/column fighting FM (`chat.css`, globals Make leftovers)
7. **Reveal bridge** — `visibleCount` / `pullLive` / double-rAF / sample restart mid tween

Primary code:  
`src/projects/boots-pharmacy/screens/chat/{ChatScreen,chatMotion,ChatThinkingBubble,chat.css,chatScenarioRevealBridge}.ts(x)`  
`src/app/scenario/playbackScroll.ts`  
`src/app/shell/agent-testing/chatBubbleMotionSelfTest.ts` · `playbackDiag.ts` bubble JUMP/CHOP

---

## How to debug (mandatory recipe)

1. **ALWAYS CLEAR** QA · open agent overlay + logger (gate open).
2. Localhost **only** `http://localhost:5173/` — reuse Studio tab (R11).
3. Capture **both**:
   - Eyes: MCP screenshots / short trace during q0→r1 and a tall reply (r1/r2).
   - Data: Save Log + `[PLAYBACK_DIAG] chat-bubble-motion` — especially `layoutY`, `deltaY`, `deltaScrollTop`, `scrollLock`, camera TRACE tags.
4. Run self-test **and** human Play/SF through chat — **both** must feel continuous.
5. Build a **felony table**: time-aligned symptom → owning system (Motion vs camera vs layout vs CSS). No mega-diff without the table.
6. Fix **one clash class at a time**; re-prove after each.
7. Done only when: PO eyes OK **or** Arch + Uma + Quinn agree continuous + Save Log shows no large single-frame scroll/layout steps during appear **and** self-test still green **with gates that match eyes** (re-tighten if needed).

Helpers:

```js
await window.__studioRunChatBubbleMotionSelfTest?.()
await window.__studioRunAgenticFullPlayProve?.() // through chat beats
window.__studioDownloadAgentTestingDump?.()
```

---

## Team shape

Arch parent → parallel **Quinn** (evidence/Save Log) · **Uma** (CSS/Motion clash) · **Finn** (one fix class) · **Bea** (appear bands P0) · **Ben** (diag honesty if gate lies).  
**Arch rejects “done”** if only self-test green or only docs updated.

---

## Out of scope this handoff

- Traditional scroll-reversal (board 0d) unless it blocks chat camera
- History/Details migrate (#7)
- Inventing a second enter animation / CSS keyframe zoo

---

## Paste to new agent (short)

```
Workspace: E:\UX\ux-studio only. Tip ~v0.0.104. PP-14 REOPEN / NEXT_STEPS 0e.

PO: chat bubbles still CHOPPY after multi-agent fixes. Self-test 8/8 is FALSE-GREEN risk
(layout ΔY during co-travel was excluded from hard gate). Investigate clash stack thoroughly
(Motion pull-up + camera co-travel + thinking handoff + layout/CSS) BEFORE coding.

MUST: ALWAYS CLEAR QA, Save Log + MCP eyes, felony table time-aligned, one clash class per fix.
MUST NOT: claim PROVEN from self-test alone; relax asserts further without removing visible chop.

Read: docs/product/PAINPOINTS.md PP-14, MOTION.md chat north star, CHAT_PAGE_RAILS appear north star,
docs/projects/.../audits if any, chatMotion.ts + ChatScreen settle + playbackScroll animateScrollTo.
Prove: continuous appear on tall replies + self-test honest vs eyes. Team check Knowledge used.
```

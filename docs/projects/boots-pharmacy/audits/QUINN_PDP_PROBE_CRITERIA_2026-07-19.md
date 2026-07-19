# Quinn (QA) — PDP MCP prove criteria

**Status:** MCP matrix **PASS** @ tip `57775a3` / v0.0.36 — evidence [FE_AUDIT_PDP_MCP_2026-07-19.md](./FE_AUDIT_PDP_MCP_2026-07-19.md).  
**PAGE FINAL PASS:** **HARD-GREEN** (`hardGreen: true` @ tip `57775a3`) — Uma §0a PROVEN @ `76e2433`; Quinn 23/23 PASS @ `57775a3` / v0.0.36.  
**Updated:** 2026-07-19 (Arch HARD-GREEN restore after playback panel + cursor lock re-prove)  
**Screen:** `pdp` (Frame child 8)  
**Register:** [../features/PDP_MAKE_PARITY_REGISTER.md](../features/PDP_MAKE_PARITY_REGISTER.md)  
**Refs:** [RECORDING.md](../../../shell/RECORDING.md) · LESSONS overlay/scroll · `studioMcpPageProbe.ts`

---

## Hard refuse rules

- **No false PROVEN** — Vitest/build green alone = BAD.
- Overlay missing / not visible on any step = FAIL.
- Click-through under open modal = felony FAIL.
- Invented PDP loader/spinner = FAIL.
- Probe must use `{ reload: false }`. Do **not** run unbounded robo prove that navigates away.

---

## Probe entry

```js
await window.__studioRunMcpPageProbe?.({ screenId: "pdp", reload: false })
```

**Prep:** Sign Out / `__studioSetLoggedIn(false)`; empty chickenpox wishlist heart; Book now £150 before probe.

**Matrix:** 23 steps (overlay-arm → url-screen) — see [FE_AUDIT_PDP_MCP_2026-07-19.md](./FE_AUDIT_PDP_MCP_2026-07-19.md).

**Final Pass:** `PAGE FINAL PASS — pdp — HARD-GREEN` (Home still waits PO `+`).

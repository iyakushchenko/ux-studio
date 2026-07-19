# UX Studio — next steps (living board)

**Updated:** 2026-07-19  
**Owner:** Arch (agents execute; human PO accept/reject + assets only; **Pax** sim for bump/push)  
**Team:** [TEAM.md](./TEAM.md) · Forecast: [PRODUCT_FORECAST.md](./PRODUCT_FORECAST.md) · [ARCHITECTURE.md](./ARCHITECTURE.md) · [HYGIENE.md](./HYGIENE.md)  
**Refs:** [COMMAND_DOCTRINE.md](./COMMAND_DOCTRINE.md) · [CI_ACTIONS_BUDGET.md](./CI_ACTIONS_BUDGET.md) · [NAMING.md](./NAMING.md) · [../shell/URL.md](../shell/URL.md)

---

## Done definition — React page (erase-Make program)

A screen is **DONE** only when **all** are true:

1. **React-mounted** under UXDS + project chrome (`data-studio-react-screen=<screenId>`).
2. **Make child retired from view** with wire gates:
   - Prefer **deleting** the Make Frame child when safe (no CJM/playback regress).
   - Else hide via `data-studio-make-retired=<screenId>` + `display:none`; Make wire effects **must** early-return when React is mounted.
3. **No LEGACY growth** for the React path (screen CSS / UXDS / theme only).
4. **Honest residual** documented in the feature brief / audit (what Make still exists in DOM, what fidelity is Partial).
5. Uma audit **PROVEN** (or honest FAIL with blockers) + Quinn prove (tests + localhost).
6. **PAGE FINAL PASS hard-green** — [PAGE_FINAL_PASS.md](./PAGE_FINAL_PASS.md) + `check:page-final-pass` (Finn/Uma). **Required before the next migrated page may start.**

---

## NOW

1. [x] **PLP React migration** — DONE by erase-Make definition. Brief: [PLP_REACT.md](../projects/boots-pharmacy/features/PLP_REACT.md) · audit [FE_AUDIT_PLP_2026-07-19.md](../projects/boots-pharmacy/audits/FE_AUDIT_PLP_2026-07-19.md).
2. [x] **PLP Make parity restore** — register [PLP_MAKE_PARITY_REGISTER.md](../projects/boots-pharmacy/features/PLP_MAKE_PARITY_REGISTER.md); P0 gaps fixed (bg fill, hero shadow, listing wrapper, preloader, filter chips); audit PROVEN; patch `0.0.5`.
2b. [x] **PLP fidelity rage fix** — Advantage bar, heart optimistic hover/click, Book now commerce hover, tile border removed, Reset Filters icon+text; Uma checklist + team-check harden; patch bump.
2c. [x] **PLP preloader + checkbox hover (PO rage #2)** — real Make spinner overlay (hide tiles, in-band); mint checkbox hover; Uma loading/checkbox sign-off gates; patch bump.
2d. [x] **PLP invent/dupe rage #3** — one loader label (no count duplicate), height lock, Make empty-heart navy hover (no fuchsia invent); MCP matrix mandatory; prior PROVEN revoked; `0.0.8`.
2e. [x] **PLP PAGE FINAL PASS hard-green** — structure stamp + `check:page-final-pass` green; Quinn MCP `__studioRunMcpPageProbe({ screenId:"plp" })` full matrix PASS (overlay + scroll-into-view + landmarks); `mcpFinalPass: HARD-GREEN` @ tip `6358184` / v0.0.17. Audit: [FE_AUDIT_PLP_PAGE_FINAL_PASS_2026-07-19.md](../projects/boots-pharmacy/audits/FE_AUDIT_PLP_PAGE_FINAL_PASS_2026-07-19.md). **PDP unblocked.**
3. [ ] **PDP React migration** — **scaffold mounted** (2026-07-19). Register [PDP_MAKE_PARITY_REGISTER.md](../projects/boots-pharmacy/features/PDP_MAKE_PARITY_REGISTER.md) · brief [PDP_REACT.md](../projects/boots-pharmacy/features/PDP_REACT.md) · React `screens/pdp/*` (L1–L13 RTB) · Uma [UMA_FIDELITY_PDP_2026-07-19.md](../projects/boots-pharmacy/audits/UMA_FIDELITY_PDP_2026-07-19.md) IN PROGRESS · Quinn prep [QUINN_PDP_PROBE_CRITERIA_2026-07-19.md](../projects/boots-pharmacy/audits/QUINN_PDP_PROBE_CRITERIA_2026-07-19.md). **Not PROVEN / not Final Pass.** Next: below-fold L14–L20 + Quinn MCP recipe + Uma side-by-side. Order lock: **PDP → Home → Chat → History/Details**.
4. [ ] **Versioning habit** — append notes on every user-visible ship; Pax decides patch; Ben executes ([VERSIONING.md](./VERSIONING.md)).

---

## NEXT (erase-Make sequence)

**Gate:** each page starts only after the previous is **PAGE FINAL PASS hard-green** ([PAGE_FINAL_PASS.md](./PAGE_FINAL_PASS.md)). Parallel callsigns + Knowledge used still required.

5. [ ] **Home React migration** — after PDP Final Pass hard-green. Site Pilot Home (child 11).
6. [ ] **Chat React migration** — after Home Final Pass hard-green. Site Pilot Chat (child 10).
7. [ ] **Appointment History + Details** — after Chat Final Pass hard-green. Children 2 + 1.
8. [ ] **Delete Book Step 1–3 Make children** — after History/Details Final Pass hard-green + CJM/playback green; until then keep `data-studio-make-retired` residual.
9. [ ] **LEGACY retirement (by screen)** — shrink Make wire + `globals-screens` as React pages land. Concept `.proto-*` classes retire with their screen.
10. [ ] **Engine monster splits** — on next touch of `App.tsx` / `useJourneyPlayback.ts`, extract by domain — not micro-files.
11. [ ] **Grow UXDS by page** — extract only on second use ([COMPONENT_LIBRARY.md](./COMPONENT_LIBRARY.md)).
12. [ ] **Residual fidelity (low)** — Book Steps 1–3 Make-only hexes with no bridge token yet. Do **not** invent aliases. PLP residuals: AI promo strip, View all, catalog depth (see register). Advantage bar restored.

---

## LATER

13. [ ] **Second project rabbit** — after Boots book + URL + REC proven on Pages.
14. [ ] **Release / tag CI** — when versioning habit is stable and Actions budget allows.
15. [ ] **Broader CSS check ratchets** — more `scripts/check-*.mjs`, not more Playwright on every push.
16. [ ] **On-demand lean smoke** — keep `workflow_dispatch` / local `npm run smoke`; do **not** return auto smoke to default CI without a Director rewrite of this board.

---

## Done recently (context)

- [x] **PLP Make parity restore** — register + P0 fidelity; audit PROVEN; `v0.0.5`.
- [x] **PLP preloader + checkbox hover** — Make overlay scenario + mint hover; team loading gates; `v0.0.7`.
- [x] **PLP React migration** — erase-Make DONE; audit PROVEN; Make child 9 retired (delete deferred).
- [x] **Honest version chip + unstick agent overlay** — tip `6c5c911`.
- [x] **REC capture gaps (v3)** — beat-enter / scroll / typed-text capture+replay; compile still gaps scroll/typed.
- [x] **Post-agent clean slate** — hub home + strip modal; Quinn localhost PROVEN.
- [x] **Lean UX team OS + modal URL + sitrep z-index**.
- [x] **Recording compile→journeys (vertical)**.
- [x] **Version chip + felony gate**.
- [x] **Book Steps 1–3 React pilots** — Make retired via `data-studio-make-retired` (delete Make children deferred to end of erase-Make sequence).
- [x] **Domain CSS/attrs + hygiene + naming pack**.

---

## Hard locks (do not regress)

| Lock | Rule |
|------|------|
| **Erase-Make DONE** | React mount + Make retired + wire gates + no LEGACY growth + honest residual + **PAGE FINAL PASS hard-green** |
| **PAGE FINAL PASS** | **No new migrated page** until previous hard-green — stamp `PAGE_FINAL_PASS.json` + `check:page-final-pass` ([PAGE_FINAL_PASS.md](./PAGE_FINAL_PASS.md)); Arch enforces |
| **Sequence** | PLP → PDP → Home → Chat → History/Details → delete Book Make children (each step gated by Final Pass) |
| **REC ⊗ CJM ⊗ AIR** | REC off when journey mode on; XOR; AIR locks both |
| **No LEGACY growth** | New React page styles → screen CSS / UXDS / theme only |
| **No new `.proto-*` / `data-proto-*`** | PANEL/chrome/attrs use `.studio-*` / `data-studio-*` |
| **Nazi QA** | UI ship needs audit **PROVEN** before PO green-light |
| **CI budget** | No auto marathon Playwright on every push |
| **Post-push sitrep** | `gh run list` after push |
| **Hygiene** | `check:hygiene` must stay green |
| **Felonies** | `check:felonies` + `check:version` + `check:page-final-pass` in `npm test` |
| **Naming** | [NAMING.md](./NAMING.md); folder = `screenId` |
| **Clean URL** | No sticky `?proof=*` |
| **Workspace** | `E:\UX\ux-studio` only |

---

## Related

- [PAGE_FINAL_PASS.md](./PAGE_FINAL_PASS.md)
- [PRODUCT_FORECAST.md](./PRODUCT_FORECAST.md)
- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [HYGIENE.md](./HYGIENE.md)
- [LESSONS_LEARNED.md](./LESSONS_LEARNED.md)
- [POST_CHANGE_CHECKLIST.md](./POST_CHANGE_CHECKLIST.md)
- [PRODUCT_OWNER_BRIEF.md](./PRODUCT_OWNER_BRIEF.md)

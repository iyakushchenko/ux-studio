# UX Studio — next steps (living board)

**Updated:** 2026-07-22  
**Owner:** Arch (agents execute; human PO accept/reject + assets only; **Pax** sim for bump/push)  
**Status authority:** This file is the **only mutable source of truth** for current priority, sequence, blockers, and completion. Forecasts, briefs, and feature registers may preserve historical context; when they disagree with this board, treat their status prose as historical. Evidence artifacts remain authoritative for the proof they record.  
**Team:** [TEAM.md](./TEAM.md) · Forecast: [PRODUCT_FORECAST.md](./PRODUCT_FORECAST.md) · Painpoints: [PAINPOINTS.md](./PAINPOINTS.md) · [ARCHITECTURE.md](./ARCHITECTURE.md) · [HYGIENE.md](./HYGIENE.md)  
**Refs:** [COMMAND_DOCTRINE.md](./COMMAND_DOCTRINE.md) · [CI_ACTIONS_BUDGET.md](./CI_ACTIONS_BUDGET.md) · [NAMING.md](./NAMING.md) · [../shell/URL.md](../shell/URL.md) · [../shell/CJM_RECORD_PLAY_EDIT.md](../shell/CJM_RECORD_PLAY_EDIT.md)

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

0. [x] **Agent testing mid-flight QA shell (PP-10)** — `src/app/shell/agent-testing/`; R11 `:5173` mid-flight prove PASS 2026-07-20 (colors/names/timer/sitrep/alarm/cursor/scroll/timeline/START-END/dumps). Track: [PAINPOINTS.md](./PAINPOINTS.md).
0a. [~] **QA overlay trust / dual-role self-test (PP-13)** — pack expanded 2026-07-20 (pause/capture, interactive-only, Session origin, fail-freeze, presence, RTT, STEPPED/PLAYBACK, RESULT seal, Message withhold, stale-green, diag mirror). Self-test: [`SELF_TEST.md`](../../src/app/shell/agent-testing/SELF_TEST.md) · `__studioRunQaSelfTestSmoke()`. Keep eyes until residuals rare.
0b. [x] **Playback reliability / diag-first (PP-01…PP-08)** — 2026-07-20 wave: agentic Play→end + retreat + traditional Play **PASS** on `:5173`; PP-01/03/06/07 → **WATCH**. Keep PLAYBACK_DIAG; residuals stay eyes-on (not COMPLETE forever). See [PAINPOINTS.md](./PAINPOINTS.md).
0c. [x] **CJM Record/Play/Edit = guitar tabs** — doctrine [CJM_RECORD_PLAY_EDIT.md](../shell/CJM_RECORD_PLAY_EDIT.md); Play≡Step; Edit-by-user-story; Book Step2 already-selected → **other** 24/16:30; agentic prove `__studioRunAgenticFullPlayProve`.
0d. [ ] **Traditional CJM smoothness** — PO dump 2026-07-20T22:58:41Z: Play completes but **3× scroll-reversal** camera yanks (Reserve / Open Appointments / View Details). Sitrep: [TRADITIONAL_CJM_UX_2026-07-21.md](../projects/boots-pharmacy/audits/TRADITIONAL_CJM_UX_2026-07-21.md). **Not green** until camera ROI + re-dump.
0e. [ ] **Chat bubble appear chop (PP-14 REOPEN)** — PO still sees choppy progressive/send bubbles after multi-agent waves (tip `7e0cce7` / v0.0.104 self-test 8/8 = **false-green risk**). Thorough clash investigation — [PAINPOINTS.md](./PAINPOINTS.md) PP-14. **Do not claim PROVEN from self-test alone.**
0f. [x] **Appointment History React migration** — **PAGE FINAL PASS HARD-GREEN** 2026-07-22 (`appointment-history`). Uma PROVEN · Quinn MCP 8/8 · densify gate · audit [FE_AUDIT_APPOINTMENT_HISTORY_PAGE_FINAL_PASS_2026-07-22.md](../projects/boots-pharmacy/audits/FE_AUDIT_APPOINTMENT_HISTORY_PAGE_FINAL_PASS_2026-07-22.md). **Details unblocked.**
0g. [x] **Appointment Details React migration** — **PAGE FINAL PASS HARD-GREEN** 2026-07-22 (`appointment-details`). Uma PROVEN · Quinn MCP 10/10 · densify 20/20 · audit [FE_AUDIT_APPOINTMENT_DETAILS_PAGE_FINAL_PASS_2026-07-22.md](../projects/boots-pharmacy/audits/FE_AUDIT_APPOINTMENT_DETAILS_PAGE_FINAL_PASS_2026-07-22.md).
1. [x] **PLP React migration** — DONE by erase-Make definition. Brief: [PLP_REACT.md](../projects/boots-pharmacy/features/PLP_REACT.md) · audit [FE_AUDIT_PLP_2026-07-19.md](../projects/boots-pharmacy/audits/FE_AUDIT_PLP_2026-07-19.md).
2. [x] **PLP Make parity restore** — register [PLP_MAKE_PARITY_REGISTER.md](../projects/boots-pharmacy/features/PLP_MAKE_PARITY_REGISTER.md); P0 gaps fixed (bg fill, hero shadow, listing wrapper, preloader, filter chips); audit PROVEN; patch `0.0.5`.
2b. [x] **PLP fidelity rage fix** — Advantage bar, heart optimistic hover/click, Book now commerce hover, tile border removed, Reset Filters icon+text; Uma checklist + team-check harden; patch bump.
2c. [x] **PLP preloader + checkbox hover (PO rage #2)** — real Make spinner overlay (hide tiles, in-band); mint checkbox hover; Uma loading/checkbox sign-off gates; patch bump.
2d. [x] **PLP invent/dupe rage #3** — one loader label (no count duplicate), height lock, Make empty-heart navy hover (no fuchsia invent); MCP matrix mandatory; prior PROVEN revoked; `0.0.8`.
2e. [x] **PLP PAGE FINAL PASS hard-green** — structure stamp + `check:page-final-pass` green; Quinn MCP `__studioRunMcpPageProbe({ screenId:"plp" })` full matrix PASS (overlay + scroll-into-view + landmarks); `mcpFinalPass: HARD-GREEN` @ tip `6358184` / v0.0.17. Audit: [FE_AUDIT_PLP_PAGE_FINAL_PASS_2026-07-19.md](../projects/boots-pharmacy/audits/FE_AUDIT_PLP_PAGE_FINAL_PASS_2026-07-19.md). **PDP unblocked.**
3. [x] **PDP React migration** — DONE by erase-Make definition (2026-07-19). Register [PDP_MAKE_PARITY_REGISTER.md](../projects/boots-pharmacy/features/PDP_MAKE_PARITY_REGISTER.md) · brief [PDP_REACT.md](../projects/boots-pharmacy/features/PDP_REACT.md) · React `screens/pdp/*` (L1–L20) · Uma [UMA_FIDELITY_PDP_2026-07-19.md](../projects/boots-pharmacy/audits/UMA_FIDELITY_PDP_2026-07-19.md) **PROVEN** · Quinn [FE_AUDIT_PDP_MCP_2026-07-19.md](../projects/boots-pharmacy/audits/FE_AUDIT_PDP_MCP_2026-07-19.md) PASS · `PARITY_PROVEN` pdp proven.
3e. [x] **PDP PAGE FINAL PASS hard-green** — structure `status=proven` + `check:page-final-pass` green; Quinn MCP `__studioRunMcpPageProbe({ screenId:"pdp", reload:false })` **23/23 PASS** ~27242ms on tip `f5f004f` / v0.0.38 (PromoMessageStrip + tip-stable cursor; after NEEDS-REPROVE demote); teardown clean stay `screen=pdp`; Arch restore `mcpFinalPass: HARD-GREEN` / `hardGreen: true` @ tip `53da33f`. Audit: [FE_AUDIT_PDP_PAGE_FINAL_PASS_2026-07-19.md](../projects/boots-pharmacy/audits/FE_AUDIT_PDP_PAGE_FINAL_PASS_2026-07-19.md).
4. [ ] **Versioning habit** — append notes on every user-visible ship; Pax decides patch; Ben executes ([VERSIONING.md](./VERSIONING.md)).

---

## NEXT (erase-Make sequence)

**Gate:** each page starts only after the previous is **PAGE FINAL PASS hard-green** ([PAGE_FINAL_PASS.md](./PAGE_FINAL_PASS.md)). Parallel callsigns + Knowledge used still required.

5. [x] **Site Pilot React migration** — **PAGE FINAL PASS HARD-GREEN** 2026-07-20 (`site-pilot`). Uma PROVEN · Quinn MCP 15/15 · audit [FE_AUDIT_SITE_PILOT_PAGE_FINAL_PASS_2026-07-20.md](../projects/boots-pharmacy/audits/FE_AUDIT_SITE_PILOT_PAGE_FINAL_PASS_2026-07-20.md). **Chat Final Pass unblocked.**
6. [x] **Chat React migration** — **PAGE FINAL PASS HARD-GREEN** 2026-07-20 (`chat`). Uma PROVEN · Quinn MCP 20/20 · audit [FE_AUDIT_CHAT_PAGE_FINAL_PASS_2026-07-20.md](../projects/boots-pharmacy/audits/FE_AUDIT_CHAT_PAGE_FINAL_PASS_2026-07-20.md). Shared `SitePilotComposer`. **History/Details unblocked.**
7. [x] **Appointment History** — **PAGE FINAL PASS HARD-GREEN** 2026-07-22 (`appointment-history`). Uma PROVEN · Quinn MCP 8/8 · audit [FE_AUDIT_APPOINTMENT_HISTORY_PAGE_FINAL_PASS_2026-07-22.md](../projects/boots-pharmacy/audits/FE_AUDIT_APPOINTMENT_HISTORY_PAGE_FINAL_PASS_2026-07-22.md). **Details unblocked.**
7b. [x] **Appointment Details** — **PAGE FINAL PASS HARD-GREEN** 2026-07-22 (`appointment-details`). Uma PROVEN · Quinn MCP 10/10 · audit [FE_AUDIT_APPOINTMENT_DETAILS_PAGE_FINAL_PASS_2026-07-22.md](../projects/boots-pharmacy/audits/FE_AUDIT_APPOINTMENT_DETAILS_PAGE_FINAL_PASS_2026-07-22.md).
8. [ ] **Delete Book Step 1–3 Make children** — after History/Details Final Pass hard-green + CJM/playback green; until then keep `data-studio-make-retired` residual.
9. [ ] **LEGACY retirement (by screen)** — shrink Make wire + `globals-screens` as React pages land. Concept `.proto-*` classes retire with their screen.
10. [ ] **Engine monster splits** — on next touch of `App.tsx` / `useJourneyPlayback.ts`, extract by domain — not micro-files.
11. [ ] **Grow UXDS by page** — extract only on second use ([COMPONENT_LIBRARY.md](./COMPONENT_LIBRARY.md)).
12. [ ] **Residual fidelity (low)** — Book Steps 1–3 Make-only hexes with no bridge token yet. Do **not** invent aliases. PLP residuals: AI promo strip, View all, catalog depth (see register). Advantage bar restored.

---

## LATER

12a. [ ] **P0 future — Playback/REC/QA prove architecture refactor + single regression harness** — **not now** (PO 2026-07-22). Pain: monster token burn + scattered law (`completeJourneyPlay` + many prove contracts) so a one-line product flip (e.g. play-end stay-at-end) cascades across smokes/docs/asserts. Desired: one SSoT behavior module + thin prove API + fewer duplicated play-end at-start/at-end contracts. Track: [PAINPOINTS.md](./PAINPOINTS.md) PP-41 · forecast LATER. **Do not start until Arch/Pax open this wave.**
12b. [ ] **Hover-reveal REC capture (engine-wide) — backlog, not now** (PO 2026-07-23). Today: no `hover` event kind exists in the recording pipeline (`transport | touchpoint | screen | demo-click | director-script | beat-enter | wire-intent | studio | scroll | typed-text | dwell` — see [RECORDING.md](../shell/RECORDING.md)); hover-revealed panels (e.g. `MegaMenuFlyout`) unmount on close so a recorded click has no DOM target on replay. **Desired (do this, later):** first-class `hover-reveal` event kind through capture → compile → replay (`recordingTypes.ts` / `recordingCapture.ts` / `recordingCompile.ts` / `recordingReplay.ts` + PLAYBACK_DIAG kind) — an engine feature, not a one-off mega-menu patch. **Decision now:** leave the gap as-is (option A) — do **not** build the interim "keep mounted, hidden via CSS" workaround (option B) while this sits in backlog. PO decision: [PRODUCT_OWNER_BRIEF.md](./PRODUCT_OWNER_BRIEF.md) ledger 2026-07-23. **Do not start until Arch/Pax open this wave.**
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
| **Sequence** | PLP → PDP → Site Pilot (`screenId=site-pilot`) → Chat → History/Details → delete Book Make children (each step gated by Final Pass) |
| **REC ⊗ CJM ⊗ AIR** | REC off when journey mode on; XOR; AIR locks both |
| **No LEGACY growth** | New React page styles → screen CSS / UXDS / theme only |
| **No new `.proto-*` / `data-proto-*`** | PANEL/chrome/attrs use `.studio-*` / `data-studio-*` |
| **Strict interface audit** | UI ship needs audit **PROVEN** before PO green-light |
| **CI budget** | No auto marathon Playwright on every push |
| **Post-push (R12)** | Optional `gh run list` peek; **no await** unless HARD-GREEN / release / PO prove |
| **Hygiene** | `check:hygiene` must stay green |
| **Felonies** | `check:felonies` + `check:version` + `check:page-final-pass` in `npm test` |
| **Naming** | [NAMING.md](./NAMING.md); folder = `screenId` |
| **Clean URL** | No sticky `?proof=*` |
| **Workspace** | `E:\UX\ux-studio` only |

---

## Related

- [PAINPOINTS.md](./PAINPOINTS.md)
- [PAGE_FINAL_PASS.md](./PAGE_FINAL_PASS.md)
- [PRODUCT_FORECAST.md](./PRODUCT_FORECAST.md)
- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [HYGIENE.md](./HYGIENE.md)
- [LESSONS_LEARNED.md](./LESSONS_LEARNED.md)
- [POST_CHANGE_CHECKLIST.md](./POST_CHANGE_CHECKLIST.md)
- [PRODUCT_OWNER_BRIEF.md](./PRODUCT_OWNER_BRIEF.md)
- [ ] Introduce shell-level dark/light appearance modes after the neutral dark shell surfaces and token contract are stable; do not couple shell appearance to project themes.

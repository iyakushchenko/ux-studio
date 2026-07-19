# UX Studio — next steps (living board)

**Updated:** 2026-07-19  
**Owner:** Tech Director (agents execute; PO accept/reject + assets only)  
**Refs:** [COMMAND_DOCTRINE.md](./COMMAND_DOCTRINE.md) · [CI_ACTIONS_BUDGET.md](./CI_ACTIONS_BUDGET.md) · [FE_UI_UX_AUDIT.md](./FE_UI_UX_AUDIT.md) · [COMPONENT_LIBRARY.md](./COMPONENT_LIBRARY.md) · [CSS_BASE_THEME.md](./CSS_BASE_THEME.md)

---

## NOW

1. [ ] **Fidelity debt (non-blocking)** — Step 1/2/3 hex→tokens harden; dead child-7 / child-4 / child-3 LEGACY CSS cleanup when touching those files; tertiary CTA layer extraction when next shared use forces it (summary Change already in UXDS).

---

## NEXT

2. [ ] **Versioning habit** — append notes on every user-visible ship (`npm run notes:append`). Release/tag CI stays **later**.
3. [ ] **Grow UXDS by page (ongoing)** — extract only when a second screen needs it; no speculative catalog ([COMPONENT_LIBRARY.md](./COMPONENT_LIBRARY.md)).

---

## LATER

4. [ ] **Release / tag CI** — only when versioning habit is stable and Actions budget allows.
5. [ ] **Broader CSS check ratchets** — more `scripts/check-*.mjs` contracts (Summarizer-style), not more Playwright on every push.
6. [ ] **On-demand lean smoke** — keep `workflow_dispatch` / local `npm run smoke`; do **not** return auto smoke to default CI without a Director rewrite of this board.

---

## Done recently (context)

- [x] **UXDS book kits** — `BookAppointmentProgress` + `AppointmentSummaryPill` extracted; Steps 1–3 wired; light audit [FE_AUDIT_UXDS_BOOK_KITS_2026-07-19.md](../projects/boots-pharmacy/audits/FE_AUDIT_UXDS_BOOK_KITS_2026-07-19.md) **PROVEN** tip `d56fab1`.
- [x] **Agent testing overlay (PO rage)** — BR corner status + invisible click capture; MCP `stop({ reload: true })`; tip `4f0e12a`.
- [x] **Docs layout** — Boots product docs + FE audits under `docs/projects/boots-pharmacy/`; engine doctrine stays in `docs/product/`; old paths keep stubs.
- [x] **createRoot unmount race** — defer `root.unmount()` so book-step hosts never tear down during parent commit (tip `49e6397`).
- [x] **GitHub Pages verify (Step 3)** — deploy `1a567be` green; Pages `data-proto-react-screen=book-step-3`; Step 2 short time rows left-aligned; Step 1 under agentic-cjm browse stays (no Home/tab1 snap); REC⊗CJM (CJM on → REC disabled); `__protoAgentTestingOverlay` start/log/stop on Pages.
- [x] **Lessons + agent testing overlay** — [LESSONS_LEARNED.md](./LESSONS_LEARNED.md); director/checklist gates; `__protoAgentTestingOverlay` for MCP runs ([../shell/RECORDING.md](../shell/RECORDING.md)); tip `e35bf41`.
- [x] **Book Step 3 React migration** — Confirmation Frame child **3**; Make chrome hidden; AIR `data-proto-open-appointment`; audit [FE_AUDIT_BOOK_STEP3_2026-07-19.md](../projects/boots-pharmacy/audits/FE_AUDIT_BOOK_STEP3_2026-07-19.md) **PROVEN** tip `e35bf41`.
- [x] **Book Step 2 hotfix** — time-slot last-row left-align (CSS grid); agentic-cjm browse no longer snaps Book Step 1 → Home (`shouldNavigateBeatTabOnEnter`); tip `66e7fe0`; audit note on [FE_AUDIT_BOOK_STEP2_2026-07-19.md](../projects/boots-pharmacy/audits/FE_AUDIT_BOOK_STEP2_2026-07-19.md).
- [x] **Book Step 2 React migration** — Date/Time Frame child **4**; Make chrome hidden; calendar/reserve gated; audit [FE_AUDIT_BOOK_STEP2_2026-07-19.md](../projects/boots-pharmacy/audits/FE_AUDIT_BOOK_STEP2_2026-07-19.md) **PROVEN** (`af50556` / tip `76b5f55`).
- [x] **GitHub Pages verify (Step 2)** — deploy green; Pages shows `data-proto-react-screen=book-step-2` + host; MCP sanity REC⊗CJM pass on deployed build.
- [x] **REC ⊗ CJM** — REC disabled when CJM on; XOR both ways; AIR locks both (`800ec61`). Unit + MCP sanity.
- [x] **Slim CI** — unit + build default; Playwright smoke `workflow_dispatch` only (`009fb2b`).
- [x] **Actions bump** — checkout/setup-node v5; Node 22 app runtime (`3bec858`).
- [x] Book Step 1 React pilot + FE audits **PROVEN** (hybrid mount; LEGACY retires screen-by-screen).
- [x] Text-link contract + Make viewport link carve-out.
- [x] Local versioning skeleton + post-change checklist.
- [x] CSS layer lock BASE → THEME → PANEL → LEGACY documented.

---

## Hard locks (do not regress)

| Lock | Rule |
|------|------|
| **REC ⊗ CJM** | REC off when journey mode on; XOR; AIR locks both |
| **No LEGACY growth** | New React page styles → screen CSS / UXDS / theme only |
| **Nazi QA** | UI ship needs audit **PROVEN** before PO green-light |
| **CI budget** | No stacking full Playwright smoke via Actions without Director OK |
| **Lessons** | Read/append [LESSONS_LEARNED.md](./LESSONS_LEARNED.md) |

---

## Related

- [LESSONS_LEARNED.md](./LESSONS_LEARNED.md)
- [POST_CHANGE_CHECKLIST.md](./POST_CHANGE_CHECKLIST.md)
- [PRODUCT_OWNER_BRIEF.md](./PRODUCT_OWNER_BRIEF.md)
- [BOOTS_REACT_SCREEN_PILOT.md](../projects/boots-pharmacy/BOOTS_REACT_SCREEN_PILOT.md)
- [BOOTS_BOOK_STEP2_DESIGN_DELTA.md](../projects/boots-pharmacy/BOOTS_BOOK_STEP2_DESIGN_DELTA.md)
- [BOOTS_BOOK_STEP3_DESIGN_DELTA.md](../projects/boots-pharmacy/BOOTS_BOOK_STEP3_DESIGN_DELTA.md)
- [COMPONENT_LIBRARY.md](./COMPONENT_LIBRARY.md)

# UX Studio — next steps (living board)

**Updated:** 2026-07-19  
**Owner:** Tech Director (agents execute; PO accept/reject + assets only)  
**Refs:** [COMMAND_DOCTRINE.md](./COMMAND_DOCTRINE.md) · [CI_ACTIONS_BUDGET.md](./CI_ACTIONS_BUDGET.md) · [FE_UI_UX_AUDIT.md](./FE_UI_UX_AUDIT.md) · [COMPONENT_LIBRARY.md](./COMPONENT_LIBRARY.md) · [CSS_BASE_THEME.md](./CSS_BASE_THEME.md)

---

## NOW

1. [ ] **GitHub Pages verify (Step 3)** — after deploy of Book Step 3 + overlay ship: `data-proto-react-screen=book-step-3` on Confirmation; MCP sanity on Pages (chrome + overlay present).

---

## NEXT

2. [ ] **Grow UXDS by page** — extract kits only when a second screen needs them; retire LEGACY screen-by-screen ([COMPONENT_LIBRARY.md](./COMPONENT_LIBRARY.md)).
3. [ ] **Fidelity debt (non-blocking)** — Step 1/2/3 hex→tokens harden; dead child-7 / child-4 / child-3 LEGACY CSS cleanup when touching those files; tertiary CTA layer extraction when next shared use forces it.
4. [ ] **Versioning habit** — append notes on every user-visible ship (`npm run notes:append`). Release/tag CI stays **later**.

---

## LATER

6. [ ] **Release / tag CI** — only when versioning habit is stable and Actions budget allows.
7. [ ] **Broader CSS check ratchets** — more `scripts/check-*.mjs` contracts (Summarizer-style), not more Playwright on every push.
8. [ ] **On-demand lean smoke** — keep `workflow_dispatch` / local `npm run smoke`; do **not** return auto smoke to default CI without a Director rewrite of this board.

---

## Done recently (context)

- [x] **Lessons + agent testing overlay** — [LESSONS_LEARNED.md](./LESSONS_LEARNED.md); director/checklist gates; `__protoAgentTestingOverlay` for MCP runs ([../shell/RECORDING.md](../shell/RECORDING.md)).
- [x] **Book Step 3 React migration** — Confirmation Frame child **3**; Make chrome hidden; AIR `data-proto-open-appointment`; audit [FE_AUDIT_BOOK_STEP3_2026-07-19.md](./audits/FE_AUDIT_BOOK_STEP3_2026-07-19.md).
- [x] **Book Step 2 hotfix** — time-slot last-row left-align (CSS grid); agentic-cjm browse no longer snaps Book Step 1 → Home (`shouldNavigateBeatTabOnEnter`); tip `66e7fe0`; audit note on [FE_AUDIT_BOOK_STEP2_2026-07-19.md](./audits/FE_AUDIT_BOOK_STEP2_2026-07-19.md).
- [x] **Book Step 2 React migration** — Date/Time Frame child **4**; Make chrome hidden; calendar/reserve gated; audit [FE_AUDIT_BOOK_STEP2_2026-07-19.md](./audits/FE_AUDIT_BOOK_STEP2_2026-07-19.md) **PROVEN** (`af50556` / tip `76b5f55`).
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
- [BOOTS_REACT_SCREEN_PILOT.md](./BOOTS_REACT_SCREEN_PILOT.md)
- [BOOTS_BOOK_STEP2_DESIGN_DELTA.md](./BOOTS_BOOK_STEP2_DESIGN_DELTA.md)
- [BOOTS_BOOK_STEP3_DESIGN_DELTA.md](./BOOTS_BOOK_STEP3_DESIGN_DELTA.md)
- [COMPONENT_LIBRARY.md](./COMPONENT_LIBRARY.md)

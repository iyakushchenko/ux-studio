# UX Studio — next steps (living board)

**Updated:** 2026-07-19  
**Owner:** Tech Director (agents execute; PO accept/reject + assets only)  
**Refs:** [COMMAND_DOCTRINE.md](./COMMAND_DOCTRINE.md) · [CI_ACTIONS_BUDGET.md](./CI_ACTIONS_BUDGET.md) · [FE_UI_UX_AUDIT.md](./FE_UI_UX_AUDIT.md)

---

## NOW

1. **Ship REC ⊗ CJM fix** — REC disabled when CJM on; XOR both ways; AIR still locks both. Prove with unit + MCP sanity; push + Pages.
2. **Verify GitHub Pages** after push — `https://iyakushchenko.github.io/ux-studio/` loads; chrome REC/CJM still correct on deployed build.
3. **Chrome XOR proven before page work** — do not start Book Step 2 migration until REC⊗CJM is green on Pages (or localhost + PROVEN audit).

## NEXT

4. **Book Step 2 React migration** under BASE → THEME (+ PANEL only for engine chrome). Nazi QA FE audit **PROVEN** before PO.
5. **Grow UXDS by page** — migrate real kits as screens land; retire LEGACY screen-by-screen (no new React styles in LEGACY).
6. **Versioning habit** — append notes on user-visible ships (`npm run notes:append`). Release CI stays **later**.

## LATER

7. **Release / tag CI** — only when versioning habit is stable and budget allows.
8. **Broader CSS check ratchets** — more `scripts/check-*.mjs` contracts (Summarizer-style), not more Playwright on every push.
9. **On-demand lean smoke** — keep `workflow_dispatch` / local `npm run smoke`; do not return auto smoke to default CI without a Director rewrite of this board.

---

## Done recently (context)

- Local versioning skeleton + post-change checklist  
- Text-link contract + Make viewport link carve-out  
- Slim CI: unit + build default; Playwright smoke on-demand only  

---

## Related

- [POST_CHANGE_CHECKLIST.md](./POST_CHANGE_CHECKLIST.md)  
- [PRODUCT_OWNER_BRIEF.md](./PRODUCT_OWNER_BRIEF.md)  
- [COMPONENT_LIBRARY.md](./COMPONENT_LIBRARY.md)  

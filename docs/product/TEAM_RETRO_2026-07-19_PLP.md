# Team retrospective — PLP workstream (2026-07-19)

**Facilitator:** Arch (Director)  
**Stream:** Boots Pharmacy PLP Make→React (rage cycles → PAGE FINAL PASS HARD-GREEN)  
**Tip at close:** `528b54f` / v0.0.17 · `PAGE FINAL PASS — plp — HARD-GREEN`  
**PO ask:** Pain points + what worked; lock keep actions into team knowledge.

Format per callsign: **Pain** / **Worked** / **Keep** (2–4 bullets each). Dialogue, not essays.

---

## Opening — Arch (Director)

**Arch:** We closed PLP hard-green after too many rage loops. Themes on the table: inventing UX, missing Legacy logic, false PROVEN, overlay/URL, DS hover, parallel agents, knowledge use, final-pass gate. Speak for your hat — what hurt, what saved us, what we keep.

---

## Arch (Director)

**Pain**
- Stamped “done / PROVEN” while PO still saw invent chrome and missing bands — handoff distrust came late, after rage, not at first ship.
- Sequencing leaked: temptation to open PDP while PLP Final Pass was still soft-green / MCP-open.
- Knowledge was growing in LESSONS while siblings still re-discovered the same fail class mid-stream.

**Worked**
- Parallel sibling dispatch + Arch synthesis beat mega-agent “everyone’s hat” chaos once we enforced it.
- PAGE FINAL PASS as a hard sequencing veto (no next page) finally stopped the board from racing ahead of fidelity.
- Rejecting PROVEN without Quinn MCP evidence log — once locked — cut the false-green loop.

**Keep**
- After every HARD-GREEN page: Arch runs a **micro-retro** into [TEAM_KNOWLEDGE.md](./TEAM_KNOWLEDGE.md) (this Reflex rule).
- Veto next migrated page until `PAGE FINAL PASS — <screenId> — HARD-GREEN`.
- Team check must show **Knowledge used** (applied), not write-only appends.

---

## Bea (BA)

**Pain**
- Early register treated loading/empty/updating as copy polish — P0 rows for Legacy spinner/overlay mechanism were missing or marked Fixed without mechanism notes.
- Advantage bar / filter wire logic (View all, counters, 10-cap) were not inventoried as first-class bands before Finn coded.
- “Residual OK” language hid whole missing components until PO rage.

**Worked**
- Band-by-band [PLP_LEGACY_PARITY_REGISTER.md](../projects/boots-pharmacy/features/PLP_LEGACY_PARITY_REGISTER.md) once forced complete — gave Uma/Quinn a shared truth table.
- Loading / empty / updating as mandatory P0 rows when Legacy has them — stopped “text-only Updating results…” ships.
- No next-page brief until previous Final Pass hard-green — protects Bea from writing PDP acceptance on a soft PLP.

**Keep**
- Register **every** Legacy band **before** Finn codes — including loader mechanism + layout notes, not labels alone.
- Unchecked P0 = Bea FAIL on team check; Quinn cannot PASS with open P0s.
- Wire scripts / Legacy behavior (View all, counters, hide-tiles) listed as acceptance, not “nice FE detail.”

---

## Finn (FE)

**Pain**
- Rebuilt filter search / hearts / loader from intuition — invented fuchsia empty-heart hover, duplicate loader copy, left-side magnifier, double clear X.
- LEGACY hover selectors (`[aria-hidden]`) painted a box on UXDS search icons — port without kit awareness.
- Hybrid/mount and landmark gaps (header+main, BEM=`screenId`) showed up late under Final Pass, not at first mount.

**Worked**
- UXDS kits + ratchets (`check:parity-ratchets`) turned typical misses into CI FAIL instead of chat regret.
- Height-locked listing + one spinner label + count-hide-on-load matched Legacy once we stopped “improving” it.
- Co-owning `check:page-final-pass` with Uma made structure/naming a build gate, not a docs afterthought.

**Keep**
- Prefer under-match Legacy over inventing hover/loader chrome.
- Modal ship checklist: `STUDIO_MODAL` + `data-studio-modal` + **URL `modal` id in [URL.md](../shell/URL.md)** before any dialog lands.
- New typical fail class → ask Arch/Ben for a ratchet **same ship**.

---

## Uma (UI/UX)

**Pain**
- Side-by-side Legacy vs React skipped Nazi-hover on SearchField / checkbox / empty heart — rest-state screenshots looked “fine.”
- Signed or inherited PROVEN while typical DS state matrix (hover/focus/active/disabled) was incomplete.
- Invented attention chrome (fuchsia, borders, separators) passed visual skim until PO put Legacy next to React.

**Worked**
- Explicit team-check lines: `loading states`, `checkbox/radio hover`, `typical DS checks` — forced the miss classes into the open.
- UMA fidelity notes §0 / §0a as the Nazi checklist before PROVEN.
- Final Pass landmarks + BEM=`screenId` stamp — page structure stopped being optional polish.

**Keep**
- No invent: if Legacy doesn’t have it, don’t add it; under-match beats pretty-wrong.
- Typical DS checks vs **kit + Legacy** before any screen PROVEN — missing DS hover = FAIL class.
- Co-sign PAGE FINAL PASS checklist with Finn; hard-green before Arch opens the next page.

---

## Quinn (QA)

**Pain**
- Early “PASS” on prior-ship wishlist / green Vitest while MCP real-user matrix was thin or missing — false PROVEN enabler.
- Probe clicked through open Quick View; below-fold controls interacted without scroll-into-view; overlay sometimes absent mid-run.
- Interaction matrix didn’t MCP-hover SearchField until PO called out flat DS chrome.

**Worked**
- `__studioRunMcpPageProbe` as the default prove path — robo-cursor + overlay PASS/FAIL the PO can see.
- Overlay-arm + refuse-under-modal + scroll-into-view as hard FAIL gates on every step.
- Stamping `mcpFinalPass: HARD-GREEN` only after full matrix — closed PLP for real and unblocked PDP.

**Keep**
- Arch rejects PROVEN without MCP evidence log; prior PROVEN is BAD when PO disputes pixels until re-proved.
- Overlay visible entire probe; scroll-into-view before every interact; overlay-eyes refuse click-through.
- MCP-hover ≥1 SearchField (and full matrix) on every screen ship.

---

## Ben (BE)

**Pain**
- Gates lived in docs while felonies/ratchets weren’t wired — process truth ≠ `npm test` truth until we caught up.
- Overlay registry + URL modal table drifted from shipped dialogs (Quick View et al.).
- Version/notes churn across rage patches without always pairing chip prove + Knowledge improved tip SHA.

**Worked**
- `check:felonies` / `check:parity-ratchets` / `check:parity-proven` / `check:page-final-pass` in `npm test` — CI as felony court.
- Modal registry + probe hygiene owned with Quinn (vite up, overlay start/stop, stay-on-page).
- Patch bumps only when user-visible (Pax call); docs/process ships can skip bump.

**Keep**
- **Modal URL registry mandatory before any dialog ship** — [URL.md](../shell/URL.md) `modal` table + `REGISTERED_OVERLAY_MODAL_IDS` + `data-studio-modal` same PR.
- New fail class → ratchet or felony same ship; no chat-only PROVEN.
- Post-push `gh` sitrep; chip = `package.json` after every bump.

---

## Pax (PO sim)

**Pain**
- Rage loops burned PO trust: invent UX, missing Legacy logic, false PROVEN, flat DS hover — “tests passed” meant nothing.
- Board tried to race PDP while PLP still bled fidelity.
- Knowledge base looked busy but wasn’t changing behavior until Knowledge used became a gate.

**Worked**
- Zero-tolerance fidelity bar + MCP-visible prove restored a believable accept path.
- PAGE FINAL PASS hard-green before next page — product sequencing matches quality, not hope.
- Parallel callsigns + Arch veto — team OS felt like a team, not a lone coder with costumes.

**Keep**
- Accept bar = Legacy parity + MCP matrix + Final Pass hard-green — not green Vitest alone.
- Bump only when Finn/user-visible ships need it; docs/reflex notes = notes+push, no bump.
- Human PO `+` / `ok` on board only after Arch reports HARD-GREEN honestly.

---

## Themes (from PLP rage) — locked takeaways

| Theme | Verdict |
|-------|---------|
| **Inventing UX** | Forbidden. Under-match Legacy. Empty-heart fuchsia, invent borders, duplicate loader copy = ship fail. |
| **Missing Legacy logic** | Register every band + wire behavior (loader mechanism, View all, counters, count-hide) before Finn codes. |
| **False PROVEN** | PROVEN without Quinn MCP evidence = invalid. PO dispute → revoke until re-prove. |
| **Overlay / URL** | Every blocking dialog: guard registry + `data-studio-modal` + URL `modal` id **before** ship. |
| **DS hover** | Typical DS state matrix mandatory; missing hover = FAIL class; MCP-hover ≥1 SearchField. |
| **Parallel agents** | Serious streams = sibling subagents; mega-agent collapse = process fail. |
| **Knowledge use** | Re-read before work; Knowledge used on team check; Knowledge improved after ships; write-only = FAIL. |
| **Final-pass gate** | No next migrated page until HARD-GREEN; Finn/Uma checklist + `check:page-final-pass`; Arch veto. |

---

## Top keep actions (Arch synthesis — apply on PDP+)

1. **Modal URL registry before any dialog ship** — URL.md + `STUDIO_MODAL` / felonies registry + `data-studio-modal` in the same change.  
2. **Legacy register complete (incl. loading mechanism) before Finn codes** — unchecked P0 blocks Quinn PASS.  
3. **No invent UX** — kit + Legacy only; under-match; typical DS hover/focus/active/disabled signed by Uma + MCP-proved by Quinn.  
4. **PROVEN requires MCP page-probe evidence** — overlay visible, scroll-into-view, overlay-eyes; Arch rejects chat-only green.  
5. **HARD-GREEN → micro-retro → next page** — PAGE FINAL PASS gate + Arch Reflex into TEAM_KNOWLEDGE before opening the next migrated screen.

---

---

## Arch micro-retro — overlay / QV close HARD-GREEN (2026-07-19 · tip `f28693c`)

**Stream close:** v0.0.19 `1624f79` (QV URL close race) → v0.0.20 `de2edf0` (overlay pre-arm / PASS-FAIL / forceClear / probe `reload:false`) → Quinn PASS/PROVEN `f28693c` (stay-closed + full PLP matrix).  
**Knowledge used:** Arch section + TEAM_RETRO Keep #1/#4 + LESSONS modal URL bridge + RECORDING crash-safe reload.

**What broke**
- Closing QV cleared live state before `&modal=` stripped → URL bridge re-applied open → modal thrash (FAIL on `43c1ec8`).
- Probe default `reload: true` + mid-settle re-arm nested reload timers → tab crash / reload loop under agent automation.
- Sticky agent overlay after sitrep eroded PO trust in PASS/FAIL chrome.

**What we learned**
- Modal URL sync is incomplete without **intentional-close suppress** (`studioModalUrlBridgePlan`) — open+close both must stay closed under probe timing.
- Overlay lifecycle is a prove surface: **pre-arm → steps → green/red sitrep → forceClear**; probe defaults **`reload: false`**.
- Quinn re-prove on tip after Knowledge/docs stamps — PASS/PROVEN only when `plp-quick-view-close` stay-closed samples hold.

**What’s next**
- **Hold PDP** until PO `+`. PLP Final Pass already HARD-GREEN; overlay/QV close now proven on tip.
- Residual (non-urgent): journey / `withMcpTestSession` may still do **one** post-sitrep reload when explicitly opted in — not a loop; page probe stays `reload: false`.
- Pages tip OK; no sticky overlay expected after forceClear settle.

---

## Related

- [TEAM_KNOWLEDGE.md](./TEAM_KNOWLEDGE.md) · [TEAM.md](./TEAM.md) · [COMMAND_DOCTRINE.md](./COMMAND_DOCTRINE.md)  
- [PAGE_FINAL_PASS.md](./PAGE_FINAL_PASS.md) · [LESSONS_LEARNED.md](./LESSONS_LEARNED.md)  
- Audits: [FE_AUDIT_PLP_PAGE_FINAL_PASS_2026-07-19.md](../projects/boots-pharmacy/audits/FE_AUDIT_PLP_PAGE_FINAL_PASS_2026-07-19.md) · rage trail `FE_AUDIT_PLP_2026-07-19_RAGE*.md` · [FE_AUDIT_QV_MODAL_URL_2026-07-19.md](../projects/boots-pharmacy/audits/FE_AUDIT_QV_MODAL_URL_2026-07-19.md) · [FE_AUDIT_OVERLAY_PREARM_SITREP_2026-07-19.md](../projects/boots-pharmacy/audits/FE_AUDIT_OVERLAY_PREARM_SITREP_2026-07-19.md)

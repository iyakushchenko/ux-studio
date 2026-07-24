# Team retrospective — Appointment History + Details workstream (2026-07-22)

**Facilitator:** Arch (Director)  
**Stream:** Boots Pharmacy Appointment History → Appointment Details Make→React (sequenced Final Pass wave)  
**Tip at close:** `95ccca7` tree · **v0.0.108** · `PAGE FINAL PASS — appointment-history — HARD-GREEN` then `PAGE FINAL PASS — appointment-details — HARD-GREEN`  
**PO ask:** Pain / Worked / Keep after both screens hard-green; lock keep actions before Book Legacy delete / header lane.

Format per callsign: **Pain** / **Worked** / **Keep** (2–4 bullets each). Dialogue, not essays.

---

## Opening — Arch (Director)

**Arch:** Chat was hard-green; we sequenced History then Details per PAGE FINAL PASS. Themes: Legacy densify `!important` beating React CSS, duplicated account `<aside>`, invent Cancel/Edit hover, per-screen densify truth (32/56 vs 20/20), terminal CTA hide, crumb → **React** History, engine probe registry, playback chain-advance for View Details. Both screens stamped HARD-GREEN 2026-07-22 — this retro was due **before** opening erase-Legacy Book children; filing it now.

---

## Arch (Director)

**Pain**
- Reflex micro-retro lagged the ship — Knowledge improved stamps on 2026-07-22 said “Reflex before Book Legacy delete” but the Pain/Worked/Keep doc did not land same wave; process debt until this file.
- Shared account chrome was forked twice (~90 lines JSX + CSS per screen) before `MaNavigationPanel` extract — predictable second-use tax.
- Header/footer asymmetry remains: footer is Legacy-free (`footerContent.ts` + `Footer.tsx`); header still `cloneNode(true)` on live Legacy DOM — frame delete blocked until a dedicated Final-Pass lane (see [NEXT_STEPS.md](./NEXT_STEPS.md) 7c).

**Worked**
- History HARD-GREEN **before** Details brief/mount — PAGE FINAL PASS sequencing held; no parallel Details React while History was Uma FAIL on densify.
- Dual hard-green same tip (`95ccca7` / v0.0.108) with honest residuals (Show All P1, Shipping omit, shared chrome extract noted).
- LESSONS + Knowledge improved captured densify gate, probe registry, and chain-advance — applied on re-prove, not write-only.

**Keep**
- After **each** HARD-GREEN page (or sequenced pair close): Arch **micro-retro** → [TEAM_KNOWLEDGE.md](./TEAM_KNOWLEDGE.md) index **before** next erase-Legacy or chrome lane.
- No next migrated page / Legacy delete until prior Final Pass hard-green + Reflex filed.
- Board item for header re-author (7c) — Final-Pass-gated like a page — before `frame/index.tsx` deletion.

---

## Bea (BA)

**Pain**
- Early History pass treated pad/gap as “set in CSS” without densify mechanism in the register — Uma measured 20/20 while React claimed 32/56.
- Details register risked copying History spacing assumptions; Details child-1 densify truth is **20/20**, not History’s 32/56.
- Terminal appointment `#8762341` (Cancelled) needed explicit P0: hide Edit/Cancel **and** entire CTA host — easy to miss as “just hide buttons.”

**Worked**
- [APPOINTMENT_HISTORY_LEGACY_PARITY_REGISTER.md](../projects/boots-pharmacy/features/APPOINTMENT_HISTORY_LEGACY_PARITY_REGISTER.md) + Details register gave Quinn/Uma shared P0 rows (View Details selector HARD, breadcrumb back, terminal rule).
- `data-studio-appointment-view-details="true"` stamped as probe contract — no engine `ButtonPrimary` Boots props.
- Omit Shipping / static buyer-payment as documented under-match — no invent accordion bands.

**Keep**
- Register **loader/densify mechanism** and terminal CTA host rule **before** Finn codes — unchecked P0 blocks Quinn PASS.
- Details back-nav HARD: crumb “Appointment history” → React `appointment-history` — no Legacy History handoff after Details ships.
- `MA_NAV_LINKED_LABELS` — link only screens that exist; under-match nav labels stay inert divs.

---

## Finn (FE)

**Pain**
- Legacy densify on History child-2 (`globals-chrome.css`, `!important` + `data-name`) overrode React page CSS until gated — looked like “FE typo,” was global chrome law.
- Duplicated account aside on both screens until `MaNavigationPanel` extract; host `align-self: stretch` missing on History/Details — 1200px main in wide viewport until LESSONS fix.
- Invent Cancel hover `#c96b6b` and bespoke Edit/Cancel wash — PO caught; PLP `.plp__tertiary` is the icon+text hover SSoT.

**Worked**
- Densify gate `:not([data-studio-react-screen])` on History child-2; Details child-1 stays densified until React mount retires Legacy.
- `MaNavigationPanel` + screen-owned `*_NAV_ITEMS` — dedup without merging content contracts.
- `mcpPageProbeRegistry` + `data-studio-action=history-view-details` — page registers probe, engine does not branch on Boots screen ids.
- Deferred unmount + `retireLegacyUnderPage` pattern consistent with prior migrations.

**Keep**
- New screen CSS: include `.studio-react-screen-host[data-studio-react-screen="<id>"] { align-self: stretch; width: 100%; }` from day one.
- Grep existing interaction role (PLP tertiary) before inventing hover; transparent bg + label `#000` + icon `--uxds-text-link-link`.
- Densify: measure computed styles after mount — gate off React hosts, don’t fight `!important` in page CSS alone.

---

## Uma (UI/UX)

**Pain**
- First History PROVEN attempt failed: card/info/CTA still densified (20/20, CTA 12, invent Cancel tone) — rest-state JSX looked right, computed styles wrong.
- Edit/Cancel got a new hover treatment before checking PLP Quick View tertiary — fidelity FAIL class (invent chrome).
- Load more looked disabled but `aria-disabled` only — hover still applied; needed PDP secondary token copy, not hardcoded hex pill.

**Worked**
- Re-measure gate after densify fix: pad **32**, gap **56**, title **25/32**, info **32** / `#c3c3c3`, CTA **32** — PROVEN on evidence.
- Details densify 20/20 signed separately from History — no false “same as History” spacing.
- Terminal CTA host absent for `#8762341` in MCP matrix — visibility rule proved, not assumed.

**Keep**
- Measure **computed** styles vs Legacy before PROVEN — especially when Legacy `data-name` survives on React nodes.
- Typical DS checks: icon+text tertiary = PLP pattern; commerce View Details = `ButtonPrimary` + probe hover step.
- Co-sign PAGE FINAL PASS with Finn; History hard-green before Details audit stamp.

---

## Quinn (QA)

**Pain**
- History probe first pass green while Uma still FAIL on densify — matrix passed interaction but not fidelity contract; required re-prove after gate.
- View Details handoff exercised Legacy Details before Details React — intentional sequence; restore History for `url-screen` had to stay in matrix.
- Playback `beat-tab-mismatch` at `history-view-details` until chain-advance rescue — same symptom class as Book Step 2 timing race.

**Worked**
- History **8/8** including View Details hover/click, Legacy Details hop, return History; Details **10/10** + terminal CTA hide + crumb back → React History.
- `reload: false` + overlay visible every step — LESSONS R11 `:5173` reuse tab.
- Interaction inventories `readinessPass` true, `invalid` 0 for both Legacy baseline and React rematch.
- `shouldAdvanceAfterChainedManualDirectorBeat` extended for `history-view-details` — Play/step 22/22 through History→Details.

**Keep**
- Re-run `__studioRunMcpPageProbe` after any densify or fidelity fix — prior PASS is BAD when Uma disputes pixels.
- Details matrix must include: selected card, Edit/Cancel rules + hover, crumb back, terminal host absent.
- MCP-hover View Details (commerce button); scroll-into-view before interact; overlay-eyes unchanged.

---

## Ben (BE)

**Pain**
- `check:page-final-pass` / `check:parity-proven` needed `appointment-history` then `appointment-details` in requiredScreens — Details correctly omits ButtonPrimary requirement.
- SCREEN_SOURCES/MOUNTS drift risk when two screens share chrome extract mid-wave.
- Felony/parity gates don’t catch “header still Legacy clone” — docs lane 7c is the honest gate before frame delete.

**Worked**
- Both screenIds in PAGE_FINAL_PASS.json + PARITY_PROVEN proven entries on same ship tip.
- Probe registry pattern keeps engine imports clean — ratchet-friendly.
- `npm test` green on v0.0.108 tree including page-final-pass and parity-proven.

**Keep**
- requiredScreens + manifest update **same PR** as Final Pass stamp.
- New typical fail (densify vs React host) → LESSONS + optional ratchet same ship.
- Header re-author lane gets same gate discipline as a migrated page before deleting Legacy frame.

---

## Pax (PO sim)

**Pain**
- Invent Cancel color and Edit/Cancel hover wash — “tests passed” insufficient until Legacy-adjacent tertiary pattern applied.
- False comfort when React CSS files showed 32/56 but browser showed 20/20 — PO trust hits computed truth, not source lines.
- Reflex doc missing while board raced toward Book Legacy delete — sequencing quality vs board optimism.

**Worked**
- Zero-tolerance on invent hover; under-match Shipping/nav labels accepted with honest residuals.
- History→Details sequence matched product order; View Details → Details → crumb back proved on React History.
- v0.0.108 local hard-green pair closed erase-Legacy History/Details acceptance bar.

**Keep**
- Accept = Final Pass hard-green + MCP matrix + Uma PROVEN + Reflex filed — not green Vitest alone.
- Push when Pax/PO asks coherent ship; retro/docs can land local first (this file).
- Next chrome lane: hand-built header (7c) before fantasizing `frame/index.tsx` delete.

---

## Themes (History + Details wave) — locked takeaways

| Theme | Verdict |
|-------|---------|
| **Legacy densify `!important`** | Gate densify with `:not([data-studio-react-screen])` on retired child; don’t fight in page CSS alone. Measure computed pad/gap/CTA. |
| **Per-screen spacing truth** | Details 20/20 ≠ History 32/56 — register and measure per Legacy child index. |
| **No invent UX** | Cancel `#c96b6b`, Edit/Cancel wash, dead nav links — forbidden. PLP tertiary hover for icon+text; `MA_NAV_LINKED_LABELS` for real routes only. |
| **Shared chrome dedup** | `MaNavigationPanel` on second use; screen-owned nav constants; host stretch rule on every new screen. |
| **Terminal CTA rule** | Cancelled `#8762341`: hide Edit/Cancel **and** CTA host — P0 in register + Quinn step. |
| **Crumb → React History** | Details breadcrumb “Appointment history” → `INDEX_APPOINTMENT_HISTORY` live React — not Legacy History. |
| **Probe registry** | Pages register MCP steps; engine `mcpPageProbeRegistry`; `data-studio-action` on page. |
| **Playback chain-advance** | `history-view-details` in `shouldAdvanceAfterChainedManualDirectorBeat` — or beat-tab-mismatch returns. |
| **Final-pass sequencing** | History HARD-GREEN before Details mount/Final Pass; Reflex before next erase-Legacy lane. |
| **Header vs footer** | Footer Legacy-free; header still Legacy `cloneNode` — 7c Final-Pass lane before frame delete. |

---

## Top keep actions (Arch synthesis — apply on Book Legacy delete + header lane)

1. **Densify gate on React hosts** — `:not([data-studio-react-screen])` on the correct Legacy child; Uma re-measure before PROVEN; Quinn re-probe after fidelity fix.  
2. **Extract shared account chrome once** — `MaNavigationPanel` + linked-labels SSoT; new My Account screens consume from day one.  
3. **Details terminal + back-nav P0s** — CTA host hide for cancelled; crumb → React History in register and MCP.  
4. **Engine probe registry only** — no new `stepsForScreen` Boots branches; stamp `data-studio-action` on the page.  
5. **HARD-GREEN → micro-retro → next lane** — Reflex into [TEAM_KNOWLEDGE.md](./TEAM_KNOWLEDGE.md); then Book Legacy delete (8) and header re-author (7c) per board.  
6. **Icon+text hover** — copy PLP `.plp__tertiary` treatment; grep before inventing classes or tokens.

---

## Related

- [TEAM_KNOWLEDGE.md](./TEAM_KNOWLEDGE.md) · [TEAM.md](./TEAM.md) · [COMMAND_DOCTRINE.md](./COMMAND_DOCTRINE.md)  
- [PAGE_FINAL_PASS.md](./PAGE_FINAL_PASS.md) · [LESSONS_LEARNED.md](./LESSONS_LEARNED.md) (densify, MaNavigationPanel, chain-advance)  
- Audits: [FE_AUDIT_APPOINTMENT_HISTORY_PAGE_FINAL_PASS_2026-07-22.md](../projects/boots-pharmacy/audits/FE_AUDIT_APPOINTMENT_HISTORY_PAGE_FINAL_PASS_2026-07-22.md) · [FE_AUDIT_APPOINTMENT_DETAILS_PAGE_FINAL_PASS_2026-07-22.md](../projects/boots-pharmacy/audits/FE_AUDIT_APPOINTMENT_DETAILS_PAGE_FINAL_PASS_2026-07-22.md)  
- Briefs: [APPOINTMENT_HISTORY_REACT.md](../projects/boots-pharmacy/features/APPOINTMENT_HISTORY_REACT.md) · [APPOINTMENT_DETAILS_REACT.md](../projects/boots-pharmacy/features/APPOINTMENT_DETAILS_REACT.md)

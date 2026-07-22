# UX Studio — product forecast (engine)

**Updated:** 2026-07-21  
**Owner:** Arch (decisive; not a menu for the PO) · Team OS: [TEAM.md](./TEAM.md)  
**Current-status authority:** [NEXT_STEPS.md](./NEXT_STEPS.md). This forecast describes direction and must not be used as a live backlog. · Doctrine: [COMMAND_DOCTRINE.md](./COMMAND_DOCTRINE.md)  
**Map:** [ARCHITECTURE.md](./ARCHITECTURE.md) · [NAMING.md](./NAMING.md) · [HYGIENE.md](./HYGIENE.md)

This is the engine-level map of what must exist before UX Studio is a real product — not a Boots page backlog.

---

## Verdict

Ship the **control room** first: deep-linkable screens, recordable interactions, clean agent chrome, slim CI, multi-project registry, domain-named surfaces. Concept pages (Boots) are the rabbit; they do not define the product ceiling.

**Boots erase-Make program (Director lock):** migration order is **PLP → PDP → Site Pilot (`screenId=site-pilot`) → Chat → History/Details**, then **delete Book Step 1–3 Make children**. PLP, PDP, Site Pilot, and Chat are landed; current state and blockers live only on [NEXT_STEPS.md](./NEXT_STEPS.md). Page DONE = React-mounted **and** Make child retired from view with wire gates; prefer delete when safe, else `data-studio-make-retired` + no LEGACY growth — document honest residual.

---

## NOW → NEXT → LATER (Director lock)

### NOW

| Work | Why | Status |
|------|-----|--------|
| **Appointment History + Details** | Next open erase-Make page pair after Chat | **READY** — sequence/proof status on board |
| **Traditional CJM smoothness** | Remove the three recorded camera scroll reversals | **OPEN** — acceptance evidence on board |
| Versioning habit | notes + consider patch on named demos | Habit — every ship |
| Post-agent clean slate | Sticky Choose Pharmacy after MCP sitrep/reload rage | **LANDED** |
| Recording compile→journeys | Ephemeral Save as journey → CJM catalog | **LANDED (vertical)** |
| **PLP React migration** | Listing CJM entry | **LANDED** — [PLP_REACT.md](../projects/boots-pharmacy/features/PLP_REACT.md) |

### NEXT

| Work | Why |
|------|-----|
| **Delete Book 1–3 Make children** | Only after History/Details Final Pass + CJM green |
| LEGACY retirement by screen | No LEGACY growth; shrink `globals-screens` + Make wire as React pages land |
| Concept `.proto-*` class debt | Boots wire/footer/chat/avail cards still `.proto-*` in LEGACY — retire with page migrate |
| Engine monster splits | `App.tsx` / `useJourneyPlayback.ts` — extract by domain when next touched |
| UXDS extract-on-second-use | No speculative catalog |
| Residual Make-only hex tokens | Only when bridge token exists |

### LATER

| Work | Why |
|------|-----|
| **P0 future — Playback/REC/QA prove refactor + single regression harness** | PO token burn; scattered prove law (`completeJourneyPlay` + many contracts); one-line flips cascade. **Not now** — board 12a · PP-41 |
| Second project rabbit | After Boots book + URL + REC proven on Pages |
| Release / tag CI | When versioning habit is stable + Actions budget |
| Broader CSS contracts | More `check-*.mjs`, not more Playwright on every push |
| Optional `beat` query | Only when CJM-on and non-noisy |
| X-Suite handshake | Summarizer → Studio: PO shares CJM export → agent analyze + pages + REC ([X_SUITE_INTEGRATION.md](./X_SUITE_INTEGRATION.md)); automated import later |
| **Real-user persona (X-Suite CJM)** | End-user persona from Summarizer/CJM as product-truth input beside **Pax** — **stub only; do not implement now** ([TEAM.md](./TEAM.md), [X_SUITE_INTEGRATION.md](./X_SUITE_INTEGRATION.md)) |

---

## Pillars (ordered)

### 1. URL / routing — LANDED (+ modal)

Shareable `?project=&screen=` (+ `&modal=` for blocking lightboxes e.g. `choose-pharmacy`); URL wins on refresh; strip `proof` / ephemeral. Optional beat query later.

### 2. Recording fidelity — v2 MATRIX + COMPILE VERTICAL LANDED

`kind: "screen"` + `applyStudioScreen` landed. **Demo-click + human REC click** replay. **Director-script** + **retreat-sync**. **Compile→journeys** overlays CJM slot. The shared interaction contract rejects ghost DOM boxes and already-selected idempotent options, verifies checkbox/radio/selection state changes, aims at visible content inside oversized targets, and owns nested modal scroll. Capture gaps (beat-enter / scroll / typed-text) are replayable; compiled CJMs still report typed-text gaps honestly.

### 3. Interaction fidelity — ONGOING

Shared kits in `src/uxds/interactions/`. Dead CTAs forbidden. Fake data OK.

### 4. Domain identity — LANDED (+ felony gate)

| Surface | Rule |
|---------|------|
| Filenames / modules | `studio*` / domain verbs — done; `check:felonies` locks proto* basenames |
| PANEL/chrome CSS | `.studio-nav-*`, `.studio-*`, `.studio-agent-testing-*` |
| DOM attrs | `data-studio-*` (+ `dataset.studio*`) |
| Window APIs | Prefer `__studio*`; keep `__proto*` aliases |
| Beat JSON | `protoTab` stays until beat-schema migration |
| Storage / events | `studio-nav:` / `studio-hub:` / `studio-*-sync` with legacy read |
| Concept LEGACY classes | `.proto-*` in Make dumps OK until screen retirement |

### 5. Multi-project — STRUCTURAL

Registry + isolation already. Second rabbit only after Boots book+URL+REC on Pages.

### 6. UXDS growth — BY MIGRATION

Extract on second use. Theme remaps only. Hex→token = hygiene.

### 7. CI budget — LOCKED

Default push = unit + build (+ cheap contracts). Playwright = `workflow_dispatch` / local. **No auto marathon.**

### 8. File hygiene — LOCKED

`npm run check:hygiene` in `npm test`. Default 1600 LOC; allowlist LEGACY + current monsters. Prefer domain splits over ceiling bumps ([HYGIENE.md](./HYGIENE.md)).

### 9. GitHub Pages — RELEASE SURFACE

Deploy green ≠ visual proof. Verify `data-studio-react-screen`, deep link, overlay on live host after chrome ships.

### 10. Agent overlay — POLICY (landed → mid-flight QA shell)

BR **AGENT TESTING** + invisible click guard; `touch()`; MCP `stop({ reload: true })`; never lightbox / sticky `?proof=`. Post-test default: stay on current screen; `resetToHub: true` only for CJM/journey. Screen ships: `__studioRunMcpPageProbe` + `check:parity-proven`.

**2026-07-20 vision (PP-10):** overlay is a mid-flight QA shell — readable steps (not helper spam), outcome colors, elapsed timer, control-panel sitrep, alarm + cursor flag, script timeline strip, console START/END, last-N dumps on FAIL/alarm only. Code: `src/app/shell/agent-testing/`. Track: [PAINPOINTS.md](./PAINPOINTS.md). Prefer existing Motion + PLAYBACK_DIAG; reject heavy APM.

### 11. Versioning — HABIT THEN AUTOMATION

Local notes + CHANGELOG. Release CI later. Version chip must match `package.json` (felony if lie).

### 12. X-Suite — SEAM + MANUAL AGENT PATH

Documented handshake ([X_SUITE_INTEGRATION.md](./X_SUITE_INTEGRATION.md)). Automated importer later. **Now:** when PO shares an X-Suite persona/CJM export, agent analyzes → builds/reuses project pages (UXDS + Studio templates + `data-studio-*` names) → **RECs a new CJM** in Studio. Do not build a second studio inside Summarizer. Ask PO for coarse concept / UXDS page prototype references before new pages.

### 13. Erase-Make (Boots rabbit) — PROGRAM

| Gate | Rule |
|------|------|
| DONE | React mount + Make retired from view + wire gates + no LEGACY growth + honest residual |
| Retire mode | Delete Make child when safe; else `data-studio-make-retired` |
| Order | **PLP → PDP → Site Pilot → Chat → History/Details → delete Book 1–3 Make** |
| Audit | Strict interface audit under `docs/projects/boots-pharmacy/audits/` before PO |

---

## Risks (watch continuously)

| Risk | Mitigation |
|------|------------|
| Visual / style zoo | DS strictness + strict interface audit PROVEN |
| Dead UI “recordings” | Interaction fidelity gate |
| CJM-specific rescue branches / brittle route order | One shared interaction engine; no journey-id/persona exceptions; cross-route proof |
| Page migration breaks existing recordings | Preserve semantic action/state hooks + run interaction inventory and recorded-playback compatibility before retirement |
| URL / session fight | URL wins; replaceState sync |
| Agent overlay sticky | Strip ephemeral; nest-aware stop |
| CI Actions burn | Slim default CI |
| LEGACY CSS growth | No new React styles in LEGACY |
| Subagent “done” | Parent verifies §6–§7 |
| `proto` identity drift | No new `.proto-*` / `data-proto-*`; hygiene + naming rules |
| Monster / micro-file extremes | Hygiene ratchet + domain cohesion |
| Make residual forgotten | Honest residual in brief/audit; delete at sequence end |

---

## Sequencing (Director lock)

1. URL + overlay + clean bar — landed  
2. Recording screen markers → replay — landed  
3. Domain CSS/attrs + hygiene — landed  
4. Version chip + agent felony gate — landed  
5. Recording compile→journeys vertical — landed  
6. **Erase-Make: PLP → PDP → Site Pilot → Chat landed; History/Details next → delete Book Make children**  
7. LEGACY shrink by screen + UXDS extract-on-second-use  
8. Second project rabbit  
9. Release CI + broader CSS contracts  
10. X-Suite handshake  

PO accept/reject is on product outcomes. Tech path above is not optional shopping.

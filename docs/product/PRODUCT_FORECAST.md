# UX Studio — product forecast (engine)

**Updated:** 2026-07-19  
**Owner:** Arch (decisive; not a menu for the PO) · Team OS: [TEAM.md](./TEAM.md)  
**Board:** [NEXT_STEPS.md](./NEXT_STEPS.md) · Doctrine: [COMMAND_DOCTRINE.md](./COMMAND_DOCTRINE.md)  
**Map:** [ARCHITECTURE.md](./ARCHITECTURE.md) · [NAMING.md](./NAMING.md) · [HYGIENE.md](./HYGIENE.md)

This is the engine-level map of what must exist before UX Studio is a real product — not a Boots page backlog.

---

## Verdict

Ship the **control room** first: deep-linkable screens, recordable interactions, clean agent chrome, slim CI, multi-project registry, domain-named surfaces. Concept pages (Boots) are the rabbit; they do not define the product ceiling.

---

## NOW → NEXT → LATER (Director lock)

### NOW

| Work | Why | Status |
|------|-----|--------|
| Recording compile→journeys | Ephemeral Save as journey → CJM catalog landed; durable `journeys.ts` later | **LANDED (vertical)** |
| Versioning habit | notes + consider patch on named demos | Habit — every ship |

### NEXT

| Work | Why |
|------|-----|
| LEGACY retirement by screen | No LEGACY growth; shrink `globals-screens` + Make wire as React pages land |
| Concept `.proto-*` class debt | Boots wire/footer/chat/avail cards still `.proto-*` in LEGACY — retire with page migrate |
| Engine monster splits | `App.tsx` / `useJourneyPlayback.ts` — extract by domain when next touched |
| UXDS extract-on-second-use | No speculative catalog |
| Residual Make-only hex tokens | Only when bridge token exists |

### LATER

| Work | Why |
|------|-----|
| Second project rabbit | After Boots book + URL + REC proven on Pages |
| Release / tag CI | When versioning habit is stable + Actions budget |
| Broader CSS contracts | More `check-*.mjs`, not more Playwright on every push |
| Optional `beat` query | Only when CJM-on and non-noisy |
| X-Suite handshake | Summarizer → Studio journey JSON seam only |
| **Real-user persona (X-Suite CJM)** | End-user persona from Summarizer/CJM as product-truth input beside **Pax** — **stub only; do not implement now** ([TEAM.md](./TEAM.md), [X_SUITE_INTEGRATION.md](./X_SUITE_INTEGRATION.md)) |

---

## Pillars (ordered)

### 1. URL / routing — LANDED (+ modal)

Shareable `?project=&screen=` (+ `&modal=` for blocking lightboxes e.g. `choose-pharmacy`); URL wins on refresh; strip `proof` / ephemeral. Optional beat query later.

### 2. Recording fidelity — v2 MATRIX + COMPILE VERTICAL LANDED

`kind: "screen"` + `applyStudioScreen` landed. **Demo-click + human REC click** replay (`isTrusted` capture → same selector chain). **Director-script** + **retreat-sync** via shared `applyRecordingProjectScript` / `resolvePlaybackScriptKind`. Wire-intent for known `JourneyBeatActionId`. **Compile→journeys:** `compileRecordingToJourney` / Save as journey overlays the CJM slot in `journeyRuntimeStore` (playable; not a durable `journeys.ts` write). Still open: beat-enter / scroll / typed-text **replay**; free journey ids beyond two CJM slots.

### 3. Interaction fidelity — ONGOING

Shared kits in `src/uxds/interactions/`. Dead CTAs forbidden. Fake data OK.

### 4. Domain identity — LANDED (+ felony gate)

| Surface | Rule |
|---------|------|
| Filenames / modules | `studio*` / domain verbs — done; `check:felonies` locks proto* basenames |
| PANEL/chrome CSS | `.studio-nav-*`, `.studio-*`, `.studio-agent-testing-*` — this tip |
| DOM attrs | `data-studio-*` (+ `dataset.studio*`) — this tip |
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

### 8. File hygiene — LOCKED (this tip)

`npm run check:hygiene` in `npm test`. Default 1600 LOC; allowlist LEGACY + current monsters. Prefer domain splits over ceiling bumps ([HYGIENE.md](./HYGIENE.md)).

### 9. GitHub Pages — RELEASE SURFACE

Deploy green ≠ visual proof. Verify `data-studio-react-screen`, deep link, overlay on live host after chrome ships.

### 10. Agent overlay — POLICY (landed)

BR **AGENT TESTING** + invisible click guard; `touch()`; MCP `stop({ reload: true })`; never lightbox / sticky `?proof=`.

### 11. Versioning — HABIT THEN AUTOMATION

Local notes + CHANGELOG. Release CI later.

### 12. X-Suite — SEAM ONLY

Documented handshake; do not build a second studio inside Summarizer.

---

## Risks (watch continuously)

| Risk | Mitigation |
|------|------------|
| Visual / style zoo | DS strictness + Nazi QA PROVEN |
| Dead UI “recordings” | Interaction fidelity gate |
| URL / session fight | URL wins; replaceState sync |
| Agent overlay sticky | Strip ephemeral; nest-aware stop |
| CI Actions burn | Slim default CI |
| LEGACY CSS growth | No new React styles in LEGACY |
| Subagent “done” | Parent verifies §6–§7 |
| `proto` identity drift | No new `.proto-*` / `data-proto-*`; hygiene + naming rules |
| Monster / micro-file extremes | Hygiene ratchet + domain cohesion |

---

## Sequencing (Director lock)

1. URL + overlay + clean bar — landed  
2. Recording screen markers → replay — landed  
3. Domain CSS/attrs + hygiene — landed  
4. Version chip + agent felony gate — **this tip**  
5. Recording compile→journeys vertical — landed; durable journeys.ts + REC capture gaps next  

6. LEGACY shrink by screen + UXDS extract-on-second-use  
7. Second project rabbit  
8. Release CI + broader CSS contracts  
9. X-Suite handshake  

PO accept/reject is on product outcomes. Tech path above is not optional shopping.

# Feature brief — Chat React migration

**Project:** `boots-pharmacy`  
**Callsigns:** Bea (BA) · Finn (FE) · Uma (UI/UX) · Quinn (QA) · Pax (PO sim) · Arch (Director)  
**Status:** draft (kickoff — register only)  
**Updated:** 2026-07-19  
**Refs:** [CHAT_MAKE_PARITY_REGISTER.md](./CHAT_MAKE_PARITY_REGISTER.md) · [HOME_MAKE_PARITY_REGISTER.md](./HOME_MAKE_PARITY_REGISTER.md) · [NEXT_STEPS.md](../../../product/NEXT_STEPS.md) erase-Make · [PAGE_FINAL_PASS.md](../../../product/PAGE_FINAL_PASS.md)

**PO override (2026-07-19):** Chat documentation/migration **started** while **Site Pilot (`site-pilot`) is NOT PAGE FINAL PASS hard-green**. PDP **remains** HARD-GREEN — do not demote.

---

## Context

Erase-Make sequence: PLP → PDP (**HARD-GREEN**) → Site Pilot Home → **Chat** → History/Details. Site Pilot Chat (`screenId: chat`, Frame child **10**) is the agentic CJM thread after Home send/chip. Today Make + heavy wire (`sitePilotChat*`) own thread, thinking, composer dock, and playback prelude. React kickoff = full Make inventory + shared composer contract with Home — no second composer fork.

## Business logic

| Rule | Behavior |
|------|----------|
| Entry | From Site Pilot Home send/chip → chat tab (`screen=chat`) |
| Thread | Scripted `query` / `reply` frames in `component.appointment.summary` (Sarah SE Asia travel narrative) |
| Composer chips | Fill textarea; “Show available slots for today” → Availability Tool |
| Agent CTAs | Book / catalog / slot / date / pharmacy — wire maps to PDP, PLP, Availability Tool |
| CJM agentic | Beat `agentic-chat` → scenario `site-pilot-chat` with thinking + demo cursor + finale date CTA |
| CJM traditional | No chat beat — PLP → PDP → book path only |
| Browse (CJM off) | Land on chat → browse reveal (thinking pause → full thread at bottom) |
| Helpful UI | Per-reply + conversation feedback bands — conversation band hidden until wire shows |
| Disclaimer | Fixed below dock — “SitePilot can make mistakes…” |

## Acceptance (Bea → Quinn)

- [ ] Register [CHAT_MAKE_PARITY_REGISTER.md](./CHAT_MAKE_PARITY_REGISTER.md) complete — no Missing **P0** at ship time
- [ ] React host mounts at child 10; Make retired (`data-studio-make-retired=chat`)
- [ ] Make wire effects early-return when React mounted (composer, links, dock)
- [ ] URL `?project=boots-pharmacy&screen=chat` (+ `cjm` / `experience` / `persona` as needed)
- [ ] **Shared composer** — same React component as `site-pilot` Home (SK1 in register)
- [ ] Thinking states LE1–LE5 parity (playback, send/stop, browse, hint, fade)
- [ ] CJM playback C6–C8 + finale C7 green with Availability Tool
- [ ] Motion via `@/uxds/motion` — no ad-hoc CSS height thrash for UI motion ([MOTION.md](../../../product/MOTION.md))
- [ ] No LEGACY growth for React path
- [ ] Uma audit **PROVEN** — not claimed on kickoff
- [ ] Quinn MCP matrix PASS + `PARITY_PROVEN.json` — not claimed on kickoff
- [ ] PAGE FINAL PASS hard-green — **later**; do **not** add `chat` to `requiredScreens` until PROVEN

## Chrome / fidelity (Uma)

- [ ] Microheader (Frame337) — logo, Contact Support, Rate/More
- [ ] Thread bubbles — user mint tint vs agent white cards + CTA pills
- [ ] Thinking bubble — dots, placement before reply, hint variant
- [ ] Composer dock — fixed bottom, pad var, disclaimer
- [ ] Typical DS checks: mic · send/stop · chips · agent CTAs · underlined links
- [ ] No invent footer / accordion / page spinner
- [ ] PDP Final Pass not regressed

## Mount / FE notes (Finn)

- Target folder: `src/projects/boots-pharmacy/screens/chat/` (`screenId=chat`)
- Contract: `CHAT_CHILD_INDEX = 10`, scenario id `site-pilot-chat`
- Reuse: extract **Site Pilot composer** from `screens/home/HomeScreen.tsx` (chat label + chip set via props)
- Keep: `dom/sitePilotChatScenario.ts` / thinking / playback until React owns equivalent hooks or wire gates cleanly
- Hybrid: engine header + microheader until scoped; body + thread + dock in React
- Auth: same `isStudioLoggedIn` SSoT where copy depends on login (if any)

## Prove notes (Quinn)

- Agentic: `http://localhost:5173/?project=boots-pharmacy&screen=chat&persona=sarah-jenkins&cjm=on&experience=agentic`
- R11: reuse tab `localhost:5173`
- Matrix: scenario play (thinking visible every step), browse reveal, chip → avail, finale date CTA, overlay suppress composer, demo cursor on prelude steps
- `__studioRunMcpPageProbe({ screenId:"chat", reload:false })` — criteria doc TBD after first mount
- **Not PROVEN** on kickoff

## Pax

- [ ] User-visible? → bump patch? **N** until first visible React mount ship
- [ ] Push? **N** (docs-only kickoff unless PO says otherwise)
- [ ] Notes/CHANGELOG when user-visible ship closes

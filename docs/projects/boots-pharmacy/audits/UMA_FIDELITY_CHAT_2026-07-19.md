# Uma fidelity stamp — Site Pilot Chat

**Surface:** Boots Pharmacy Site Pilot Chat (`screenId: chat`, Frame child **10**, Legacy `Body9`)  
**Date:** 2026-07-20  
**Owner:** Uma (UI/UX)  
**Status:** **PROVEN** — React Chat host ON; PAGE FINAL PASS HARD-GREEN  
**React target:** `screens/chat/*` — **live** (`CHAT_REACT_MOUNT_ENABLED=true`; Legacy child 10 `data-studio-legacy-retired=chat`)  
**Legacy truth:** `frame/index.tsx` `Body9` · `ComponentAppointmentSummary2` · `query` / `reply` bubbles · `component.co.order.summary` · `component.gse.system.message` (feedback + chips) · `ComponentCoOrderSummary8` (composer) · `globals-chrome.css` child-10 · `globals-screens.css` chat flash  
**Wire / DOM today:** React `ChatScreen` + shared `SitePilotComposer` · `chatThinkingBridge` · Motion frames via `@/uxds/motion` · playback `sitePilotChat.ts`  
**Register:** [CHAT_LEGACY_PARITY_REGISTER.md](../features/CHAT_LEGACY_PARITY_REGISTER.md) · brief [CHAT_REACT.md](../features/CHAT_REACT.md)  
**Shared composer:** `screens/shared/SitePilotComposer.tsx` (Home + Chat)  
**Checklist:** [../../../product/UMA_FIDELITY_NOTES.md](../../../product/UMA_FIDELITY_NOTES.md) · [MOTION.md](../../../product/MOTION.md) · [VISUAL_FIDELITY.md](../../../product/VISUAL_FIDELITY.md) · [FE_UI_UX_AUDIT.md](../../../product/FE_UI_UX_AUDIT.md) · [PAGE_FINAL_PASS.md](../../../product/PAGE_FINAL_PASS.md)  
**Final Pass audit:** [FE_AUDIT_CHAT_PAGE_FINAL_PASS_2026-07-20.md](./FE_AUDIT_CHAT_PAGE_FINAL_PASS_2026-07-20.md)

**Gate:** Site Pilot PAGE FINAL PASS **HARD-GREEN** — **do not demote**. History/Details unblocked after this stamp.

---

## Verdict

| Field | Value |
|-------|-------|
| **Overall** | **PROVEN** |
| **§0a typical DS / pointer matrix** | **PASS** — mic · send · chips · reply CTA · helpful Yes/No hover CSS + Quinn MCP hover |
| **§0b section vertical rhythm** | **PASS** — MCP: summary gap **40px** · max-width **864px** · column pad-top **64px** · query **438px** / radius **16px** · host `#dbebf5` |
| **loading / empty / updating** | **PASS (P0)** — thinking = playback-owned dots bubble (`SITE_PILOT_CHAT_PLAYBACK_THINK_MS` 1400); **not** on Sarah send (Legacy truth). PLAYBACK_DIAG `thinking-start` / `thinking-end` |
| **checkbox / radio hover** | **N/A** |
| **Composer ↔ Home shared kit** | **PASS** — same `SitePilotComposer`; Chat label **“Next dialog options:”** |
| **Motion** | **PASS** — frames + thinking via `@/uxds/motion` |
| **Accordion / history** | **N/A on Legacy chat** |
| **PO green-light allowed?** | **Yes** — Final Pass HARD-GREEN |
| **PAGE FINAL PASS** | **HARD-GREEN** |

**Honest scope (Legacy `Body9` / summary column):**

- **Present:** navy header · sticky Site Pilot secondary bar · `#dbebf5` body · centered **864px** thread · user query **438px** · agent replies · pill CTAs · helpful feedback · **Next dialog options:** chips · mic + send · disclaimer · Motion frames  
- **Absent (must not invent):** PLP Advantage · chat mini-footer (h≈0) · FAQ accordion · listing loader  
- **Wire-only:** thinking bubble · fixed composer dock + fade · query send flash

---

## Layout bands — Legacy `Body9` inventory

| # | Legacy band / component | Uma stamp | Evidence |
|---|------------------------|-----------|----------|
| **C1** | Shell / column — 1440, **64px** pad | **PASS** | column `padding-top: 64px` |
| **C2** | Page bg `#dbebf5` | **PASS** | host `rgb(219, 235, 245)` |
| **C3** | Sticky Site Pilot bar | **PASS** | probe `chat-site-pilot-bar` |
| **C4** | Thread **864** · gap **40** | **PASS** | `chat-layout-rhythm` |
| **C5** | User query **438** · r16 · p16 | **PASS** | MCP measure |
| **C6** | Agent reply full width · gap 16 | **PASS** | |
| **C7** | Reply pill CTAs ButtonPrimary | **PASS** | CTA hover + frame sweep ≥2 replies |
| **C8** | Feedback Yes/No | **PASS** | reply strip hover; conversation strip `hidden` residual (DOM copy OK) |
| **C9** | Thinking | **PASS** | playback-owned; diag thinking-start/end |
| **C10–C12** | Composer shared kit + Chat chip label | **PASS** | |
| **C13** | Disclaimer | **PASS** | `chat-disclaimer` |
| **C14** | Scenario frame motion | **PASS** | `@/uxds/motion` ≥2 frames |
| **C15** | Footer hide | **PASS** | footer mount height ≈0 |

---

## §0a — Typical DS state matrix

| Control | Status | Evidence |
|---------|--------|----------|
| Textarea | **PASS** | shared kit + placeholder Ask Boots SitePilot |
| Mic | **PASS** | MCP `chat-composer-mic-hover` |
| Send / stop | **PASS** | dual-class + hover CSS |
| Next dialog chips | **PASS** | label + hover |
| Reply pill CTAs | **PASS** | commerce hover + frame sweep |
| Feedback Yes/No | **PASS** | `chat-helpful-hover` |
| Quinn MCP hover | **PASS** | expanded recipe 20/20 |

---

## Mandatory sign-off stamps

| Line | Stamp |
|------|-------|
| `loading states` | **PASS** — playback thinking; no invent send loader |
| `checkbox/radio hover` | **N/A** |
| `typical DS checks` | **PASS** |
| `fidelity checklist` | **PROVEN** |
| `PAGE FINAL PASS` | **HARD-GREEN** |

---

## team check report lines (Uma)

```
Uma (UI/UX): fidelity checklist — PROVEN
Uma (UI/UX): section vertical rhythm — PASS (§0b MCP 40/864/64/438)
Uma (UI/UX): loading states — PASS (playback thinking; not on send)
Uma (UI/UX): checkbox/radio hover — N/A
Uma (UI/UX): typical DS checks (state matrix) — PASS
Uma (UI/UX): motion ownership — PASS
Uma (UI/UX): composer shared kit — PASS
PAGE FINAL PASS — chat — HARD-GREEN
```

**Knowledge used:** UMA_FIDELITY_NOTES §0/§0a/§0b · MOTION.md · VISUAL_FIDELITY · HOME H5–H11 composer parity · shared `site-pilot-composer.css` · no-invent footer/Advantage.

---

## Related

- [FE_AUDIT_CHAT_PAGE_FINAL_PASS_2026-07-20.md](./FE_AUDIT_CHAT_PAGE_FINAL_PASS_2026-07-20.md)  
- [QUINN_CHAT_PROBE_CRITERIA_2026-07-19.md](./QUINN_CHAT_PROBE_CRITERIA_2026-07-19.md)  
- [UMA_FIDELITY_HOME_2026-07-19.md](./UMA_FIDELITY_HOME_2026-07-19.md)  
- [NEXT_STEPS.md](../../../product/NEXT_STEPS.md) §5–6

# Quinn (QA) — Chat MCP prove criteria

**Status:** **RECIPE EXPANDED** — React `chat` host ON; probe matrix beyond stub.  
**Updated:** 2026-07-19 (Quinn QA — Finn+Uma+Quinn residual wave)  
**Screen:** `chat` (Make child 10 retired · scenario `site-pilot-chat`)  
**Refs:** [STUDIO_AUTO_RULES.md](../../../product/STUDIO_AUTO_RULES.md) R11 · [URL.md](../../../shell/URL.md) · `studioMcpPageProbe.ts` · [UMA_FIDELITY_CHAT_2026-07-19.md](./UMA_FIDELITY_CHAT_2026-07-19.md)

**Hard honesty:** Recipe **PASS** ≠ Chat whole-page **PROVEN** ≠ PAGE FINAL PASS. No `chat` row in `PARITY_PROVEN.json` / Final Pass until Uma §0a/§0b ready + playback P1–P10.

---

## Hard refuse rules

| Rule | FAIL when |
|------|-----------|
| **No false PROVEN** | Recipe green alone, Vitest green alone, or missing Uma §0a |
| **Overlay visible every step** | Agent testing BR panel absent/hidden on any probe step |
| **Scroll-into-view** | Interact before target is in view |
| **`reload: false`** | Page probe uses reload (R1 teardown / URL fight) |
| **R11 fixed localhost + reuse tab** | Not `http://localhost:5173/`; Chrome MCP `new_page` when Studio tab exists |
| **Teardown clean** | Sticky `&modal=` / overlay DOM after settle |
| **PARITY / Final Pass honesty** | Do **not** add `chat` to `PARITY_PROVEN.json` or stamp Chat PAGE FINAL PASS until Uma PROVEN |

---

## Prove URLs (canonical — R11)

```
http://localhost:5173/?project=boots-pharmacy&screen=chat&persona=sarah-jenkins&cjm=off&experience=agentic
```

Traditional residual (PDP Book now — not Chat host prove):

```
http://localhost:5173/?project=boots-pharmacy&screen=pdp&persona=sarah-jenkins&cjm=on&experience=traditional
```

---

## Probe entry

```js
await window.__studioRunMcpPageProbe?.({ screenId: "chat", reload: false })
```

---

## Expanded matrix (`chatProbeSteps`)

| Step | Id | Expect |
|------|-----|--------|
| auto | `overlay-arm` | BR panel visible before first interact |
| 1 | `chat-host` | `<main data-studio-react-screen="chat">` |
| 2 | `chat-make-retired` | `data-studio-make-retired=chat`; exactly 1 live summary |
| 3 | `chat-landmarks` | `.chat__summary` + ≥1 query + ≥1 reply |
| 4 | `chat-composer-dock` | `[data-studio-chat-composer=true]` + shared kit class |
| 5 | `chat-composer-textarea` | `agentic-chat-query` + placeholder Ask Boots SitePilot |
| 6 | `chat-composer-send` | dual-class send + `:hover` CSS |
| 7 | `chat-composer-mic-hover` | MCP hover + shared mic `:hover` |
| 8 | `chat-chip-hover` | MCP hover + **Next dialog options:** label |
| 9 | `chat-cta-hover` | MCP hover + UXDS `.uxds-btn-primary--commerce:hover` |
| 10 | `chat-motion-owner` | ≥2 `[data-studio-chat-frame]` |
| auto | `url-screen` | `screen=chat` in address bar |

**Recipe stamp:** **PASS** only when live MCP on tip is green (cite below).  
**Whole-page PROVEN / Final Pass:** **NOT** stamped this wave.

---

## Traditional residual (same Make-first-match class)

| Check | Expect |
|-------|--------|
| `tab/pdp-book-now` | Prefer React `[data-studio-action=pdp-book-now]`; skip `[data-studio-make-retired]` — no transport-no-op |
| Unit | `findPdpBookNowBtn.test.ts` |
| Live | `__protoRunTraditionalPlaySmoke` or step through traditional-pdp on `:5173` |

---

## Playback smoke (still required before Chat PROVEN)

P1–P10 from prior criteria — agentic Play + traditional Play + REC⊗CJM XOR + teardown. Recipe PASS does **not** waive P1–P10 for whole-page PROVEN.

---

## PAGE FINAL PASS / parity

- **PDP / PLP** HARD-GREEN untouched.
- **Chat** NOT-GREEN / not in `PARITY_PROVEN.json`.
- Quinn recipe PASS + Uma PARTIAL §0a — Arch may open next wave; **not** Final Pass.

---

## Live evidence log (tip prove — 2026-07-19)

| Field | Value |
|-------|-------|
| Tip | pre-push prove @ v0.0.43 / R11 `:5173` |
| Recipe | **PASS** — `__studioRunMcpPageProbe({ screenId:"chat", reload:false })` 12/12 (overlay-arm → url-screen) |
| Traditional Play | **PASS** — `__protoRunTraditionalPlaySmoke` · `diagnosticOpen=false` (pdp-book-now no transport-no-op) |
| Unit | `findPdpBookNowBtn.test.ts` green |
| Whole-page PROVEN | **NO** |
| PAGE FINAL PASS | **NOT-GREEN** |

**Quinn status:** recipe **PASS** · traditional residual **PASS** · Chat Final Pass / `PARITY_PROVEN` **not** stamped (Uma §0a still PARTIAL).

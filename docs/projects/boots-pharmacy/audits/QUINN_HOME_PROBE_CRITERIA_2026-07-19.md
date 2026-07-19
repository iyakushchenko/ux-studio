# Quinn (QA) — Home MCP prove criteria (stub)

**Status:** **STUB** — React host mounted; probe recipe minimal (`home-host` only). **NOT PROVEN.**  
**Updated:** 2026-07-19 (Ben BE + Arch kickoff)  
**Screen:** `site-pilot` (Agentic Site Pilot Home, Make child 11 → React `screens/home/*`)  
**Refs:** [STUDIO_AUTO_RULES.md](../../../product/STUDIO_AUTO_RULES.md) R11 · [URL.md](../../../shell/URL.md) · `studioMcpPageProbe.ts` · [HOME_MAKE_PARITY_REGISTER.md](../features/HOME_MAKE_PARITY_REGISTER.md)

---

## Hard refuse rules

- **No false PROVEN** — Vitest/build green alone = BAD; stub matrix ≠ ship prove.
- Overlay missing / not visible on any step = FAIL.
- Probe must use `{ reload: false }` (R1 teardown).
- **Do not** add `home` to `PAGE_FINAL_PASS.json` / `PARITY_PROVEN.json` `requiredScreens` until full matrix PROVEN + Uma PROVEN.

---

## Prove URL (R11 — fixed localhost, reuse tab)

```
http://localhost:5173/?project=boots-pharmacy&screen=site-pilot
```

**R11:** One origin only (`http://localhost:5173/`). Chrome DevTools MCP → `list_pages` → reuse existing tab → `navigate_page`; `new_page` only if zero pages. Do **not** spawn extra Vite ports (`5182`/`5185`…).

---

## Probe entry

```js
await window.__studioRunMcpPageProbe?.({ screenId: "site-pilot", reload: false })
```

**Prep (when matrix grows):** `__studioSetLoggedIn(false)` before logged-out heading checks; strip `mode=traditional-cjm` if it interferes.

---

## Stub matrix (current)

| Step | Id | Expect |
|------|-----|--------|
| auto | `overlay-arm` | BR agent-testing panel visible |
| 1 | `site-pilot-host` | `[data-studio-react-screen="site-pilot"]` present (React host) |
| auto | `url-screen` | Address bar `screen=site-pilot` |

**Expected after kickoff mount (live localhost):** `home-host` **PASS**; unit test without DOM host still expects FAIL (guards false PROVEN).

**Next prove criteria (expand recipe before PROVEN):**

| Id | Expect |
|----|--------|
| `home-heading-logged-out` | heading text default via `__studioIsLoggedIn()===false` |
| `home-heading-logged-in` | “Sarah, what…” after `__studioSetLoggedIn(true)` |
| `home-query-textarea` | `[data-studio-action="agentic-home-query"]` present + focus |
| `home-send` | send → `screen=chat` |
| `home-chip` | chip click → `screen=chat` |
| `home-make-retired` | Make body retired / no duplicate visible prompt |
| DS hover | mic · send · ≥1 chip (Uma signs; MCP hover) |

**Selectors:**

- Host: `[data-studio-react-screen="site-pilot"]`
- BEM root: `.home`
- Hero heading: `[data-studio-agentic-home-heading]`
- Query: `textarea[data-studio-action="agentic-home-query"]`

---

## Auth SSoT (heading personalization)

Home hero copy **must** branch on **`isStudioLoggedIn()` / `window.__studioIsLoggedIn()`** only — `src/app/shell/studioAuthSession.ts`. **No new auth store.**

| State | Expected heading (Sarah persona) |
|-------|--------------------------------|
| Logged out | `What health services are you focusing on today?` |
| Logged in | `Sarah, what health services are you focusing on today?` |

Make wire reference: `syncAgenticHomeHeading` / `resolveAgenticHomeLoggedIn` in `BootsPharmacyProjectView.tsx`. React Home must preserve the same SSoT when Finn replaces Make child 11.

Future probe rows (not stubbed yet): `home-heading-logged-out`, `home-heading-logged-in`, query textarea, chip/send interactions.

---

## PAGE FINAL PASS

**PDP stays HARD-GREEN** — Home does **not** block or demote PDP. Next page opens only after Home is PO-approved + full matrix PROVEN.

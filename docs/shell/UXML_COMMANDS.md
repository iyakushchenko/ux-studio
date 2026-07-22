# UXML standing commands — REC / Play (agent defaults)

**Status:** Locked (PO mandate, 2026-07-22)  
**Audience:** Every agent. When the PO says these strings (or clear equivalents), **run this procedure only** — do not invent a parallel path.  
**Deep contracts:** [PROOF_ROUTER.md](./PROOF_ROUTER.md) · [RECORDING.md](./RECORDING.md) · [QA_LOGGING_AND_PLAYBACK_RECIPE.md](./QA_LOGGING_AND_PLAYBACK_RECIPE.md) · [PLAYBACK_DIAG.md](./PLAYBACK_DIAG.md) · [CJM_RECORD_PLAY_EDIT.md](./CJM_RECORD_PLAY_EDIT.md)

These are **agent standing commands** (chat shorthand), not Studio UI chrome. They map 1:1 onto blessed window helpers + Chrome DevTools MCP eyes on `:5173`.

---

## Defaults (HARD — if PO does not override)

| Default | Resolve from |
|---------|----------------|
| **CJM / journey** | Current Studio selection: `window.__protoStudioState?.()?.orchestraMode` (or URL journey / picker). If empty → built-in for experience (`agentic-cjm` / `traditional-cjm`). |
| **Experience** | URL `experience=agentic\|traditional`, else infer from journey id (`traditional-*` → traditional, else agentic). |
| **Project / persona** | Current URL (`project`, `persona`) — do not reset to hub. |
| **Localhost** | **Only** `http://localhost:5173/` — reuse existing tab (R11). |

**Override examples:** `uxml play traditional` · `uxml play journeyId=rec-trad-…` · `uxml rec experience=agentic` · `uxml rec captureUntil=book-confirmation`.

---

## Watched run envelope (EVERY command)

Do this shell **around** the blessed helper — all-in-one QA + DevTools:

1. **Chrome DevTools MCP:** `list_pages` → `select_page` on the existing Studio tab (or navigate that tab to `:5173` with current `project`/`persona`/`experience`/`cjm=on` as needed). **Never** `new_page` if a Studio tab exists; **never** invent port `5174+`.
2. Confirm Vite is the one server on `5173` (reuse; do not spawn a second).
3. Close blocking Studio lightboxes (Guiding UX / Onboarding) if they cover the page — probes/REC refuse under-overlay clicks.
4. Run the **blessed helper** via `evaluate_script` (helpers already **ALWAYS CLEAR** QA + arm overlay where required).
5. **Watch:** AGENT TESTING overlay visible for the whole run; poll `__studioConsumePoSignal` / suite status if mid-flight; on Alarm/Cursor/Scroll → **STOP → understand `diagSnapshot` → FIX → RESTART** (R15) — do not continue blind.
6. Report `{ pass, … }` (and `journeyId` for REC). Keep overlay open after Full Play / REC prove for Save Log unless the helper tears down.
7. Strip ephemeral URL params (`proof`, etc.) only after evidence is captured.

**Forbidden:** ad-hoc Play while claiming REC; reusing an old `rec-*` as REC prove; Play smoke that tears down overlay when PO asked for prove/Save Log; skipping open `&modal=`.

---

## Command → procedure

| PO says | Meaning | Blessed helper (default CJM / experience) | PASS evidence |
|---------|---------|---------------------------------------------|---------------|
| **`uxml rec`** | Mint a **new** recorded CJM and Play **that** journey (REC robustness) | `await window.__studioRunRecNewCjmProve?.({ experience })` — ALWAYS CLEAR → arm REC → human pace → modal drain → Stop → Add as CJM → Play that `rec-*` | `{ pass: true, journeyId, recLive, peak }`; latch was live; **not** built-in CJM Play alone |
| **`uxml play`** | **Continuous** Play of the default / named CJM | `await window.__studioRunFullPlayProve?.({ journeyId })` preferred; or `{ experience }` when no free journey selected | `{ pass: true }`; peak / play-end **stays at journey end** (N/N finale); overlay retained |
| **`uxml play step`** | **Stepped** Play (Step forward through the playlist) | Agentic: `await window.__protoRunAgenticStepForwardSmoke?.({ timeoutMs: 600_000 })` · Traditional: `await window.__protoRunTraditionalStepForwardSmoke?.({ timeoutMs: 600_000 })` | `{ pass: true }` (or smoke `pass`); each beat polled for PO signals |
| **`uxml play step r`** | Stepped Play **including rewind** (Step back / retreat) | (1) same as **`uxml play step`**, then (2) retreat: agentic `__protoRunRetreatSmoke` / `__protoRunAgenticRetreatSmoke` · traditional `__protoRunTraditionalRetreatSmoke` | Both segments PASS; Step back buttons exercised |

Aliases (same meaning): `uxml record` → `uxml rec`; `uxml playback` / `uxml continuous play` → `uxml play`; `uxml step` → `uxml play step`; `uxml step rewind` / `uxml play step rewind` → `uxml play step r`.

---

## Copy-paste defaults

```js
// Resolve default CJM + experience (agents — do not invent another source)
const st = window.__protoStudioState?.();
const urlExp = new URLSearchParams(location.search).get("experience");
const journeyId = (st?.orchestraMode || "").trim();
const experience =
  urlExp === "traditional" || urlExp === "agentic"
    ? urlExp
    : /trad/i.test(journeyId)
      ? "traditional"
      : "agentic";

// uxml rec
await window.__studioRunRecNewCjmProve?.({ experience });

// uxml play  (prefer current journey when set)
await window.__studioRunFullPlayProve?.(
  journeyId ? { journeyId } : { experience }
);

// uxml play step
experience === "traditional"
  ? await window.__protoRunTraditionalStepForwardSmoke?.({ timeoutMs: 600_000 })
  : await window.__protoRunAgenticStepForwardSmoke?.({ timeoutMs: 600_000 });

// uxml play step r  (+ rewind)
// …run step smoke above, then:
experience === "traditional"
  ? await window.__protoRunTraditionalRetreatSmoke?.()
  : await window.__protoRunRetreatSmoke?.();
```

---

## What this is / is not

| Is | Is not |
|----|--------|
| Deterministic agent default when PO types the shorthand | A new UI button or slash-command product feature |
| Wrapper around existing blessed helpers + MCP eyes | A license to invent parallel REC/Play scripts |
| Default = **current** CJM / experience unless PO names another | Always force `agentic-cjm` / always force traditional |

If a helper is missing after hard-reload, fix the arm — do not hand-roll transport clicks as “prove.” Stuck twice → [AGENT_STUCK_ROUTER.md](../product/AGENT_STUCK_ROUTER.md) → [PROOF_ROUTER.md](./PROOF_ROUTER.md).

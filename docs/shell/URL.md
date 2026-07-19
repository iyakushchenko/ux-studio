# Studio URL scheme



Address-bar deep links for UX Studio. **Query params only** — works with Vite base `/` (localhost) and GitHub Pages `/ux-studio/` without SPA path rewrites.



## Canonical localhost (HARD)



**Origin agents MUST use:** `http://localhost:5173/`  

Vite: `server.port: 5173` + `strictPort: true` (never silent bump). Smoke/CI default the same port (`127.0.0.1:5173` OK).  

**One** `npm run dev`. Chrome MCP: reuse existing tab (`list_pages` → `select_page` / `navigate_page`; `new_page` only if zero pages).  

Auto-Rule: [STUDIO_AUTO_RULES.md](../product/STUDIO_AUTO_RULES.md) **`fixed-localhost-reuse-tab`**.



## Canonical form



```

?project=<projectId>&screen=<screenId>

?project=boots-pharmacy&screen=book-step-2

?project=boots-pharmacy&screen=book-step-1&modal=choose-pharmacy

?project=boots-pharmacy&screen=plp&modal=quick-view

?project=boots-pharmacy&screen=chat&persona=sarah-jenkins&cjm=on&experience=agentic

?project=boots-pharmacy&screen=site-pilot&persona=sarah-jenkins&cjm=off&experience=agentic

```



| Param | Required | Values | Meaning |

|-------|----------|--------|---------|

| `project` | recommended | Registry id (`boots-pharmacy`, `puma`, …) | Active project |

| `screen` | recommended | Stable screen id (below) | Active screen |

| `persona` | optional | Persona id within project | Active persona |

| `cjm` | optional | `on` \| `off` (aliases: `1`/`0`, `true`/`false`) | **CJM playback switch** — on or off (not a journey path) |

| `experience` | optional | `agentic` \| `traditional` | Which CJM journey path (orchestra slot) |

| `modal` | optional | Blocking lightbox id (below) | Topmost registered dialog |



**Do not use `mode=` for new links.** Legacy `mode=agentic-cjm` / `traditional-cjm` / bare aliases still parse (→ `experience` only; they do **not** turn CJM on). Serialize never writes `mode=`.



### Legacy `mode=` alias map



| Legacy query | Normalizes to |

|--------------|---------------|

| `mode=agentic-cjm` | `experience=agentic` |

| `mode=traditional-cjm` | `experience=traditional` |

| `mode=agentic` | `experience=agentic` |

| `mode=traditional` | `experience=traditional` |

| `mode=chat-experience` | `experience=agentic` |



Canonical `cjm=` / `experience=` win when both legacy and new params are present.



Internal journey ids remain `agentic-cjm` / `traditional-cjm` (`OrchestraModeId`) — URL uses the honest split above.



Examples (local / Pages):



- `http://localhost:5173/?project=boots-pharmacy&screen=chat&persona=sarah-jenkins&cjm=on&experience=agentic`

- `http://localhost:5173/?project=boots-pharmacy&screen=site-pilot&persona=sarah-jenkins&cjm=off&experience=agentic`

- `http://localhost:5173/?project=boots-pharmacy&screen=book-step-2`

- `http://localhost:5173/?project=boots-pharmacy&screen=book-step-1&modal=choose-pharmacy`

- `http://localhost:5173/?project=boots-pharmacy&screen=plp&modal=quick-view`

- `https://iyakushchenko.github.io/ux-studio/?project=boots-pharmacy&screen=book-step-1`



## Boots Pharmacy `screen` ids



| `screen` | Make child | Nav |

|----------|------------|-----|

| `hub` | (onboarding wiki) | Hub tab |

| `site-pilot` | 11 | Agentic Site Pilot Home (Make “Agentic. Site Pilot. Home”) |

| `chat` | 10 | Agentic chat |

| `plp` | 9 | Vaccinations PLP |

| `pdp` | 8 | Vaccine PDP |

| `book-step-1` | 7 | Book — Location |

| `book-step-2` | 4 | Book — Date & Time |

| `book-step-3` | 3 | Book — Confirmation |

| `appointment-history` | 2 | Appointment History |

| `appointment-details` | 1 | Appointment Details |



**Reserved:** `home` is **not** the Site Pilot screen — kept free for a future real Home page.  

Aliases accepted on parse: `book-step2` → `book-step-2`, `onboarding` → `hub`, `agentic-home` / `site-pilot-home` → `site-pilot`, `site-pilot-chat` → `chat`.



## Boots Pharmacy `modal` ids



**Registry:** `src/app/shell/studioModalRegistry.ts` (`STUDIO_MODAL_REGISTRY`) — every blocking dialog must be listed with `urlSync: true` + open/close helpers. Felony if unregistered or open bypasses the helper (no URL change).



| `modal` | Surface | Opened from |

|---------|---------|-------------|

| `choose-pharmacy` | Availability Tool (`.studio-avail-scrim`, `data-studio-modal`) — steps: Find Pharmacy → list/map → Choose Date → Choose Time | PDP **Check availability** (no login gate): logged-out + no location → **Find Pharmacy** (`start`); logged-in or chosen location → **Choose Date**. Also Book Step 1 Continue / Search / Near me / Change location / journey beats |

| `quick-view` | PLP Quick View lightbox | PLP tile Quick View CTA (single-SKU chickenpox RTB today; optional `&jab=` later if multi-SKU) |

| `login` | Login / Create account | Header Sign in, PDP / Quick View account CTAs, **Book now** when logged out |

| `vaccine-picker` | Vaccine picker | Book Step 1 / 2 Change vaccine |

| `recipient-picker` | Recipient picker | Book Step 1 / 2 Change recipient |



Aliases on parse: `availability` / `avail` → `choose-pharmacy`; `quickview` → `quick-view`; `account` → `login`.



When multiple dialogs are open (e.g. Login over Quick View), URL uses the **topmost** id (`STUDIO_MODAL_URL_PRIORITY`).



## Behavior



1. **Boot** — URL wins over `sessionStorage` when `project` / `screen` / `persona` / `cjm` / `experience` / `modal` present (legacy `mode=` → `experience`).

2. **Nav** — tab / hub / CJM switch / experience changes `replaceState` the bar (no history spam).

3. **Modal** — open/close of **any** registered lightbox syncs `&modal=` via `resolveStudioModalIdFromFlags` + `useStudioUrlSync`; modal transitions use `pushState` so Back closes the lightbox. Deep link re-opens after wire mount (`applyStudioModal` / `applyStudioModalFromUrl`).

4. **Refresh / deep link** — restores project + screen (+ cjm / experience / modal when present).

5. **Back/forward** — `popstate` re-applies query (screen + modal + cjm/experience).

6. **Ephemeral strip** — `proof`, `mcpDebug`, `agentTest`, `agentOverlay` removed on boot, overlay install, and overlay stop. Never re-written by studio sync.

7. **Post-agent reset** — after MCP / agent overlay `stop()` (and again immediately before reload): `resetStudioAfterAgentTest()`. **Default:** stay on current `project`+`screen`(+persona/cjm/experience); **always strip `&modal=`** + ephemeral; close live dialogs via `studio-post-agent-reset` (never re-apply modal). **`resetToJourneyStart: true`:** land journey key 1 (`site-pilot` / `plp`, `cjm=on`) — CJM/journey smokes. **`resetToHub: true`:** forbidden for product/smoke (Hub nav click only; emits `hub-nav` diag). Quinn proves page probe → still `screen=plp` with no sticky modal.



Implementation: `src/app/shell/studioUrl.ts` · `useStudioUrlSync.ts` · `orchestraModes.ts` · `studioModalRegistry.ts` · `studioModalGuard.ts` · `agentTestingOverlay.ts`.



## Recording



While REC is live, screen **and modal** transitions append `kind: "screen"` events (`screenId`, `projectId`, `studioUrl` including `modal` / `cjm` / `experience` when set). Snapshots also carry `screenId` + `studioUrl` for ordered page/URL replay context.



**Replay** restores those events through `applyStudioScreen` (+ `applyModal`) — the same helper used for refresh deep-link and `popstate`. See [RECORDING.md](./RECORDING.md).



## Agent note



Do **not** put verify leftovers in the bar (`?proof=unmount-race`). Use `__protoAgentTestingOverlay` / `__studioAgentTestingOverlay` — bottom-right panel only. Overlay z-index sits **above** concept lightboxes (`2147483646`).



**Logged-in flag (project-wide SSoT):** `src/app/shell/studioAuthSession.ts` — `isStudioLoggedIn()` / `setStudioLoggedIn(bool)`. Window: `__studioIsLoggedIn` / `__studioSetLoggedIn` (`__proto*` aliases). Header `isHeaderLoggedIn` / `setHeaderLoggedIn` are thin aliases.



**Probe tip:** for page matrices that must not be hijacked by CJM, use `cjm=off` (or strip `cjm=on`). Legacy `mode=traditional-cjm` alone does not enable the CJM switch.



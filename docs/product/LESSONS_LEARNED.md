# Lessons learned — UX Studio agents

**Status:** Living — append dated bullets; do not rewrite history.  
**Audience:** Every agent before UI / chrome / hybrid-mount work.  
**Refs:** [COMMAND_DOCTRINE.md](./COMMAND_DOCTRINE.md) · [FE_UI_UX_AUDIT.md](./FE_UI_UX_AUDIT.md) · [POST_CHANGE_CHECKLIST.md](./POST_CHANGE_CHECKLIST.md) · [CI_ACTIONS_BUDGET.md](./CI_ACTIONS_BUDGET.md) · [NEXT_STEPS.md](./NEXT_STEPS.md)

Agents **must read** this file before claiming a UI or Studio-chrome slice done.

---

<a id="topic-index"></a>
## Topic index

Read the latest dated section plus the rows for the surface being changed. The dated body
below remains append-only evidence; this index is the retrieval layer and may be extended
without rewriting history.

| Topic | Start with | Typical use |
|-------|------------|-------------|
| REC capture, compile, and honesty | [REC robustness](#topic-rec) · [Recording baseline](#topic-recording-baseline) | Arming, new-CJM proof, labels, scroll-stop, compile/replay |
| Continuous Play and diagnostics | [Playback completion](#topic-playback) · [Navigation/journeys baseline](#topic-navigation-baseline) · [Beat-tab alignment race](#topic-playback-alignment) · [PLP listing-load race](#topic-plp-listing-race) | Stalls, end state, scroll/cursor diagnostics, Step/Play parity, beat-tab-mismatch, scripted click vs screen's own reveal timer |
| Play/REC/QA prove surface sprawl (token burn) | [Prove harness debt](#topic-prove-harness) · board LATER 12a · PP-41 | One-line product flips cascade across smokes/docs/asserts — **refactor later, not now** |
| Hover-revealed UI + REC capture (no `hover` kind) | [Hover-reveal REC gap](#topic-hover-reveal-rec) · board LATER 12b | Before calling a hover-triggered kit "REC-ready" — check event kind + unmount-on-close |
| QA overlay and PO signals | [Overlay reset/HMR](#topic-overlay) · [Overlay baseline](#topic-overlay-baseline) | ALWAYS CLEAR, alarm/cursor/scroll, teardown, false FAIL |
| QA suite Observe / touch-wrap (R16) | [Suite Observe race](#topic-suite-observe) · dig [`qaSuiteTouchWrapContract.ts`](../../src/app/shell/qaSuiteTouchWrapContract.ts) | `dom-observe-open kind=agent` after suite sanity |
| Chat, camera, scroll, and type-in | [Chat camera](#topic-chat) · [Nested scroll host](#topic-scroll) | Progressive bubbles, composer pad, type-in, scroll reversal |
| Make→React mounts and selectors | [Make ghosts](#topic-hybrid) · [Hybrid baseline](#topic-hybrid-baseline) | Retire/park Make, first-match ghosts, mount/unmount |
| CSS, UXDS, hover, and fidelity | [Typical DS checks](#topic-ds) · [DS/CSS baseline](#topic-ds-baseline) | Tokens, kit states, loading parity, no invented chrome |
| Component library / typical action kits | [Pending-commit spinner icon](#topic-pending-spinner-icon) · [My Account nav panel dedup](#topic-ma-nav-panel) | Reusable `src/uxds/interactions/` primitives beyond Accordion/Disclosure/FilterChip — optimistic-flip-then-delayed-commit affordances; per-screen chrome copy-paste |
| URL, modal, and navigation state | [URL/CJM state](#topic-url) · [Modal URL](#topic-modal) · [Non-destructive overlay](#topic-overlay-underlay) | Deep links, modal registry, underlay must stay painted |
| Page migration and Final Pass | [Page Final Pass](#topic-final-pass) · [Page create inheritance](#topic-page-create) | Sequencing, proof, audits, next-page gate; UXDS/UXML reuse |
| Naming, hygiene, docs, version, CI | [Version](#topic-version) · [Naming](#topic-naming) · [CI](#topic-ci) | Repository conventions and delivery mechanics |
| **Stuck / don’t know / looping** | **[AGENT_STUCK_ROUTER.md](./AGENT_STUCK_ROUTER.md)** | One dig — do not thrash tokens |

For role-specific mandatory reading, return to
[TEAM_KNOWLEDGE.md](./TEAM_KNOWLEDGE.md#retrieve-knowledge-without-reading-the-archive).

---

## 2026-07-22

<a id="topic-plp-listing-race"></a>
### PLP bookmark click racing the listing content-load overlay (PO)

- **Symptom / class:** Traditional CJM `plp-open-pdp` beat clicked "Add to Bookmarks" but the heart/label never visually activated — only the (intentionally delayed) real store commit ~2s later flipped it, so watchers saw no immediate feedback on click.
- **Root cause:** PLP always runs a "content-load interim" (`PLP_LISTING_LOAD_MS` ≈ `STUDIO_CONTENT_LOAD_MS`, ~1.5s, **not** wrapped in `playbackMs` so it never compresses in fast/test mode) on every mount — a spinner overlay band, unrelated to bookmarks. `runPlpOpenPdp` only waited `SETTLE_MS` (320ms) after the screen became active before clicking, landing well inside that ~1.5s window. A click during that window still dispatched `pointerdown`/`click` correctly, but the tile's own optimistic `setOptimisticOn` flip never stuck — confirmed live via `MutationObserver` + a native `pointerdown` listener on the button (clean isolated click before the window closes: no attribute change ever; same click issued after the window closes: `aria-pressed`/`data-studio-bookmarked` flip within ~11ms of `pointerdown`).
- **Right fix:** `waitForPlpListingSettled` in `traditional.ts` — poll for `[data-studio-plp-listing-loader]` to clear (using the same `playbackReadinessDelay` polling idiom as `waitForVisibleTarget`/`pollForLoginPopup`) before finding/clicking the bookmark button. Any scripted click into a screen that has its own async "reveal" timer must wait for that reveal, not just for the screen container to be visible.
- **Gate:** Live MCP trace (`MutationObserver` on the button + `pointerdown` listener) through `__studioRunFullPlayProve({ experience: "traditional" })` — `native-pointerdown` and `data-studio-bookmarked`/`aria-pressed` → `"true"` land in the same ~10ms window, no delayed-only flip.
- **Engine hardening (2026-07-22, follow-up — do not re-litigate per screen):** The PLP-specific fix above was a **point fix**; this class ("scripted click races a screen's own reveal timer") is now closed at three levels so future screens get it for free instead of needing a hand-authored wait:
  1. **Shared timing primitive, not a raw `setTimeout`.** `waitStudioContentLoad(ms, shouldAbort)` (`src/uxds/motion/index.ts`) already existed and Chat's browse-entry reveal already used it correctly — PLP's listing-load effect was the one screen still hand-rolling a bare `setTimeout(..., PLP_LISTING_LOAD_MS)`. Converted to `waitStudioContentLoad` (abortable, real wall-clock, never `playbackMs`-compressed by design). Root cause of the *inconsistency*, not just this bug: two screens implementing the same "content-load interim" contract two different ways.
  2. **Director-owned generic gate.** `waitForContentLoadSettled()` (`src/app/scenario/playbackReadiness.ts`) polls `document.body[data-studio-content-loading]` and is now called inside `invokeBeatScript` (`useJourneyPlayback.ts`) — the single choke point every beat script (book/tab/home/avail, agentic **and** traditional) already runs through. Screens opt in by setting the attribute; they never need to author a wait themselves. (Screen-specific scripts may still add a more precise wait, e.g. for one element, when they need finer sequencing than "beat start" — `waitForPlpListingSettled` in `traditional.ts` stays as defense-in-depth since it waits *after* `waitForActiveScreen`, which the generic gate — checked at beat start, before the screen may even be mounted — cannot guarantee.)
  3. **CI felony gate (`check-agent-felonies.mjs` #14, `content-load-ssot`).** Any file that writes `data-studio-content-loading` via `setAttribute` must call `waitStudioContentLoad` — a raw `setTimeout` gating that attribute is now a hard CI fail, not just a lesson to remember.
- **Why this was invisible to CI before:** `PLP_LISTING_LOAD_MS` is intentionally **not** wrapped in `playbackMs` (a content-load interim must behave identically for a human and a smoke — see `playbackReadinessDelay` header doctrine), so fast-mode tests never compressed it away; they simply never triggered the race because the old per-script click already happened later in the beat's own async chain in the test harness's simulated timing. Only a real-speed watch — or, as here, precise `MutationObserver` polling — surfaces the multi-hundred-ms window where it recurs.

<a id="topic-pending-spinner-icon"></a>
### Pending-commit spinner icon — new `src/uxds/interactions/` primitive (PO ask, 2026-07-22)

- **Ask:** PO asked whether the engine has a reusable "library of typical actions" to enrich UX beyond point fixes — specifically, could the PLP bookmark heart show a loading/committing state during its intentional ~2s delayed-commit window (`PLP_WISHLIST_ADD_DELAY_MS`), and could that be done the standard way without breaking REC/Play. Explicitly **not Make-parity-gated**: "forget about make parity. implement as suggested. we may and WILL improve as we go."
- **Gap found:** `src/uxds/interactions/` (Accordion, Disclosure, FilterChip) is the real "typical actions" library today, but it had no loading/pending-icon entry — every screen either hand-rolled its own spinner (PLP's listing loader) or explicitly avoided one (Chat, by PO request). No shared "optimistic flip → delayed real commit → show it's committing" pattern existed.
- **Built:** `PendingSpinnerIcon` (`src/uxds/interactions/PendingSpinnerIcon.tsx` + `pendingSpinnerIcon.css`) — same arc-turn visual language as PLP's existing listing-loader spinner (promoted to a shared kit, not reinvented), `stroke: currentColor` on the arc so it inherits whatever active-state color the consumer already sets (fuchsia here) rather than a generic loader color. Exported from `src/uxds/interactions/index.ts` alongside Accordion/Disclosure/FilterChip.
- **Wiring (PLP heart, `PlpScreen.tsx`):** `wishlistCommitPending = heartActive && !wishlisted` — a **derived** signal from state that already existed (optimistic flip vs. real store), no new prop threading, and it is `false` on the remove path for free (remove commits synchronously, so `heartActive`/`wishlisted` never diverge there). While pending: swap `BookmarkGlyph` for `<PendingSpinnerIcon />` and stamp `data-fav-pending` on the icon span for QA/future-contract visibility.
- **Why this cannot break REC/Play:** the click-verification contract watches `data-studio-bookmarked` / `aria-pressed` on the **button** (unchanged, flips synchronously on `pointerdown` regardless of which glyph is inside), never the inner SVG. `waitForWishlistCommit()` (`traditional.ts`) already polls the real store, so Play never races the pending window either way — the spinner is a pure presentation layer on top of contracts that were already correct.
- **Gate:** Live MCP — `data-fav-pending` flips `true` at click, spinner renders in fuchsia (`currentColor` inheriting `.is-active`), holds for the full ~2s window, flips back to the solid heart glyph exactly when the real commit lands. Full `__studioRunFullPlayProve({ experience: "traditional" })` still completes `10/10 STEPS`, `pass: true`, no errors, with the spinner mid-flight during that beat. `npm test` 153/153 files green, build green.
- **Open for reuse:** any future "optimistic UI ahead of a delayed real commit" surface (save, add-to-cart, follow…) gets this via `import { PendingSpinnerIcon } from "@/uxds/interactions"` instead of a bespoke spinner. Not registered in `docs/uxds/DEVIATIONS.md` — that registry is for anonymous/hacky chrome outside the kit system; this *is* the kit system (one named, reusable, exported primitive), same tier as Accordion/FilterChip.
- **Follow-up (same day) — "Saving…" label + commit-pulse, engine motion only:** PO asked for two more enrichments on the same interaction, explicitly forgetting Make parity and explicitly "using engine, not hardcoded stuff": (1) swap the label to `Saving…` during the pending window, (2) pop the icon slightly bigger then back to normal size the instant the real commit lands.
  - **Label:** `wishlistCommitPending` (already-derived state) gates a third label branch — no new state, no magic string disconnected from the actual signal.
  - **Icon pulse:** new `CommitPulseIcon` (`src/uxds/interactions/CommitPulseIcon.tsx`) — `motion.span` from `@/uxds/motion` (doctrine-mandated motion engine, not a bespoke `@keyframes`), `animate={{ scale: [1, 1.32, 1] }}`. Framer-motion only replays a keyframe `animate` array on (re)mount, so the trigger is a `pulseKey` prop bumped via `key={pulseKey}` — remounting is what replays it.
  - **Mount-safety gotcha (why it's not `commitPulseKey >= 0`):** a static `animate` keyframe array plays on **every** mount, including first paint — wrapping *every* tile's rest-state heart in `CommitPulseIcon` from render 1 would pop every untouched tile once on initial reveal. Fix: only wrap once `commitPulseKey > 0` (i.e. only after a real commit has actually happened at least once); the plain `<BookmarkGlyph />` renders unwrapped before that. The pulse's own first mount **is** the commit moment, so it still fires exactly once when intended.
  - **`commitPulseKey` derivation:** a `wasWishlistedRef` comparison bumps the key only on `false → true` (real add landing) inside the existing `[wishlisted]` effect — never on mount (ref seeds to the mount-time value) and never on remove (`true → false`).
  - **Gate:** Live MCP — `labelText` reads `Saving…` for the full pending window, flips to `In your Bookmarks` the instant `data-fav-pending` clears; icon `transform` samples show `scale(1.27…)` mid-pulse exactly at the commit tick, settling back to identity within ~320ms. Full CJM prove still `10/10`, `pass: true`. `npm test` 153/153 green, build green.

<a id="topic-ma-nav-panel"></a>
### My Account left-nav panel — copy-pasted per screen, not shared (PO ask, 2026-07-23)

- **Ask:** PO asked whether the `appointment-history` / `appointment-details` left-hand rail is a shared component and whether it semantically matches UXDS Figma `module.ma.navigation` (`myqzp3KRc1pxKDOv8RfTsl`, node `12409:640716`).
- **Found:** Semantic match was already exact — `data-name` stamps (`module.ma.navigation`, `component.ma.navigation.profile.name.and.icon`, `.menu`, `.menu.item`, `.content.slot`) mirror the Figma node 1:1, confirmed via `get_design_context`. But it was **not a shared component**: `AccountAvatar()` and the whole `<aside>` block (profile + 10-item menu + Customer Service slot) were byte-for-byte duplicated in `AppointmentHistoryScreen.tsx` and `AppointmentDetailsScreen.tsx` (only the CSS class prefix differed), plus the same CSS rules duplicated in both screen `.css` files, plus a third legacy copy in Make `frame/index.tsx`. Classic one-pattern-per-role violation (`DS_STRICTNESS.md`) that hadn't surfaced as a visible bug yet.
- **Fix:** Extracted `MaNavigationPanel` (`src/projects/boots-pharmacy/chrome/MaNavigationPanel.tsx` + `maNavigationPanel.css`) taking `helloLabel` / `profileName` / `navItems` / `activeItem` as props (each screen's own `*_NAV_ITEMS` / `*_NAV_ACTIVE` / `*_PROFILE_*` contract constants stay screen-owned — the markup/CSS is what was shared, not the content). Both screens now render `<MaNavigationPanel ... />`; per-screen `AccountAvatar()` and the ~90-line duplicated `<aside>` JSX + ~90 lines of duplicated CSS removed from both.
- **Verified:** `npm test` all gates green, `npm run build` green, live MCP screenshot on both `screen=appointment-history` and `screen=appointment-details` — panel renders identically (profile photo swap still applies via the preserved `data-name="icon / accent / account"` global theme selector in `globals-screens.css`, unaffected by the class rename).
- **Reuse rule:** any future My Account screen (profile, invoices, address book…) consumes `MaNavigationPanel` from day one — do not re-fork the `<aside>` a third time.
- **Follow-up (same day) — make real links, no dead hrefs:** PO asked that nav items be genuinely interactive with DS hover/focus/active states, but **only** for labels whose target page actually exists in the project (no invented navigation for the other 9 generic Make labels — under-match over invent, doctrine item 23). `MA_NAV_LINKED_LABELS` (exported from `MaNavigationPanel.tsx`) is the single place that lists which labels have a real screen; today that's just `"Appointment history"` (only `appointment-history` + `appointment-details` exist). Matching items render as real `<button>`s (hover: `--uxds-filter-chip-surface-hover`; active/focus-visible via existing text-link tokens); non-matching items stay plain `<div>` text, unchanged.
- **Current = self OR parent, and still clickable:** kept the existing convention (`*_NAV_ACTIVE = "Appointment history"` on *both* screens) — mirrors the breadcrumb pattern already in these screens, where a parent crumb stays clickable even while its child page is "current". So on Details, "Appointment history" is both the highlighted current-section item **and** a real link back to History (`onNavigate={onGoHistory}`); on History it's current **and** a harmless self-nav no-op. Verified live via MCP: hover tint visible + distinct from the active background, click from Details → navigates to History, self-click on History → no console errors, no-op.
- **Follow-up (same day) — every item hoverable, not just linked ones; and a real width regression found underneath:** PO refined the ask: *all* 10 items must read as one interactive DS pattern (hoverable/focusable), not just the one with a real target; current page keeps its bold+filled wrapper unaffected; others = transparent bg at rest, transparent bg + brand-primary text on hover. Separately PO flagged the body container as "narrower than needed" vs other pages.
  - **All-items-hoverable fix:** every `navItems` entry now renders as a real `<button>`; `MA_NAV_LINKED_LABELS` still gates *navigation only* (`onClick` set vs `undefined`) so un-shipped pages stay a no-op click — hover affordance is uniform, invented targets are not (doctrine item 23, under-match over invent).
  - **CSS specificity trap (new failure class — watch for this on any "reset styles then re-add a modifier" button pattern):** a `button.menu-item { font: inherit; background: none; … }` reset rule, even though declared *after* `.menu-item--active { font-weight:600; background:#f5f5f5 }` in the file, **beat it in the cascade** — `button.class` (1 class + 1 element = specificity `0,1,1`) is MORE specific than `.class--active` alone (1 class = `0,1,0`), regardless of source order. Silently dropped the active item's filled background *and* bold weight (font-size/line-height too, since `font: inherit` resets the whole shorthand, not just family). Caught by reading `getComputedStyle` after a real MCP hover, not by eyeballing a screenshot. **Fix:** (a) use `font-family: inherit` in resets, never the `font` shorthand, when sibling rules set individual font sub-properties; (b) restate any modifier that must always win as a doubled-class selector (`button.menu-item.menu-item--active { … }`, specificity `0,2,1`) so it beats the reset regardless of order.
  - **Width regression root cause (real bug, unrelated to the nav panel):** `.appointment-history` / `.appointment-details` main measured `1200px` wide inside a `1872px` viewport (should be full width, like every other migrated screen) — traced by walking `getBoundingClientRect()` up the DOM chain. Cause: the Figma-generated ancestor wrapper uses `items-center` (cross-axis center, not stretch) on its `flex-col`; every other screen's own CSS carries a `.studio-react-screen-host[data-studio-react-screen="<id>"] { align-self: stretch; width:100%; … }` override (see `plp.css`, `book-step-2-datetime.css`) that forces the host to fill instead of shrink-to-content — `appointment-history.css` / `appointment-details.css` were the only two screens missing that rule (never copied over when those screens were built). **Fix:** added the same host-stretch rule to both. **Lesson:** any new migrated screen's CSS must include this host rule from day one — it is easy to omit because the screen "looks fine" during local dev at whatever ad-hoc browser width happens to be open; only a `main` vs `.studio-viewport` width diff (or a maximized-viewport screenshot vs. another page) surfaces it.
  - **Gate:** `npm test` 153/153 green, `npm run build` green. Live MCP: `main` width `1872px === .studio-viewport` width on both screens (was `1200px`); real CDP `hover()` + `getComputedStyle` shows active item `background:#f5f5f5`/`font-weight:600` unaffected by hovering non-active siblings; non-active item hover flips `color` to `rgb(70,118,114)` (`--project-brand-primary`) with `background: transparent`.
- **Follow-up (same day) — active-item hover fill, tile CTA hover, and sticky rail:** PO asked for three more refinements once the above landed:
  1. **Current-page hover fill.** The active/current nav item was intentionally left unaffected by hover (correct per the earlier ask), but PO wants it to *also* react on hover — filling with the same lighter-primary tone already used at rest by the Edit/Cancel icons in the appointment tiles (`stroke="#AFCCCA"` / `fill="#AFCCCA"` = `--project-brand-primary-light`). Added `button.menu-item.menu-item--active:hover { background: var(--project-brand-primary-light, #afccca); }` — reuses an existing token pair already visible elsewhere on the same screen instead of inventing a new tint.
  2. **Appointment-tile icon+text CTAs (Edit/Cancel) had zero hover/focus states** — first pass added a bespoke background wash + a new `--project-brand-primary-darkest` color, i.e. invented a new hover treatment instead of checking for an existing one. **PO caught it same day** ("edit cancel cta are same as quick view on plp — do not add any new classes and redundant styles!"): PLP's Quick View tertiary CTA (`.plp__tertiary` in `plp.css`) already defines the canonical icon+text hover for this exact role — **no background wash at all**, label → `#000`, icon → `var(--uxds-text-link-link)` (the DS link-navy token, resolves to `#012169` in Boots theme, not a new teal). Corrected `.appointment-history__icon-btn:hover` / `.appointment-details__icon-btn:hover` to that exact treatment (transparent bg, `color:#000`, icon fill/stroke → `--uxds-text-link-link`) — same existing classes, no new ones. **Lesson:** before styling a hover state, grep for the same interaction role already shipped elsewhere (PLP `.plp__tertiary`, PDP `.pdp__secondary`) and copy its exact token/behavior; do not derive a "same-family" palette variant that only *looks* consistent.
  3. **Sticky left rail** — PO asked to mirror the Hub sidebar TOC pattern (`globals-hub.css` `.proto-hub-page__sidebar { position: sticky; top: 24px; align-self: start; }`). Added `position: sticky; top: var(--sticky-top, 64px); align-self: flex-start; max-height: calc(100vh - var(--sticky-top) - 24px); overflow-y: auto;` to `.ma-navigation-panel`. **Verify sticky math by container-relative offset, not raw viewport `top`:** a live measurement showed the panel clamping at `getBoundingClientRect().top ≈ 184px`, not the `96px` `--sticky-top` value — this looked like a bug at first glance. It wasn't: `position: sticky`'s `top` offset is relative to the *scroll container's own padding edge* (here `.proto-scroll.studio-scroll--overflow`, itself pinned ~89px down by outer Studio chrome), not the viewport — `scrollerRect.top (88.6875) + sticky top (96) = 184.6875`, which lands the panel exactly flush under the sticky Boots header's bottom edge inside that same scroll container. When auditing a sticky offset, always add the scroll container's own `getBoundingClientRect().top`, don't compare the clamp value to the raw `--sticky-top` number.
  - **MCP measurement gotcha:** `getComputedStyle(el)` read right after a synthetic `dispatchEvent(new MouseEvent('mouseover'))` does **not** reliably reflect `:hover` — it only worked consistently when using the real CDP `hover()` tool followed immediately by `evaluate_script` (no intervening `take_snapshot`/navigation, and uid must point at the element's *current* on-screen position — a stale uid from before a scroll/reflow hovers the wrong coordinates). Screenshot + computed-style cross-check, not either alone.
  - **Gate:** `npm test` 153/153 green, `npm run build` green. Live MCP on both screens: real scroll (`scroller.scrollTop` swept 0→2200) shows nav clamped at the header's bottom edge then releasing near the list's end (no premature detach); hovering the active item and the Edit/Cancel CTAs shows the exact expected `rgb()` values for background/color/icon fill via `getComputedStyle` (not just eyeballed).
- **Follow-up (same day) — three more corrections, all "reuse the existing pattern" fixes:**
  1. **Edit/Cancel hover corrected to Quick View parity** — see the corrected item 2 above; this was a straight revert-and-copy, not a redesign.
  2. **Sticky nav touched the header with zero gap.** `top: var(--sticky-top, 64px)` clamps the panel flush against the header's bottom edge — no breathing room. Fix: `top: calc(var(--sticky-top, 64px) + 24px)` (and `max-height` adjusted `-48px` to match). No motion-lib transition needed — the offset is a static value, not a state change that animates; framer-motion would have nothing to animate here (doctrine's "use motion for transitions" applies when a property changes over time in response to state, not a fixed CSS position math fix).
  3. **"Load more" was a dead-looking disabled button with hardcoded hex** (`border:#afccca`, `color:#5c5c5c`, `border-radius:4px`, `cursor:default`, no hover) despite having only `aria-disabled="true"` (not a real `disabled` attribute, so it still receives pointer/hover events). PO: "same as check availability CTA on PDP." Copied `.pdp__secondary`'s exact token set into the *same existing class* (`.appointment-history__load-more-btn` — no new class): `border/background` → `var(--uxds-input-button-border-border-secondary)` / `var(--uxds-input-button-surface-surface-secondary-solid)`, `border-radius:360px` (pill, was `4px`), hover → `var(--uxds-surface-accent-soft)` bg+border, icon → `var(--project-brand-cta-navy-hover)`. **Lesson:** `aria-disabled="true"` alone does not suppress hover/pointer events in Chromium (only the real `disabled` attribute does) — don't assume a control marked disabled-looking is inert; check the actual attribute before deciding hover styling is moot.
  - **Gate:** `npm test` 153/153 green, `npm run build` green. Live MCP: sticky gap measured `navTop - scrollerTop === 120px` (`96 + 24`) after scroll — confirms the fixed offset, not a screenshot guess. Edit hover on both screens: `background: rgba(0,0,0,0)`, `color: rgb(0,0,0)`, icon `rgb(1,33,105)` via real CDP `hover()` + `getComputedStyle` (`:matches(':hover')` asserted true before reading). Load more hover: `background`/`border` → `rgb(198,229,225)`, icon → `rgb(1,49,143)` — same values as `.pdp__secondary`'s hover.

<a id="topic-prove-harness"></a>
### Playback/REC/QA prove surface — architecture debt (PO / Arch)

- **Symptom / class:** Touching Play / REC / QA prove burns monster tokens; law is scattered (`completeJourneyPlay` + many prove contracts); one-line product flips (e.g. play-end stay-at-end) cascade across smokes/docs/asserts.
- **Root cause:** No single SSoT behavior module; duplicated at-start/at-end contracts; thin prove API missing.
- **Right fix (future P0 — not now):** Architecture refactor + one regression harness; thin prove API; fewer duplicated play-end contracts. Stamp: [NEXT_STEPS.md](./NEXT_STEPS.md) LATER 12a · [PAINPOINTS.md](./PAINPOINTS.md) PP-41.
- **Gate:** Do **not** start until Arch/Pax open the wave; until then prefer minimal product flips + update the fewest asserts.

### Play end stays at finale — no auto-rewind (PO)

- **Symptom / class:** Continuous Play finished then jumped to CJM start (PLP / site-pilot / 1/N). PO wants end state left on the last beat.
- **Root cause:** `completeJourneyPlay` called `jumpToStart` + emitted play-end `journey-reset`; `play()` at last beat also rewound; asserts/smokes required play-end-at-start.
- **Right fix:** `completeJourneyPlay` stops in place (park cursor `play-end`); Play-at-end is a no-op; Jump-to-start stays manual. Assert `__studioAssertPlayEndedAtEnd` (N/N + finale beat; anti-rewind vs startBeatId). Step-at-last already stayed.
- **Gate:** Unit `playbackDiag` / `fullPlayProve` / format humanize; live `__studioRunFullPlayProve({ experience: "traditional" })` → PASS peak N/N · play-end at end · `screen=appointment-details` (not plp/site-pilot).

### Agentic SF `transport-no-progress` — bubble fail-handoff freeze silent-blocks SF (PO / Quinn)

- **Symptom / class:** `__protoRunAgenticStepForwardSmoke` FAIL `transport-no-progress` mid-chat or at `book-step2` after Avail — fingerprint stuck; no diagnostic modal; SF appears to fire. Residual after honest refuse: `step-forward-unavailable` with `frozen` + sticky overlay `isDiagnosticBlocking` while Studio `diagnosticOpen:false` (avail→book-step2 land often leaves `PLAYBACK_DIAGNOSTIC_OPEN` beat-tab race).
- **Root cause:** Chat bubble JUMP/CHOP called `__studioBeginQaFailHandoff` (freeze + handoff pending) **without** a polled PO latch. App `refusePlayIfQaBlocks` then silent-no-op’d SF while MCP helper still returned `true`. Orphan clear previously keyed off overlay diag flags — sticky `diagnosticBlocking` prevented freeze wipe.
- **Right fix:** Prove-mode skips bubble fail-handoff (diag-only, like fast). `beginQaFailHandoff` always latches `QA_FAIL_HANDOFF`. Prove-mode clears via `clearQaPlaybackBlocksForReset` when Studio has no open diagnostic (ignore sticky overlay flag). App `triggerTransport` returns `false` when refused. Step-forward smoke pre-clears orphan blocks before each SF.
- **Gate:** `playbackDiag.test.ts` prove-mode + `agentTestingListen.test.ts` orphan freeze (sticky diagBlocking); full R11 `__protoRunAgenticStepForwardSmoke` PASS → `STEPS: 22 / 22` appointment-details.

- **Symptom / class:** `uxml play step` / `__protoRunAgenticStepForwardSmoke` FAIL on beat 1 `agentic-home` / `sarah-query-submit` — `PLAYBACK_DIAGNOSTIC_OPEN` “Step forward had no effect”; QA log shows `Agent stale · auto-pause` then `Typing finished — FAIL` / type-in `aborted`.
- **Root cause:** `withMcpTestSession` `forceClear` ends prove-mode and never re-armed it (unlike `__studioRunFullPlayProve` / `requireFreshQaSession`). Long Site Pilot type-in (>8s) hit stale heartbeat → `haltPlaybackForPoSignal("agent-stale-auto")` mid-script → director-step-no-effect. Same class for manual stepped watch with overlay open.
- **Right fix:** Arm `beginQaProveMode` inside `withMcpTestSession` (clear in finally). Skip stale auto-pause while director on-air or `isTypeInCursorGuardActive()`.
- **Gate:** `mcpTestSession.test.ts` + type-in active latch test; R11 re-prove `__protoRunAgenticStepForwardSmoke` past home type-in.

### QA popup Run Test must not appear in user agentic QA mode (PO)

- **Symptom / class:** QA tool popup showed half-visible / activatable **Run Test** while human product QA chrome was open (`manual` / `observe`), driven by leftover suite selection rather than an explicit operator mode.
- **Root cause:** Capture toggle text flipped to “Run Test” whenever `selectedQaSuiteId` was set — no solid popup action state machine; CSS/ad-hoc hide was insufficient.
- **Right fix:** `qaPopupActionState.ts` — states `idle | agentic-user | prove | suite-armed | suite-running`. **User agentic QA mode** = `sessionKind` `manual` \| `observe` → Run Test unavailable + suite picker hidden. Run Test only in `suite-armed` (`agent` + suite selected). Click path gated by `canActivateRunTestFromPopup`. `__studioRunQaSuiteById` unchanged.
- **Gate:** `qaPopupActionState.test.ts`; MCP spot-check `:5173` manual/observe QA open → no Run Test.

### Recorded `modalId: choose-pharmacy` vs live Availability / noSlots (PO / Quinn)

- **Symptom / class:** `all-cjms-fast` FAIL on `rec-*` @ `avail-select-date` — `playback-click-failed` / target-degraded; beat stamps `modalId: "choose-pharmacy"` while Availability date step is live, or prior `avail-choose-location` picked Strand (`hasSlots: false`) → `noSlots` so date cells never exist.
- **Root cause:** Capture stamped sticky choose-pharmacy modalId onto later avail-* clicks; Play re-applied modal and wiped the date surface. Separately, poisoned REC location with no slots left Play waiting for `[data-studio-action="avail-select-date"]` that cannot appear.
- **Right fix:** In `recordedClickPlayback.ts`: `keepLiveAvailability` skips modal re-apply when Availability scrim is open; before date/time clicks, `ensureAvailDateSurfaceReady` backs out of noSlots and Choose Location on a slotted store; choose-location prefers slotted when next beat needs date. Hard FAIL on missing targets (no soft-log invent).
- **Gate:** vitest heal + keep-live-avail units; `all-cjms-fast` 5/5 including `rec-trad-mrvina5r-1xna`. Do not delete PO journeys without capture evidence.

### Page create must inherit UXML + similar UXDS (PO)

- **Symptom / class:** Agents invent page-local accordions/buttons or grow project `theme.css` with layout/hover when asked to create a page.
- **Root cause:** No hard preflight forcing UXDS map + similar frame + existing kits/pages before JSX.
- **Right fix:** [PAGE_CREATE_INHERITANCE.md](./PAGE_CREATE_INHERITANCE.md) P1–P6; Bea inheritance table required; BASE mutual; theme = brand/copy delta only.
- **Gate:** Arch rejects mount without inheritance stamp; ship sitrep `Inheritance: P1–P6 PASS`.

### QA self-test must not wipe `document.body` (PO / Quinn)

- **Symptom / class:** `__studioRunQaSelfTestSmoke` / pure checks PASS, then every MCP page probe fails host-miss (`[data-studio-react-screen=…]` gone) while URL still shows the screen.
- **Root cause:** `control-room-interactive-only` set `document.body.innerHTML = …` then `""`, destroying the React Studio root.
- **Right fix:** Probe click-detail helpers inside an offscreen sandbox node; never replace `body.innerHTML` in live Studio.
- **Gate:** After self-test, `document.querySelector('[data-studio-react-screen]')` still present; suite `mcp-page-probe` can PASS without reload.

### Fast suite scroll-path-deviation must not block (PO / Quinn)

- **Symptom / class:** `all-cjms-fast` / `play-all-cjms` FAIL `PLAYBACK_DIAGNOSTIC_OPEN` with `Eased scroll deviated Npx` (e.g. 72px on PLP filter beat) while suite copy says motion frames are diagnostic-only. Also: `playback-chat-motion-failed:chops=1` under fast while handoff already soft-logs bubble chop.
- **Root cause:** Compressed `playbackMs()` ease samples diverge from the easeOut model; `scroll-path-deviation` still opened a blocking diagnostic → suite alarm latch aborted the CJM. Separately, `playJourneySmoke` hard-failed on `chatBubbleMotion.chops/jumps` even when `isFastPlayback()`.
- **Right fix:** In `playbackScrollMonitor.report`, when `isFastPlayback()`, soft-log `scroll-path-deviation` / `scroll-stutter` via `playbackDiagScroll` and do **not** call `onAnomaly` (no Alarm / FAIL handoff). In `playJourneySmoke`, skip chat-bubble motion hard-fail when `isFastPlayback()`. Demo-speed remains strict.
- **Gate:** vitest fast-mode monitor; re-run Fast test all CJMs — motion path drift / bubble chop must not stop the suite.

### QA suite: mcp-sanity → self-test Observe race (PO / Quinn)

<a id="topic-suite-observe"></a>

- **Symptom / class:** Suite `mcp-sanity` PASS then `qa-self-test` FAIL `dom-observe-open kind=agent phase=control`. Direct `sanity → smoke` PASS.
- **Root cause:** `__studioGetQaSuiteStatus` (and other suite APIs) were helper touch-wrapped. Live suite/UI polls re-armed CONTROL ~50ms after self-test `forceClear`, so `OpenQaLogger({ kind:'observe' })` no-op'd on agent lock.
- **Right fix:** Quiet contract SSoT `qaSuiteTouchWrapContract.ts` (`isQuietHelperSuffix` + MUST_STAY_QUIET list) · `helperOverlayArm` unwraps · Auto-Rule **R16 `qa-suite-no-touch-wrap`** · self-test checks `suite-helpers-not-touch-wrapped` + `suite-status-poll-no-rearm` embed dig card on FAIL.
- **Agent dig (HARD):** On that symptom open `src/app/shell/qaSuiteTouchWrapContract.ts` (`QA_SUITE_TOUCH_WRAP_DIG`) first — not the page under test. Or use [AGENT_STUCK_ROUTER.md](./AGENT_STUCK_ROUTER.md) row. Prove `!window.__studioGetQaSuiteStatus.__studioOverlayArmed` then suite `[mcp-sanity, qa-self-test]` PASS.
- **Gate:** `check:felonies` + vitest contract + suite `[mcp-sanity, qa-self-test, mcp-page-probe, validate-all-cjms]` PASS; React host still mounted.

### Engine owns probe wiring — pages register, never if/else the engine (PO)

- **Symptom / class:** Each new migrated screen added Boots imports + `stepsForScreen` branches inside `studioMcpPageProbe.ts`; kits grew Boots-only props (`data-studio-appointment-view-details` on ButtonPrimary).
- **Root cause:** Page ships treated the engine file as a contribution board.
- **Right fix:** Engine `mcpPageProbeRegistry` + project `registerMcpPageProbes`; pages stamp `data-studio-action` (engine contract); legacy project attrs stay on the page. Freeze beat-id allowlists in `playbackTransportAnomalies` — no new rescue rows.
- **Gate:** New screen probe = register only; UXDS kit has no project selector props; `npm test` registry unit.

### Make densify `!important` vs React History host (PO / Uma)

- **Symptom / class:** React Appointment History CSS set Make pad/gap (32/56, CTA 32) but computed styles stayed densified (20/20, CTA 12) — Uma FAIL.
- **Root cause:** `globals-chrome.css` Make densify rules target child-2 `[data-name=…]` with `!important`. React cards kept Make `data-name`s, so densify won over page CSS.
- **Right fix:** Gate densify with `:not([data-studio-react-screen])` on History child-2 so React mounts skip densify; leave Details child 1 densified while Make. Do **not** invent Cancel hover to “improve” wire (removed `#c96b6b`).
- **Gate:** Uma re-measure pad/gap/title/info/CTA; Quinn `__studioRunMcpPageProbe` appointment-history; PAGE FINAL PASS HARD-GREEN.

### REC/playback target truth — visible box, selected no-op, and unchecked checkbox (PO)

- **Symptom / class:** Agent REC clicked an already-selected Book Step 2 date; wide PLP links looked like empty-space clicks; ghost boxes on legacy Details could be reported as clicks; checkbox cursor press did not guarantee the checkbox changed.
- **Root cause:** Shared cursor treated any visible non-disabled rectangle as clickable, always aimed at its geometric centre, captured before verifying outcome, and had no universal idempotent-selection rule.
- **Right fix:** One engine contract: require native/ARIA/action semantics; reject selected idempotent options before travel; target visible text/content inside oversized actions; read checkbox/radio/selection state before click and require a transition before logging PASS or REC capture. Toggle-off remains valid; selected radio/date/tab no-op does not.
- **Gate:** `demoInteractionContract` units + cursor interaction tests + cross-route localhost REC/playback. Page migrations preserve semantic action/state hooks; no CJM-id rescue branches.

<a id="topic-playback-alignment"></a>
### `beat-tab-mismatch` — beatIndex advance can commit one render before the tab navigates (PO / Arch)

- **Symptom / class:** `uxml play` / `uxml play step` PO diagnostic `state-mismatch` / `beat-tab-mismatch` — `beat=book-step2 protoTab=6 expectedTabIndex=5 currentTabIndex=1` right after Robo-cursor "Book Now" at Availability "Choose time"; later also seen at `appointment-history → appointment-details` ("View Details").
- **Root cause (two distinct causes, same symptom):**
  1. **Timing race:** director-script beats (`runAvailScriptBeat` / `runBookScriptBeat` / `runTabScriptBeat`) call `setBeatIndex(next)` then `setScriptingActive(false)` in their `finally` — both in the **same** synchronous flow, so React can commit `beatId = next beat` and `isScripting = false` **simultaneously**, one render **before** the beat-enter effect (`runBeatEnter` → `navigateBeatTab`) has run. `usePlaybackTransportGuard` samples that exact render and reports a false mismatch.
  2. **Missing chain-advance rescue:** `history-view-details`'s click genuinely navigates the prototype to Appointment Details, but `shouldAdvanceAfterChainedManualDirectorBeat` only auto-advanced `beatIndex` for the `reserve-appointment → camera` pair — `appointment-history → appointment-details` was missing, so the beat stayed parked one step behind a click that had already navigated.
- **Right fix:**
  1. `beatEnterPendingRef` (ref, not state) in `useJourneyPlayback` — the `setBeatIndex` param is wrapped so **every** internal advance latches it synchronously; cleared only when that beat's `runBeatEnter` (tab nav + book-step2 landing prep) finishes, or the retreat-sync branch settles. Threaded into `usePlaybackTransportGuard`'s snapshot as its **own** `beatEnterPending` field — deliberately **not** OR'd into `isScripting` (that also feeds `detectDirectorScriptOffAir`, which ties `isScripting` to on-air state; OR'ing in caused a *new* false `director-script-off-air` diagnostic during stepped Play).
  2. `shouldAdvanceAfterChainedManualDirectorBeat` also returns true when `completedBeat.tabScript === "history-view-details"` — same gesture that clicks View Details also moves the journey beat to the beat that click actually landed on.
- **Gate:** `playbackDirectorAnomalies.test.ts` chain-advance case; live `uxml play` (`__studioRunFullPlayProve`) + `uxml play step` (`__protoRunAgenticStepForwardSmoke`) both PASS 22/22 with zero diagnostics through avail-book→book-step2 and confirmation→appointment-history→appointment-details.
- **Forecast:** Any new director-script beat that ends with `setBeatIndex` (avail/book/tab/home/recordedClick/camera) is already covered by the wrapped setter — no per-call-site fix needed. Any new *chained* click-that-navigates beat must be added to `shouldAdvanceAfterChainedManualDirectorBeat` or it will reproduce class 2.

### Delayed commit after a UI pace ask — split optimistic flip from store write, wrap with `playbackMs()` (PO / Finn)

- **Symptom / class:** PO asked for a generic pause before PLP tile "Add to Bookmarks" actually commits, so the hover/pressed state is visible longer before it lands — without inventing a raw hardcoded wait that could hang a smoke.
- **Right pattern (engine SSoT, not a one-off):** Keep the **optimistic** visual flip (`onPointerDown` → local `useState`) instant and unconditional — that is what `readDemoInteractionState` / `waitForDemoInteractionStateChange` (`demoInteractionContract`) actually reads, so REC/Play's click-verified-a-transition contract is satisfied immediately regardless of the delay. Only delay the **real store write** (`toggleWishlist`), and wrap the constant with `playbackMs()` (`@/app/shell/playbackTiming`) — the one mechanism that compresses presentation-only waits under fast/test playback while leaving normal speed untouched (same pattern as `cameraBeatPlayback.ts`'s `DEFAULT_CAMERA_DWELL_MS`). Define the ms as a named exported constant next to its sibling timers (e.g. `PLP_WISHLIST_ADD_DELAY_MS` beside `PLP_LISTING_LOAD_MS` in `plpCatalog.ts`) — never inline a raw number at the call site. A second click on the *same* pending target before commit must cancel the timer (nothing was ever added) rather than schedule a duplicate add.
- **Why safe:** `data/journeys/*` and `useJourneyPlayback`/`journeyBeatDirector` have **zero** wishlist/bookmark coupling — no beat gates on `isInWishlist`. Traditional CJM's own scripted click on this exact control (`runPlpOpenPdp` → `addFirstPlpTileBookmark` in `playback/traditional.ts`) only asserts the DOM attribute flip via `simulateDemoPointerClick`, then dwells `AVATAR_DOT_SHOWCASE_MS` (5000ms) on `showcaseSarahAvatarDot` — comfortably longer than a ~2s commit delay, so the avatar dot still lands mid-showcase.
- **Gate:** `npm test` 901/901 unmoved; live `uxml play` + `uxml play step` both experiences PASS (agentic 22/22, traditional 10/10) with the delay in place; console clean, zero `beat-tab-mismatch`.

## 2026-07-21

### Agentic prove flake — early path-deviation + stale DIAGNOSTIC_ACK_STOP (PO)

- **Symptom / class:** `__studioRunAgenticFullPlayProve` FAIL at ~20/22 (`scroll-path-deviation` ~37px on `book-step3-camera`); immediate re-prove aborts 0/22 with `po-alarm:DIAGNOSTIC_ACK_STOP`. Agents buried FAIL in wrap-up sitrep.
- **Root cause:** (1) `SCROLL_PATH_DEVIATION_PX=36` knife-edge + early easeOut frames lag before compositor catches up. (2) Session Reset cleared `clearPoSignal`, but `forceClearAgentTestingOverlay` / ALWAYS CLEAR did **not** — Ack/leave latch survived into next prove.
- **Right fix:** Path grace `progress < 0.12` + threshold **48**; `forceClear` always `clearPoSignal()`. Report mid-prove FAIL immediately — do not invent green. History/Details Make (`data-name=Left`) still board #7 — out of this hotfix.
- **Gate:** Units wipe-hygiene + playbackScrollAnomalies; MCP agentic 22/22 then immediate second prove without manual Ack.

### QA chat spam — Camera wait ×N + ring twin restore (PO)

- **Symptom / class:** Chat flooded with `Camera: wait` every beat; after refresh `Journey reset` / `Play finished` appeared twice; Save Log ring had detail+label twins.
- **Root cause:** (1) Routine `chat-camera:wait` dwell mirrored to chat. (2) `mirrorPlaybackDiagToQa` appended ring **and** `logStep`→`pushLogEntry` appended ring again → hydrate restored doubles.
- **Right fix:** Suppress dwell wait from chat; mirror only via `logStep`; restore coalesces consecutive playback-diag twins; lean login drain rows.
- **Gate:** `playbackDiagQaBridge` unit — wait not mirrored; clear via logStep.

<a id="topic-overlay"></a>
### QA Reset must not auto-CAPTURE + HMR ×24 spam (PO)

- **Symptom / class:** Reset wiped log then immediately capturing again. Vite file save flooded QA with dozens of identical `vite-hmr · capture/play paused` rows.
- **Root cause:** Prior Play-gate hotfix left Reset with `capturePaused=false`. `installViteHmrListen` stacked a new `vite:beforeUpdate` handler on every overlay bind.
- **Right fix:** Reset → capture **off** (`Session reset · capture off`); clear pause latch; Play still auto-resumes Pause-only. One HMR listener + mutable deps; identical system rows already coalesce to `×N`.
- **Gate:** Unit `agentTestingViteHmr.test.ts` + format coalesce vite-hmr.

<a id="topic-hybrid"></a>
### Make `display:none` ≠ gone — ghosts win querySelector / Play (PO)

- **Symptom / class:** React-migrated page still clicks Make `div[data-name=…]` (not clickable / wrong node) while React `<button>` with same name exists. QA Save Log spam: `Save Log · export` + `Click: a` + download row; capture stayed ON.
- **Root cause:** Retiring Make with `display:none` + `data-studio-make-retired` left nodes in the document → first-match selectors hit ghosts. Download used a bare `<a>.click()` while capture was live.
- **Right fix:** `retireMakeUnderPage` **detaches** Make from the live tree (park + restore on unmount). Save Log **auto-pauses** (silent) then one timeline row; ephemeral download `<a>` stamped `data-studio-agent-testing-ignore`; bare-tag click labels dropped.
- **Gate:** Unit `retireMakeUnderPage.test.ts`; parity / page-final-pass accept `retireMakeUnderPage(`; MCP probes use `isMakeParkedForScreen`.

### QA dump false FAIL — `jump-to-start` matched as bubble JUMP (PO dump 03:30Z)

- **Symptom / class:** Play finished 23/23 + play-end ok, but QA painted `Scroll jumped the wrong way (Δ-96)` and `Cursor eased to rest` as **fail**. Also “Chat camera: wait” on traditional PDP/book; `RecModalPharmacyPick` on login Sign in.
- **Root cause:** `isBubbleChopOrJump` used `/JUMP/i` which matched reason tag `jump-to-start`. Intentional `scrollCameraToOrigin` (jump-to-start / resetPrototypeScroll) was labeled “wrong way”.
- **Right fix:** Word-boundary JUMP; suppress intentional origin resets + play-end park-rest from notice mirror; Camera: wait (not Chat); RecModalPick for login.
- **Gate:** Unit `playbackDiagQaBridge` — jump-to-start origin not mirrored; park-rest jump-to-start not fail.

### Long traditional REC Play FAIL at ~11/23 — login interstitial under Book Now (PO / Finn)

- **Symptom / class:** Continuous Play on `rec-trad-*` peaks ~11/23 with `po-diagnostic:PLAYBACK_DIAGNOSTIC_OPEN` / `tab/Book Now failed on Book Now`. QA: first `Click: Book now - £150` → `Modal open · login` → later second Book Now → click FAIL (target under modal / degraded).
- **Root cause:** Logged-out PDP `pdp-book-now` opens login (does not navigate). REC often captures a second Book Now after sign-in. Play drained choose-pharmacy on REC prove but **not** login on recorded-click Play → second click blocked → hard diagnostic.
- **Right fix:** `drainLoginModalIfOpen` in `playRecordedClick` (before retry + after click). Do **not** auto-drain choose-pharmacy here (own beat owns that pick). Prefer reading live QA rows before ALWAYS CLEAR when a dump/log already has the FAIL.
- **Gate:** UI Play `rec-trad-mru30gpt-zp5d` (logged out) → QA shows login drain → second Book Now → book-step-1… → peak 23/23 + `Play finished — back at journey start`. Unit: `recordedClickPlayback.test.ts`.

<a id="topic-rec"></a>
### REC robustness = NEW CJM only (PO standing order)

- **Symptom / class:** Agents claim REC robustness by playing built-in `agentic-cjm` / `traditional-cjm` or an old `rec-*`, or call `__studioStartRecording` without REC toggle + CREATE NEW + ● Start.
- **Right fix:** `__studioArmRecCapture` (CJM off → REC ON → CREATE NEW → Start) + `__studioAssertRecLive` (switch+session) + `__studioRunRecNewCjmProve` (always mint new `rec-*`, Play that id). Docs: AGENTS / RECORDING / QA recipe / CJM_RECORD_PLAY_EDIT.
- **Gate:** Live prove returns `{ pass, journeyId: rec-*, recLive: true }`.

### REC prove honesty — fake tiles click + Play logged as REC (PO fury)

- **Symptom / class:** (1) Robo-click on `module.plp.tiles` reported success (auto-refined to first Book now). (2) QA showed Start REC while agent only ran `__studioRunFullPlayProve` on an existing CJM.
- **Wrong fix:** Silent refine of coarse listing shells; generic helper log `start-recording` without verifying `isRecordingActive()`.
- **Right fix:** Explicit coarse shell → click FAIL (no invent child CTA). StartRecording logs `REC capture live · <id>` only after live arm; FullPlayProve logs `Play journey prove (NOT REC)`. Prove catalog reads imported store for `rec-*`.
- **Gate:** Live: `recAttr=live` + tiles click false + Book now `data-studio-action` + Add CJM + Play that id PASS.

### REC prove / labels / camera bind (PO retest `rec-trad-*` FAIL)

- **Symptom / class:** (1) STEPS/touchpoints empty or Make-ish (`data-name="module.plp.tiles"`, `component.plp…`). (2) Camera scroll-stop bound to hidden/filter checkbox. (3) Click degraded to tiles container. (4) `__studioRunFullPlayProve({ journeyId: "rec-trad-…" })` asserted traditional-plp / peak 13. (5) Scroll-reversal Δ~1k from page-land yank on `isPlaying` flip.
- **Root causes:** `resolveExperience` used `id.includes("trad")` → matched `rec-trad-*`; scroll anchor scored nearest `[data-name]` (filters); click `closest("[data-name]")` climbed to module; page-land `force` top ran whenever play/journey deps flipped, not only on screen change; labels stored raw attr soup.
- **Right fix:** Prove catalog lookup for `rec-*` (playlist length + start beat); `humanizeRecordingLabel` scrub at capture/compile; prefer title/content scroll anchors + drop weak filter chains; refine clicks to `data-studio-action` / tile CTA; page-land only when `current` screen changes.
- **Gate:** Unit `recordingLabels` + compile human labels + `fullPlayProve` rec-* peak; live REC PLP→PDP → Play → `__studioRunFullPlayProve({ journeyId })` asserts that journey.

<a id="topic-playback"></a>
### REC continuous Play stalls on last recordedClick / camera (PO / Quinn + Finn)

- **Symptom / class:** Continuous Play reaches last PDP `recordedClick` (or last `kind:camera`) then hangs → playback-stall ~22s / idle ~45s (often reported as script-timeout). Peak can show `N/N` but play never ends.
- **Root cause:** `scheduleDwellAdvance` no-ops on beats that still carry `recordedClick` / camera / `*Script`. Script runners advanced mid-journey but on **last beat** only `return true` — never `completeJourneyPlay()`.
- **Right fix:** After script success, if `next >= length` and continuous Play (`isPlaying && !manualStep`) → `completeJourneyPlay()`. Helper: `shouldCompleteJourneyPlayAfterScript`. Camera Make ghosts (`display:none` / 0×0 / make-retired) soft-continue dwell-only (`camera-beat:target-unusable`) instead of ghost-scroll.
- **Gate:** Unit `journeyPlayAdvance` + camera unusable; live `__studioRunFullPlayProve({ journeyId: rec-…, startBeatId, startScreenId })` → PASS peak N/N + play-end at start.

### REC scroll-stop never compiled to camera (PO / Quinn + Finn)

- **Symptom / class:** Meaningful scroll + ≥2s settle while REC live produced `scroll` events but **no** `scroll-stop` → compile missed `kind:camera` wait beats. QA also silent on camera-wait milestones.
- **Root causes:** (1) `flushRecordingScrollStop` called `noteScrollSample` then discarded its emit; `noteScrollIdle` saw `armed=false` → always null. (2) Listener install reset tracker with `lastTop=null`, so a single scroll jump only seeded baseline and never armed.
- **Right fix:** Keep `fromSample ?? noteScrollIdle` in flush; seed `lastTop = root.scrollTop` when installing scroll listeners. Mirror lean `rec-capture` scroll-stop (+ weak clicks) into QA as **Camera wait after scroll**.
- **Gate:** Unit `scrollStopDetect` flush-pattern + baseline-jump; live REC PLP scroll ≥2s → `scroll-stop@2xxx` + QA row. Recipe: [RECORDING.md](../shell/RECORDING.md) · [QA_LOGGING_AND_PLAYBACK_RECIPE.md](../shell/QA_LOGGING_AND_PLAYBACK_RECIPE.md).

### Per-char type-in → QA log flood — do NOT kill composer animation (PO / Arch + Finn)

- **Symptom / class:** Huge perf drop / QA overlay noise during continuous Play — one log line (or diag event) per typed character while Site Pilot / Chat composers animate. Dump fingerprint: `typeIn.samples=249` with `starts/ends=2`.
- **Wrong fix:** Disable / skip / instant-fill type-in animation on page composers.
- **Right fix:** Gate **logging only** — `playbackDiagTypeInProgress` = in-memory samples; no `type-in-progress` push; QA mirror ≤ start+end; cursor guard no per-N-char visibility spam. Animation loops in `sitePilotHome` / `sitePilotChat` stay letter-by-letter.
- **Recipe:** [QA_LOGGING_AND_PLAYBACK_RECIPE.md](../shell/QA_LOGGING_AND_PLAYBACK_RECIPE.md) · Play ≡ Step · prove on `:5173` with QA visible + console.

### FM `controls.stop()` hangs Play at confirmation (PO / Finn)

- **Symptom / class:** Full agentic Play `script-timeout` 45s on book-step-3 confirmation — mid-travel abort stranded director scripts.
- **Root cause:** framer-motion `controls.stop()` does **not** settle `await controls`.
- **Gate:** `demoCursor.ts` travel await settles on onComplete / abort poll / ceiling. Also skip `scroll-path-deviation` while chat pull-up `scrollLock`. Prove: continuous Play 21/21.
- **Recipe:** [QA_LOGGING_AND_PLAYBACK_RECIPE.md](../shell/QA_LOGGING_AND_PLAYBACK_RECIPE.md).

<a id="topic-chat"></a>
### Thinking bubble not camera’d — settle used last revealed only (PO / Finn)

- **Symptom / class:** Thinking dots stay under composer dock; settle scrolled to last `data-studio-chat-revealed="true"` while thinking paints `revealed=false`.
- **Gate:** `ChatScreen` settle uses `resolveChatCameraTarget` (thinking first). Rail: any new content including thinking must camera into view. → [CHAT_PAGE_RAILS.md](../projects/boots-pharmacy/features/CHAT_PAGE_RAILS.md).

## 2026-07-20

### Chat tall-bubble start-scroll fights bottom pin → scroll-reversal (PO / Finn + Quinn)

- **Symptom / class:** PLAYBACK DIAGNOSTIC `scroll-reversal` on agentic-chat SF into frame 4/9 (tall r1); trigger often shows stale `retreat-sync` / `sarah-query-submit`.
- **Root cause:** `settleScrollAfterForwardStep` scrolled tall bubbles to **start** while chat also bottom-pins (thinking / composer pad / ChatScreen) → down→up→down. Retreat into screen-frames also snapped mid-thread `button.chat__cta`.
- **Gate:** Chat `.chat__column` forward settle = bottom only; screen-frames retreat camera pins chat column bottom (no CTA snap). Prove: UI Step forward through chat 4/9 + Step back — no scroll-reversal Alarm.

### Book Step 2/3 page blink on same-tab Step Forward (PO / Finn + Quinn)

- **Symptom / class:** Book Step 2 (and Step 3 funnel) pages blink while in-page steps work; suspected transition leakage.
- **Root cause:** Journey **always** calls `goToTab` (hub-close safety) even when `protoTab` is unchanged (book-step2 date→time→reserve). `goToTab` ran `.studio-wire-mount--nav-cross` opacity crossfade (280ms → opacity 0) on every same-tab advance.
- **Gate:** `resolveNavTransitionInstant` / `buildJourneyGoToTabTransition` — same-tab + hub closed → `instant: true` (still `setHubOpen(false)`). PLAYBACK_DIAG: `nav-cross` RUN vs SKIP + `screen-enter` remount/opacity/motion. Prove: same-tab SF → `nav-cross SKIP sameTab=true`, wire opacity stays 1; real tab change may still RUN.
- **R11 trap:** `localhost` may hit IPv6 `[::1]` on a second Vite (abandoned clone) while `127.0.0.1:5173` is the real `E:\\UX\\ux-studio` server — prove on `http://127.0.0.1:5173/`.

### PO overlay / diagnostic dismiss must hard-stop Play sync (PO / Finn)

- **Symptom / class:** Alarm/Cursor/Scroll click left Play running until next smoke poll; PLAYBACK DIAGNOSTIC Cancel left modal / did not stop cassette.
- **Root cause:** Latch-only path; dismiss cleared React state without `haltPlaybackForPoSignal` + PO latch.
- **Gate:** Overlay CTAs + diagnostic Cancel → `haltPlaybackForPoSignal` (journey/scenario abort + cursor/scroll cancel) in the same click; Cancel latches `DIAGNOSTIC_ACK_STOP`. Smoke `__protoDismissPlaybackDiagnostic` clears without that latch. Prove: mid-Play Alarm/Cancel → `isPlaying===false` immediately; modal gone.

### Agentic chat reply before thinking bubble (PO / Finn + Quinn)

- **Symptom / class:** Chat progressed too fast — first agent reply painted without (or with) thinking bubble; PO Alarm sequence mismatch at `frame:2`.
- **Root cause:** Manual `stepForward` (and home→chat handoff) used `skipPrelude: true`, skipping `runSitePilotChatBeforeReveal` thinking pause. Make order is thinking → fade → reveal reply.
- **Gate:** CJM Step runs `beforeReveal` when hooks exist; React holds reply paint while `playback` thinking anchors that frame (`resolveChatFrameRevealed`). Diag: `thinking-start` / `thinking-end → reveal reply`. Prove: thinking visible + r0 `revealed=false` before reveal; then r0 after fade.

### CJM type-in hid robo-cursor on Site Pilot (PO / Finn + Quinn)

- **Symptom / class:** Agentic home typed-text beat — robo-cursor missing / opacity 0; PO Cursor flag while eyes saw no cursor.
- **Root cause:** Type-in path never parked/moved the demo cursor near the field; Play `isPlaying` left parkAfterInteraction false and prior wipe left DOM-null. No auto latch for “hidden mid type-in.”
- **Gate:** `parkDemoCursorForTypeIn` + `nudgeDemoCursorForTypeIn` at type-in start/progress; `CURSOR_HIDDEN_DURING_TYPEIN` latch; `[PLAYBACK_DIAG] cursor` logs visibility. Prove R11: type-in with `.proto-chat-demo-cursor` visible + opacity>0.

### PO Alarm/Cursor/Scroll must stop→(understand|ask)→fix→reprove (PO / Arch)

- **Symptom / class:** Agents soft-logged Cursor/Scroll and continued; or guessed a fix without knowing what PO flagged.
- **Gate:** `pollSmokePoSignal` aborts on alarm **and** cursor **and** scroll (structured fail + diagSnapshot). Session loop: STOP → understand from diagSnapshot (**ask PO if unclear — do not invent**) → FIX → RESTART + prove that issue gone. Stamp TEAM / COMMAND_DOCTRINE / PLAYBACK_DIAG / PAINPOINTS / AGENTS / R15 / agent-testing README.

### Smoke / Alarm abort still dumped PO to hub — `resetToHub: true` harness (PO / Finn + Quinn)

- **Symptom / class:** Tip claimed journey-start never hub (`53f1348` goToTab) but PO eyes still landed `screen=hub` after Alarm abort / agentic step-forward smoke end.
- **Root cause:** CJM smokes passed `withMcpTestSession(..., { resetToHub: true })` → overlay sitrep + `resetStudioAfterAgentTest({ resetToHub: true })` rewrote URL to hub. Product `goToTab` fix never touched harness teardown.
- **Gate:** Journey smokes use `resetToJourneyStart` → `site-pilot` / `plp` + `cjm=on`. `resetToHub` forbidden for smoke/product (Hub nav click only). Every hub open logs PLAYBACK_DIAG `hub-nav` with reason + stack. Prove R11: Alarm abort / step-forward finally → `screen≠hub`.

### CJM on leaves robo-cursor DOM-null after restart / re-apply (PO / Finn)

- **Symptom / class:** CJM switch ON (or `cjm=on` re-apply) — parked robo-cursor missing (`display` removed / not mounted) even at home park pose.
- **Root cause:** `handleStudioJourneyModeChange(true)` always calls `restartStudioJourney` → `removeDemoCursor({ immediate: true })`. When `studioJourneyMode` was **already** true, React effect is a no-op so park never remounts. First-on also raced wipe before `journeyModePinned`.
- **Gate:** Pin + `setDemoCursorJourneyMode(true)` before restart; restart remounts `parkDemoCursorAtRest` when CJM stays on; `setDemoCursorJourneyMode` idempotently remounts if DOM node missing. Prove R11: toggle/`setJourneyMode(true)` while already-on → `.proto-chat-demo-cursor--parked` visible; Play still travels.

### Agentic chat full-thread dump on enter — React paint ignored engine visibleCount (PO / Finn + Quinn)

- **Symptom / class:** CJM enter chat / Play shows **all bubbles at once** (not Make step-by-step progressive disclosure). Counter may say `2/9` while DOM paints 8 frames.
- **Root cause:** React Chat mounted the full `CHAT_THREAD_FRAMES` list; scenario hide used delayed `display:none` + CSS opacity that lost to paint. Engine `visibleCount` was not a React control point.
- **Gate:** `chatScenarioRevealBridge` + `usePublishChatScenarioReveal` — paint only `index < visibleCount` (`data-studio-chat-revealed` / `hidden`). Engine still collects all mounted frames. Never-shown frames: immediate `display:none` in `applyScenarioFrameVisibility`. Prove: first chat land → visible content frames === 1; step → sequential reveal.

### Journey reset / Jump-to-start still lands hub — matching-tab `goToTab` skip (PO / Finn + Ben)

- **Symptom / class:** CJM Jump to start / Play end / Stop-at-end still shows **hub** (PO again). Expected: key 1 of selected journey (`agentic-home`/`site-pilot` or `traditional-plp`/`plp`).
- **Root cause:** `navigateBeatTab` skipped `runtime.goToTab` when `currentTabIndex === target`. Hub overlay can sit on that same underlying tab — skip left `hubOpen=true`. Smoke `resetToHub` is harness-only and must not define product reset.
- **Gate:** `navigateToBeatTab` **always** calls `goToTab` (closes hub). Stop-at-end → `jumpToStart`. Diag: `[PLAYBACK_DIAG] journey-reset` with `startBeatId` + `startScreenId` ≠ hub. Prove R11: CJM on → jump-to-start / play-end → `screen≠hub`, beat `1/N`.

### Agentic SF `touchpoint-ahead-of-beat` — chat finale opens Availability before beat advances (PO / Finn + Quinn)

- **Symptom / class:** `__protoRunAgenticStepForwardSmoke` FAIL `diagnostic-on-step-8` / `touchpoint-ahead-of-beat` — counter jumps to “Choose date” while `beatId` still `agentic-chat`.
- **Root cause:** `onFinale` called `runSitePilotChatScenarioFinale` (opens `dateChat`) **before** `setJourneyBeatIndex`. Transport guard saw chat beat + `popup:availability:date` (playlist gap ≫ 1).
- **Gate:** Advance beat to `avail-continue` **before** opening Availability; allow chat→avail playlist skip + chat/avail popup substep. Prove agentic SF PASS on R11 `:5173` with `__studioPlaybackDiag`.

### PLAYBACK_DIAG cursor blindness + hub/`goToTab` + agentic CTA off-by-one (PO / Finn + Quinn + Ben)

- **Symptom / class:** Micro-fails (PLP heart not fuchsia, Step2 Continue scroll-only, retreat no scrollIntoView, Play returns hub, agentic chat skips progressive CTAs) with no console proof the cursor did its job; panel mint/green dropdowns stale.
- **Root cause:** Diag logged type-in/step labels only. `goToTab` set `current` without `setHubOpen(false)`. React PLP `resetPlpTileBookmarkForPlayback` wrote SVG `fill` that overrode `currentColor`/`.is-active`. Chat `CTA_BEFORE_USER_FRAME` keys were 1-based vs 0-based `frameIndex`. Retreat sync did not always scrollIntoView the active control.
- **Gate (R13 expand):** Every beat logs target/bbox, cursor park reason, scroll before/after + retreat intoView, click results, journey-reset destination. Product reset never hub. Prove: `__studioPlaybackDiag` dump after traditional + agentic step/retreat on R11 `:5173`.

### Play end stuck on last beat / hub — return to CJM start (PO / Finn)

- **Symptom / class:** After Play finishes, transport sits on last beat (or agent teardown dumps hub); PO wants **CJM journey start** of the active script.
- **Root cause:** `completeJourneyPlay` only stopped play — no `jumpToStart`. Smoke `resetToHub` is harness-only and must not define product end.
- **Gate:** `completeJourneyPlay` → jump to first playable beat + `playbackDiagPlayEnd`. Prove: `__protoRunTraditionalPlaySmoke` / `__protoRunAgenticPlaySmoke` + `__studioAssertPlayEndedAtStart`.

## 2026-07-19

### Traditional SF `stray-popup-on-beat` — settle skipped chained location pick (PO / Finn + Quinn)

- **Symptom / class:** `__protoRunTraditionalStepForwardSmoke` FAIL `stray-popup-on-beat` — Availability still open (`availStep=list`) on `book-step2`.
- **Root cause:** `login-sign-in` **chains** into `book-location-pick`. Smoke `waitForDirectorSettle` ignored `choose-location` / on-air, so the next Step aborted mid-picker and left the scrim. Secondary: Book Step 1 Continue/search first-match could hit Make-retired ghosts.
- **Gate:** Settle must wait until `!isOnAir && !isPlaying` (see `stepForwardSmokeSettle.ts`). Abort closes Availability. Prefer React `[data-studio-action="book-step-1-continue"]` / live `.book-step-1` — never Make-retired Continue. Prove full traditional SF smoke PASS on R11 `:5173` from **`E:\\UX\\ux-studio`** (not abandoned VaccineConcept clone).

### CJM type-in skipped + Chat fade removed — PLAYBACK_DIAG (PO / Finn + Quinn + Ben)

- **Symptom / class:** Agentic CJM Site Pilot type-in animation missing (instant jump to chat); Chat composer/under-bar fade wash gone after “remove gradient” ship; step/retreat hard to prove without console evidence.
- **Root cause:** `simulateSarahHomeTyping` skipped typing when `ta.value === AGENTIC_HOME_DEMO_QUERY` (React `HOME_QUERY_DEFAULT` prefill). Composer fade removed in `95a2eda` without keeping under-bar wash. No console type-in/step contract.
- **Gate (Auto-Rule `playback-diag` R13):** Always clear + type-in during CJM (never prefill-skip). Restore SitePilot bar `::after` top fade + composer-edge fade. Console: `__studioPlaybackDiag` / `__studioAssertTypeIn` (+ `__proto*` aliases). Prove: [PLAYBACK_DIAG.md](../shell/PLAYBACK_DIAG.md) + step-forward/retreat smokes on R11 `:5173`.

### Journey-lock `overflow:hidden` kills CJM eased scroll (PO / Finn)

- **Symptom / class:** Agentic step-forward dies late (`diagnostic-on-step-1N`) with `scroll-path-deviation` on appointment-history — expected ~120px, actual stuck ~0–6.
- **Root cause:** `.studio-scroll--journey-locked` shared popup-lock CSS `overflow: hidden !important`, so `scrollTop` writes during eased director scroll were ignored. Event blockers already prevent user wheel/touch.
- **Gate:** Journey-lock CSS = overscroll/touch-action only; popup `.studio-scroll--locked` keeps overflow hidden. `getPrototypeScrollRoot` must not prefer `.chat__column` when `?screen=` is non-chat.

### Appointment history ghost card first-match (PO / Finn)

- **Symptom / class:** `history-view-details` / late agentic step → scroll-path-deviation or miss; first `recent.order` card is 0×0 with `display:none` View Details.
- **Root cause:** `querySelector` first card is a Make ghost template; visible cards are siblings 2+.
- **Gate:** `findVisibleHistoryViewDetails` — first `isClickableTarget` card + button (never bare first-match).

### Scrollbar gutter always-on → empty white strip on short pages (PO / Finn)

- **Symptom / class:** Home Site Pilot shows a white bar / fake scrollbar track with nothing to scroll; tall pages / modal lock still X-jump when classic `scrollbar-gutter: stable` width ≠ thin 4px thumb.
- **Root cause:** `scrollbar-gutter: stable` reserves **classic** track width (~12–17px), not our `::-webkit-scrollbar { width: 4px }` — empty white strip on short panes; mismatch on tall panes.
- **Gate:** Never `scrollbar-gutter: stable` for Studio hosts. Short panes stay `overflow-y: auto` (no track). Tall prototype / `.chat__column`: `studio-scroll--overflow` → `overflow-y: scroll` (thin track) via `syncStudioScrollOverflowGutter`; lock → `padding-inline-end: var(--studio-scrollbar-size)`. Chat mirrors thin-track inset with `padding-left: calc(64px + var(--studio-scrollbar-size))` so the centered 864 column X does not jump. Prove: Home no empty white bar; Chat center X stable with/without thumb.

### Chat sticky / scroll / Site Pilot bar — don't regress (PO / Finn + Uma + Bea)

- **Symptom / class:** React Chat retired Make Frame337 → Site Pilot white microheader gone; bubble links invent always-underline / browser-blue; scrollbar track shifts centered column left (jagged UI).
- **Root cause:** `hideMakeChrome` retired Frame337 without a React port; `.chat__link` rest-underline fought UXDS `.uxds-link`; always-on `overflow-y: scroll` / uncompensated thin track stole right inset from the flex-centered column.
- **Gate:** Keep `ChatSitePilotBar` (`data-studio-chat-site-pilot-bar`) above `.chat__column`. Bubble/disclaimer links = `.uxds-link` (+ optional `.chat__link` hook). Scroll = auto → overflow sync thin-track + left pad compensate — never classic `scrollbar-gutter: stable` on Studio hosts.

### Robo-cursor hand↔arrow tip jump — CSS-align hotspots (PO / Finn + Uma)

- **Symptom / class:** After press/release, default arrow appeared to teleport vs hand; hand↔default felt like a flicker/jump even when `left`/`top` stayed locked.
- **Root cause:** Arrow tip (~3px) and hand fingertip (~10px) differ inside the 37×37 box; toggling `--pointer` swapped graphics without shared tip.
- **Gate:** CSS-shift `.proto-chat-demo-cursor__graphic--hand { left: -7px }` so tips share one hotspot; keep `left`/`top` locked through settle; R10 prove `onTargetStable` + `maxPostSettleDriftPx=0`. Do **not** re-write post-click pose from a different hotspot math.

### Fixed localhost + reuse tab — no port bump / no new Chrome windows (PO / Arch + Finn + Ben)

- **Symptom / class:** Agents start extra `npm run dev` → Vite silently moves to `5182`/`5185`/`5186`…; Chrome DevTools MCP opens `new_page` / new windows; PO loses the Studio tab context.
- **Gate (GLOBAL HARD FAIL — Auto-Rule `fixed-localhost-reuse-tab`):**
  1. Canonical URL **only:** `http://localhost:5173/` (`127.0.0.1:5173` = same server).
  2. `vite.config.ts`: `server.port: 5173` + `server.strictPort: true` — fail if busy; never silent bump. `check:felonies` asserts this.
  3. **One** `npm run dev` for the workspace; if 5173 busy → reuse or stop stray Vite (docs only — do not kill PO browser).
  4. Chrome MCP: `list_pages` → `select_page` / `navigate_page`; **`new_page` only if zero pages**.
- **Refs:** [STUDIO_AUTO_RULES.md](./STUDIO_AUTO_RULES.md) R11 · [../shell/URL.md](../shell/URL.md) · [AGENTS.md](../../AGENTS.md)

### Platform motion — Accordion height via Motion; CSS reduced-motion hid expand (PO / Arch + Uma + Finn)

- **Symptom / class:** PO could not see Accordion collapse/expand; CSS `grid-template-rows 0fr↔1fr` “fixed” but still looked instant.
- **Root cause:** OS/browser `prefers-reduced-motion: reduce` → kit CSS `transition: none !important` on `.uxds-accordion-content`. Computed `transitionDuration: 0s`. (Secondary: `grid-row: span 2` yielded two-track `0px 0px` computed rows.)
- **Gate:** Accordion expand = Motion `height: 0↔auto` via `@/uxds/motion` (functional reveal; always-mounted; cancel on unmount). Chevron mute/rotate stays CSS (honors reduced-motion). Import `@/uxds/motion` only — never raw `framer-motion`. Shell presence pilots OK; **user-visible PDP Accordion Motion demotes Final Pass `mcpFinalPass` → NEEDS-REPROVE**. See [MOTION.md](./MOTION.md).

### Platform motion — Motion (`framer-motion`) via `@/uxds/motion` (superseded Accordion CSS row — PO / Arch)

- **Symptom / class:** Motion library listed but unused; dual `motion` + `framer-motion` deps; callsigns unsure CSS vs Motion.
- **Gate (updated):** [MOTION.md](./MOTION.md) — import `@/uxds/motion` only; one package (`framer-motion`); CSS for trivial hover + Accordion chevron; Motion for Accordion height + enter/exit panels/menus. No React Spring. Shell-only presence pilots do **not** demote PDP; Accordion Motion on PDP **does**.

### Robo-cursor travel — ease-in-out only, no bounce (PO / Finn)

- **Symptom / class:** Robo cursor “bouncy” arrival (back-ease overshoot + path/end jitter felt like spring).
- **Gate:** Travel driven by Motion `animate(0,1,{ ease:"easeInOut" })` via `@/uxds/motion`; straight-line lerp; **no** spring / back / overshoot / arc variance. `cancelDemoCursorTravel()` → `controls.stop()` on forceClear (keep hang guards from v0.0.31). See [MOTION.md](./MOTION.md).

### Playback panel stranded by AnimatePresence `mode="wait"` (PO / Finn)

- **Symptom / class:** Cassette transport (CJM + STEPS + play deck) missing from nav; only REC switch remains; `.studio-nav-scenario__panel-swap` has `children=0`.
- **Root cause (two classes):**
  1. Playback ↔ Rec XOR used `AnimatePresence mode="wait"` — exit can complete without enter → empty swap while ScenarioControls is mounted.
  2. Invalid URL mode (`mode=traditional` / bare aliases) applied via `setModeId` → 0 journey beats → `showOrchestraControls` false → **REC-only** `StudioNavRecordingModeSlot` (empty playback by design).
- **Gate:** Sync-mount playback when Rec is off (`data-studio-playback-panel`); `normalizeOrchestraModeId` on URL parse + `setModeId` (`traditional`→`traditional-cjm`). Never let an unknown mode zero the cassette deck.

<a id="topic-url"></a>
### URL `mode=agentic-cjm` conflates CJM switch with journey path (PO / Arch)

- **Symptom / class:** Deep links used `mode=agentic-cjm` as if “mode” meant both CJM-on and agentic path — logically wrong; CJM is on/off; agentic vs traditional is the experience path.
- **Gate:** Canonical URL = `cjm=on|off` + `experience=agentic|traditional` ([URL.md](../shell/URL.md)). Legacy `mode=*-cjm` / bare aliases parse → `experience` only (do **not** imply CJM on — protects REC replay). Serialize never writes `mode=`.

### Robo-cursor on-target re-aim / tap bounce (PO / Finn)

- **Symptom / class:** After travel, cursor jitters / re-aims / “bounces” on the CTA while pressing.
- **Root cause:** Mid-travel hover + `trackTarget` chased layout shifts; CSS `scale()` on `--tap` read as bounce; path diagnostics required CJM pin so prove could not show the drift.
- **Gate:** Hover only after settle; freeze tracking ≥90% progress; lock left/top through press/release; no tap scale; `__studioCursorDiagnostics()` path samples + prove `onTargetStable`. Keep hang guards.

<a id="topic-final-pass"></a>
### PAGE FINAL PASS — no next migrated page until previous hard-green (PO / Arch)

- **Symptom / class:** Team starts PDP (or next erase-Make page) while PLP (previous) still has open Final Pass gaps — PROVEN/tests green used as a false “open next page” signal.
- **Gate (GLOBAL sequencing):** **No new migrated page** until previous is **PAGE FINAL PASS hard-green** — [PAGE_FINAL_PASS.md](./PAGE_FINAL_PASS.md). Finn/Uma own checklist + `check:page-final-pass` (single contract; do not duplicate). Arch vetoes next-page brief/mount otherwise. Team check reports `PAGE FINAL PASS — <screenId> — HARD-GREEN | NOT-GREEN`.
- **Process:** Parallel callsigns still required; **`Knowledge used:`** still mandatory on team check. Board: [NEXT_STEPS.md](./NEXT_STEPS.md) NOW 2e blocks PDP.

<a id="topic-page-create"></a>
### Page create inheritance — UXDS + existing UXML first (PO / Arch)

- **Symptom / class:** Agents invent page-local controls or grow project theme with layout/hover when asked to create/migrate a page.
- **Gate (GLOBAL):** [PAGE_CREATE_INHERITANCE.md](./PAGE_CREATE_INHERITANCE.md) P1–P6 before JSX — inventory → similar UXDS frame → existing kits/pages → interactive kits → theme = brand/copy delta only. Bea stamps inheritance table; Arch rejects mount without it.
- **Process:** UXML/UXDS BASE stays mutual across projects; coarse concepts supply brand/copy cues only.

### MCP page probe — scroll-into-view + overlay visible every probe (PO / Quinn)

- **Symptom / class:** MCP / robo page probe interacted with off-screen or partially scrolled targets; or ran steps while the agent testing overlay was missing/hidden — prove looked “green” without visible PASS/FAIL chrome the PO can trust.
- **Root cause:** Probe assumed targets were in viewport and that overlay start was optional/ambient; scroll + overlay visibility were not hard FAIL gates on every step.
- **Gate (GLOBAL HARD FAIL — Quinn + Finn + Ben):**
  1. Before every probe interact (hover/click/type): **`scrollIntoView`** (or equivalent) so the target is in the prototype viewport — note `scroll-into-view` in cursor/probe diagnostics when used.
  2. **Agent testing overlay must be visible** for the **entire** probe run (start → each step PASS/FAIL → sitrep/stop). If overlay is absent/hidden at any probe step → that step and the probe **FAIL** (do not continue as PASS).
  3. Prefer `__studioRunMcpPageProbe` so robo-cursor + overlay sitrep are mandatory; Quinn cites overlay-visible + scroll in the MCP evidence log.
  4. **Code gate shipped:** `revealDemoTargetForAgent` + probe `overlay-arm` / `plp-below-fold-scroll`; mid-sitrep re-arm must not fire deferred reload; `RunMcpPageProbe` excluded from helper nest-arm. See [RECORDING.md](../shell/RECORDING.md).
- **Process:** Index in [TEAM_KNOWLEDGE.md](./TEAM_KNOWLEDGE.md); Quinn re-reads this before every MCP prove. Arch rejects PROVEN without overlay-visible evidence.

<a id="topic-scroll"></a>
### Nested scroll host after single-scrollbar Chat (Finn / Quinn)

- **Symptom / class:** Chat beat/CTA `scrollIntoView` / `revealDemoTargetForAgent` no-ops after React Chat moves overflow to `.chat__column` (outer `.studio-scroll--prototype` `protoMax≈0`).
- **Root cause:** Engine `getPrototypeScrollRoot` still resolved the outer prototype pane; scenario/REC helpers hardcoded the same host.
- **Gate:** Prefer active `.chat__column` when it owns overflow (`getPrototypeScrollRoot`); scenario `resolveScrollEl` + REC `captureScroll` must use that helper. Quinn proves with probe `chat-below-fold-reveal` (r1 CTA) — not finale CTAs that cannot clear agent-testing bottom pad at max scroll.

### Sticky Chat composer scroll pad (Finn / Uma)

- **Symptom / class:** Flex-sibling composer (outside `.chat__column`) regresses Make under-composer scroll — below-fold bubbles clip at the dock; Motion wrap height changes leave last CTAs under the overlay.
- **Contract:** Overlay dock (`position: absolute` bottom) + dynamic `--studio-chat-composer-h` (ResizeObserver) → `.chat__column` `padding-bottom` / `scroll-padding-bottom` ≥ dock height; reveal/scrollIntoView reads `scroll-padding-bottom`. Single scroll host only (viewport locked). Transparent scrollbar track.
- **Gate:** Probe `chat-composer-scroll-pad` — pad var ≥120, last CTA above dock at max scroll, prototype `protoMax≈0`.

### Team knowledge must be used, not only written (PO)

- **Symptom:** LESSONS / notes grow but agents re-ship the same fail class — knowledge was append-only.
- **Gate:** [TEAM_KNOWLEDGE.md](./TEAM_KNOWLEDGE.md) living index; before serious work re-read hat section + LESSONS; team check **`Knowledge used:`** one-liner per role; **Knowledge improved** sitrep after ships; Arch rejects write-only “done.”

<a id="topic-ds"></a>
### Typical DS checks mandatory before screen PROVEN (PO)

- **Symptom / class:** Screens stamped **PROVEN** while UXDS controls (SearchField, Button, checkbox, link) were flat at rest — missing kit/Make **hover / focus / active / disabled**. Concrete miss: PLP filter SearchField had **focus-only** kit (no `:hover`); Make / Availability / Book Step 1 use inset navy ring on hover+focus.
- **PO callout:** **Missing DS hover = fidelity FAIL class** — not a polish nicety. “Why no typical DS checks as rule of thumb?”
- **Gate (GLOBAL rule of thumb):**
  1. Before any screen **PROVEN**, Uma walks the **full state matrix** (default/hover/focus/active/filled/disabled/error + icon positions) per [UMA_FIDELITY_NOTES.md](./UMA_FIDELITY_NOTES.md) §0a — vs **UXDS kit + Make**.
  2. SearchField: `.uxds-search-field__control:hover` + `:focus-within` inset `2px` `--uxds-border-border-focus` (Boots → navy); magnifier stays borderless.
  3. Ratchet **search-field-states** fails CI if kit omits control `:hover` / `:focus-within`.
  4. **Uma (UI/UX)** signs `typical DS checks (state matrix) — PASS|FAIL` in audit + **team check**.
  5. **Quinn (QA)** MCP-hovers **≥1 SearchField** (and the rest of the interaction matrix).
  6. Arch **rejects** **PROVEN** if typical DS checks FAIL or MCP hover evidence is missing.
- **Process:** Parallel callsigns still required for serious streams — DS checks do not collapse the team into one mega-agent ([TEAM.md](./TEAM.md), doctrine §0.2).

### Filter search parity — icon side, double X, View all, counters (PO rage)

- **Symptom:** PLP filter search had **two X** clears; magnifier on the **LEFT** (PO: original RIGHT); no **10-cap / View all**; no option **counters**; invented filter `border-bottom` separator; bespoke input instead of UXDS.
- **Root cause:** Prior “PROVEN” trusted Make static DOM order + `type="search"` (native cancel) without wire scripts (`PLP_FILTER_LIST_MAX`, `handlePlpFilterViewAllClick`, `setFilterRowCount`) or Availability/Book icon-end pattern.
- **Gate (GLOBAL):**
  1. UXDS `SearchField` — `iconPosition` start\|end, single `data-studio-search-clear`, `type="text"`, stamps `data-studio-search-icon-pos`.
  2. PLP: icon **end**, View all + 10-cap, facet counters, **no** `.plp__filter-section` border separator.
  3. Ratchets 1b–1f + MCP `plp-search-icons` / `plp-filter-view-all` / `plp-filter-option-counters`.
  4. Distrust prior PROVEN on filter/search until re-proved.
- **Process:** Every new PO miss → ratchet same ship ([PARITY_RATCHETS.md](./PARITY_RATCHETS.md)).

### Search icon boxed by Make border-overlay hover (PO)

- **Symptom:** PLP “Search countries” / “Search diseases” magnifier showed a weird navy/grey **box border** around the icon.
- **Root cause:** LEGACY chrome targeted `Text Field > [aria-hidden]` for Make’s absolute inset border overlay. UXDS `SearchField` stamps `aria-hidden` on the magnifier (direct child of `Text Field`), so hover/focus painted the overlay ring on the icon.
- **Gate (GLOBAL):**
  1. Make overlay hover selectors must be `> [aria-hidden].absolute` only — never bare `[aria-hidden]`.
  2. UXDS `.uxds-search-field__icon` forces `border/box-shadow: none` (defense in depth).
  3. Uma §7b: magnifier = bare glyph; boxed icon = FAIL.
- **Process:** When porting Make `aria-hidden` overlays into React kits, do not reuse overlay selectors on decorative icons.

### Missing search icon = classic Make→React parity fail

- **Symptom:** React PLP filter fields (“Search countries” / “Search diseases”) shipped with no magnifying glass.
- **Root cause:** `FilterSearch` rebuilt as bare input without `icon=search` sibling; no CI contract for icon affordances.
- **Gate (GLOBAL):**
  1. Stamp `data-studio-search-icon="true"` on every React search magnifier (prefer UXDS `SearchField`).
  2. `npm run check:parity-ratchets` fails if search inputs/placeholders lack the marker ([PARITY_RATCHETS.md](./PARITY_RATCHETS.md) #1).
  3. Quinn MCP page probe step `plp-search-icons` asserts ≥2 visible icons + sibling on disease/country fields.
- **Process:** Every new typical fail class → add a ratchet (Arch/Ben). Ratchets regain trust; green Vitest alone does not.

### Agent DONE sitrep must countdown; clear dismisses robo-cursor

- **Symptom:** Sitrep sat silent/stale; robo-cursor lingered after overlay cleared.
- **Gate:** Hint = `PASS|FAIL — Auto-closes in Xs` (live tick); big green/red badge; `finishSettle` / `forceClear` call `removeDemoCursor({ immediate: true })` + **hard-remove** overlay DOM; idle → sitrep still honest.

<a id="topic-overlay-baseline"></a>
### Agent testing overlay: pre-arm before steps; no stale popup after test

- **Symptom:** Probe clicks started before PO could see the BR panel; after stop, sitrep/overlay sometimes stuck or left a stale panel.
- **Gate (GLOBAL):**
  1. MCP probe/sanity/`withMcpTestSession`: `start()` → **pre-arm** (~2.5s `preparing…`) → then steps.
  2. `stop({ result: "pass"|"fail" })` → green/red sitrep (~9s) + FINAL `PASS|FAIL n/m` summary line.
  3. After settle (or interrupt): `forceClear` path — cancel timers, dismiss cursor, clear persist, strip ephemeral URL, **hard-remove** DOM. Probe `finally` schedules ensure-clear at settle+1s.

### MCP page probe must not reload-loop / URL-fight (Chrome crash class)

- **Symptom / class:** Browser tab crashed or endlessly reloaded during agent MCP testing on localhost (overlay + probe + modal URL bridge).
- **Root cause hypotheses (proven gates):**
  1. Page probe defaulted `reload: true` → sitrep → reload → probe re-arm → reload loop under agent automation.
  2. Mid-settle `start`/`touch` abandoned sitrep without cancelling a deferred `location.reload()` timer.
  3. QV/`&modal=` close raced URL→open re-apply (wire cleared live before URL stripped) → modal thrash + re-renders.
  4. Uncapped `scrollIntoView` / reveal storms + overlay DOM thrash under rapid probe steps.
- **Gate (GLOBAL HARD FAIL — Finn + Quinn + Ben):**
  1. `__studioRunMcpPageProbe` defaults **`reload: false`**. At most one reload at end, and only when explicitly `{ reload: true }`.
  2. `forceClear` / mid-settle re-arm **cancels** pending reload timers (`cancelPendingReload`); never nest start/stop loops.
  3. Modal URL bridge suppresses URL→open while intentional close waits for `&modal=` clear (`studioModalUrlBridgePlan`).
  4. Cap probe reveal/scroll calls per run; overlay `forceClear` hard-removes DOM + all timers.
  5. Reload storm cooldown (~4s) — refuse stacked `scheduleReload` (agent loops).
- **PO recovery:** refresh once → `window.__studioAgentTestingOverlay?.forceClear()` → do not re-run probe with `reload: true` in a loop.

### Chrome hang — robo-cursor hover bridge + uncanceled travel rAF (P0)

- **Symptom / class:** Chrome tab hung (not just reload-loop) during agent/robo testing on PDP / avail — same P0 family as prior crash storms.
- **Root cause (v0.0.29–0.0.30 area):**
  1. `demoCursorPseudoBridge` mirrored **all** `:hover`/`:active` rules from readable sheets → mega stylesheet + class toggles → style-recalc storm.
  2. Cursor travel `requestAnimationFrame` kept ticking after `forceClear` / `removeDemoCursor` (no cancel token).
  3. Re-applying hover on an already-hovered root re-dispatched enter/move events.
  4. Accordion permanent `will-change` + rapid open/close amplified layout thrash.
- **Gate (GLOBAL HARD FAIL — Finn + Ben + Quinn):**
  1. Cap bridged CSS rules (`DEMO_PSEUDO_BRIDGE_MAX_RULES`); skip vendor sheets.
  2. `cancelDemoCursorTravel()` on remove/forceClear; Motion travel `.stop()` + generation bump (no orphan tween).
  3. Rate-limit synthetic move; no re-flood when hover class already active.
  4. Accordion: no permanent `will-change`; `contain: layout style`; toggle min-interval.
- **PO recovery:** refresh once → `__studioAgentTestingOverlay?.forceClear()` → `__studioWaitAgentTeardownClean()`.

### Robo-cursor hover missing on secondary/DS CTAs (bridge CSSOM stall — P0)

- **Symptom / class:** Robo hover class applied (`proto-chat-cta--hover` / `data-studio-robo-hover`) but **no visual hover** on PDP **Check availability**, outline/secondary buttons, etc. Chat CTAs looked fine (hand-mirrored rules in chrome CSS).
- **Root cause:** `bridgeDemoPseudoSelector` split selector lists on **every** comma — including commas inside `:is(button, [role="option"], …)`. That emitted broken selectors like `[role="option"]).proto-chat-cta--pressed:focus`. Dumping them into one `style.textContent` **stalled CSSOM parse**, so later bridged page rules (`.pdp__secondary:hover` → `.pdp__secondary.proto-chat-cta--hover`) never became live rules.
- **Gate (GLOBAL HARD FAIL — Finn + Ben + Quinn):**
  1. Split selectors on **top-level commas only** (`splitSelectorsTopLevel`).
  2. `insertRule` per bridged rule; skip invalid; never one mega text blob that can abort the sheet.
  3. Skip pseudo-element `:hover`/`:active` (`::-webkit-scrollbar-thumb:hover`).
  4. Prefer page/UXDS sheets under the 256 cap; fingerprint-refresh when sheets change.
  5. Press = pointerdown → ~40–80ms dwell → pointerup → click; clear hover/press + default arrow after.
  6. Auto-Rule R10: **robo = native hover+press everywhere** (not chat-only). Vitest covers `:is()` + `.pdp__secondary`; MCP prove Check availability bg/border.
- **PO recovery:** refresh → re-run `__studioProveRoboCursorFeedback?.('[data-studio-action="pdp-check-availability"]')`.

### Overlay eyes — MCP/robo must not click through open dialogs (PO rage)

- **Symptom:** MCP page probe / robo-cursor still clicked PLP tiles **under** open Quick View (and other lightboxes).
- **Root cause:** Modal guard existed for REC replay but was **not** wired into `simulateDemoPointerClick` / probe; Quick View (+ other PLP dialogs) not fully registered with `data-studio-modal`.
- **Gate (GLOBAL HARD FAIL):**
  1. Every blocking overlay in `STUDIO_MODAL` / `REGISTERED_OVERLAY_MODAL_IDS` + DOM `data-studio-modal="…"`.
  2. `simulateDemoPointerClick` + `__studioRunMcpPageProbe` refuse under-overlay targets (`refuse-click` prove step).
  3. `check:felonies` fails npm test if guard missing or known overlays unregistered.
- **Quinn prove:** open Quick View → probe cannot click PLP tile underneath → overlay sitrep PASS.

<a id="topic-modal"></a>
### Modal URL — every popup must change the address bar (PO rage)

- **Symptom:** Quick View (and other Boots dialogs) opened with **no** URL change; only Choose Pharmacy synced `&modal=`.
- **Root cause:** `useStudioUrlSync` derived `modalId` from `availabilityOpen` only; openers called raw `set*Open(true)` without a central registry.
- **Gate (GLOBAL HARD FAIL):**
  1. `STUDIO_MODAL_REGISTRY` lists every dialog (`choose-pharmacy`, `quick-view`, `login`, `vaccine-picker`, `recipient-picker`) with `urlSync: true` + open/close helpers ([URL.md](../shell/URL.md)).
  2. App derives `modalId` via `resolveStudioModalIdFromFlags`; open/close → `writeStudioUrl`; deep-link / `popstate` → `applyStudioModalFromUrl`.
  3. `check:felonies` + ratchet **modal-url-sync** fail npm test if registry entry missing, lacks URL helper, or source opens via orphan `set*Open(true)`.
- **Quinn prove:** open Quick View on PLP → bar shows `modal=quick-view`; close / Back clears `modal`.

<a id="topic-overlay-underlay"></a>
### Non-destructive overlay — popup must not hide page beneath (PO 2026-07-22)

- **Symptom / class:** Agentic CJM Play opens Availability **Choose Date** (`modal=choose-pharmacy`) → React chat underlay vanishes (`content-visibility: hidden` / looks like `display: none`).
- **Root cause:** Boots `chat.css` FPS hack froze chat when choose-pharmacy was open. **Not** engine modal law — engine overlays are meant to sit on top without trashing underlay.
- **Gate (HARD):** Opening any registered popup is **non-destructive** — underlay stays mounted and painted. Allowed: solid scrim, `pointer-events` on scrim only, z-index. **Forbidden:** `display:none` / `content-visibility:hidden` / unmount host solely because a modal opened.
- **Fix:** Removed chat freeze rule; keep solid `.studio-avail-scrim` (no backdrop-filter). Recipe: [QA_LOGGING_AND_PLAYBACK_RECIPE.md](../shell/QA_LOGGING_AND_PLAYBACK_RECIPE.md) § Avail after chat.
- **Quinn prove:** `screen=chat&modal=choose-pharmacy` → chat host computed `content-visibility` not `hidden`; underlay present under scrim.

### Stale jab count during Reset / filter refresh = ship fail (PO rage #5)

- **Symptom:** During PLP “Updating results…” loader (Reset filters / filter change), top-left still showed stale totals like **“3 jabs available”** — made-up leftover from prior `displayItems`.
- **Root cause:** Count kept prior results “for stability” while tiles hid; PO rejects any numeric jab count that isn’t the post-load truth.
- **Gate:**
  1. While `listingPhase === "loading"`: count children = `null`, `data-studio-plp-results=""`, `data-studio-plp-results-loading="true"`, CSS hide (`.plp__results-count--loading`).
  2. After load: real `${n} jabs available` only.
  3. `check:parity-ratchets` **count-hide-load** + MCP probe `plp-reset-filters` (mid-load empty) → `plp-reset-count-ready`.
- **Quinn prove:** Reset → no count text while loader up → real count after.

### Invented hover / loading chrome not in Make = ship fail (PO rage #3)

- **Symptom:** React PLP showed **duplicate** “Updating results…” (count line + spinner label) + listing **jump**; empty bookmark heart went **fuchsia on hover** (Make tertiary empty hover is navy link; fuchsia only when filled/active).
- **Root cause:** Agents “improved” Make — invented fuchsia-on-empty hover and doubled loader copy / pulsed count — then stamped **PROVEN** without MCP real-user matrix.
- **Forbidden:** Invent hover colors, loader copy placement, or attention chrome not present in Make CSS/behavior. Prefer under-matching over inventing.
- **Gate:**
  1. Uma side-by-side Make vs React for **empty vs filled** icon states and **exactly one** loader treatment (spinner ± one label; never duplicate count-line copy).
  2. Quinn + Ben: **MCP localhost real-user matrix mandatory for every screen ship** — overlay start → log each step → stop/clean slate. Arch **rejects** audit **PROVEN** without that evidence log.
  3. Prior “PROVEN” is **BAD until re-proven** when PO disputes pixels.

### Wrong preloader / loading scenario = fidelity fail (PO called out twice)

- **Symptom:** React PLP filter-change showed a blank listing band with only “Updating results…” (results-count text) — PO rage again; not the Make scenario.
- **Make truth (PLP child 9):** ~450ms load → **hide tiles** → **centered spinner overlay** (44px arc + **one** “Updating results…” under spinner) on height-locked host → stagger reveal. **Not** opacity-0 tiles, **not** text-only, **not** duplicate count-line “Updating results…”.
- **Root cause:** Loading/empty/updating treated as copy polish, not a first-class Make scenario; register marked “preloader Fixed” without mechanism prove; Uma did not sign off loading states.
- **Gate:**
  1. Uma + Bea capture Make loading mechanism **before** Finn codes ([UMA_FIDELITY_NOTES.md](./UMA_FIDELITY_NOTES.md) §0).
  2. Bea register P0 rows for loading/empty/updating with layout notes + screenshot notes.
  3. Quinn proves filter-change: spinner/overlay **in-band**, then results return — blank+text alone = FAIL; duplicate “Updating results…” = FAIL.
  4. **team check:** Uma must explicitly report `loading states — PASS|FAIL` and `checkbox/radio hover — PASS|FAIL`.

### Checkbox / radio hover miss on migrated PLP

- **Symptom:** React filter checkboxes had no Make mint hover (`#c6e5e1`); Make `globals-chrome` targets `[data-name="box"]` which React rows do not use.
- **Gate:** Page CSS must port unchecked hover wash; Uma + Quinn prove hover visible on every migrated checkbox/radio.

### Make → React fidelity (PO rage — not first time)

- **Symptom:** PLP shipped “PROVEN” while Advantage Card promo bar was entirely missing, tile had invent border, Book now hover was mint secondary (LEGACY catch-all), heart had weak/laggy feedback, Reset Filters was text-only — register Wrongly marked OK / residual.
- **Root cause:** Make→React ships without a pixel+interaction register prove; Uma skipped Nazi-hover on every CTA/icon; Bea register incomplete (bands not inventoried before Finn coded); Quinn passed with unchecked P0s / “prior ship” wishlist.
- **PO context:** Human PO has complained before about near-dups / fidelity slips — **zero tolerance**. Missing whole components = ship fail.
- **Gate:**
  1. Bea register lists **every** Make band/component before Finn codes ([UMA_FIDELITY_NOTES.md](./UMA_FIDELITY_NOTES.md)).
  2. Uma Nazi-hovers every CTA/icon; runs full fidelity checklist; audit PROVEN only when checklist PASS.
  3. Quinn cannot PASS if register has unchecked P0s; must click-hover every interactive control (interaction matrix).
  4. **team check** must include Uma checklist + Bea register completeness + Quinn interaction matrix — ship not done if Uma or Quinn FAIL.
- **Example miss:** PLP Advantage Card bar — “Collect 3 points for every £1 you spend with Boots Advantage Card‡”.

<a id="topic-version"></a>
### Versioning / felonies

- **Version chip wins overflow** — sticky right block with solid PANEL fill + z-index; never let scrolling tabs cover `vX.Y.Z` / channel.
- **Version chip must track package.json live** — Vite `define` alone freezes semver at `npm run dev` start; after bumps the tab chip lied (0.0.1 while package was 0.0.3). Source of truth = JSON import of `package.json` in `studioRelease.ts` + server restart on package.json change; unit test + `check:felonies` must fail on hardcoded UI semver / missing import. Quinn proves chip after every bump ([VERSIONING.md](./VERSIONING.md) DoD).
- **Felony = `npm test` fail** — wire `check:felonies` + `check:version`; do not rely on docs alone. JSDoc must not contain `*/` mid-word (e.g. write "proto star filenames", not `proto*/…`).
- **Channel ≠ semver** — PO accepts alpha/beta/rc/stable; BE bumps digits via `release.mjs` / notes habit.

<a id="topic-recording-baseline"></a>
### Recording

- **REC session truth must survive module churn** — module-local singleton state can split under Vite HMR: the UI shows REC live while a newly loaded helper sees no session. Keep the runtime on one browser-global store; sessionStorage remains page-refresh recovery, not the live coordination bus. Arm must stop both stale active **and paused** drafts before Start. Gate: recording recovery/arm tests + NEW-CJM localhost prove.
- **Shared dropdown iteration can detach sibling nodes** — Project/Persona/Orchestra use the same menu shell; opening the wrong menu can remount later siblings and invalidate a captured node list. Resolve the intended control by semantic action/ARIA identity first (`orchestra-mode-select`), then its controlled listbox. Gate: real CREATE NEW arm.
- **Selected no-ops are invalid at both boundaries** — rejecting an already-selected date/time/radio only during playback leaves a poison event in the recording. Reject in trusted human capture phase and before robo-cursor travel; toggles remain valid only when state changes. Do not exempt legacy pages.

- **Demo-click replay needs stable targets** — prefer `data-studio-action` on the click element; stop the selector chain there. Ancestor `data-name` noise (progress "Step N", breadcrumbs) breaks nested resolve.
- **Replay ≠ screen advance** — re-firing Continue proves interaction parity even when product logic opens a picker (no location yet). Do not require step navigation for a demo-click PROVE.
- **Wire-intent beat actions ≠ retreat-sync** — known `JourneyBeatActionId` → `runBeatAction`; `retreat-sync` → same script channel as director with `syncState` (`applyRecordingProjectScript` + `retreatScriptOptions`), not `runBeatAction`.
- **Human REC clicks = trusted only** — document capture-phase `click` with `isTrusted`; skip `.studio-nav-panel-host` / agent overlay; demo `.click()` stays on `notePlaybackDemoClick` (no double-capture).
- **Overlay root class must match CSS** — agent testing root is `.studio-agent-testing-overlay` (not bare `.agent-testing-overlay`); mismatch breaks PANEL CSS and lets Dismiss leak into REC capture.
- **Director replay needs scriptKind or resolvable id** — capture `scriptKind` on the interaction record; fall back to `resolvePlaybackScriptKind(scriptId)` for older sessions.

### Domain identity

- **No new `.proto-*` / `data-proto-*`.** PANEL/chrome classes are `.studio-nav-*` / `.studio-*`; DOM attrs are `data-studio-*` (`dataset.studio*`). Prefer `__studio*` window APIs; keep `__proto*` aliases. Concept Make leftovers may stay `.proto-*` in LEGACY until that screen retires — do not invent new ones. Gate: [NAMING.md](./NAMING.md) + light strict interface audit after chrome class renames.
- **Half-renames kill agents** — className + CSS + smoke/MCP selectors must move together (one codemod). Dual attrs only if a release truly needs them; prefer clean cut.
- **Storage/events** — `studio-nav:` / `studio-hub:` / `studio-*-sync` with one-time legacy read; beat field `protoTab` waits for a schema migration.

### File hygiene

- **Monster files block agents** — default 1600 LOC via `npm run check:hygiene`. Allowlist LEGACY Make dumps + current engine ceilings; prefer domain cohesion splits over micro-file zoos or silent ceiling bumps ([HYGIENE.md](./HYGIENE.md)).

### Studio chrome

- **REC ⊗ CJM is XOR, not only AIR.** CJM on → REC `disabled`; REC on → CJM off. AIR still locks both. Gate: `src/app/nav/studioModeXor.ts` + MCP sanity `rec-disabled-when-cjm-on` / `rec-enabled-when-cjm-off-idle`. Audit row **G6**.
- **Blast-radius adjacent chrome** — after any UI edit, scan sibling links/CTAs, counters, mode labels, panel XOR, AIR/browse locks. Do not only test the pixel you touched.

<a id="topic-ds-baseline"></a>
### DS / links / CSS

- **Near-dup text links forbidden** — one footer-like pattern (`.uxds-link` + LEGACY aliases): no underline at rest, underline on hover. Enforce with `npm run check:links` ([DS_STRICTNESS.md](./DS_STRICTNESS.md)).
- **Make `!important` vs kit tokens** — when retiring Make for a React screen, do not fight LEGACY `!important` forever; hide Make chrome and style the React host in page CSS / UXDS / theme. No LEGACY growth for new React pages.
- **Incomplete CSS grid / flex rows must left-align** — never `justify-content: space-between` with narrower pad spacers on short last rows (Book Step 2 time slots). Prefer CSS `grid` with fixed columns, or equal-width pads + `flex-start`.

<a id="topic-hybrid-baseline"></a>
### Hybrid Make + React

- **Distrust “done” without browser proof** — green Vitest/build/smoke alone are BAD for UI. Live localhost or CSS gate; write audit **PROVEN** under `docs/projects/<project-id>/audits/` (Boots: `docs/projects/boots-pharmacy/audits/`).
- **Hybrid mount gates** — when React mounts, hide Make duplicates (`data-studio-make-retired`); gate Make wire handlers with `isBookStepNReactMounted()`; preserve `data-name` / AIR hooks (`data-studio-open-appointment`, `data-studio-cal-*`).
- **querySelector first-match traps** — Make DOM often still exists (hidden). Prefer React host selectors or React-owned props for clicks (e.g. progress Step 1 → `onBackToStep1`), not wiring the first Make progress node.
- **Agentic home `sarah-query-submit` / Chat summary** — after Site Pilot React mount, hidden Make `[data-name="component.co.order.summary"]` / `appointment.summary` still wins `querySelector` → director transport-no-op (`diagnostic-on-step-1`). Always prefer `.studio-react-screen-host` / `.home__card` / `.chat__summary` and skip `[data-studio-make-retired]` ancestors. Controlled React textareas need the native `value` setter + `input` event for playback typing.
- **Traditional `pdp-book-now`** — same first-match class: Make `[data-name="component.input.button"]` Book now under `data-studio-make-retired` can win while React wire is gated → transport-no-op. Prefer `button[data-studio-action="pdp-book-now"]` on `.studio-react-screen-host` / `[data-studio-react-screen="pdp"]` and skip make-retired ancestors (`findPdpBookNowBtn`).
- **createRoot `unmount()` must not run sync during parent React render/commit** — calling `root.unmount()` from `useLayoutEffect` / effect cleanup while `BootsPharmacyProjectView` is committing triggers: *Attempted to synchronously unmount a root while React was already rendering*. Defer with `setTimeout(0)` (or equivalent); cancel the deferred unmount on remount so Step tab / AIR / CJM flips do not race. Gate: `mountBookStep{1,2,3}Screen.tsx`.

<a id="topic-navigation-baseline"></a>
### Navigation / journeys

- **Progress / Studio “Step 1” ≠ Make “tab1”.** Book Step 1 is `INDEX_BOOK_STEP1` (screen index **4**, child **7**, protoTab **5**). Agentic CJM has no beat on that tab; beat-index fallback to `agentic-home` must **not** `goToTab` while browsing (`shouldNavigateBeatTabOnEnter` / `scenarioBrowseMode`).
- **Named screen indices** — use `INDEX_BOOK_STEP*` / `INDEX_PLP` from `screens.ts`; avoid magic `setCurrent(4)` comments that confuse childIndex vs screen index.

### Docs layout

- **Project docs live under `docs/projects/<id>/`** — design deltas, screen pilots, FE audits, migrate-ready reports. Engine doctrine / FE standards / templates stay in `docs/product/`. Old heavily linked paths keep thin stubs. Do not dump Boots files into `docs/product/`.

<a id="topic-naming"></a>
### Naming

- **Screen folder = `screenId`** — use `screens/book-step-1/` for `?screen=book-step-1`, never `book-step1`. Journey **beat** ids may stay compact (`book-step2`) until a dedicated migration; URL aliases normalize them ([../shell/URL.md](../shell/URL.md)). New files follow [NAMING.md](./NAMING.md).
- **No `proto*` filenames / new classes / new attrs** — see Domain identity above.

<a id="topic-ci"></a>
### CI / Pages / MCP

- **CI smoke is on-demand** — default CI = unit + build; Playwright smoke = `workflow_dispatch` / local `npm run smoke` only ([CI_ACTIONS_BUDGET.md](./CI_ACTIONS_BUDGET.md)).
- **Post-push sitrep (BE / Director) — no-await routine (R12)** — after routine push: optional one-shot `gh run list` peek, then **move on**. **Forbidden:** `gh run watch` / sleep-poll / await Pages on every ship. Await CI only for HARD-GREEN / release / PO-asked prove. Do **not** claim remote green without evidence. `cancelled` Deploy/CI often means concurrency supersede — check tip SHA when you look. → [CI_ACTIONS_BUDGET.md](./CI_ACTIONS_BUDGET.md) §5 · [STUDIO_AUTO_RULES.md](./STUDIO_AUTO_RULES.md) R12.
- **CI wall clock** — install dominates; warm `node_modules` cache (skip `npm ci`) + parallel `test`∥`build` + Vitest forks/workers is the free-runner path. Target ≤20–25s warm. Do not gut hard gates for speed.
- **Page-probe unit delays ≠ MCP settles** — recipe `settleMs`/`waitMs` are for real robo-cursor MCP. Under Vitest, `compressProbeDelayMs` (env `VITEST` only) + fake timers crush wall clock; never shorten production overlay/pre-arm/step settles for CI.
- **Pages verify after chrome ships** — deploy green ≠ visual proof; check deployed host for `data-studio-react-screen` + MCP sanity on the live URL when chrome/pages matter.
- **Agent MCP testing overlay** — BR corner status + invisible click capture (no lightbox). `stop()` enters ~5s DONE/SITREP (readable log, click guard released) then clears; MCP helpers use `stop({ reload: true })` so reload runs **after** sitrep; Dismiss/`forceClear` is instant; never restore stale persist on load ([../shell/RECORDING.md](../shell/RECORDING.md)).
- **Overlay stuck after agent work** — `helperOverlayArm` `touch()` on mutating helpers (e.g. EnsureCleanStudio) without a matching `stop()` left the panel active with only “overlay start”; titles concatenated `__studioEnsureCleanStudio` and CSS `uppercase` read as garbled `STUDIOENSURE…`. Fix: clean titles only; do not arm on EnsureCleanStudio/AbortAll; idle auto-stop ~45s → sitrep; `forceClear()`; Run helpers keep `finally` → `stop({ reload: true })`.
- **Post-agent stay-on-page** — page/sanity/probe tests must **not** bounce the PO to hub. Default `resetStudioAfterAgentTest()` keeps `project`+`screen`(+persona/mode); **always strips `&modal=`** + ephemeral; closes live dialogs via event (never re-apply modal after `closeAllPopups`). Use `{ resetToHub: true }` only for CJM/journey. Quinn proves: PLP probe → still `screen=plp` with no sticky modal.
- **Sticky `&modal=` after probe / sitrep / forceClear (PO rage felony)** — Root cause: stay-state preserved `modalId` and App `onPostAgentReset` re-applied it after `closeAllPopups`. Gate: stay builder omits modal; reset forces `modalId: undefined`; App never re-applies modal on post-agent event; probe `finally` calls `resetStudioAfterAgentTest` again; intentional-close suppress still covers URL→open race. **Auto-Rule `agent-teardown-clean`:** [STUDIO_AUTO_RULES.md](./STUDIO_AUTO_RULES.md) · `studioAgentTeardownContract` · `check:felonies` §9 · `__studioAssertAgentTeardownClean` after settle.
- **Studio Auto-Rules framework** — recurring PO asks (dismiss/modal, auth SSoT, logged-out avail start, brand-active pills, §0b rhythm) must become CI/MCP gates in the **existing** check family — not a parallel unused system. Catalog: [STUDIO_AUTO_RULES.md](./STUDIO_AUTO_RULES.md) · `check:theme-brand` · felonies §10 auth-ssot.
- **Parity-proven CI gate** — React-migrated screens without PROVEN audit + MCP matrix in `PARITY_PROVEN.json` must fail `npm test` (`check:parity-proven`). Chat “PROVEN” without the gate = PO trust loss.
- **Overlay ≠ lightbox** — opaque full-screen “AGENT TESTING” modals rage the PO and hide the page under test; keep the concept visible.

---

## 2026-07-22 — Modal target handoff and QA frame gutter

- **A modal close is not a navigation beat.** A terminal modal CTA must not close, wait, and then navigate: that exposes the source page and makes an atomic user intent look broken. The shell screen-transition callback must close project transient UI in the same React batch as navigation; during CJM playback return immediately and retain the modal as a visual bridge until that atomic target commit. Put any presentation dwell on the destination.
- **Diagnostic chrome must consume its own space.** A viewport ring painted over the product hides edge controls and falsifies visual QA. Reserve a shell gutter equal to the ring width, then paint the ring only inside that gutter.
- **CJM warnings are product debt, not decoration.** If recorded CJMs predate the current playback contract, either prove/migrate a small current set or delete stale non-protected entries. Clean both deployed file-backed CJMs and origin-local `studio-recorded-cjm:*` storage when validating localhost; otherwise the global warning count keeps reporting old browser state after the repo is clean.

---

## 2026-07-23 — QA viewport activity border now fades, not snaps

- **Ask:** PO wants the agent-testing overlay's viewport frame (the inset colored ring — gold=`control`, blue=`pending`, red=`error`, orange=`rec:live`) to appear/disappear "in a more fluid way" via the shared motion system.
- **Found:** `.studio-agent-testing-overlay__frame` (`agent-testing-overlay.css`) is a plain imperative DOM node — attributes (`data-mcp`, `data-rec`) are painted by `paintMcpChromeDom`/`agentTestingOverlay.ts`, not React mount/unmount, so there is no presence/exit to hand to `AnimatePresence`. Per [MOTION.md](./MOTION.md)'s own table, "trivial hover color/opacity" stays CSS — and CSS `ease-in-out` **is** `MOTION_EASE_IN_OUT` (`cubic-bezier(0.42,0,0.58,1)`) by spec, so a plain `transition` on this property already rides the same curve as the rest of the platform's motion, no framer-motion import needed for a single interpolated property on a non-React node.
- **The actual bug:** the frame's rest state had **no** `box-shadow` declared at all (`box-shadow: none` implicitly) while every active state set `box-shadow: inset 0 0 0 10px <color>`. Browsers cannot smoothly interpolate `none ↔ <shadow>` — it just snaps regardless of any `transition` you add, because there's no matching shadow list to blend from/to.
- **Fix:** gave the base rule an explicit rest shadow of the **same shape, transparent** (`inset 0 0 0 var(--studio-agent-testing-frame-size) transparent`) plus `transition: box-shadow 220ms ease-in-out;`. Now every phase change (idle→control, control→pending, rec start/stop, sitrep clear) interpolates color+alpha smoothly instead of popping, and going back to idle fades to transparent instead of vanishing.
- **Gate:** `npm test` 153/153 green, `npm run build` green. Live MCP: `__studioArmRecCapture()` → frame computed `transition: "box-shadow 0.22s ease-in-out"`, `boxShadow` resolved to the live REC-orange value — confirms the rule is live, not just present in source.

---

## 2026-07-23 — Header MCP hint: text chip → persistent icon glyph

- **Ask:** PO wants the header "CTRL" text chip replaced with an MCP-server glyph icon (PO supplied `mcp-server-stroke-rounded` — already sitting in `src/assets/mcp-server-stroke-rounded.svg`, `stroke="currentColor"`), and wants it **always visible** ("persist") instead of only appearing while a session is live: green while connected, muted silver otherwise.
- **Found:** `.studio-nav-version__mcp` (`StudioNavVersionChip.tsx`) rendered `hidden` by default and only un-hid + wrote 5-way phase text (`CTRL`/`OBS`/`PENDING`/`…`/`OK`/`ERR`) via `paintMcpChromeDom`/`shortNavPhase` in `agentTestingMcpChrome.ts` while the overlay was live. PO's binary "connected/not" ask is simpler than the 5-phase text model — folded `connecting`/`connected`/`control`/`observe`/`pending` into one `data-connected="true"` (green), and `idle`/`error`/overlay-not-live into `data-connected="false"` (muted silver). **Error is deliberately excluded from green** even though it carries a label — "broken" should not paint as "connected"; the real error text still surfaces via the `title` tooltip, just not as a green glyph.
- **Fix:** inlined the SVG (same `McpGlyphIcon` pattern as the existing bug-icon button — codebase convention is inline JSX `<svg stroke="currentColor">`, not `<img src>`, so CSS `color` drives the fill directly, no mask-image hack needed). `paintMcpChromeDom`/`clearNavMcpHintDom` now always set `navHint.hidden = false` and only toggle `data-connected` + `title`; removed the now-dead `shortNavPhase()`. CSS dropped the pill/border/background chip styling (no longer text, just a bare 18px icon) and added `transition: color 220ms ease-in-out` so connect/disconnect fades rather than snaps (see the box-shadow fade lesson above — same curve, same reasoning).
- **Test contract change:** two existing unit tests asserted `hint.hidden === true` + `textContent === ""` when not live — that's the *old* contract this ask explicitly reversed. Updated both to assert `hidden === false` + `dataset.connected === "false"` instead of skipping/deleting them.
- **Gate:** `npm test` 153/153 green, `npm run build` green. Live MCP: idle → `color: rgba(160,166,176,0.7)` (muted silver), zoomed element screenshot confirms a plain gray glyph; `__studioArmRecCapture()` → `dataset.connected === "true"`, `color: rgb(61,255,138)` (`#3dff8a`), zoomed screenshot confirms green — both states read from `getComputedStyle`, not eyeballed.

---

## 2026-07-23 — QA panel MCP status: diode + jargon label → same persistent glyph + honest text

- **Ask:** PO wants the QA console's bottom-right status row (under Message/Send) to get "the same" treatment as the header MCP glyph, and to replace "AGENT — CONTROL · MANUAL · ONLINE"-style internal jargon with "proper industry typical honest technical text status".
- **Found:** `.studio-agent-testing-overlay__mcp-status` was a separate DOM row from the header chip (camera-lens LED diode via `::before` gradients + `status.label` verbatim, e.g. `AGENT — CONTROL · MANUAL · ONLINE`), and the whole row was `hidden` while idle — same anti-pattern as the header chip before its own fix.
- **Fix:** renamed `.studio-agent-testing-overlay__mcp-diode` → `-glyph` and swapped the pseudo-element LED for the **same** `MCP_GLYPH_SVG_MARKUP` inline SVG constant (single source in `agentTestingMcpChrome.ts`, consumed by both the vanilla-DOM panel template and — separately, since one is JSX — `StudioNavVersionChip.tsx`'s `McpGlyphIcon`). Row + glyph + text are now always rendered (never `hidden`); only `data-connected`/`data-phase` and text content change. Added `formatHonestMcpPanelText(phase)` — a **second, deliberately plainer** formatter than `formatMcpStatusLabel` (`AGENT — CONTROL` etc., which stays untouched for the nav tooltip + `agentTestingMcpStatus.test.ts` assertions): `"Agent MCP — connected · control"` / `"· observe"` / `"· awaiting reply"` / `"connecting…"` / `"connection error"` / `"disconnected"`. Kept the CONTROL-requires-fresh-presence trust rule (stale/offline CONTROL never glows green) — only `observe`/`pending`/`connecting`/`connected` skip the presence gate, same as before.
- **Don't invent a second visible vocabulary:** the internal `AGENT — …` label format still exists and is asserted verbatim elsewhere (self-test scenarios, `formatMcpStatusLabel` unit tests, tooltips) — this fix only changes what's **user-visible** in the two persistent chrome spots (header + panel row), not the underlying phase/label API.
- **Gate:** `npm test` 153/153 green, `npm run build` green. Live MCP: panel row read `"Agent MCP — connected · control"` with `data-connected="true"` on a live session (accessibility snapshot + cropped screenshot), and DOM query confirmed the row + glyph persist (`hidden === false`) the entire time the panel is open.

---

## 2026-07-23 — MCP glyph hover: status + one-line description, not just status

- **Ask:** PO wants the MCP icon's hover (title/alt text) to carry both its status *and* a short description of what that status means — not just the bare honest phrase from the panel row.
- **Found:** the header nav glyph and QA panel glyph/chip each built their `title` independently (`${status.label} — ${AGENT_LATCH_STATUS_TITLE}`, still the pre-honest-text jargon in two of the three spots), so hover text didn't match the newly-honest visible text and never explained *what* e.g. "control" or "pending" means.
- **Fix:** added `formatMcpPhaseDescription(phase)` (one line: "agent is driving the page", "waiting on your reply", "no active QA session", etc.) and `formatMcpGlyphTitle(phase)` = `formatHonestMcpPanelText(phase) — description (AGENT_LATCH_STATUS_TITLE)`. All three glyph/label elements (header nav hint, panel glyph, panel chip) now share this one title formatter instead of three near-duplicate inline template strings. Added `aria-label` mirroring `title` on the header nav hint (screen-reader parity — the wrapper isn't `aria-hidden`, only the inner `<svg>` is) so the accessible name matches the hover text, not just a static idle default.
- **Gate:** `npm test` 153/153 green, `npm run build` green. Live MCP: accessibility snapshot's `generic` node for the nav glyph read `"Agent MCP — disconnected — no active QA session (In-app testing latch (not Cursor MCP))"` verbatim — title, aria-label, and a11y tree all in sync.

---

## 2026-07-23 — Shell popup auto-focus ring: `useEffect` + ref raced Radix's Presence mount

- **Ask:** PO wants no element inside a shell popup (About UXML, CJM compatibility) to show a visible focus outline the instant the popup opens — screenshot showed a gold ring around the × close button on open.
- **Found:** both dialogs already used `:focus-visible` (good practice), but Radix's `Dialog.Content` auto-focuses a child on mount and browsers' `:focus-visible` heuristic often still paints a ring for that *programmatic* focus, even though the popup was opened by mouse/hover.
- **First attempt was wrong — a real bug, not just imperfect:** tried `useEffect(() => { ...; panelRef.current?.addEventListener(...) }, [open])` with a plain object `useRef`. Traced with `window.__debug*` breadcrumbs (temporarily added to source, confirmed live via MCP, then removed) and found the effect ran with `panelRef.current === null` on every *re*-open (worked once on first mount, silently no-op'd after). Root cause: Radix mounts `Dialog.Content` through `@radix-ui/react-presence`, so the actual DOM node can attach in a **later commit** than the one that flips `open` to `true` — a `useEffect` keyed on `[open]` can fire before the ref is populated. This is a timing race, not a one-off flake — it reproduced on every close→reopen cycle.
- **Fix:** rewrote as a **callback ref** (`useSuppressDialogAutoFocusRing`, `src/app/shell/`) instead of an object ref + effect — callback refs fire exactly when the node attaches/detaches, in whatever commit that actually happens, so there's no dependency on `open` state timing at all. On attach: set `data-studio-suppress-focus-ring="true"` directly on the node (no React state round-trip) + one `{ once: true }` keydown listener that removes it. CSS (`studioNavPolish.css`): `[data-studio-suppress-focus-ring="true"], [data-studio-suppress-focus-ring="true"] * { outline: none !important; }`. Shared by both `StudioNavProductAbout.tsx` and `StudioNavCompatibilityDialog.tsx` (same Radix Dialog pattern, same close-button class) — one hook, not two near-duplicate implementations.
- **Don't just trust the visible fix — verify the mechanism:** the popup *looked* right in a screenshot even during the broken first attempt in one throwaway test, which would have been a false-positive "PROVEN" if not cross-checked with a live DOM attribute read (`getAttribute`) + `getComputedStyle().outline` on both the auto-focused element (ring suppressed) *and* after a real `Tab` keydown (ring restored) — the second half of that check is what caught the race.
- **Gate:** `npm test` 153/153 green, `npm run build` green. Live MCP: reopened the About popup fresh, computed `outline: "none"` on the auto-focused × button; pressed a real `Tab` key, computed `outline: "rgb(244, 207, 114) solid 2px"` on the next link — ring correctly suppressed on auto-focus, correctly restored on genuine keyboard use. Screenshots for both states.

---

## 2026-07-23 — MCP glyph "not green during live devtools use" was correct behavior, not a redesign regression

- **Ask:** PO asked why the MCP icon doesn't go green while the agent is actively clicking/evaluating the page via Chrome DevTools MCP, noting it "worked before" the text-chip → glyph migration.
- **Found (not a bug):** the icon has never been a literal "Cursor MCP/CDP attached" detector — the browser gives page JS **no** signal that a remote CDP client is debugging an already-open tab (`navigator.webdriver` only fires for browsers *launched* under automation, not for `list_pages`/`select_page` reuse per R11 fixed-localhost-reuse-tab). The icon reflects the **in-app AGENT TESTING presence latch** (`agentTestingPresence.ts`), gated by `live && MCP_NAV_CONNECTED_PHASES.has(status.phase)` — that gate condition is **unchanged** by the icon redesign; only the visual (text → glyph) changed. It looked "green during interaction" earlier in the session because a QA session/latch happened to already be armed from prior REC/Play prove work, not because raw clicking triggered it.
- **Live-proved on `:5173` (Chrome DevTools MCP):** fresh page → nav glyph `data-connected="false"`, title `"Agent MCP — disconnected — no active QA session"`. Raw `click` on a PLP tile (no AGENT TESTING helper) → **still** `false` — proves clicking alone never lit it, before or after the redesign. Then `window.__studioAgentTestingOverlay.touch('mcp-devtools-demo')` → `connecting…` → settles to `data-connected="true"`, `"connected · control — agent is driving the page"`.
- **Actionable fix (habit, not code):** when doing ad-hoc live MCP verification outside a formal REC/Play prove helper, call `window.__studioAgentTestingOverlay.touch('<source>')` once at the start so the icon honestly reflects active agent work for the 8s heartbeat window (re-touch, or use a prove helper, for longer sessions). Documented in [QA_LOGGING_AND_PLAYBACK_RECIPE.md](../shell/QA_LOGGING_AND_PLAYBACK_RECIPE.md) § "MCP glyph = in-app latch, not a literal 'Cursor MCP attached' detector".
- **Gate:** no code change required (confirmed working-as-designed); doc-only addition + this lesson. Live MCP evidence above is the proof.

---

## 2026-07-23 — Chrome DevTools MCP ran real clicks invisibly: `select_page` needs `bringToFront: true`

- **Ask:** PO, immediately after the MCP-glyph live-prove above: "where are you doing all that???? i dont see anything on my chrome localhost tab!" — also asked what's wrong with the header MCP icon's alt text.
- **Found:** the automation was 100% real — `list_pages` returns the PO's actual day-to-day Chrome (their Gmail/YouTube/Sheets tabs alongside the Studio tab), not a hidden/headless browser. But `select_page(pageId)` was called **without** `bringToFront`, so CDP switched the "active target" for tool calls without raising that Chrome window over whatever else had OS focus (Cursor, in this case). Raw `click`/`evaluate_script` also fire instantly with no visible mouse-cursor animation (unlike the `simulateDemoPointerClick` robo-cursor helpers used in formal probes) — so even a frontmost window wouldn't show obvious motion. Confirmed live: the tab I'd been clicking on (`58`) was closed mid-session (by the PO, unaware anything was happening on it) and `list_pages` afterward showed a different tab (`61`) had since been navigated by the PO to a different screen — clear evidence the PO was never watching the tab I was driving.
- **Separately, the alt-text complaint was a false alarm:** live-read `outerHTML`/`title`/`aria-label` on the header glyph showed the full detailed string present exactly as designed (`"Agent MCP — disconnected — no active QA session (In-app testing latch (not Cursor MCP))"`), at an on-screen, in-viewport position (`rect.x/y` within `innerWidth/innerHeight`). Native `title` tooltips need a ~1s precise hover over an 18×18px target — easy to miss, especially while not looking at the (backgrounded) window in the first place.
- **Fix:** `select_page({ pageId, bringToFront: true })` before any live prove/demo the PO is meant to watch. Documented in [STUDIO_AUTO_RULES.md](./STUDIO_AUTO_RULES.md) R11.
- **Gate:** doc-only; `select_page` with `bringToFront: true` confirmed to raise the target window via the same MCP call.

---

## 2026-07-23 — CREATE NEW CJM left a stale STEPS count from the previous unadded recording

- **Ask:** PO reported that picking **CREATE NEW CJM** from the orchestra dropdown still showed the `STEPS: N` counter next to REC with an old count (e.g. `10`) instead of `0` for the brand-new, empty CJM.
- **Found:** `StudioNavRecordingEventCounter` (`StudioNavRecordingControls.tsx`) derives its `eventCount` from `countRecordingSteps((live ?? last)?.events)`. `getLastRecordingSession()` (`recordingSession.ts`) only ever changes on `stopRecording()` / `stageRecordingSession()` (import) / `clearStagedRecordingSession()` (Purge) — nothing in `StudioNavJourneyMenu.tsx`'s CREATE NEW CJM entry points (menu click `handleChange` and the imperative `registerCreateNewCjmSelector` used by REC-arm helpers) ever cleared it. So a previously stopped-but-never-purged/never-added recording (its `lastSession`) kept surfacing its old event count every time the picker was freshly re-selected to CREATE NEW CJM, even though nothing had been recorded yet in that fresh pass.
- **Fix:** both CREATE NEW CJM entry points now compute `enteringFresh = !createNewSelected` (i.e. this is a genuine transition *into* CREATE NEW, not just re-affirming an already-selected draft) and, only when fresh, call the existing `clearStagedRecordingSession()`. That helper already no-ops while a session is live/paused (`runtime.activeSession != null` guard), so an in-progress recording is never discarded — only a leftover *stopped* draft from a previous pass is cleared, resetting `STEPS` to `0`.
- **Don't reinvent a reset path:** `clearStagedRecordingSession()` already existed (same function the Purge ✕ button calls) — the bug was a missing call site, not a missing primitive. Reuse it at both entry points (menu click + imperative selector) rather than adding a second clearing mechanism.
- **Gate:** new tests `src/app/nav/__tests__/StudioNavJourneyMenuCreateNewReset.test.ts` (3 cases: menu-click reset, imperative-selector reset, live-session-not-discarded) + full `npx vitest run` 155/155 files · 912/912 tests green, `npx vite build` green.

---

## 2026-07-23 — QA panel title/chrome desync: title painted once at transition time, not re-derived on every sync; agent-presence heartbeat leaked into manual sessions

- **Ask (screenshot bug report):** panel title showed **MANUAL** while simultaneously showing the **Take control** link (supposed to be hidden for `sessionKind === "manual"`) and agent-presence log chatter (`"Agent stale · auto-pause · capture paused · Last seen 8s ago"`, `"Agent disconnected (left)"`) — a session cannot honestly be both.
- **Root cause #1 (title/chrome desync):** the title was painted **ad hoc** at each kind-transition call site (`sessionTitle = resolved; setTitle(resolved);` scattered across `startAgentTestingOverlay`, `applyQaHandoff`, `escalateObserveToAgentSession`, `takeControlSession`, `openAgentTestingLogger`, …) instead of being derived from `getSessionKind()` inside the single chrome-sync function (`syncSessionChrome()`), which the Take control link, MCP status row, and suite chrome all correctly read live. One path — `confirmAgentHandshake("touch"/"api")` → `startFreshAgentInterventionSession()` (the real FAIL → agent-takeover handshake) — called `setSessionKind("agent")` and `syncSessionChrome()` but never repainted the title, so the panel kept showing a stale earlier title (e.g. "Manual QA") while every other kind-driven element already reflected the new (agent) kind.
- **Root cause #2 (presence leak):** `agentTestingPresence.ts`'s stale-heartbeat auto-pause guard (`maybeAutoPauseOnStalePresence`) is generic infra armed by `armPresenceHeartbeatWithAutoPause()` at agent/observe session-open — but nothing disarmed it on the way back to `manual` (e.g. `takeControlSession()` never called `clearQaAgentPresence()`), so the `setInterval` heartbeat kept ticking and, once the last agent touch aged past `QA_AGENT_AUTO_PAUSE_MS` (8s), pushed "Agent stale · auto-pause…" log lines and paused capture in a session whose live kind was now `manual` — a session that, from that point on, never had an agent connected.
- **Fix (structural, not a symptom patch):**
  - Added `paintSessionKindTitle(kind, override?)` — the one place that sets `sessionTitle` + the new `lastTitleKind` tracker + `setTitle()` — and routed every kind-transition site through it instead of the old ad hoc pairs.
  - `syncSessionChrome()` now self-heals: `if (!settling && lastTitleKind !== kind) paintSessionKindTitle(kind)` — any call site (present or future) that forgets to repaint gets corrected on the very next chrome sync, the same sync pass that already paints Take control / MCP row / suite chrome, so they can never diverge again. Transient titles (preparing/finale/sitrep) don't update `lastTitleKind`, so they aren't clobbered by the drift check.
  - `maybeAutoPauseOnStalePresence()` now bails immediately unless `getSessionKind()` is `"agent"` or `"observe"` — the guard rail is scoped to sessions that can actually have an agent, by design, not just by cleanup convention.
  - `takeControlSession()`, `softCloseAgentTestingLogger()`, and the manual branch of `openAgentTestingLogger()` now call `clearQaAgentPresence()` (stops the heartbeat interval outright) as belt-and-suspenders on top of the kind gate.
- **Ordering pitfall while fixing:** the first pass called `paintSessionKindTitle()` *before* `ensureRoot()` in `startAgentTestingOverlay` / `applyQaHandoff` / `openAgentTestingLogger` — `setTitle()` queries `.studio-agent-testing-overlay__title` in the live DOM, which doesn't exist until `ensureRoot()` runs, so the paint silently no-op'd and the DOM kept showing the static `DEFAULT_TITLE` ("Agent control") placeholder from the initial template. Caught immediately by the new tests (title text didn't match `getSessionKind()` on the very first open). **Always paint title after `ensureRoot()`, never before**, in any fresh-session-open path.
- **Gate:** new `src/app/shell/agent-testing/__tests__/agentTestingTitleSync.test.ts` (6 tests: title/take-control consistency property check across manual/agent/observe; the exact fail-handoff → agent-takeover regression path; self-heal via a bypassed paint call; manual-never-touched-by-agent shows zero presence chatter; stale heartbeat doesn't leak after a raw kind flip; Take control clears presence). Full `npx vitest run` 157/157 files · 920/920 tests green, `npx vite build` green, `check:hygiene` green (trimmed comments to stay under the file's allowlisted 4800-line ceiling rather than bumping it).

---

## 2026-07-23 — "QA tool health" self-test hijacked a PO-owned Manual QA session into AGENT kind (dead-end Finale + Save Log dump showing `sessionKind:"agent"`)

- **Ask:** PO launched Manual QA, ran the "QA tool health" suite (the `mcp-sanity` self-check) from the popup's Run CTA, clicked **Keep open**, and hit a dead end — Take control link visible, `Complete — PASS · SESSION FINALE`, only a Message/Send row, "Agent disconnected" footer. The downloaded dump (`qa-agent-2026-07-23T08-22-16-035Z.json`) confirmed `"sessionKind":"agent"` even though the PO never asked an agent to take control.
- **Root cause (three compounding layers, all inside `window.__protoRunMcpSanityCheck`):**
  1. Its very first line, `window.__protoAbortAll?.()`, unconditionally called `stopAgentTestingOverlay({ force: true, reload: false })` — a hard teardown (`active = false`, `teardownDom(true)`) of **whatever** overlay session was currently open, including a live PO-owned Manual session. `__protoAbortAll` is meant to stop in-flight Play/journey/recording, not nuke the QA popup a human is actively running.
  2. Immediately after, an unconditional `startAgentTestingOverlay("AGENT TESTING - preparing...")` rebuilt the (now-destroyed) panel fresh — and `startAgentTestingOverlay` always does `setSessionKind("agent")` by design (that's its contract for a genuine agent takeover), so the rebuilt session was permanently agent-owned.
  3. Even after gating (1)+(2) behind an "is a PO session already active?" check, `preArmAgentTestingOverlay`'s active-session branch still called `ensureAgentTestingOverlayDomArmed(title)` unconditionally, which does a kind-blind `setTitle(resolved)` — stamping "AGENT TESTING - preparing..." straight over a live "Manual QA" title regardless of `sessionKind`.
- **Fix:** in `__protoRunMcpSanityCheck`, capture `ownedByOtherSession = isAgentTestingOverlayActive()` up front and: (a) guard `__protoAbortAll`'s force-stop so it skips the overlay entirely when a live Manual/Observe session owns it; (b) branch start-vs-touch (`touchAgentTestingOverlay(title, { preserveLogger: true })` instead of `startAgentTestingOverlay`) so kind is never force-flipped; (c) skip the trailing `stopAgentTestingOverlay(...)` settle/Finale call in the `finally` block when nested into someone else's session — the outer suite runner owns that session's lifecycle, not this sub-check. `preArmAgentTestingOverlay`'s active-session branch now calls `touchAgentTestingOverlay(title, { preserveLogger: true })` instead of the raw `ensureAgentTestingOverlayDomArmed(title)` retitle, reusing the same ownership-aware guard `touchAgentTestingOverlay` already has for `kind === "manual"`. Also added `"RunMcpSanityCheck"` / `"RunMcpPageProbe"` to `helperOverlayArm.ts`'s `PRESERVE_LOGGER_HELPER_SUFFIXES` so the generic auto-touch-wrap around every `__proto*`/`__studio*` helper doesn't hijack an **Observe** session into agent-lock underneath these same self-tests (mirrors the Manual fix; Observe was equally exposed via `applyQaHandoff({ oversee: false })` on an un-preserved touch).
- **Pattern to watch:** any "diagnostic helper" that internally calls `startAgentTestingOverlay` / `ensureAgentTestingOverlayDomArmed` to arm its own chrome must first check `isAgentTestingOverlayActive()` and, if a PO session already owns the panel, route through the ownership-aware `touchAgentTestingOverlay(title, { preserveLogger: true })` instead — never the raw start/ensure/setTitle primitives, which are kind-blind by design (they're the *takeover* primitives, not the *nest into existing session* primitives).
- **Gate:** new `src/app/shell/agent-testing/__tests__/agentTestingSelfTestKindPreserve.test.ts` (3 tests: mcp-sanity run from a Manual popup stays `sessionKind:"manual"` with title/Take-control untouched; `__protoAbortAll` never force-clears a live Manual session; a cold-start with nothing open still legitimately owns/settles its own agent session). Full `npx vitest run` 158/158 files · 923/923 tests green, `npx vite build` green, `check:hygiene` green (bumped `agentTestingOverlay.ts` 4800→4810 and `studioMcpHelpers.ts` 1420→1450 in the allowlist for this fix's guard code).

## 2026-07-23 — Reset didn't reset the title: `appendFinale` stamps the title directly and nothing ever un-stamps it, even on a fully-active session

- **Ask:** immediately after the fix above, PO ran "QA tool health" again from a still-open Manual QA panel and asked "why tool title doesnt reset after i click reset????" — screenshot showed the title frozen at `PASS — session finale`, a `RESULT … x2 (600.0s)` coalesced duplicate log line, yet `Localhost:5173 · Active` and the dropdown/Run CTA all looked normal (not agent-locked — the fix above held).
- **False lead, corrected by reproduction:** initially assumed this was the "held SESSION FINALE" (`Keep open` → `settleHeld`) dead end and shipped a fix (`resumingFromHeld` branch in `resetManualSession` + un-sealing the Reset button while `settleHeld`) — genuinely a real, separate gap, but a synthetic repro (`openAgentTestingLogger({kind:"manual"})` → log two lines → click Reset) proved Reset was **already enabled and its click handler already ran** in the reported scenario; the title still didn't change. That's a different bug in the same function.
- **Real root cause:** `qaAutonomousSuite.ts`'s `runAutonomousQaSuite()` calls `window.__studioAgentTestingOverlay?.appendFinale(result, summary)` at the end of **every** suite run — including from a fully-active Manual/Observe session, not only a settled/held sitrep. `appendAgentTestingSessionFinale()` (`agentTestingOverlay.ts`) does `setTitle(result === "pass" ? "PASS — session finale" : "FAIL — session finale")` **directly** — bypassing `sessionTitle` / `paintSessionKindTitle()` / `lastTitleKind` entirely (the same SSoT those were built for, in the July-23 title-desync fix earlier today) — and seals the log via `sealAgentTestingFinale()`. `resetManualSession()` never called `paintSessionKindTitle()` **at all** in its normal (non-held) branch, and never cleared the finale seal either — so a self-test run from an active session left the title permanently stamped, Reset "worked" (log/ring/timer genuinely cleared) but the frozen title made it look broken.
- **Fix:** moved the finale-seal-clear + `setResultBadge("neutral")` + `paintSessionKindTitle(getSessionKind())` calls in `resetManualSession()` out of the settleHeld-only branch so they run unconditionally on every real reset — both the still-active path and the held/settled path.
- **Process lesson:** don't trust a screenshot's implied mechanism (I guessed "Keep open held state" from the title text alone) — reproduce the *exact* reported action sequence in a test first (`appendFinale` directly, not `stopAgentTestingOverlay`+`holdSettleOpen`) before writing the fix. The first fix wasn't wrong, just incomplete — it fixed a real adjacent gap but not the one actually hit.
- **Gate:** `agentTestingKeepOpen.test.ts` now has both cases (5 tests total: 3 original Keep-open/Complete + held-sitrep Reset-repaints-title + active-session `appendFinale` Reset-repaints-title, the one matching the actual report). Full `npx vitest run` 158/158 files · 925/925 tests green, `npx vite build` green, `check:hygiene` green (bumped `agentTestingOverlay.ts` 4810→4850).

## 2026-07-23 — Kind-hijack bug was three-quarters unfixed: only `mcp-sanity` was patched, every OTHER self-test still nuked a PO's Manual session

- **Ask:** immediately after the two fixes above, PO reported (furious) that running **any other test** from the Manual QA popup still showed "AGENT TESTING" title and "Agent connected via MCP" chrome — i.e. the exact same kind-hijack class, just from a different test.
- **Root cause — I fixed one call site out of three that share the identical unconditional-`startAgentTestingOverlay`/`forceClearAgentTestingOverlay` bug pattern:**
  1. `runMcpPageProbe` (`studioMcpPageProbe.ts`, powers the **"Test current page"** suite test) — unconditional `startAgentTestingOverlay("AGENT TESTING — preparing…")` + a second unconditional `ensureAgentTestingOverlayDomArmed(`AGENT TESTING — ${screenId} probe`)` retitle after pre-arm + an unconditional `stopAgentTestingOverlay(...)` in its `finally`. Same three-layer shape as the already-fixed `mcp-sanity`, just never patched.
  2. `withMcpTestSession` (`mcpTestSession.ts`) — the **shared wrapper** behind `retreat-smoke`, `home-play-smoke`, `agentic-step-forward`/`traditional-step-forward` smokes, `agentic-play-smoke`/`traditional-play-smoke`, `traditional-retreat-smoke`, and `control-room-traditional` (robot QA). This is the single highest-impact miss — it explains "**any** other test" literally, since nearly every quick suite test besides mcp-sanity/page-probe/qa-self-test routes through it. It did `forceClearAgentTestingOverlay()` then unconditional `startAgentTestingOverlay(...)` at the top, and an unconditional `stopAgentTestingOverlay(...)` in `finally`.
  3. Confirmed **not** a bug (by design): `runFullPlayProve` (`play-agentic`/`play-traditional`/`rec-traditional`) uses `requireFreshQaSession()`, which is explicitly documented "ALWAYS CLEAR = code law, no skip flag" — a full continuous CJM Play/REC run is a genuine agent-driving-the-browser action and is *supposed* to seize a fresh agent session regardless of what was open. Left unchanged.
- **Confirming signal:** `agentTestingMcpChrome.ts`'s `paintMcpChromeDom` hides the whole "Agent connected via MCP" panel row when `sessionKind === "manual"` (`wrap.hidden = input.sessionKind === "manual"`) — so the PO literally could not have been seeing that chrome unless `sessionKind` had actually flipped to `"agent"` again, proving the hijack was still live for these other tests.
- **Fix:** applied the identical proven pattern from the `mcp-sanity` fix to both remaining call sites — capture `ownedByOtherSession = isAgentTestingOverlayActive()` up front; branch `touchAgentTestingOverlay(title, { preserveLogger: true })` vs `startAgentTestingOverlay(title)`; skip the raw kind-blind `ensureAgentTestingOverlayDomArmed(explicitTitle)` retitle for the owned case (use `isAgentTestingOverlayDomVisible()` instead); and guard the `finally` block's `stopAgentTestingOverlay(...)` + `scheduleAgentTestingOverlayEnsureClear(...)` so a nested sub-test never settles/Finales a session it didn't start.
- **Process lesson:** when a bug class is found in one function, **grep for every other call site of the same unconditional primitives** (`startAgentTestingOverlay(`, `forceClearAgentTestingOverlay(`) before declaring the class fixed — patching the one function the PO happened to name first left the *majority* of entry points (the shared `withMcpTestSession` wrapper) still broken, guaranteeing an immediate "still broken!!" follow-up.
- **Gate:** `mcpTestSession.test.ts` +2 (`withMcpTestSession` stays Manual when owned / cold-starts Agent when not), `studioMcpPageProbe.test.ts` +1 (`runMcpPageProbe` never calls start/stop/raw-ensureArmed when owned, calls `touchAgentTestingOverlay(title, { preserveLogger: true })` instead). Full `npx vitest run` 158/158 files · 928/928 tests green, `npx vite build` green, `check:hygiene` green.

## 2026-07-23 — "Test current page" reported RESULT · PASS while a real control-room Alarm fired mid-run: page-probe never polled the shared PO-signal gate

- **Ask:** PO ran "Test current page" from Manual QA (dump `qa-manual-2026-07-23T09-29-43-108Z.json`). Mid-run, a genuine ambient diagnostic fired — "control-room · Alarm red / diagnostic — Scroll jumped 1494px outside eased animation" and "Caught error. Ask agent with the prompt: uxml control" — yet the session still finished `RESULT · PASS — 1/1 autonomous tests passed` and title stamped `PASS — SESSION FINALE`. PO: "why title says PASS?!" / "control panel doesn't react on test live — it was supposed to be a UNIVERSAL GATE".
- **Not a bug (ruled out first):** the `plp-book-now-blocked` probe step intentionally uses `action: "refuse-click"` — Book Now *should* be refused while Quick View is open (overlay-eyes contract, rule 7c); that "click FAIL — blocked-by-modal" line is the step working correctly, not a symptom.
- **Real root cause:** the scroll-anomaly watchdog (`onPlaybackDiagnosticOpened`) genuinely fires kind-independently and correctly `latchPoSignal({ type: "diagnostic", code: "PLAYBACK_DIAGNOSTIC_OPEN", ... })` — the "universal gate" *does* exist and *did* fire. But nothing ever consumed/checked that latch inside `runMcpPageProbe`'s step loop. Every other smoke already honors this exact gate each step/beat via the shared `pollSmokePoSignal()` helper (`smokePoSignalPoll.ts`, R15 doctrine: "PO HARD process: Alarm / Cursor / Scroll → STOP") — `studioMcpHelpers.ts`'s step-forward/home-play smokes, and `playJourneySmoke.ts`'s continuous Play smoke, all call it. `runMcpPageProbe` ("Test current page") was the one runner that never imported it at all, so a real ambient Alarm during a page-probe was structurally invisible to that probe's own `checks[]`/`pass` computation — the diagnostic got logged, then silently auto-dismissed at session-finale (`dismissedBy: "session-finale"`), and the probe's own narrow step list (which never touches the scroll subsystem) still reported clean.
- **Fix:** `runMcpPageProbe`'s step loop now calls `pollSmokePoSignal({ context: `page-probe:${screenId}:${step.id}` })` after every step (matching the established call shape used elsewhere); on `hit && abort` it pushes a failing `po-signal` check and breaks — the probe can never again report PASS while an unconsumed Alarm/diagnostic po-signal is open.
- **Known gap not closed here (documented, not fixed):** `runRetreatSmokeBody` (`studioMcpHelpers.ts`) only checks the narrower React `state.diagnosticOpen` field, not the shared po-signal latch — same theoretical exposure, lower priority (retreat smoke already re-polls diagnosticOpen at every leg). Flag for a follow-up pass if a retreat-smoke false-PASS is ever reported.
- **Process lesson:** "the gate exists somewhere in the codebase" is not the same as "every entry point calls the gate" — when a PO reports a specific tool/runner ignoring an established safety mechanism, grep for the mechanism's callers (`pollSmokePoSignal` in this case) and diff against every runner that should have it, not just the one used as the report's example.
- **Gate:** `studioMcpPageProbe.test.ts` +1 ("fails the probe when a live Alarm/diagnostic PO signal fires mid-run (universal gate)" — registers a 2-step test recipe, asserts the probe aborts after step-1's poll hit and step-2 never runs). Full `npx vitest run` 158/158 files · 929/929 tests green, `npx vite build` green, `check:hygiene` green. Live-verified on `:5173` (kind stays `manual`, panel functional) but could not force-reproduce the underlying scroll-anomaly timing race on demand — the *gate* is proven by unit test; the anomaly's root FE cause (if it recurs) is a separate investigation.

## 2026-07-23 — Hover-revealed UI (mega-menu flyout) is structurally unrecordable — no `hover` event kind, and the panel isn't even in the DOM until hovered

<a id="topic-hover-reveal-rec"></a>

- **Ask:** PO built a UXDS `MegaMenuFlyout` (hover-open header nav panel, Boots "Health Services") and asked whether all its links/buttons — hover, flyout-open, click, hide-flyout — would "naturally click into" UXML's REC → CJM recording mechanics.
- **Investigation, not guess:** read `docs/shell/RECORDING.md` § Event types + `recordingCapture.ts` selector-chain resolution before answering.
- **Finding — two separate gaps, one fixed, one structural:**
  1. **Fixable (fixed same session):** the flyout's inner links had no `data-studio-action`. REC's human-click capture falls back to climbing the nearest `data-name` ancestor when no `data-studio-action` exists — for these links that ancestor was the *shared* group wrapper (`flyout.link-group.<row>.<col>`), not a unique-per-link id, so two links in the same group were indistinguishable to the recorder. Fix: added a stable, unique `actionId` → `data-studio-action` per link (`MegaMenuFlyout.tsx` + `healthServicesMegaMenuMount.tsx`'s `slugifyLinkAction`).
  2. **Structural, not fixed (backlog):** the full event-kind list is `transport | touchpoint | screen | demo-click | director-script | beat-enter | wire-intent | studio | scroll | typed-text | dwell` — there is **no `hover` kind at all**. Hover-driven open/close can never itself become a CJM step. Compounding this, `MegaMenuFlyout` unmounts (`return null`) when `open=false` (same contract as `DisclosureContent`), so a recorded click's target genuinely does not exist in the DOM at replay time unless something first reopens the panel — and nothing can, since the open trigger isn't captured.
- **PO decision (same session):** wants the real fix eventually — a first-class `hover-reveal` event kind through capture → compile → replay, engine-wide (not a mega-menu-only patch) — but explicitly **not now**. Do not build the interim "keep mounted, hidden via CSS" workaround either; leave the gap honestly documented. See [NEXT_STEPS.md](./NEXT_STEPS.md) LATER 12b · [PRODUCT_OWNER_BRIEF.md](./PRODUCT_OWNER_BRIEF.md) ledger 2026-07-23.
- **Pattern to watch:** before telling a PO that a new hover-driven or otherwise non-click-triggered interactive kit is "REC-ready," check (a) whether its trigger's event *kind* exists in `recordingTypes.ts`'s captured kinds and (b) whether the component **unmounts** its interactive content when hidden (unmount = no replay target without a captured reveal step; hidden-but-mounted, like the existing login flyout in `headerMount.tsx`, is the only pattern that tolerates an uncaptured reveal).
- **Gate:** `npm test` 947/947 green (2 new: `data-studio-action` render test in `megaMenuFlyout.test.ts`; updated group-link-count assertions in `healthServicesMegaMenuMount.test.ts`), `npm run build` green. Live MCP hover screenshot confirmed left-aligned row 3 + capped link counts (separate content/layout ask, same session).

## 2026-07-23 — Mega-menu scrim washed over the header AND painted on top of its own flyout panel — two separate CSS stacking defaults, not one bug

- **Ask:** immediately after shipping the `module.mega.menu` scrim, PO reported it visually covered the header/breadcrumb (should stay crisp/undimmed) and appeared to render on top of the flyout panel itself (should stay behind it, dimming only the page beneath).
- **Root cause 1 (scrim over the panel):** the panel (`.uxds-mega-menu-flyout`) had no `position` set (computed `position: static`), while the scrim was `position: fixed`. Per CSS painting order, *any* positioned element paints above non-positioned siblings **regardless of DOM order** — the scrim (positioned) always drew above the panel (static) even though the panel came later in markup. This is a general trap: adding a `position: fixed/absolute` decorative layer next to an existing unpositioned component silently reorders paint, not just z-index comparison — a plain z-index doesn't even apply until the other element is positioned too.
- **Root cause 2 (scrim over the header):** the scrim was `position: fixed; inset: 0` — anchored to the *real viewport* y:0, reaching up over the header/breadcrumb above the flyout — and it was nested inside the Boots mount's absolutely-positioned host (`z-index: 998`), which (because the header itself carries no explicit `z-index`) always painted above the header in their shared stacking context regardless of the scrim's own value.
- **Fix — both by construction, not by z-index tuning:** (a) the flyout root is now a real positioned wrapper (`.uxds-mega-menu-flyout__root { position: relative }`, `data-name="module.mega.menu"`), not a bare Fragment — the scrim's `position: absolute; top: 0` is now anchored to the flyout's *own* top edge (wherever the host mounts it — already flush under the header) instead of the true viewport top, so it geometrically cannot reach above the header no matter what z-index math happens elsewhere; (b) both the scrim (`z-index: 0`) and the panel (`position: relative; z-index: 1`) now carry explicit, comparable z-index values so paint order is deterministic instead of relying on the "positioned beats non-positioned" default.
- **Verified via computed styles, not a screenshot guess:** live MCP `getComputedStyle` + `getBoundingClientRect` before writing the fix (`header.top + header.height === scrim.top` exactly, `panel.zIndex(1) > scrim.zIndex(0)`), then again after, to confirm the geometry — screenshots alone would not have distinguished "scrim above panel" from "scrim above header" as two separate root causes.
- **Pattern to watch:** whenever a shared UXDS kit adds a decorative `position: fixed`/`absolute` overlay layer (scrim, glow, backdrop) next to existing kit markup, audit **every sibling's computed `position`** first — an unpositioned sibling will always lose the paint order regardless of z-index, and a `fixed` layer nested inside a positioned host with a naive `inset: 0` will escape past whatever the host is supposed to sit under (header, sticky nav, etc.) unless it's anchored to the kit's own container instead of the true viewport.
- **Gate:** 2 new regression tests in `megaMenuFlyout.test.ts` (root wrapper is a real DOM node containing both scrim + panel; scrim is `position: absolute` not `fixed`, anchored `top: 0`, and `z-index` strictly below the panel's) so this exact bug class fails a unit test, not just a live screenshot, if it regresses. Full `npm test` 951/951 green, `npm run build` green. Live MCP `getComputedStyle` re-verified: header `top:88.7 height:96` → scrim `top:184.7` (flush, zero overlap); panel `z-index:1` > scrim `z-index:0`.

## 2026-07-23 — `AnimatePresence` show/hide added to mega-menu flyout: real-timer unit tests need TWO separate `act()` phases, not one

- **Ask:** PO wanted the mega-menu flyout's show/hide to have "a nice touch" — swapped the kit's `if (!open) return null` for `framer-motion` `AnimatePresence` (opacity + tiny y, per `MOTION.md`'s "enter/exit presence" row — same idiom as `StudioNavStudioSelect`), so `open=false` now plays a real exit transition before the panel actually leaves the DOM instead of vanishing instantly.
- **Trap hit while updating the existing hover open/close unit test:** the test dispatched `mouseleave`, then did `await act(async () => { await new Promise(r => setTimeout(r, N)) })` for a single generous `N` (tried 500ms, then 1200ms) and the panel **never** disappeared — `getAttribute("style")` polled every 200ms inside the same `act()` call showed `opacity: 1; transform: none` unchanged the whole time, even though a debug log confirmed the production `setTimeout` had already fired `root.render(<MegaMenuFlyout open={false} />)`.
- **Root cause:** this test file sets `IS_REACT_ACT_ENVIRONMENT = true` at module scope (required so React doesn't warn on `createRoot().render()` outside a real test-renderer). With that flag on, React queues **every** state update — including `AnimatePresence`'s own internal "start exiting" `setState` from its effect, and its later "now actually remove" `setState` once the animation finishes — into an internal `actQueue`, and that queue is only drained **at the moment an `act()` call's scope ends**, not continuously while real timers tick inside one long-lived `act(async () => { ...multiple awaits... })`. A single `act()` spanning the whole wait only flushes once, right at the very end — so mid-loop polls inside that same `act()` are reading pre-flush, stale DOM, and the final flush lands at the same instant as the assertion, before the (real, wall-clock) exit animation has had any separately-flushed window to run.
- **Fix — split into two sequential `act()` calls, each ending at a real checkpoint:** (1) one `act()` that dispatches `mouseleave` and waits past the hide delay, then **ends** — this flushes the "start exiting" update, and the panel is still present (asserted `toBeTruthy()`, now visually mid-exit); (2) a **second, separate** `act()` that just waits past the exit transition duration and ends — this flushes the "now remove" update once the animation has actually had real time to run, and *that's* when the panel becomes `null`. One `act()` boundary per state-flip you need flushed — not one boundary around an arbitrarily long wait.
- **Where fixed:** `src/uxds/interactions/__tests__/megaMenuFlyout.test.ts` (new test, single sync `act()` to flip `open` + one `await act(async…)` afterward — the sync `act()` flushes immediately since it has no `await`, so only one follow-up phase was needed there) and `src/projects/boots-pharmacy/chrome/__tests__/healthServicesMegaMenuMount.test.ts` (needed the full two-phase pattern since both the hide-delay flip *and* the exit-transition completion are separately timer-driven in that hop).
- **Pattern to watch:** any kit that moves from an instant `if (!open) return null` to `AnimatePresence`-driven exit needs its existing "closes/unmounts" tests re-audited — a bare `expect(...).toBeNull()` immediately after flipping the prop will now be testing the *old*, no-longer-true contract (instant unmount). Assert "still present, now exiting" right after the flip, then a **separate** `act()` phase for the real animation duration before asserting removal.
- **Gate:** `npm test` 952/952 green (both mega-menu test files), `npm run build` green. Live MCP hover-in/hover-out on `:5173` PLP screen confirmed a clean visual fade in and out, no flash of the scrim or layout jump.

---

## How to append

Add a `## YYYY-MM-DD` section with concrete bullets (symptom → root cause → gate). Link the audit SHA or commit when relevant.

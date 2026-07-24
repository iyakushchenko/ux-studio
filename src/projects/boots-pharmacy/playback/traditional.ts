import {
  isHeaderLoggedIn,
  isInWishlist,
  PDP_WISHLIST_ID,
  plpTileWishlistId,
  resetPdpWishlistForPlayback,
  resetPlpTileBookmarkForPlayback,
} from "@/projects/boots-pharmacy/chrome/headerMount";
import type { JourneyRuntime, TabScriptId } from "@/app/orchestra/types";
import type { PlaybackScriptOptions } from "@/projects/playbackScriptOptions";
import { runSelectLocationStore } from "./availability";
import {
  clearSimulatedClickRipples,
  delay,
  isClickableTarget,
  isDemoCursorJourneyModePinned,
  releaseDemoCursorAfterScript,
  removeDemoCursor,
  resetDemoCursorTravelOrigin,
  simulateDemoPointerClick,
  simulateDemoPointerHover,
} from "@/app/scenario/demoCursor";
import { getPrototypeScrollRoot, scrollCameraToOrigin } from "@/app/scenario/playbackScroll";
import { playbackReadinessDelay } from "@/app/scenario/playbackReadiness";
import { PROJECT_SCREENS } from "@/projects/boots-pharmacy/screens/screens";
import {
  scriptAborted,
  scriptFail,
  scriptOk,
  type PlaybackScriptResult,
} from "@/projects/playbackScriptResult";

const AVAIL_DEMO_STORE = "covent";
const BOOK_STEP1_PICK_INTENT = {
  step: "list" as const,
  query: "London",
  pickLocation: true,
};
const SETTLE_MS = 320;
const LOGIN_POPUP_SETTLE_MS = 380;
const LOGIN_AFTER_SIGNIN_MS = 360;
const CHOSEN_LOCATION_SETTLE_MS = 420;
const AVATAR_DOT_SHOWCASE_MS = 5000;

let playbackAborted = false;
let playbackGeneration = 0;
let activeRunGeneration = 0;
let traditionalScriptInFlight = false;

export function abortTraditionalPlayback(): void {
  playbackGeneration += 1;
  playbackAborted = true;
  resetDemoCursorTravelOrigin();
  if (traditionalScriptInFlight) {
    removeDemoCursor({ immediate: true });
  }
  traditionalScriptInFlight = false;
  clearSimulatedClickRipples();
}

export function wasTraditionalPlaybackAborted(): boolean {
  return playbackAborted;
}

function shouldAbort(): boolean {
  return (
    playbackAborted || activeRunGeneration !== playbackGeneration
  );
}

function abortOr(step: string): PlaybackScriptResult {
  return shouldAbort() ? scriptAborted() : scriptFail(step);
}

async function wrapBool(
  run: () => Promise<boolean>,
  failStep: string
): Promise<PlaybackScriptResult> {
  const ok = await run();
  if (ok) return scriptOk();
  return abortOr(failStep);
}

async function waitForSelector(
  root: ParentNode,
  selector: string,
  tries = 80
): Promise<HTMLElement | null> {
  for (let i = 0; i < tries; i++) {
    const el = root.querySelector<HTMLElement>(selector);
    if (el) return el;
    await playbackReadinessDelay(50);
  }
  return null;
}

function screenSelector(childIndex: number): string {
  return `.studio-viewport > div > div:nth-child(${childIndex})`;
}

async function waitForActiveScreen(childIndex: number): Promise<HTMLElement | null> {
  for (let i = 0; i < 100; i++) {
    const screen = document.querySelector<HTMLElement>(screenSelector(childIndex));
    if (screen && isClickableTarget(screen)) return screen;
    await playbackReadinessDelay(50);
  }
  return null;
}

function queryVisibleProtoScreen(childIndex: number): HTMLElement | null {
  const screen = document.querySelector<HTMLElement>(screenSelector(childIndex));
  if (screen && isClickableTarget(screen)) return screen;
  return null;
}

/** Engine contract first; legacy Legacy attr kept for residual Legacy History. */
const HISTORY_VIEW_DETAILS_SEL =
  '[data-studio-action="history-view-details"], [data-studio-appointment-view-details="true"]';

function findVisibleHistoryViewDetails(
  screen: HTMLElement
): HTMLElement | null {
  // Legacy exports a zero-size / display:none ghost card first — never first-match.
  const cards = screen.querySelectorAll<HTMLElement>(
    '[data-name="boots-pharmacy.component.ma.acc.overview.recent.order"]'
  );
  for (const card of cards) {
    if (!isClickableTarget(card)) continue;
    const viewBtn = card.querySelector<HTMLElement>(HISTORY_VIEW_DETAILS_SEL);
    if (viewBtn && isClickableTarget(viewBtn)) return viewBtn;
  }
  return (
    Array.from(
      screen.querySelectorAll<HTMLElement>(HISTORY_VIEW_DETAILS_SEL)
    ).find((btn) => isClickableTarget(btn)) ?? null
  );
}

function resolveHistoryScreenHost(): HTMLElement | null {
  const byScreenId = document.querySelector<HTMLElement>(
    '[data-studio-react-screen="appointment-history"]'
  );
  if (byScreenId && isClickableTarget(byScreenId)) return byScreenId;
  return queryVisibleProtoScreen(2);
}

function isAppointmentHistoryReady(): boolean {
  const historyScreen = resolveHistoryScreenHost();
  if (!historyScreen) return false;
  return Boolean(findVisibleHistoryViewDetails(historyScreen));
}

async function waitForVisibleTarget(
  root: ParentNode,
  find: (scope: ParentNode) => HTMLElement | null
): Promise<HTMLElement | null> {
  for (let i = 0; i < 100; i++) {
    const target = find(root);
    if (target && isClickableTarget(target)) return target;
    await playbackReadinessDelay(50);
  }
  return null;
}

function findButtonByText(
  root: ParentNode,
  pattern: RegExp
): HTMLElement | null {
  return (
    Array.from(
      root.querySelectorAll<HTMLElement>('[data-name="component.input.button"]')
    ).find((btn) => pattern.test((btn.textContent ?? "").replace(/\s+/g, " ").trim())) ??
    null
  );
}

/**
 * Prefer React PDP Book now. Legacy `[data-name="component.input.button"]`
 * under `data-studio-legacy-retired` still wins first-match and can transport-no-op
 * when wire is gated by `isPdpReactMounted()` — same class as Chat/Home (LESSONS).
 */
export function findPdpBookNowBtn(root: ParentNode): HTMLElement | null {
  const scope = root instanceof Element ? root : document;
  const reactBtn =
    scope.querySelector<HTMLElement>(
      [
        '.studio-react-screen-host button[data-studio-action="pdp-book-now"]',
        '[data-studio-react-screen="pdp"] button[data-studio-action="pdp-book-now"]',
        '.pdp button[data-studio-action="pdp-book-now"]',
      ].join(", ")
    ) ?? null;
  if (reactBtn && !reactBtn.closest("[data-studio-legacy-retired]")) {
    return reactBtn;
  }

  return (
    Array.from(
      scope.querySelectorAll<HTMLElement>(
        'button[data-studio-action="pdp-book-now"], [data-name="component.input.button"]'
      )
    ).find((btn) => {
      if (btn.closest("[data-studio-legacy-retired]")) return false;
      if (btn.getAttribute("data-studio-action") === "pdp-book-now") return true;
      return /^book now/i.test(
        (btn.textContent ?? "").replace(/\s+/g, " ").trim()
      );
    }) ?? null
  );
}

function findPdpWishlistBtn(root: ParentNode): HTMLElement | null {
  const scope = root instanceof Element ? root : document;
  return (
    scope
      .querySelector<HTMLElement>(`[data-studio-wishlist-id="${PDP_WISHLIST_ID}"]`)
      ?.closest<HTMLElement>("button") ?? null
  );
}

const PLP_TILE_SELECTOR = '[data-name="boots-pharmacy.service.tile"]';

function findFirstVisiblePlpTile(scope: ParentNode): HTMLElement | null {
  const reactHost =
    scope instanceof Element
      ? scope.querySelector<HTMLElement>(
          '[data-studio-react-screen="plp"], .studio-react-screen-host .plp, main.plp'
        )
      : null;
  const searchRoot = reactHost ?? scope;
  return (
    Array.from(searchRoot.querySelectorAll<HTMLElement>(PLP_TILE_SELECTOR)).find(
      (tile) =>
        !tile.closest("[data-studio-legacy-retired]") &&
        !tile.classList.contains("proto-plp-tile--hidden") &&
        isClickableTarget(tile)
    ) ?? null
  );
}

function findPlpBookmarkBtn(tile: HTMLElement): HTMLElement | null {
  const byAttr = tile.querySelector<HTMLElement>(
    "[data-studio-wishlist-id]"
  );
  if (byAttr) return byAttr;
  return (
    Array.from(
      tile.querySelectorAll<HTMLElement>('[data-name="component.input.button"]')
    ).find((btn) =>
      /(add to bookmarks|in your bookmarks|remove from bookmarks)/i.test(
        (btn.textContent ?? "").replace(/\s+/g, " ").trim()
      )
    ) ?? null
  );
}

function findHeaderSarahAvatar(): HTMLElement | null {
  return (
    document.querySelector<HTMLElement>(
      '.proto-header-sticky .proto-header-avatar:not(.proto-header-avatar--guest)'
    ) ?? null
  );
}

function findHeaderSarahAvatarNavItem(): HTMLElement | null {
  const avatar = findHeaderSarahAvatar();
  return (
    avatar?.closest<HTMLElement>('[data-name="component.header.aux.nav.item"]') ??
    null
  );
}

async function showcaseSarahAvatarDot(
  options?: { skip?: boolean }
): Promise<boolean> {
  // Traditional CJM hits PLP before login — Sarah's avatar dot is post-login only.
  if (!isHeaderLoggedIn()) {
    return true;
  }

  const avatar = await waitForVisibleTarget(document, () => findHeaderSarahAvatar());
  if (!avatar || shouldAbort()) return false;

  if (options?.skip) {
    await delay(AVATAR_DOT_SHOWCASE_MS);
    return true;
  }

  const navItem = findHeaderSarahAvatarNavItem();
  await simulateDemoPointerHover(avatar, AVATAR_DOT_SHOWCASE_MS, {
    shouldAbort,
    scroll: false,
    onHoverStart: () => {
      navItem?.classList.add("proto-demo-avatar-hover");
      navItem?.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }));
    },
    onHoverEnd: () => {
      navItem?.dispatchEvent(new MouseEvent("mouseleave", { bubbles: true }));
      navItem?.classList.remove("proto-demo-avatar-hover");
    },
  });
  return !shouldAbort();
}

/**
 * The PLP heart flips its optimistic hover/pressed state instantly, but the
 * real wishlist store write is intentionally held open (PLP_WISHLIST_ADD_DELAY_MS,
 * see plpCatalog.ts) so the state change stays visible longer. Wait for the
 * real commit here so the avatar-dot showcase right after never races ahead
 * and hovers an empty dot.
 */
async function waitForWishlistCommit(id: string, tries = 80): Promise<boolean> {
  for (let i = 0; i < tries; i++) {
    if (isInWishlist(id)) return true;
    if (shouldAbort()) return false;
    await playbackReadinessDelay(50);
  }
  return isInWishlist(id);
}

async function addFirstPlpTileBookmark(
  tile: HTMLElement,
  options?: { skip?: boolean }
): Promise<boolean> {
  const bookmarkBtn = findPlpBookmarkBtn(tile);
  if (!bookmarkBtn || shouldAbort()) return false;
  const wishId =
    bookmarkBtn.getAttribute("data-studio-wishlist-id") ?? plpTileWishlistId(0);

  if (options?.skip) {
    bookmarkBtn.click();
    await waitForWishlistCommit(wishId);
    await delay(120);
    return true;
  }

  const clicked = await simulateDemoPointerClick(bookmarkBtn, {
    shouldAbort,
    scroll: false,
  });
  if (!clicked || shouldAbort()) return false;
  await waitForWishlistCommit(wishId);
  await delay(SETTLE_MS);
  return true;
}

function findLoginSignInButton(loginCard: ParentNode): HTMLElement | null {
  return (
    loginCard.querySelector<HTMLElement>(".proto-login-cta") ??
    Array.from(loginCard.querySelectorAll<HTMLElement>("button")).find((btn) =>
      /^sign in$/i.test((btn.textContent ?? "").trim())
    ) ??
    null
  );
}

async function settleLoginPopup(card: HTMLElement): Promise<HTMLElement | null> {
  if (shouldAbort()) return null;
  await delay(LOGIN_POPUP_SETTLE_MS);
  return card;
}

async function pollForLoginPopup(tries = 40): Promise<HTMLElement | null> {
  for (let i = 0; i < tries; i++) {
    if (shouldAbort()) return null;
    const card = document.querySelector<HTMLElement>(".proto-login-card");
    if (card && isClickableTarget(card)) return card;
    await playbackReadinessDelay(50);
  }
  return null;
}

async function waitForLoginPopupClosed(): Promise<void> {
  for (let i = 0; i < 60; i++) {
    if (!document.querySelector<HTMLElement>(".proto-login-card")) return;
    await playbackReadinessDelay(50);
  }
}

async function runLoginPopupSignIn(
  loginCard: HTMLElement,
  options?: { skip?: boolean }
): Promise<boolean> {
  const signInBtn = await waitForVisibleTarget(loginCard, findLoginSignInButton);
  if (!signInBtn || shouldAbort()) return false;

  const clicked = await simulateDemoPointerClick(signInBtn, {
    shouldAbort,
    scroll: false,
  });
  if (!clicked || shouldAbort()) return false;

  await delay(options?.skip ? LOGIN_AFTER_SIGNIN_MS : LOGIN_AFTER_SIGNIN_MS + 120);
  await waitForLoginPopupClosed();
  return true;
}

async function openLoginFromPdpQuickSignIn(
  runtime: JourneyRuntime,
  options?: { skip?: boolean }
): Promise<HTMLElement | null> {
  const pdpTabIndex = PROJECT_SCREENS.findIndex((screen) => screen.childIndex === 8);
  if (pdpTabIndex >= 0) {
    runtime.goToTab(pdpTabIndex);
    await delay(120);
  }

  const screen = await waitForActiveScreen(8);
  if (!screen || shouldAbort()) return null;

  await delay(SETTLE_MS);

  const signInLink = await waitForVisibleTarget(screen, (scope) =>
    Array.from(scope.querySelectorAll<HTMLElement>("p")).find(
      (p) => (p.textContent ?? "").trim() === "Quick Sign In"
    ) ?? null
  );
  if (!signInLink || shouldAbort()) return null;

  if (options?.skip) {
    signInLink.click();
  } else {
    const clicked = await simulateDemoPointerClick(signInLink, {
      shouldAbort,
      scroll: false,
    });
    if (!clicked || shouldAbort()) return null;
  }

  const card = await pollForLoginPopup(80);
  if (!card || shouldAbort()) return null;
  return settleLoginPopup(card);
}

/**
 * PLP mounts with its own "content-load interim" spinner over the tiles
 * (platform pattern — not a one-off), independent of the wishlist delay.
 * A click that lands while that overlay is still up races the tile's own
 * re-render and can drop the optimistic heart flip. Wait for it to clear.
 */
async function waitForPlpListingSettled(
  screen: ParentNode,
  tries = 80
): Promise<void> {
  for (let i = 0; i < tries; i++) {
    if (!screen.querySelector("[data-studio-plp-listing-loader]")) return;
    if (shouldAbort()) return;
    await playbackReadinessDelay(50);
  }
}

async function runPlpOpenPdp(options?: { skip?: boolean }): Promise<PlaybackScriptResult> {
  resetDemoCursorTravelOrigin();

  const screen = await waitForActiveScreen(9);
  if (!screen) {
    return abortOr("waitForActiveScreen(childIndex=9): PLP screen not visible");
  }

  await delay(SETTLE_MS);
  await waitForPlpListingSettled(screen);

  const tile = await waitForVisibleTarget(screen, findFirstVisiblePlpTile);
  if (!tile) {
    return abortOr(
      "findFirstVisiblePlpTile: no visible [data-name=boots-pharmacy.service.tile]"
    );
  }

  resetPlpTileBookmarkForPlayback(tile, 0);

  if (!(await addFirstPlpTileBookmark(tile, options))) {
    return abortOr(
      "addFirstPlpTileBookmark: Add to bookmarks button missing or click failed"
    );
  }
  if (!(await showcaseSarahAvatarDot(options))) {
    return abortOr(
      "showcaseSarahAvatarDot: logged-in header avatar not found or hover aborted"
    );
  }

  const bookBtn = await waitForVisibleTarget(tile, (scope) =>
    findButtonByText(scope, /^book now$/i)
  );
  if (!bookBtn) {
    return abortOr('findButtonByText: "Book now" on PLP tile not found');
  }

  if (options?.skip) {
    bookBtn.click();
    return scriptOk();
  }

  await simulateDemoPointerClick(bookBtn, { shouldAbort, scroll: false });
  await delay(SETTLE_MS);
  return shouldAbort() ? scriptAborted() : scriptOk();
}

/**
 * Scripted PDP "Add to Bookmarks" click — same held-open commit contract as
 * PLP's tile heart (`addFirstPlpTileBookmark`), so Play journey actually
 * demonstrates the pending-spinner/commit-pulse IxD instead of skipping the
 * control entirely.
 */
async function clickPdpWishlistHeart(
  screen: HTMLElement,
  options?: { skip?: boolean }
): Promise<boolean> {
  resetPdpWishlistForPlayback(screen);

  const heartBtn = await waitForVisibleTarget(screen, findPdpWishlistBtn);
  if (!heartBtn || shouldAbort()) return false;

  if (options?.skip) {
    heartBtn.click();
    await waitForWishlistCommit(PDP_WISHLIST_ID);
    await delay(120);
    return !shouldAbort();
  }

  const clicked = await simulateDemoPointerClick(heartBtn, {
    shouldAbort,
    scroll: false,
  });
  if (!clicked || shouldAbort()) return false;
  await waitForWishlistCommit(PDP_WISHLIST_ID);
  await delay(SETTLE_MS);
  return !shouldAbort();
}

async function runPdpBookNow(
  runtime: JourneyRuntime,
  options?: { skip?: boolean }
): Promise<boolean> {
  let screen = await waitForActiveScreen(8);
  if (!screen) {
    const pdpTabIndex = PROJECT_SCREENS.findIndex((s) => s.childIndex === 8);
    if (pdpTabIndex >= 0) {
      runtime.goToTab(pdpTabIndex);
      await delay(120);
    }
    screen = await waitForActiveScreen(8);
  }
  if (!screen || shouldAbort()) return false;

  await delay(SETTLE_MS);

  if (!(await clickPdpWishlistHeart(screen, options))) return false;

  const bookBtn = await waitForVisibleTarget(screen, findPdpBookNowBtn);
  if (!bookBtn || shouldAbort()) return false;

  if (options?.skip) {
    bookBtn.click();
  } else {
    const clicked = await simulateDemoPointerClick(bookBtn, {
      shouldAbort,
      scroll: false,
    });
    if (!clicked || shouldAbort()) return false;
    await delay(SETTLE_MS);
  }

  return !shouldAbort();
}

async function runLoginSignIn(
  runtime: JourneyRuntime,
  options?: { skip?: boolean }
): Promise<boolean> {
  if (isHeaderLoggedIn()) {
    return true;
  }

  const polled = await pollForLoginPopup();
  const loginCard = polled
    ? await settleLoginPopup(polled)
    : await openLoginFromPdpQuickSignIn(runtime, options);

  if (!loginCard || shouldAbort()) return false;

  if (!(await runLoginPopupSignIn(loginCard, options))) return false;

  return !shouldAbort();
}

/** Prefer live React Book Step 1 — Legacy under `data-studio-legacy-retired` is a ghost. */
function liveBookStep1Root(screen: HTMLElement): HTMLElement {
  return (
    screen.querySelector<HTMLElement>(
      [
        '[data-studio-react-screen="book-step-1"]',
        ".studio-react-screen-host .book-step-1",
        ".book-step-1",
      ].join(", ")
    ) ?? screen
  );
}

function isLiveBookStep1Target(el: HTMLElement | null): el is HTMLElement {
  // Size/visibility checked by waitForVisibleTarget / simulate click — here only
  // skip Legacy-retired ghosts that win first-match querySelector.
  return Boolean(el && !el.closest("[data-studio-legacy-retired]"));
}

async function waitForBookStep1ChosenSlot(screen: HTMLElement): Promise<boolean> {
  const root = liveBookStep1Root(screen);
  for (let i = 0; i < 80; i++) {
    const slot = root.querySelector<HTMLElement>(
      ".book-step-1__chosen, .proto-chosen-slot"
    );
    if (slot && !slot.closest("[data-studio-legacy-retired]")) return true;
    await playbackReadinessDelay(50);
  }
  return false;
}

/** Prefer React Continue — Legacy-retired `component.input.button` is a ghost. */
export function findBookStep1ContinueBtn(
  screen: HTMLElement
): HTMLElement | null {
  const root = liveBookStep1Root(screen);
  const reactBtn = root.querySelector<HTMLElement>(
    '[data-studio-action="book-step-1-continue"]'
  );
  if (isLiveBookStep1Target(reactBtn)) return reactBtn;

  return (
    Array.from(
      root.querySelectorAll<HTMLElement>('[data-name="component.input.button"]')
    ).find(
      (btn) =>
        isLiveBookStep1Target(btn) &&
        /^continue$/i.test((btn.textContent ?? "").replace(/\s+/g, " ").trim())
    ) ?? null
  );
}

async function clickBookStep1Continue(
  screen: HTMLElement,
  options?: { skip?: boolean }
): Promise<boolean> {
  const continueBtn = findBookStep1ContinueBtn(screen);
  if (!continueBtn || shouldAbort()) {
    // Diag via cursor path — missing React Continue often looks like "scroll only".
    return false;
  }

  if (options?.skip) {
    continueBtn.click();
    return true;
  }

  // Scroll into view then click — Continue sits below the chosen-location card.
  // scroll:false left the camera scrolling (dwell/retreat) without a real click.
  return simulateDemoPointerClick(continueBtn, { shouldAbort, scroll: true });
}

function findBookStep1SearchField(scope: ParentNode): HTMLElement | null {
  const root =
    scope instanceof HTMLElement ? liveBookStep1Root(scope) : scope;
  const candidates = [
    root.querySelector<HTMLElement>(
      "[data-name='chosen location'] [data-name='component.input.field']"
    ),
    root.querySelector<HTMLElement>("button.book-step-1__search"),
    root.querySelector<HTMLElement>("[data-name='component.input.field']"),
    root.querySelector<HTMLElement>("[data-name='Text Field']"),
  ];
  return candidates.find((el) => isLiveBookStep1Target(el)) ?? null;
}

/** Opens location picker via Step 1 search field click (wire listener) or runtime fallback. */
async function openBookStep1LocationPicker(
  runtime: JourneyRuntime,
  screen: HTMLElement,
  options?: { skip?: boolean }
): Promise<boolean> {
  const searchField = await waitForVisibleTarget(screen, findBookStep1SearchField);
  if (searchField) {
    if (options?.skip) {
      searchField.click();
    } else {
      const clicked = await simulateDemoPointerClick(searchField, {
        shouldAbort,
        scroll: false,
      });
      if (!clicked || shouldAbort()) return false;
    }
    return true;
  }

  runtime.openAvailability({ ...BOOK_STEP1_PICK_INTENT });
  return true;
}

async function runBookLocationPick(
  runtime: JourneyRuntime,
  options?: { skip?: boolean }
): Promise<boolean> {
  const screen = await waitForActiveScreen(7);
  if (!screen || shouldAbort()) return false;

  await delay(SETTLE_MS);

  if (!(await openBookStep1LocationPicker(runtime, screen, options))) {
    return false;
  }

  await delay(options?.skip ? 200 : 450);
  if (shouldAbort()) return false;

  if (!(await runSelectLocationStore({ ...options, storeId: AVAIL_DEMO_STORE }))) {
    runtime.closeAvailability();
    return false;
  }
  if (shouldAbort()) return false;

  await delay(options?.skip ? CHOSEN_LOCATION_SETTLE_MS : CHOSEN_LOCATION_SETTLE_MS + 120);

  const step1Screen = (await waitForActiveScreen(7)) ?? screen;
  if (!step1Screen || shouldAbort()) return false;

  if (!(await waitForBookStep1ChosenSlot(step1Screen))) return false;

  if (!(await clickBookStep1Continue(step1Screen, options))) return false;

  await delay(SETTLE_MS);

  runtime.closeAvailability();
  runtime.closeAllPopups();
  // Wait for avail scrim to unmount — book-step2 dwell FAIL stray-popup-on-beat otherwise.
  for (let i = 0; i < 40; i++) {
    if (shouldAbort()) return false;
    const scrim = document.querySelector(".studio-avail-scrim, .proto-avail-scrim");
    if (!scrim) break;
    runtime.closeAvailability();
    runtime.closeAllPopups();
    await playbackReadinessDelay(50);
  }

  const scrimStillOpen = Boolean(
    document.querySelector(".studio-avail-scrim, .proto-avail-scrim")
  );
  if (scrimStillOpen) return false;

  return !shouldAbort();
}

async function runConfirmationOpenAppointments(
  runtime: JourneyRuntime,
  options?: { skip?: boolean }
): Promise<boolean> {
  if (isAppointmentHistoryReady()) {
    return true;
  }

  const screen = await waitForActiveScreen(3);
  if (!screen || shouldAbort()) return false;

  await delay(SETTLE_MS);

  const openBtn = await waitForVisibleTarget(screen, (scope) =>
    scope.querySelector<HTMLElement>('[data-studio-open-appointment="true"]')
  );
  if (!openBtn || shouldAbort()) return false;

  if (options?.skip) {
    openBtn.click();
    return true;
  }

  // Camera beat already framed the CTA — click without competing scroll.
  const clicked = await simulateDemoPointerClick(openBtn, {
    shouldAbort,
    scroll: false,
  });
  if (!clicked || shouldAbort()) return false;

  await delay(SETTLE_MS);
  return !shouldAbort();
}

async function waitForFirstHistoryViewDetails(
  screen: HTMLElement
): Promise<HTMLElement | null> {
  for (let i = 0; i < 80; i++) {
    const viewBtn = findVisibleHistoryViewDetails(screen);
    if (viewBtn) return viewBtn;
    await playbackReadinessDelay(50);
  }
  return null;
}

async function runHistoryViewDetails(
  runtime: JourneyRuntime,
  options?: { skip?: boolean }
): Promise<boolean> {
  let screen = resolveHistoryScreenHost();
  if (!screen) {
    runtime.goToTab(protoTabIndexForChild(2), {
      instant: options?.skip !== false,
    });
    await delay(options?.skip ? 80 : SETTLE_MS);
    for (let i = 0; i < 100 && !screen; i++) {
      screen = resolveHistoryScreenHost();
      if (screen) break;
      await playbackReadinessDelay(50);
    }
  }
  if (!screen || shouldAbort()) return false;

  await delay(SETTLE_MS);

  const viewBtn = await waitForFirstHistoryViewDetails(screen);
  if (!viewBtn || shouldAbort()) return false;

  if (options?.skip) {
    viewBtn.click();
    return true;
  }

  const clicked = await simulateDemoPointerClick(viewBtn, {
    shouldAbort,
  });
  if (!clicked || shouldAbort()) return false;

  await delay(SETTLE_MS);
  return !shouldAbort();
}

function protoTabIndexForChild(childIndex: number): number {
  const index = PROJECT_SCREENS.findIndex((screen) => screen.childIndex === childIndex);
  return index >= 0 ? index : 0;
}

async function snapScreenScrollTop(
  screen: HTMLElement,
  options?: { instant?: boolean }
): Promise<void> {
  const scrollEl = getPrototypeScrollRoot(screen);
  if (!scrollEl) return;
  // Camera SSoT — named origin, not anonymous scrollTo({top:0}).
  scrollCameraToOrigin(scrollEl, {
    instant: options?.instant !== false,
    force: true,
    reason: "traditional-retreat-tab-sync",
  });
}

/** CJM step-back — restore tab + scroll baseline without director clicks. */
async function syncTraditionalTabState(
  scriptId: TabScriptId,
  runtime: JourneyRuntime,
  options?: PlaybackScriptOptions
): Promise<PlaybackScriptResult> {
  const instant = options?.instant !== false;

  switch (scriptId) {
    case "plp-open-pdp": {
      runtime.goToTab(protoTabIndexForChild(9), { instant });
      await delay(instant ? 80 : SETTLE_MS);
      const screen = await waitForActiveScreen(9);
      if (!screen || shouldAbort()) return scriptOk();
      await snapScreenScrollTop(screen, { instant });
      const tile = findFirstVisiblePlpTile(screen);
      if (tile) resetPlpTileBookmarkForPlayback(tile, 0);
      return scriptOk();
    }
    case "pdp-book-now": {
      runtime.closeAllPopups();
      runtime.closeAvailability();
      runtime.goToTab(protoTabIndexForChild(8), { instant });
      await delay(instant ? 80 : SETTLE_MS);
      const screen = await waitForActiveScreen(8);
      if (screen) resetPdpWishlistForPlayback(screen);
      return scriptOk();
    }
    case "login-sign-in": {
      runtime.closeAllPopups();
      if (document.querySelector(".proto-login-card")) {
        runtime.closeAllPopups();
      }
      return scriptOk();
    }
    case "book-location-pick": {
      runtime.closeAllPopups();
      runtime.closeAvailability();
      runtime.goToTab(protoTabIndexForChild(7), { instant });
      await delay(instant ? 80 : SETTLE_MS);
      const screen = await waitForActiveScreen(7);
      if (screen) await snapScreenScrollTop(screen, { instant });
      return scriptOk();
    }
    case "confirmation-open-appointments": {
      runtime.closeAllPopups();
      runtime.closeAvailability();
      runtime.goToTab(protoTabIndexForChild(3), { instant });
      await delay(instant ? 80 : SETTLE_MS);
      await waitForActiveScreen(3);
      return scriptOk();
    }
    case "history-view-details": {
      runtime.closeAllPopups();
      runtime.closeAvailability();
      runtime.goToTab(protoTabIndexForChild(2), { instant });
      await delay(instant ? 80 : SETTLE_MS);
      for (let i = 0; i < 100; i++) {
        if (resolveHistoryScreenHost()) break;
        await playbackReadinessDelay(50);
      }
      return scriptOk();
    }
    default:
      return scriptOk();
  }
}

export async function runTraditionalScript(
  scriptId: TabScriptId,
  runtime: JourneyRuntime,
  options?: PlaybackScriptOptions
): Promise<PlaybackScriptResult> {
  activeRunGeneration = playbackGeneration;
  playbackAborted = false;
  traditionalScriptInFlight = true;
  try {
    if (options?.syncState) {
      return await syncTraditionalTabState(scriptId, runtime, options);
    }

    let result: PlaybackScriptResult;
    switch (scriptId) {
      case "plp-open-pdp":
        result = await runPlpOpenPdp(options);
        break;
      case "pdp-book-now":
        result = await wrapBool(
          () => runPdpBookNow(runtime, options),
          "runPdpBookNow: PDP screen or Book now button not ready"
        );
        break;
      case "login-sign-in":
        result = await wrapBool(
          () => runLoginSignIn(runtime, options),
          "runLoginSignIn: login popup flow failed"
        );
        break;
      case "book-location-pick":
        result = await wrapBool(
          () => runBookLocationPick(runtime, options),
          "runBookLocationPick: book step 1 location flow failed"
        );
        break;
      case "confirmation-open-appointments":
        result = await wrapBool(
          () => runConfirmationOpenAppointments(runtime, options),
          "runConfirmationOpenAppointments: open appointment control not found"
        );
        break;
      case "history-view-details":
        result = await wrapBool(
          () => runHistoryViewDetails(runtime, options),
          "runHistoryViewDetails: view details control not found"
        );
        break;
      default:
        result = scriptFail(`unknown tab script: ${String(scriptId)}`);
    }

    if (!shouldAbort()) {
      await releaseDemoCursorAfterScript();
      clearSimulatedClickRipples();
      if (!isDemoCursorJourneyModePinned()) {
        resetDemoCursorTravelOrigin();
      }
    }

    return result;
  } finally {
    traditionalScriptInFlight = false;
  }
}

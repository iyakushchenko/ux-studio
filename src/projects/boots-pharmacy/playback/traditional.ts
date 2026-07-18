import {
  isProtoHeaderLoggedIn,
  resetPlpTileBookmarkForPlayback,
} from "@/projects/boots-pharmacy/chrome/protoHeaderMount";
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
} from "@/app/proto/protoDemoCursor";
import { PROTO_SCREENS } from "@/projects/boots-pharmacy/screens/protoScreens";
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

export function abortTraditionalPlayback(): void {
  playbackGeneration += 1;
  playbackAborted = true;
  resetDemoCursorTravelOrigin();
  removeDemoCursor();
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
    await delay(50);
  }
  return null;
}

function screenSelector(childIndex: number): string {
  return `.proto-viewport > div > div:nth-child(${childIndex})`;
}

async function waitForActiveScreen(childIndex: number): Promise<HTMLElement | null> {
  for (let i = 0; i < 100; i++) {
    const screen = document.querySelector<HTMLElement>(screenSelector(childIndex));
    if (screen && isClickableTarget(screen)) return screen;
    await delay(50);
  }
  return null;
}

function queryVisibleProtoScreen(childIndex: number): HTMLElement | null {
  const screen = document.querySelector<HTMLElement>(screenSelector(childIndex));
  if (screen && isClickableTarget(screen)) return screen;
  return null;
}

function isAppointmentHistoryReady(): boolean {
  const historyScreen = queryVisibleProtoScreen(2);
  if (!historyScreen) return false;
  const firstCard = historyScreen.querySelector<HTMLElement>(
    '[data-name="boots-pharmacy.component.ma.acc.overview.recent.order"]'
  );
  const viewBtn = firstCard?.querySelector<HTMLElement>(
    '[data-proto-appointment-view-details="true"]'
  );
  return Boolean(viewBtn && isClickableTarget(viewBtn));
}

async function waitForVisibleTarget(
  root: ParentNode,
  find: (scope: ParentNode) => HTMLElement | null
): Promise<HTMLElement | null> {
  for (let i = 0; i < 100; i++) {
    const target = find(root);
    if (target && isClickableTarget(target)) return target;
    await delay(50);
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

function findPdpBookNowBtn(root: ParentNode): HTMLElement | null {
  return findButtonByText(root, /^book now/i);
}

const PLP_TILE_SELECTOR = '[data-name="boots-pharmacy.service.tile"]';

function findFirstVisiblePlpTile(scope: ParentNode): HTMLElement | null {
  return (
    Array.from(scope.querySelectorAll<HTMLElement>(PLP_TILE_SELECTOR)).find(
      (tile) =>
        !tile.classList.contains("proto-plp-tile--hidden") && isClickableTarget(tile)
    ) ?? null
  );
}

function findPlpBookmarkBtn(tile: HTMLElement): HTMLElement | null {
  return (
    Array.from(
      tile.querySelectorAll<HTMLElement>('[data-name="component.input.button"]')
    ).find((btn) =>
      /add to bookmarks/i.test((btn.textContent ?? "").replace(/\s+/g, " ").trim())
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
  if (!isProtoHeaderLoggedIn()) {
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

async function addFirstPlpTileBookmark(
  tile: HTMLElement,
  options?: { skip?: boolean }
): Promise<boolean> {
  const bookmarkBtn = findPlpBookmarkBtn(tile);
  if (!bookmarkBtn || shouldAbort()) return false;

  if (options?.skip) {
    bookmarkBtn.click();
    await delay(120);
    return true;
  }

  const clicked = await simulateDemoPointerClick(bookmarkBtn, { shouldAbort });
  if (!clicked || shouldAbort()) return false;
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
    await delay(50);
  }
  return null;
}

async function waitForLoginPopupClosed(): Promise<void> {
  for (let i = 0; i < 60; i++) {
    if (!document.querySelector<HTMLElement>(".proto-login-card")) return;
    await delay(50);
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
  const pdpTabIndex = PROTO_SCREENS.findIndex((screen) => screen.childIndex === 8);
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

async function runPlpOpenPdp(options?: { skip?: boolean }): Promise<PlaybackScriptResult> {
  resetDemoCursorTravelOrigin();

  const screen = await waitForActiveScreen(9);
  if (!screen) {
    return abortOr("waitForActiveScreen(childIndex=9): PLP screen not visible");
  }

  await delay(SETTLE_MS);

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

  await simulateDemoPointerClick(bookBtn, { shouldAbort });
  await delay(SETTLE_MS);
  return shouldAbort() ? scriptAborted() : scriptOk();
}

async function runPdpBookNow(
  runtime: JourneyRuntime,
  options?: { skip?: boolean }
): Promise<boolean> {
  let screen = await waitForActiveScreen(8);
  if (!screen) {
    const pdpTabIndex = PROTO_SCREENS.findIndex((s) => s.childIndex === 8);
    if (pdpTabIndex >= 0) {
      runtime.goToTab(pdpTabIndex);
      await delay(120);
    }
    screen = await waitForActiveScreen(8);
  }
  if (!screen || shouldAbort()) return false;

  await delay(SETTLE_MS);

  const bookBtn = await waitForVisibleTarget(screen, findPdpBookNowBtn);
  if (!bookBtn || shouldAbort()) return false;

  if (options?.skip) {
    bookBtn.click();
  } else {
    const clicked = await simulateDemoPointerClick(bookBtn, { shouldAbort });
    if (!clicked || shouldAbort()) return false;
    await delay(SETTLE_MS);
  }

  return !shouldAbort();
}

async function runLoginSignIn(
  runtime: JourneyRuntime,
  options?: { skip?: boolean }
): Promise<boolean> {
  if (isProtoHeaderLoggedIn()) {
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

async function waitForBookStep1ChosenSlot(screen: HTMLElement): Promise<boolean> {
  for (let i = 0; i < 80; i++) {
    if (screen.querySelector(".proto-chosen-slot")) return true;
    await delay(50);
  }
  return false;
}

function findBookStep1ContinueBtn(screen: HTMLElement): HTMLElement | null {
  return (
    Array.from(
      screen.querySelectorAll<HTMLElement>('[data-name="component.input.button"]')
    ).find((btn) =>
      /^continue$/i.test((btn.textContent ?? "").replace(/\s+/g, " ").trim())
    ) ?? null
  );
}

async function clickBookStep1Continue(
  screen: HTMLElement,
  options?: { skip?: boolean }
): Promise<boolean> {
  const continueBtn = findBookStep1ContinueBtn(screen);
  if (!continueBtn || shouldAbort()) return false;

  if (options?.skip) {
    continueBtn.click();
    return true;
  }

  return simulateDemoPointerClick(continueBtn, { shouldAbort });
}

function findBookStep1SearchField(scope: ParentNode): HTMLElement | null {
  return (
    scope.querySelector<HTMLElement>(
      "[data-name='chosen location'] [data-name='component.input.field']"
    ) ??
    scope.querySelector<HTMLElement>("[data-name='component.input.field']") ??
    scope.querySelector<HTMLElement>("[data-name='Text Field']")
  );
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
      const clicked = await simulateDemoPointerClick(searchField, { shouldAbort });
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
    scope.querySelector<HTMLElement>('[data-proto-open-appointment="true"]')
  );
  if (!openBtn || shouldAbort()) return false;

  if (options?.skip) {
    openBtn.click();
    return true;
  }

  const clicked = await simulateDemoPointerClick(openBtn, {
    shouldAbort,
  });
  if (!clicked || shouldAbort()) return false;

  await delay(SETTLE_MS);
  return !shouldAbort();
}

async function waitForFirstHistoryViewDetails(
  screen: HTMLElement
): Promise<HTMLElement | null> {
  for (let i = 0; i < 80; i++) {
    const firstCard = screen.querySelector<HTMLElement>(
      '[data-name="boots-pharmacy.component.ma.acc.overview.recent.order"]'
    );
    const viewBtn = firstCard?.querySelector<HTMLElement>(
      '[data-proto-appointment-view-details="true"]'
    );
    if (viewBtn && isClickableTarget(viewBtn)) return viewBtn;
    await delay(50);
  }
  return null;
}

async function runHistoryViewDetails(
  runtime: JourneyRuntime,
  options?: { skip?: boolean }
): Promise<boolean> {
  const screen = await waitForActiveScreen(2);
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

export async function runTraditionalScript(
  scriptId: TabScriptId,
  runtime: JourneyRuntime,
  options?: PlaybackScriptOptions
): Promise<PlaybackScriptResult> {
  activeRunGeneration = playbackGeneration;
  playbackAborted = false;
  if (options?.syncState) return scriptOk();

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
}

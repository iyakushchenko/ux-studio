import { isProtoHeaderLoggedIn } from "@/app/chrome/protoHeaderMount";
import type { JourneyRuntime, TabScriptId } from "@/app/orchestra/types";
import { runSelectLocationStore } from "@/app/proto/protoAvailabilityPlayback";
import {
  clearSimulatedClickRipples,
  delay,
  isClickableTarget,
  removeDemoCursor,
  simulateDemoPointerClick,
} from "@/app/proto/protoDemoCursor";
import { PROTO_SCREENS, protoTabToIndex } from "@/app/proto/protoScreens";

const AVAIL_DEMO_STORE = "covent";
const SETTLE_MS = 320;
const LOGIN_POPUP_SETTLE_MS = 380;
const LOGIN_AFTER_SIGNIN_MS = 360;
const CHOSEN_LOCATION_SETTLE_MS = 420;

let playbackAborted = false;

export function abortTraditionalPlayback(): void {
  playbackAborted = true;
  removeDemoCursor();
  clearSimulatedClickRipples();
}

export function wasTraditionalPlaybackAborted(): boolean {
  return playbackAborted;
}

function shouldAbort(): boolean {
  return playbackAborted;
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

function goToBookStep1(runtime: JourneyRuntime): void {
  runtime.goToTab(protoTabToIndex(5));
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

async function runPlpOpenPdp(options?: { skip?: boolean }): Promise<boolean> {
  const screen = await waitForActiveScreen(9);
  if (!screen || shouldAbort()) return false;

  await delay(SETTLE_MS);

  const target = await waitForVisibleTarget(screen, (scope) => {
    const tileLink =
      scope.querySelector<HTMLElement>("a.proto-plp-tile-title-link") ??
      scope.querySelector<HTMLElement>('[data-proto-plp-tile-title="true"]');
    if (tileLink && isClickableTarget(tileLink)) return tileLink;
    return findButtonByText(scope, /^book now$/i);
  });
  if (!target || shouldAbort()) return false;

  if (options?.skip) {
    target.click();
    return true;
  }

  await simulateDemoPointerClick(target, { shouldAbort });
  await delay(SETTLE_MS);
  return !shouldAbort();
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

  if (shouldAbort()) return false;

  if (isProtoHeaderLoggedIn()) {
    goToBookStep1(runtime);
  }

  return !shouldAbort();
}

async function runLoginSignIn(
  runtime: JourneyRuntime,
  options?: { skip?: boolean }
): Promise<boolean> {
  if (isProtoHeaderLoggedIn()) {
    goToBookStep1(runtime);
    return true;
  }

  const polled = await pollForLoginPopup();
  const loginCard = polled
    ? await settleLoginPopup(polled)
    : await openLoginFromPdpQuickSignIn(runtime, options);

  if (!loginCard || shouldAbort()) return false;

  if (!(await runLoginPopupSignIn(loginCard, options))) return false;

  goToBookStep1(runtime);
  removeDemoCursor();
  return !shouldAbort();
}

function prototypeScrollRoot(): HTMLElement | null {
  return document.querySelector<HTMLElement>(
    ".proto-scroll--prototype:not(.hidden)"
  );
}

async function smoothScrollToTarget(target: HTMLElement): Promise<void> {
  const scrollRoot = prototypeScrollRoot();
  target.scrollIntoView({ block: "center", behavior: "smooth" });
  await delay(280);

  if (!scrollRoot) return;

  const btnRect = target.getBoundingClientRect();
  const rootRect = scrollRoot.getBoundingClientRect();
  const padding = 72;

  if (btnRect.bottom > rootRect.bottom - padding) {
    scrollRoot.scrollTo({
      top:
        scrollRoot.scrollTop +
        (btnRect.bottom - rootRect.bottom) +
        padding,
      behavior: "smooth",
    });
    await delay(420);
    return;
  }

  if (btnRect.top < rootRect.top + padding) {
    scrollRoot.scrollTo({
      top:
        scrollRoot.scrollTop - (rootRect.top + padding - btnRect.top),
      behavior: "smooth",
    });
    await delay(420);
  }
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

  await smoothScrollToTarget(continueBtn);
  if (shouldAbort()) return false;

  return simulateDemoPointerClick(continueBtn, { shouldAbort, scroll: false });
}

async function runBookLocationPick(
  runtime: JourneyRuntime,
  options?: { skip?: boolean }
): Promise<boolean> {
  const screen = await waitForActiveScreen(7);
  if (!screen || shouldAbort()) return false;

  await delay(SETTLE_MS);

  const searchField =
    screen.querySelector<HTMLElement>(
      "[data-name='chosen location'] [data-name='component.input.field']"
    ) ??
    screen.querySelector<HTMLElement>("[data-name='component.input.field']") ??
    screen.querySelector<HTMLElement>("[data-name='Text Field']");

  if (searchField) {
    if (options?.skip) {
      searchField.click();
    } else {
      const clicked = await simulateDemoPointerClick(searchField, { shouldAbort });
      if (!clicked || shouldAbort()) return false;
    }
  } else {
    runtime.openAvailability({
      step: "list",
      query: "London",
      pickLocation: true,
    });
  }

  await delay(options?.skip ? 200 : 450);
  if (shouldAbort()) return false;

  if (!(await runSelectLocationStore({ ...options, storeId: AVAIL_DEMO_STORE }))) {
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

  await smoothScrollToTarget(openBtn);
  if (shouldAbort()) return false;

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

  await smoothScrollToTarget(viewBtn);
  if (shouldAbort()) return false;

  const clicked = await simulateDemoPointerClick(viewBtn, {
    shouldAbort,
    scroll: false,
  });
  if (!clicked || shouldAbort()) return false;

  await delay(SETTLE_MS);
  return !shouldAbort();
}

export async function runTraditionalScript(
  scriptId: TabScriptId,
  runtime: JourneyRuntime,
  options?: { skip?: boolean }
): Promise<boolean> {
  playbackAborted = false;

  switch (scriptId) {
    case "plp-open-pdp":
      return runPlpOpenPdp(options);
    case "pdp-book-now":
      return runPdpBookNow(runtime, options);
    case "login-sign-in":
      return runLoginSignIn(runtime, options);
    case "book-location-pick":
      return runBookLocationPick(runtime, options);
    case "confirmation-open-appointments":
      return runConfirmationOpenAppointments(runtime, options);
    case "history-view-details":
      return runHistoryViewDetails(runtime, options);
    default:
      return false;
  }
}

import { isProtoHeaderLoggedIn } from "@/app/chrome/protoHeaderMount";
import type { JourneyRuntime, TabScriptId } from "@/app/orchestra/types";
import { runAvailabilityScript } from "@/app/proto/protoAvailabilityPlayback";
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

  return !shouldAbort();
}

async function runLoginSignIn(
  runtime: JourneyRuntime,
  options?: { skip?: boolean }
): Promise<boolean> {
  const loginAlreadyOpen = Boolean(
    document.querySelector<HTMLElement>(".proto-login-card")
  );

  if (isProtoHeaderLoggedIn()) {
    goToBookStep1(runtime);
    return true;
  }

  if (!loginAlreadyOpen) {
    const pdpTabIndex = PROTO_SCREENS.findIndex((screen) => screen.childIndex === 8);
    if (pdpTabIndex >= 0) {
      runtime.goToTab(pdpTabIndex);
      await delay(120);
    }
  }

  const screen = await waitForActiveScreen(8);
  if (!screen || shouldAbort()) return false;

  await delay(loginAlreadyOpen ? 80 : SETTLE_MS);

  if (!loginAlreadyOpen) {
    const signInLink = await waitForVisibleTarget(screen, (scope) =>
      Array.from(scope.querySelectorAll<HTMLElement>("p")).find(
        (p) => (p.textContent ?? "").trim() === "Quick Sign In"
      ) ?? null
    );
    if (!signInLink || shouldAbort()) return false;

    if (options?.skip) {
      signInLink.click();
    } else {
      removeDemoCursor();
      const clicked = await simulateDemoPointerClick(signInLink, {
        shouldAbort,
        scroll: false,
      });
      if (!clicked || shouldAbort()) return false;
      await delay(420);
    }
    if (shouldAbort()) return false;
  } else {
    await delay(options?.skip ? 80 : 120);
  }

  const loginCard = await waitForSelector(document, ".proto-login-card");
  if (!loginCard || shouldAbort()) return false;

  await delay(options?.skip ? 80 : 280);

  const signInBtn = await waitForVisibleTarget(loginCard, (scope) =>
    Array.from(scope.querySelectorAll<HTMLElement>("button")).find((btn) =>
      /^sign in$/i.test((btn.textContent ?? "").trim())
    ) ?? null
  );
  if (!signInBtn || shouldAbort()) return false;

  if (options?.skip) {
    signInBtn.click();
  } else {
    removeDemoCursor();
    const clicked = await simulateDemoPointerClick(signInBtn, {
      shouldAbort,
      scroll: false,
    });
    if (!clicked || shouldAbort()) return false;
  }

  goToBookStep1(runtime);
  removeDemoCursor();
  return !shouldAbort();
}

function isRecipientChangeBtn(btn: HTMLElement | null): boolean {
  if (!btn || btn.getAttribute("data-name") !== "component.input.button") {
    return false;
  }
  if (!/^change$/i.test((btn.textContent ?? "").replace(/\s+/g, " ").trim())) {
    return false;
  }
  const card = btn.closest('[data-name="Week Schedule"]') as HTMLElement | null;
  if (!card) return false;
  return Array.from(card.querySelectorAll("p")).some((p) =>
    /^recipient$/i.test((p.textContent ?? "").trim())
  );
}

async function runRecipientConfirm(options?: { skip?: boolean }): Promise<boolean> {
  const screen = await waitForActiveScreen(7);
  if (!screen || shouldAbort()) return false;

  await delay(SETTLE_MS);

  const changeBtn = Array.from(
    screen.querySelectorAll<HTMLElement>('[data-name="component.input.button"]')
  ).find((btn) => isRecipientChangeBtn(btn));

  if (!changeBtn || shouldAbort()) return false;

  if (options?.skip) {
    changeBtn.click();
  } else {
    await simulateDemoPointerClick(changeBtn, { shouldAbort });
    await delay(360);
  }
  if (shouldAbort()) return false;

  const picker = await waitForSelector(document, ".proto-recipient-picker-card");
  if (!picker || shouldAbort()) return false;

  const confirmBtn = Array.from(picker.querySelectorAll<HTMLElement>("button")).find(
    (btn) => /^confirm$/i.test((btn.textContent ?? "").trim())
  );
  if (!confirmBtn || shouldAbort()) return false;

  if (options?.skip) {
    confirmBtn.click();
  } else {
    await simulateDemoPointerClick(confirmBtn, { shouldAbort });
    await delay(SETTLE_MS);
  }

  return !shouldAbort();
}

async function runBookLocationAvail(
  runtime: JourneyRuntime,
  options?: { skip?: boolean }
): Promise<boolean> {
  const screen = await waitForActiveScreen(7);
  if (!screen || shouldAbort()) return false;

  await delay(SETTLE_MS);

  runtime.openAvailability({
    step: "date",
    storeId: AVAIL_DEMO_STORE,
    selectedDate: { month: "June", day: 25 },
  });

  await delay(options?.skip ? 120 : 400);
  if (shouldAbort()) return false;

  if (!(await runAvailabilityScript("continue-from-date", options))) return false;
  if (shouldAbort()) return false;

  if (!(await runAvailabilityScript("select-time-slot", options))) return false;
  if (shouldAbort()) return false;

  if (!(await runAvailabilityScript("book-now", options))) return false;
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
    case "recipient-confirm":
      return runRecipientConfirm(options);
    case "book-location-avail":
      return runBookLocationAvail(runtime, options);
    default:
      return false;
  }
}

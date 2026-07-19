import {
  clearSimulatedClickRipples,
  delay,
  isDemoCursorJourneyModePinned,
  releaseDemoCursorAfterScript,
  removeDemoCursor,
  simulateDemoPointerClick,
} from "@/app/scenario/demoCursor";
import {
  animateScrollElementIntoView,
  animateScrollTo,
  computeScrollTopForElement,
} from "@/app/scenario/playbackScroll";
import type { AvailabilityScriptId } from "@/app/orchestra/types";
import type { PlaybackScriptOptions } from "@/projects/playbackScriptOptions";
import {
  scriptAborted,
  scriptFail,
  scriptOk,
  type PlaybackScriptResult,
} from "@/projects/playbackScriptResult";

/** Demo date picked during journey playback on the Availability date step. */
const PLAYBACK_TARGET_DATE_DAY = 21;

let playbackAborted = false;

export function abortAvailabilityPlayback(): void {
  playbackAborted = true;
  removeDemoCursor({ immediate: true });
  clearSimulatedClickRipples();
}

export function wasAvailabilityPlaybackAborted(): boolean {
  return playbackAborted;
}

function shouldAbort(): boolean {
  return playbackAborted;
}

async function wrapAvailBool(
  run: () => Promise<boolean>,
  failStep: string
): Promise<PlaybackScriptResult> {
  const ok = await run();
  if (ok) return scriptOk();
  return shouldAbort() ? scriptAborted() : scriptFail(failStep);
}

function availCard(): HTMLElement | null {
  return document.querySelector<HTMLElement>(".proto-avail-card");
}

async function waitForAvailCard(): Promise<HTMLElement | null> {
  for (let i = 0; i < 100; i++) {
    const card = availCard();
    if (card) return card;
    await delay(50);
  }
  return null;
}

async function waitForSelector(
  card: HTMLElement,
  selector: string
): Promise<HTMLElement | null> {
  for (let i = 0; i < 80; i++) {
    const el = card.querySelector<HTMLElement>(selector);
    if (el) return el;
    await delay(50);
  }
  return null;
}

async function waitForDateStep(card: HTMLElement): Promise<boolean> {
  for (let i = 0; i < 80; i++) {
    if (card.querySelector(".proto-avail-calendars")) return true;
    await delay(50);
  }
  return false;
}

async function findDateCell(
  card: HTMLElement,
  day: number
): Promise<HTMLElement | null> {
  for (let i = 0; i < 80; i++) {
    const cells = Array.from(
      card.querySelectorAll<HTMLElement>(
        ".proto-avail-cal-cell:not(.proto-avail-cal-cell--time):not(.proto-avail-cal-cell--disabled)"
      )
    );
    const cell = cells.find((el) => el.textContent?.trim() === String(day));
    if (cell) return cell;
    await delay(50);
  }
  return null;
}

async function runContinueFromDate(options?: { skip?: boolean }): Promise<PlaybackScriptResult> {
  const card = await waitForAvailCard();
  if (!card) {
    return shouldAbort()
      ? scriptAborted()
      : scriptFail("waitForAvailCard: .proto-avail-card missing");
  }

  if (!(await waitForDateStep(card))) {
    return shouldAbort()
      ? scriptAborted()
      : scriptFail("waitForDateStep: .proto-avail-calendars not visible");
  }

  const dateCell = await findDateCell(card, PLAYBACK_TARGET_DATE_DAY);
  if (!dateCell) {
    return shouldAbort()
      ? scriptAborted()
      : scriptFail(`findDateCell: day ${PLAYBACK_TARGET_DATE_DAY} not found`);
  }

  if (!dateCell.classList.contains("proto-avail-cal-cell--selected")) {
    if (options?.skip) {
      dateCell.click();
    } else {
      await simulateDemoPointerClick(dateCell, { shouldAbort });
    }
    if (shouldAbort()) return scriptAborted();
    await delay(280);
  }

  const continueBtn = await waitForSelector(
    card,
    ".proto-avail-footer .proto-avail-btn-primary"
  );
  if (!continueBtn) {
    return shouldAbort()
      ? scriptAborted()
      : scriptFail("waitForSelector: availability Continue button missing");
  }

  if (options?.skip) {
    continueBtn.click();
    return scriptOk();
  }

  await simulateDemoPointerClick(continueBtn, { shouldAbort });
  await delay(320);
  return shouldAbort() ? scriptAborted() : scriptOk();
}

async function runSelectTimeSlot(options?: { skip?: boolean }): Promise<boolean> {
  const card = await waitForAvailCard();
  if (!card || shouldAbort()) return false;

  const slots = Array.from(
    card.querySelectorAll<HTMLElement>(
      ".proto-avail-cal-cell--time:not(.proto-avail-cal-cell--disabled)"
    )
  );

  const preferredTimes = ["15:30", "15:00", "16:15", "16:45"];
  const slot =
    preferredTimes
      .map((time) =>
        slots.find(
          (btn) =>
            btn.textContent?.trim() === time &&
            !btn.classList.contains("proto-avail-cal-cell--selected")
        )
      )
      .find(Boolean) ??
    slots.find((btn) => !btn.classList.contains("proto-avail-cal-cell--selected")) ??
    slots[0];

  if (!slot || shouldAbort()) return false;

  if (options?.skip) {
    slot.click();
    return true;
  }

  await simulateDemoPointerClick(slot, { shouldAbort });
  await delay(280);
  return !shouldAbort();
}

async function runBookNow(options?: { skip?: boolean }): Promise<boolean> {
  const card = await waitForAvailCard();
  if (!card || shouldAbort()) return false;

  const bookBtn = Array.from(
    card.querySelectorAll<HTMLElement>(".proto-avail-btn-primary")
  ).find((btn) => /book now/i.test(btn.textContent ?? ""));

  if (!bookBtn || shouldAbort()) return false;

  if (options?.skip) {
    bookBtn.click();
    return true;
  }

  await simulateDemoPointerClick(bookBtn, { shouldAbort });
  await delay(400);
  return !shouldAbort();
}

async function waitForStoreList(card: HTMLElement): Promise<boolean> {
  for (let i = 0; i < 80; i++) {
    if (card.querySelector("[data-studio-avail-store]")) return true;
    await delay(50);
  }
  return false;
}

const START_STEP_FAIL =
  "runSelectLocationStore: stuck on start step — could not reach store list";

async function navigateFromStartToStoreList(
  card: HTMLElement,
  options?: { skip?: boolean }
): Promise<boolean> {
  if (card.querySelector("[data-studio-avail-store]")) return true;
  if (card.querySelector(".proto-avail-calendars")) return true;

  const startPanel = card.querySelector(".proto-avail-body--panel");
  if (!startPanel) return true;

  const searchField = startPanel.querySelector<HTMLElement>(".proto-avail-field");
  const nearMeBtn = Array.from(startPanel.querySelectorAll<HTMLElement>("button")).find(
    (btn) =>
      /see what's available near me/i.test(
        (btn.textContent ?? "").replace(/\s+/g, " ").trim()
      )
  );
  const target = searchField ?? nearMeBtn;
  if (!target) return false;

  if (options?.skip) {
    target.click();
  } else {
    await simulateDemoPointerClick(target, { shouldAbort, scroll: false });
  }
  await delay(options?.skip ? 160 : 280);
  return waitForStoreList(card);
}

async function ensureStoreListVisible(
  card: HTMLElement,
  options?: { skip?: boolean }
): Promise<boolean> {
  if (card.querySelector("[data-studio-avail-store]")) return true;

  const listTab = Array.from(card.querySelectorAll<HTMLElement>('[role="tab"]')).find(
    (tab) => /^list$/i.test((tab.textContent ?? "").trim())
  );
  if (!listTab) return false;

  if (options?.skip) {
    listTab.click();
  } else {
    await simulateDemoPointerClick(listTab, { shouldAbort, scroll: false });
  }
  await delay(options?.skip ? 160 : 280);
  return waitForStoreList(card);
}

async function scrollWithinAvailList(
  card: HTMLElement,
  target: HTMLElement,
  options?: { skip?: boolean }
): Promise<void> {
  const list = card.querySelector<HTMLElement>(".proto-avail-store-list");
  if (!list) {
    if (options?.skip) {
      target.scrollIntoView({ block: "center", behavior: "instant" });
      return;
    }
    await animateScrollElementIntoView(target, {
      align: "center",
      shouldAbort,
    });
    return;
  }

  const targetTop = computeScrollTopForElement(list, target, "nearest", 28);
  if (options?.skip) {
    list.scrollTop = targetTop;
    return;
  }
  await animateScrollTo(list, targetTop, { shouldAbort });
}

function findChooseLocationButton(storeCard: HTMLElement): HTMLElement | null {
  return (
    storeCard.querySelector<HTMLElement>(
      ".proto-avail-store__actions .proto-avail-btn-secondary"
    ) ??
    Array.from(storeCard.querySelectorAll<HTMLElement>("button")).find((btn) =>
      /choose location/i.test((btn.textContent ?? "").replace(/\s+/g, " ").trim())
    ) ??
    null
  );
}

/** Pick a pharmacy in location-picker mode (closes overlay and sets chosen location). */
export async function runSelectLocationStore(
  options?: { skip?: boolean; storeId?: string }
): Promise<boolean> {
  playbackAborted = false;
  const storeId = options?.storeId ?? "covent";
  const card = await waitForAvailCard();
  if (!card || shouldAbort()) return false;

  if (!(await ensureStoreListVisible(card, options))) return false;

  const storeCard = card.querySelector<HTMLElement>(
    `[data-studio-avail-store="${storeId}"]`
  );
  if (!storeCard || shouldAbort()) return false;

  const chooseBtn = findChooseLocationButton(storeCard);
  const target = chooseBtn ?? storeCard;
  if (!target || shouldAbort()) return false;

  await scrollWithinAvailList(card, target, options);
  if (shouldAbort()) return false;

  if (options?.skip) {
    target.click();
  } else {
    let clicked = await simulateDemoPointerClick(target, {
      shouldAbort,
      scroll: false,
    });
    if (!clicked && !shouldAbort()) {
      target.click();
      clicked = true;
    }
    if (!clicked || shouldAbort()) return false;
  }

  await delay(options?.skip ? 280 : 520);

  for (let i = 0; i < 80; i++) {
    if (!availCard()) return true;
    await delay(50);
  }

  return false;
}

async function runSelectLocation(options?: { skip?: boolean }): Promise<PlaybackScriptResult> {
  const card = await waitForAvailCard();
  if (!card) {
    return shouldAbort()
      ? scriptAborted()
      : scriptFail("waitForAvailCard: .proto-avail-card missing");
  }

  for (let i = 0; i < 60; i++) {
    if (card.querySelector(".proto-avail-calendars")) {
      return scriptOk();
    }
    await delay(50);
  }

  if (
    !card.querySelector("[data-studio-avail-store]") &&
    card.querySelector(".proto-avail-body--panel")
  ) {
    const navigated = await navigateFromStartToStoreList(card, options);
    if (!navigated) {
      return shouldAbort() ? scriptAborted() : scriptFail(START_STEP_FAIL);
    }
  }

  const ok = await runSelectLocationStore(options);
  if (ok) return scriptOk();
  return shouldAbort()
    ? scriptAborted()
    : scriptFail(
        card.querySelector(".proto-avail-body--panel")
          ? START_STEP_FAIL
          : "runSelectLocationStore: store list or Choose location failed"
      );
}

async function syncAvailScriptState(
  scriptId: AvailabilityScriptId,
  options?: PlaybackScriptOptions
): Promise<PlaybackScriptResult> {
  const card = await waitForAvailCard();
  if (!card) return scriptOk();

  switch (scriptId) {
    case "continue-from-date": {
      if (!(await waitForDateStep(card))) {
        return shouldAbort()
          ? scriptAborted()
          : scriptFail("waitForDateStep: .proto-avail-calendars not visible");
      }
      return scriptOk();
    }
    case "select-time-slot":
    case "book-now":
    case "select-location":
      return scriptOk();
    default:
      return scriptOk();
  }
}

export async function runAvailabilityScript(
  scriptId: AvailabilityScriptId,
  options?: PlaybackScriptOptions
): Promise<PlaybackScriptResult> {
  playbackAborted = false;
  if (options?.syncState) {
    return syncAvailScriptState(scriptId, options);
  }

  switch (scriptId) {
    case "select-location":
      return runSelectLocation(options);
    case "continue-from-date":
      return runContinueFromDate(options);
    case "select-time-slot":
      return wrapAvailBool(
        () => runSelectTimeSlot(options),
        "runSelectTimeSlot: time slot not found"
      );
    case "book-now":
      return wrapAvailBool(() => runBookNow(options), "runBookNow: Book now button missing");
    default:
      return scriptFail(`unknown availability script: ${String(scriptId)}`);
  }
}


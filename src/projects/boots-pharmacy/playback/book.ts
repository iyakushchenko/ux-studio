import {
  clearSimulatedClickRipples,
  delay,
  isDemoCursorJourneyModePinned,
  releaseDemoCursorAfterScript,
  removeDemoCursor,
  resetDemoCursorTravelOrigin,
  simulateDemoPointerClick,
} from "@/app/scenario/demoCursor";
import {
  animateDemoTargetIntoView,
  cancelPlaybackScroll,
  getPrototypeScrollRoot,
  snapDemoTargetIntoView,
} from "@/app/scenario/playbackScroll";
import type { BookScriptId } from "@/app/orchestra/types";
import type { PlaybackScriptOptions } from "@/projects/playbackScriptOptions";
import {
  fromBool,
  scriptAborted,
  scriptFail,
  scriptFailureStep,
  type PlaybackScriptResult,
} from "@/projects/playbackScriptResult";
import type { DirectorOutcomeReport } from "@/app/shell/playbackDirectorAnomalies";
import { playbackDirectorMonitor } from "@/app/shell/playbackDirectorMonitor";
import {
  describeCursorTarget,
  notePlaybackCursorEvent,
  resolveBookStep2CursorPhase,
  setPlaybackCursorDiagnosticContext,
} from "@/app/shell/playbackCursorDiagnostic";
import {
  BOOK_STEP2_RETREAT_DEFAULT_DATE,
  bookStep2Screen,
  syncBookStep2RetreatDefaultDom,
  syncBookStep2RetreatSlotDom,
} from "@/projects/boots-pharmacy/dom/bookStep2Calendar";

/** Wire default from `DEFAULT_CHOSEN_BOOKING_SLOT` — pre-director Book Step 2 state. */
export const BOOK_DEFAULT_DATE = BOOK_STEP2_RETREAT_DEFAULT_DATE;
export const BOOK_DEFAULT_TIME = "16:30";

/** Demo date/time picked during Book Step 2 journey playback. */
const PLAYBACK_TARGET_DATE = { month: "June", day: 21 } as const;
const PLAYBACK_TARGET_TIME = "15:30";

let playbackAborted = false;
let playbackGeneration = 0;
let activeRunGeneration = 0;
let bookScriptInFlight = false;

type BookRunTelemetry = {
  syncState: boolean;
  directorCursorUsed: boolean;
  selectionViaSkip: boolean;
  interactionPerformed: boolean;
};

let bookRunTelemetry: BookRunTelemetry = {
  syncState: false,
  directorCursorUsed: false,
  selectionViaSkip: false,
  interactionPerformed: false,
};

function resetBookRunTelemetry(syncState: boolean): void {
  bookRunTelemetry = {
    syncState,
    directorCursorUsed: false,
    selectionViaSkip: false,
    interactionPerformed: false,
  };
}

function isBookDateCellSelected(
  screen: HTMLElement,
  month: string,
  day: number
): boolean {
  return (
    screen.querySelector<HTMLElement>(
      `[data-name="calendar. date. cell"][data-studio-cal-kind="date"][data-studio-cal-month="${month}"][data-studio-cal-value="${day}"][data-studio-cal-selected="true"]`
    ) != null
  );
}

function isBookTimeCellSelected(screen: HTMLElement, time: string): boolean {
  return (
    screen.querySelector<HTMLElement>(
      `[data-name="calendar. date. cell"][data-studio-cal-kind="time"][data-studio-cal-value="${time}"][data-studio-cal-selected="true"]`
    ) != null
  );
}

function isAnyBookTimeSelected(screen: HTMLElement): boolean {
  return (
    screen.querySelector<HTMLElement>(
      '[data-name="calendar. date. cell"][data-studio-cal-kind="time"][data-studio-cal-selected="true"]'
    ) != null
  );
}

export function isBookDefaultDateSelected(): boolean {
  const screen = bookStep2Screen();
  return screen
    ? isBookDateCellSelected(
        screen,
        BOOK_DEFAULT_DATE.month,
        BOOK_DEFAULT_DATE.day
      )
    : false;
}

export function isBookPlaybackDateSelected(): boolean {
  const screen = bookStep2Screen();
  return screen
    ? isBookDateCellSelected(
        screen,
        PLAYBACK_TARGET_DATE.month,
        PLAYBACK_TARGET_DATE.day
      )
    : false;
}

export function isBookPlaybackTimeSelected(): boolean {
  const screen = bookStep2Screen();
  return screen ? isBookTimeCellSelected(screen, PLAYBACK_TARGET_TIME) : false;
}

export function isBookDefaultTimeSelected(): boolean {
  const screen = bookStep2Screen();
  return screen ? isBookTimeCellSelected(screen, BOOK_DEFAULT_TIME) : false;
}

export function isAnyBookTimeSelectedOnScreen(screen?: HTMLElement | null): boolean {
  const target = screen ?? bookStep2Screen();
  if (!target) return false;
  return isAnyBookTimeSelected(target);
}

function buildBookDirectorOutcomeReport(
  scriptId: BookScriptId,
  syncState: boolean,
  screen: HTMLElement
): DirectorOutcomeReport {
  const dateSelected = isBookPlaybackDateSelected();
  const timeSelected = isBookPlaybackTimeSelected();
  const defaultDateSelected = isBookDefaultDateSelected();
  const usedDemoCursor = bookRunTelemetry.directorCursorUsed;
  const usedSkipClick = bookRunTelemetry.selectionViaSkip;
  const interactionPerformed = bookRunTelemetry.interactionPerformed;
  const domGoalMet =
    scriptId === "select-book-date"
      ? syncState
        ? defaultDateSelected
        : dateSelected
      : scriptId === "select-book-time"
        ? syncState
          ? defaultDateSelected &&
            isBookDefaultTimeSelected() &&
            !isBookPlaybackTimeSelected()
          : timeSelected
        : scriptId === "reserve-appointment"
          ? timeSelected
          : undefined;

  if (syncState) {
    if (scriptId === "select-book-time") {
      return {
        mode: "sync",
        usedDemoCursor,
        usedSkipClick,
        cursorRequired: true,
        outcomeAppliedThisRun: usedSkipClick && timeSelected,
        domGoalMet,
      };
    }
    return {
      mode: "sync",
      usedDemoCursor,
      usedSkipClick,
      cursorRequired: false,
      outcomeAppliedThisRun: false,
      domGoalMet,
    };
  }

  return {
    mode: "director",
    usedDemoCursor,
    usedSkipClick,
    cursorRequired: true,
    outcomeAppliedThisRun:
      usedSkipClick || (interactionPerformed && usedDemoCursor),
    domGoalMet,
  };
}

function reportBookDirectorOutcomeIfNeeded(
  scriptId: BookScriptId,
  syncState: boolean
): void {
  const screen = bookStep2Screen();
  if (!screen) return;
  playbackDirectorMonitor.reportDirectorOutcome(
    scriptId,
    buildBookDirectorOutcomeReport(scriptId, syncState, screen)
  );
}

export function abortBookPlayback(): void {
  playbackGeneration += 1;
  playbackAborted = true;
  notePlaybackCursorEvent("abort", { abortReason: "book-playback-abort" });
  cancelPlaybackScroll("abort");
  resetDemoCursorTravelOrigin();
  if (bookScriptInFlight) {
    removeDemoCursor({ immediate: true });
  }
  bookScriptInFlight = false;
  clearSimulatedClickRipples();
}

export function wasBookPlaybackAborted(): boolean {
  return playbackAborted;
}

function shouldAbort(): boolean {
  return playbackAborted || activeRunGeneration !== playbackGeneration;
}

async function waitForBookStep2Screen(): Promise<HTMLElement | null> {
  for (let i = 0; i < 60; i++) {
    if (shouldAbort()) return null;
    const screen = bookStep2Screen();
    if (screen) return screen;
    await delay(40);
  }
  return null;
}

async function clickBookCell(
  cell: HTMLElement,
  options?: { skip?: boolean; scroll?: boolean }
): Promise<boolean> {
  if (options?.skip) {
    cell.click();
    bookRunTelemetry.selectionViaSkip = true;
    bookRunTelemetry.interactionPerformed = true;
    notePlaybackCursorEvent("click", {
      target: describeCursorTarget(cell),
      instant: true,
      detail: "skip-direct-click",
    });
    return true;
  }

  bookRunTelemetry.directorCursorUsed = true;
  bookRunTelemetry.interactionPerformed = true;
  await simulateDemoPointerClick(cell, {
    shouldAbort,
    scroll: options?.scroll,
  });
  await delay(300);
  return !shouldAbort();
}

async function findPreferredBookTimeCell(
  screen: HTMLElement
): Promise<HTMLElement | null> {
  const preferredTimes = [PLAYBACK_TARGET_TIME, "15:00", "16:15", "16:45"];
  for (const time of preferredTimes) {
    const cell = await findBookTimeCell(screen, time);
    if (cell) return cell;
  }
  return null;
}

async function findBookDateCell(
  screen: HTMLElement,
  month: string,
  day: number
): Promise<HTMLElement | null> {
  for (let i = 0; i < 80; i++) {
    if (shouldAbort()) return null;
    const cell = screen.querySelector<HTMLElement>(
      `[data-name="calendar. date. cell"][data-studio-cal-kind="date"][data-studio-cal-month="${month}"][data-studio-cal-value="${day}"]`
    );
    if (cell && cell.dataset.studioCalUnavailable !== "true") return cell;
    await delay(50);
  }
  return null;
}

async function findBookTimeCell(
  screen: HTMLElement,
  time: string
): Promise<HTMLElement | null> {
  for (let i = 0; i < 80; i++) {
    if (shouldAbort()) return null;
    const cell = screen.querySelector<HTMLElement>(
      `[data-name="calendar. date. cell"][data-studio-cal-kind="time"][data-studio-cal-value="${time}"]`
    );
    if (cell && cell.dataset.studioCalUnavailable !== "true") return cell;
    await delay(50);
  }
  return null;
}

function clearBookTimeSelection(screen: HTMLElement): void {
  screen
    .querySelectorAll<HTMLElement>(
      '[data-name="calendar. date. cell"][data-studio-cal-kind="time"]'
    )
    .forEach((cell) => {
      delete cell.dataset.studioCalSelected;
    });
}


async function selectBookDateCell(
  screen: HTMLElement,
  month: string,
  day: number,
  options?: { skip?: boolean }
): Promise<boolean> {
  const dateCell = await findBookDateCell(screen, month, day);
  if (!dateCell || shouldAbort()) return false;
  if (dateCell.dataset.studioCalSelected === "true") return true;
  return clickBookCell(dateCell, options);
}

async function restoreBookDefaultDate(screen: HTMLElement): Promise<boolean> {
  clearBookTimeSelection(screen);
  const applied = syncBookStep2RetreatDefaultDom({ clearTime: true });
  if (!applied) return false;
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
  clearBookTimeSelection(screen);
  return syncBookStep2RetreatDefaultDom({ clearTime: true });
}

async function syncBookBeatState(
  scriptId: BookScriptId,
  options?: PlaybackScriptOptions
): Promise<boolean> {
  const screen = await waitForBookStep2Screen();
  if (!screen || shouldAbort()) return false;

  const syncOptions: PlaybackScriptOptions = {
    ...options,
    skip: true,
    instant: options?.instant,
  };

  switch (scriptId) {
    case "select-book-date": {
      const dateOk = await restoreBookDefaultDate(screen);
      if (!dateOk || shouldAbort()) return false;
      await scrollBookStep2ToDateSection(screen, {
        instant: options?.instant,
        month: BOOK_DEFAULT_DATE.month,
        day: BOOK_DEFAULT_DATE.day,
      });
      return true;
    }
    case "select-book-time": {
      const dateOk = await restoreBookDefaultDate(screen);
      if (!dateOk || shouldAbort()) return false;
      await scrollBookStep2ToTimeSection(screen, { instant: options?.instant });
      return true;
    }
    case "reserve-appointment": {
      syncBookStep2RetreatSlotDom({
        month: PLAYBACK_TARGET_DATE.month,
        day: PLAYBACK_TARGET_DATE.day,
        time: PLAYBACK_TARGET_TIME,
      });
      await scrollBookStep2ToReserve(screen, { instant: options?.instant });
      return !shouldAbort();
    }
    default:
      return false;
  }
}

/** Exported for unit ratchet — React CTA over Make retired div. */
export function findReserveAppointmentButton(
  screen: HTMLElement
): HTMLElement | null {
  // Prefer React Book Step 2 CTA — Make dump uses a non-button div with the
  // same data-name and was winning querySelector → click FAIL not-clickable.
  const reactBtn =
    screen.querySelector<HTMLElement>(
      'button[data-studio-action="book-step-2-reserve"], button.book-step-2__reserve'
    ) ?? null;
  if (reactBtn && !reactBtn.closest("[data-studio-make-retired]")) {
    return reactBtn;
  }
  return (
    Array.from(
      screen.querySelectorAll<HTMLElement>(
        'button[data-name="component.input.button"], [data-name="component.input.button"]'
      )
    ).find(
      (el) =>
        !el.closest("[data-studio-make-retired]") &&
        /^reserve appointment$/i.test(
          (el.textContent ?? "").replace(/\s+/g, " ").trim()
        )
    ) ?? null
  );
}

async function waitForReserveButton(
  screen: HTMLElement
): Promise<HTMLElement | null> {
  for (let i = 0; i < 60; i++) {
    if (shouldAbort()) return null;
    const btn = findReserveAppointmentButton(screen);
    if (btn) return btn;
    await delay(40);
  }
  return null;
}

async function waitForBookTimeAnchor(
  screen: HTMLElement
): Promise<HTMLElement | null> {
  for (let i = 0; i < 80; i++) {
    if (shouldAbort()) return null;
    const cell = screen.querySelector<HTMLElement>(
      '[data-name="calendar. date. cell"][data-studio-cal-kind="time"]'
    );
    if (cell) return cell;
    await delay(50);
  }
  return null;
}

async function scrollBookStep2ToTimeSection(
  screen: HTMLElement,
  options?: { instant?: boolean }
): Promise<void> {
  if (shouldAbort()) return;
  const anchor = await waitForBookTimeAnchor(screen);
  if (!anchor || shouldAbort()) return;
  if (options?.instant) {
    snapDemoTargetIntoView(anchor);
    notePlaybackCursorEvent("scroll", {
      target: describeCursorTarget(anchor),
      instant: true,
      detail: "time-section-snap",
    });
    return;
  }
  notePlaybackCursorEvent("scroll", {
    target: describeCursorTarget(anchor),
    animated: true,
    detail: "time-section-scroll",
  });
  await animateDemoTargetIntoView(anchor, { shouldAbort });
}

async function scrollBookStep2ToDateSection(
  screen: HTMLElement,
  options?: { instant?: boolean; month?: string; day?: number }
): Promise<void> {
  if (shouldAbort()) return;
  const month = options?.month ?? PLAYBACK_TARGET_DATE.month;
  const day = options?.day ?? PLAYBACK_TARGET_DATE.day;
  const dateCell = await findBookDateCell(screen, month, day);
  if (dateCell) {
    if (options?.instant) {
      snapDemoTargetIntoView(dateCell);
      notePlaybackCursorEvent("scroll", {
        target: describeCursorTarget(dateCell),
        instant: true,
        detail: "date-section-snap",
      });
      return;
    }
    notePlaybackCursorEvent("scroll", {
      target: describeCursorTarget(dateCell),
      animated: true,
      detail: "date-section-scroll",
    });
    await animateDemoTargetIntoView(dateCell, { shouldAbort });
    return;
  }

  const scrollEl = getPrototypeScrollRoot(screen);
  if (scrollEl) {
    notePlaybackCursorEvent("scroll", {
      instant: options?.instant,
      animated: !options?.instant,
      detail: "date-section-scroll-top",
    });
    scrollEl.scrollTo({
      top: 0,
      behavior: options?.instant ? "instant" : "smooth",
    });
  }
}

async function scrollBookStep2ToReserve(
  screen: HTMLElement,
  options?: { instant?: boolean }
): Promise<void> {
  if (shouldAbort()) return;
  const btn = await waitForReserveButton(screen);
  if (!btn || shouldAbort()) return;
  if (options?.instant) {
    snapDemoTargetIntoView(btn);
    notePlaybackCursorEvent("scroll", {
      target: describeCursorTarget(btn),
      instant: true,
      detail: "reserve-snap",
    });
    return;
  }
  notePlaybackCursorEvent("scroll", {
    target: describeCursorTarget(btn),
    animated: true,
    detail: "reserve-scroll",
  });
  await animateDemoTargetIntoView(btn, { shouldAbort });
}

async function runSelectBookDate(options?: {
  skip?: boolean;
  instant?: boolean;
}): Promise<boolean> {
  const screen = await waitForBookStep2Screen();
  if (!screen || shouldAbort()) return false;

  if (!options?.skip && !options?.instant) await delay(320);

  const dateCell = await findBookDateCell(
    screen,
    PLAYBACK_TARGET_DATE.month,
    PLAYBACK_TARGET_DATE.day
  );
  if (!dateCell || shouldAbort()) return false;

  if (dateCell.dataset.studioCalSelected === "true") {
    return !shouldAbort();
  }

  const clicked = await clickBookCell(dateCell, options);
  if (!clicked || shouldAbort()) return false;

  return !shouldAbort();
}

async function runSelectBookTime(options?: {
  skip?: boolean;
  instant?: boolean;
  /** Reserve beat-enter sync only — time director step must not scroll to reserve. */
  afterSelectScroll?: "reserve";
}): Promise<boolean> {
  const screen = await waitForBookStep2Screen();
  if (!screen || shouldAbort()) return false;

  const dateOk = await runSelectBookDate({ skip: true, instant: options?.instant });
  if (!dateOk || shouldAbort()) return false;

  if (!options?.skip && !options?.instant) await delay(280);

  const scrollOpts = { instant: options?.instant };
  let timeCell = await findPreferredBookTimeCell(screen);
  let didSectionScroll = false;
  if (!timeCell && !shouldAbort()) {
    await scrollBookStep2ToTimeSection(screen, scrollOpts);
    didSectionScroll = true;
    timeCell = await findPreferredBookTimeCell(screen);
  }
  if (!timeCell || shouldAbort()) return false;

  if (timeCell.dataset.studioCalSelected === "true") {
    if (!options?.skip && !options?.instant && !didSectionScroll) {
      await animateDemoTargetIntoView(timeCell, { shouldAbort });
      if (shouldAbort()) return false;
    }
    if (options?.afterSelectScroll === "reserve") {
      await scrollBookStep2ToReserve(screen, scrollOpts);
    }
    return !shouldAbort();
  }

  if (!options?.skip && !options?.instant) {
    if (!didSectionScroll) {
      await animateDemoTargetIntoView(timeCell, { shouldAbort });
      if (shouldAbort()) return false;
    }
    await delay(360);
  } else if (options?.afterSelectScroll === "reserve" && !options?.instant) {
    await animateDemoTargetIntoView(timeCell, { shouldAbort });
    if (shouldAbort()) return false;
  } else if (options?.instant && options?.afterSelectScroll === "reserve") {
    snapDemoTargetIntoView(timeCell);
  }

  const clicked = await clickBookCell(timeCell, { ...options, scroll: false });
  if (!clicked || shouldAbort()) return false;

  if (!options?.skip && !options?.instant) await delay(280);

  if (options?.afterSelectScroll === "reserve") {
    await scrollBookStep2ToReserve(screen, scrollOpts);
  }

  return !shouldAbort();
}

async function runReserveAppointment(options?: {
  skip?: boolean;
  instant?: boolean;
}): Promise<boolean> {
  const screen = await waitForBookStep2Screen();
  if (!screen || shouldAbort()) return false;

  await scrollBookStep2ToReserve(screen, { instant: options?.instant });
  if (shouldAbort()) return false;

  if (!options?.skip && !options?.instant) await delay(320);

  const reserveBtn = await waitForReserveButton(screen);
  if (!reserveBtn || shouldAbort()) return false;

  if (options?.skip) {
    reserveBtn.click();
    bookRunTelemetry.selectionViaSkip = true;
    bookRunTelemetry.interactionPerformed = true;
    return true;
  }

  bookRunTelemetry.directorCursorUsed = true;
  bookRunTelemetry.interactionPerformed = true;
  await simulateDemoPointerClick(reserveBtn, { shouldAbort, scroll: false });
  await delay(360);
  return !shouldAbort();
}

function finishBookResult(ok: boolean, failStep: string): PlaybackScriptResult {
  if (shouldAbort()) return scriptAborted();
  return fromBool(ok, failStep);
}

/** CJM step-back onto Book Step 2 dwell — reset selections and scroll to the date block. */
export async function syncBookStep2LandingRetreat(
  options?: PlaybackScriptOptions
): Promise<void> {
  notePlaybackCursorEvent("dwell-sync", {
    beatId: "book-step2",
    phase: "dwell",
    detail: "landing-retreat — scroll only, no director click",
  });
  const screen = await waitForBookStep2Screen();
  if (!screen || shouldAbort()) return;
  await restoreBookDefaultDate(screen);
  await scrollBookStep2ToDateSection(screen, {
    instant: options?.instant,
    month: BOOK_DEFAULT_DATE.month,
    day: BOOK_DEFAULT_DATE.day,
  });
}

const BOOK_SCRIPT_BEAT_ID: Record<BookScriptId, string> = {
  "select-book-date": "book-step2-date",
  "select-book-time": "book-step2-time",
  "reserve-appointment": "book-step2-reserve",
};

export async function runBookScript(
  scriptId: BookScriptId,
  options?: PlaybackScriptOptions
): Promise<PlaybackScriptResult> {
  activeRunGeneration = playbackGeneration;
  playbackAborted = false;
  bookScriptInFlight = true;
  resetBookRunTelemetry(Boolean(options?.syncState));

  const phase = resolveBookStep2CursorPhase({
    beatId: BOOK_SCRIPT_BEAT_ID[scriptId],
    syncState: options?.syncState,
  });
  setPlaybackCursorDiagnosticContext({
    beatId: BOOK_SCRIPT_BEAT_ID[scriptId],
    scriptId,
    phase,
    isScripting: !options?.syncState && !options?.skip,
  });
  notePlaybackCursorEvent("script-start", {
    scriptId,
    phase,
    instant: options?.instant,
    detail: options?.syncState
      ? "sync-state"
      : options?.skip
        ? "skip"
        : "director",
  });

  let result: PlaybackScriptResult;
  if (options?.syncState) {
    result = finishBookResult(
      await syncBookBeatState(scriptId, options),
      "syncBookBeatState: book step 2 UI not ready"
    );
  } else {
    switch (scriptId) {
      case "select-book-date":
        result = finishBookResult(
          await runSelectBookDate(options),
          "runSelectBookDate: date cell not found on book step 2"
        );
        break;
      case "select-book-time":
        result = finishBookResult(
          await runSelectBookTime(options),
          "runSelectBookTime: time cell not found on book step 2"
        );
        break;
      case "reserve-appointment":
        result = finishBookResult(
          await runReserveAppointment(options),
          "runReserveAppointment: Reserve button not found"
        );
        break;
      default:
        result = scriptFail(`unknown book script: ${String(scriptId)}`);
    }
  }

  if (!shouldAbort()) {
    reportBookDirectorOutcomeIfNeeded(scriptId, Boolean(options?.syncState));
    notePlaybackCursorEvent("script-end", {
      scriptId,
      phase,
      detail: result.ok ? "ok" : scriptFailureStep(result) ?? "failed",
    });
    await releaseDemoCursorAfterScript();
    clearSimulatedClickRipples();
    if (!isDemoCursorJourneyModePinned()) {
      resetDemoCursorTravelOrigin();
    }
  }

  return result;
}

import type {
  AvailabilityScriptId,
  BookScriptId,
  HomeScriptId,
  JourneyBeat,
  JourneyBeatActionId,
  JourneyRuntime,
  TabScriptId,
} from "@/app/orchestra/types";
import { abortAvailabilityPlayback } from "./availability";
import { runAvailabilityScript } from "./availability";
import { abortBookPlayback } from "./book";
import {
  isBookDefaultDateSelected,
  isBookDefaultTimeSelected,
  isBookPlaybackDateSelected,
  isBookPlaybackTimeSelected,
  runBookScript,
  syncBookStep2LandingRetreat,
} from "./book";
import { abortSitePilotHomePlayback } from "./sitePilotHome";
import { runSitePilotHomeScript } from "./sitePilotHome";
import { abortTraditionalPlayback } from "./traditional";
import { runTraditionalScript } from "./traditional";
import type { ProjectPlayback, RetreatViewportGoal } from "@/projects/types";
import { checkRetreatSelectionGoal } from "./retreatSelectionGoal";

function runBeatAction(actionId: JourneyBeatActionId, runtime: JourneyRuntime): void {
  switch (actionId) {
    case "open-availability-start":
    case "open-availability-date-chat":
      runtime.openAvailability(
        actionId === "open-availability-date-chat"
          ? { step: "date", storeId: "covent", selectedDate: { month: "June", day: 25 } }
          : undefined
      );
      break;
    case "close-availability":
      runtime.closeAvailability();
      break;
    case "apply-demo-location":
      runtime.applyDemoLocation();
      break;
    default:
      break;
  }
}

function abortAll(): void {
  abortAvailabilityPlayback();
  abortBookPlayback();
  abortSitePilotHomePlayback();
  abortTraditionalPlayback();
}

async function syncDwellRetreat(
  beat: JourneyBeat,
  options?: { instant?: boolean; preserveHandoff?: boolean }
): Promise<void> {
  if (beat.id === "book-step2") {
    await syncBookStep2LandingRetreat({
      instant: options?.instant,
      preserveHandoff: options?.preserveHandoff,
    });
  }
}

function bookStep2DefaultDomGoalMet(): boolean {
  return (
    isBookDefaultDateSelected() &&
    isBookDefaultTimeSelected() &&
    !isBookPlaybackDateSelected() &&
    !isBookPlaybackTimeSelected()
  );
}

function checkRetreatViewportGoal(
  beat: JourneyBeat | undefined
): RetreatViewportGoal | null {
  // Hub / no-beat frames call the monitor with undefined — never throw (Chrome hang/crash class).
  if (!beat) return null;
  if (beat.id === "avail-continue" || beat.id === "avail-time" || beat.id === "avail-book") {
    const goal = checkRetreatSelectionGoal(beat);
    return goal
      ? { expectsAnchor: false, domGoalMet: goal.domGoalMet }
      : null;
  }

  if (beat.id === "book-step2" || beat.bookScript === "select-book-date") {
    return {
      expectsAnchor: true,
      domGoalMet: bookStep2DefaultDomGoalMet(),
    };
  }
  if (beat.bookScript === "select-book-time") {
    return {
      expectsAnchor: true,
      domGoalMet: bookStep2DefaultDomGoalMet(),
    };
  }
  if (beat.bookScript === "reserve-appointment") {
    // Reserve retreat scrolls to the CTA; generic anchor heuristics still target
    // the selected calendar cell (often off-screen) — domGoalMet is the signal here.
    return {
      expectsAnchor: false,
      domGoalMet:
        isBookPlaybackDateSelected() && isBookPlaybackTimeSelected(),
    };
  }
  return null;
}

/** Boots Pharmacy — cursor/type-in scripts for journey beats. */
export const BOOTS_PHARMACY_PLAYBACK: ProjectPlayback = {
  abortAll,
  runBeatAction,
  runHomeScript: (scriptId, options) => runSitePilotHomeScript(scriptId as HomeScriptId, options),
  runAvailScript: (scriptId, options) =>
    runAvailabilityScript(scriptId as AvailabilityScriptId, options),
  runBookScript: (scriptId, options) => runBookScript(scriptId as BookScriptId, options),
  syncDwellRetreat,
  checkRetreatViewportGoal,
  checkRetreatSelectionGoal,
  runTabScript: (scriptId, runtime, options) =>
    runTraditionalScript(scriptId as TabScriptId, runtime, options),
};


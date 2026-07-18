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
  isBookPlaybackDateSelected,
  isBookPlaybackTimeSelected,
  runBookScript,
  syncBookStep2LandingRetreat,
} from "./book";
import { abortSitePilotHomePlayback } from "./sitePilotHome";
import { runSitePilotHomeScript } from "./sitePilotHome";
import { abortTraditionalPlayback } from "./traditional";
import { runTraditionalScript } from "./traditional";
import type { ProtoProjectPlayback, RetreatViewportGoal } from "@/projects/types";

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
  options?: { instant?: boolean }
): Promise<void> {
  if (beat.id === "book-step2") {
    await syncBookStep2LandingRetreat({ instant: options?.instant });
  }
}

function checkRetreatViewportGoal(beat: JourneyBeat): RetreatViewportGoal | null {
  if (beat.id === "book-step2" || beat.bookScript === "select-book-date") {
    return {
      expectsAnchor: true,
      domGoalMet:
        isBookDefaultDateSelected() && !isBookPlaybackTimeSelected(),
    };
  }
  if (beat.bookScript === "select-book-time") {
    return {
      expectsAnchor: true,
      domGoalMet:
        isBookDefaultDateSelected() && !isBookPlaybackTimeSelected(),
    };
  }
  if (beat.bookScript === "reserve-appointment") {
    return {
      expectsAnchor: true,
      domGoalMet:
        isBookPlaybackDateSelected() && isBookPlaybackTimeSelected(),
    };
  }
  return null;
}

/** Boots Pharmacy — cursor/type-in scripts for journey beats. */
export const BOOTS_PHARMACY_PLAYBACK: ProtoProjectPlayback = {
  abortAll,
  runBeatAction,
  runHomeScript: (scriptId, options) => runSitePilotHomeScript(scriptId as HomeScriptId, options),
  runAvailScript: (scriptId, options) =>
    runAvailabilityScript(scriptId as AvailabilityScriptId, options),
  runBookScript: (scriptId, options) => runBookScript(scriptId as BookScriptId, options),
  syncDwellRetreat,
  checkRetreatViewportGoal,
  runTabScript: (scriptId, runtime, options) =>
    runTraditionalScript(scriptId as TabScriptId, runtime, options),
};

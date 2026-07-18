import type { CursorAnomaly } from "@/app/shell/protoPlaybackCursorAnomalies";
import { VIEWPORT_MIN_SCROLL_DELTA_PX } from "@/app/shell/protoPlaybackViewportAnomalies";

export const DIRECTOR_HANDOFF_CHECK_MS = 1200;

/** Director scripts where a manual step must change DOM state or scroll the viewport. */
export const DIRECTOR_INTERACTION_SCRIPTS = new Set([
  "select-book-time",
  "reserve-appointment",
]);

/** Standard contract every cursor-guided script reports after a run. */
export type DirectorOutcomeReport = {
  mode: "sync" | "director";
  usedDemoCursor: boolean;
  usedSkipClick: boolean;
  /** This script run performed the interaction (not idempotent already-satisfied DOM state). */
  outcomeAppliedThisRun: boolean;
  /** This run's outcome must only be achieved via demo cursor on director steps. */
  cursorRequired: boolean;
  /** Whether the beat's DOM goal is satisfied after the run (project script sets this). */
  domGoalMet?: boolean;
};

export function formatDirectorOutcomeDetail(
  scriptLabel: string,
  report: DirectorOutcomeReport
): string {
  return [
    `script=${scriptLabel}`,
    `mode=${report.mode}`,
    `cursorRequired=${report.cursorRequired}`,
    `outcomeAppliedThisRun=${report.outcomeAppliedThisRun}`,
    report.usedDemoCursor ? "directorCursor=true" : "directorCursor=false",
    report.usedSkipClick ? "skipClick=true" : "",
  ]
    .filter(Boolean)
    .join(" ");
}

export function detectDirectorOutcomeAnomaly(
  scriptLabel: string,
  report: DirectorOutcomeReport
): CursorAnomaly | null {
  const detail = formatDirectorOutcomeDetail(scriptLabel, report);

  if (report.mode === "sync" && report.outcomeAppliedThisRun && report.cursorRequired) {
    return {
      kind: "selection-without-director",
      message:
        "Beat-enter sync applied a director-only interaction outcome",
      detail,
    };
  }

  if (report.mode === "director" && report.cursorRequired) {
    if (report.usedSkipClick) {
      return {
        kind: "selection-without-director",
        message: "Director step used skip interaction without demo cursor",
        detail,
      };
    }
    if (report.outcomeAppliedThisRun && !report.usedDemoCursor) {
      return {
        kind: "selection-without-director",
        message: "Director step outcome applied without demo cursor",
        detail,
      };
    }
  }

  return null;
}

export function detectDirectorHandoffSkippedAnomaly(options: {
  fromBeatId: string;
  toBeatId: string;
  scriptLabel: string;
  scriptStarted: boolean;
  scriptSucceeded: boolean;
}): CursorAnomaly | null {
  if (options.scriptSucceeded) return null;
  if (options.scriptStarted) return null;

  return {
    kind: "director-step-skipped",
    message: `Step forward from dwell landing did not run director script (${options.scriptLabel})`,
    detail: `from=${options.fromBeatId} to=${options.toBeatId} script=${options.scriptLabel}`,
  };
}

export function detectDirectorStepNoEffectAnomaly(options: {
  scriptLabel: string;
  report: DirectorOutcomeReport;
  beatId?: string;
  scrollDeltaPx?: number;
}): CursorAnomaly | null {
  const { scriptLabel, report } = options;

  const requiresDomGoal =
    DIRECTOR_INTERACTION_SCRIPTS.has(scriptLabel) ||
    (report.mode === "director" && report.cursorRequired);
  if (!requiresDomGoal) return null;
  if (report.outcomeAppliedThisRun) return null;
  if (report.domGoalMet === true) return null;

  if (
    scriptLabel === "select-book-time" &&
    options.scrollDeltaPx != null &&
    options.scrollDeltaPx >= VIEWPORT_MIN_SCROLL_DELTA_PX &&
    !report.usedDemoCursor
  ) {
    return null;
  }

  const detail = [
    formatDirectorOutcomeDetail(scriptLabel, report),
    options.beatId ? `beat=${options.beatId}` : "",
    options.scrollDeltaPx != null
      ? `scrollDelta=${Math.round(options.scrollDeltaPx)}px`
      : "",
  ]
    .filter(Boolean)
    .join(" ");

  return {
    kind: "director-step-no-effect",
    message: `Manual director step completed without effect (${scriptLabel})`,
    detail,
  };
}

import { dispatchRetreatSync } from "@/app/scenario/retreatBridge";
import { snapDemoTargetIntoView } from "@/app/scenario/playbackScroll";
import {
  beatDirectorScriptLabel,
  isDwellLandingBeat,
} from "@/app/orchestra/journeyBeatDirector";
import type { JourneyBeat, JourneyRuntime } from "@/app/orchestra/types";
import { playbackDiagLog, playbackDiagScroll } from "@/app/shell/playbackDiag";
import { notePlaybackRetreatSync } from "@/app/shell/playbackInteractionContext";
import { playbackScrollMonitor } from "@/app/shell/playbackScrollMonitor";
import { resolvePlaybackScriptKind } from "@/app/shell/playbackScriptRegistry";
import { syncAvailBeatRetreat } from "@/projects/boots-pharmacy/playback/availRetreatSync";
import { retreatScriptOptions } from "@/projects/playbackScriptOptions";
import type {
  ProjectPlayback,
  RetreatSyncOptions,
  RetreatSelectionGoal,
  RetreatViewportGoal,
} from "@/projects/types";

/** Best-effort active control for retreat scrollIntoView (engine-agnostic). */
function resolveRetreatScrollTarget(beat: JourneyBeat): HTMLElement | null {
  if (typeof document === "undefined") return null;
  const selectors = [
    "[data-studio-cal-selected='true']",
    "[aria-pressed='true']",
    ".proto-avail-cal-cell--selected",
    "[data-studio-action='book-step-1-continue']",
    "button.chat__cta",
    "textarea.site-pilot-composer__query",
    "textarea.proto-agentic-query",
    "[data-studio-wishlist-id]",
    ".uxds-btn-primary",
  ];
  for (const sel of selectors) {
    const el = document.querySelector<HTMLElement>(sel);
    if (el && el.getClientRects().length > 0) return el;
  }
  // Screen host fallback so retreat never leaves the camera on a blank fold.
  const tab = beat.protoTab;
  if (tab != null) {
    const screen = document.querySelector<HTMLElement>(
      `.studio-viewport > div > div:nth-child(${tab + 1})`
    );
    if (screen) return screen;
  }
  return null;
}

export type BeatRetreatScriptChannel = "home" | "avail" | "book" | "tab";

/** Which playback runner owns retreat state for this beat (derived from beat metadata). */
export function beatRetreatScriptChannel(
  beat: JourneyBeat
): BeatRetreatScriptChannel | null {
  if (beat.homeScript) return "home";
  if (beat.availScript) return "avail";
  if (beat.bookScript) return "book";
  if (beat.tabScript) return "tab";
  return null;
}

export function beatHasRetreatableState(beat: JourneyBeat): boolean {
  return (
    beatRetreatScriptChannel(beat) != null ||
    (isDwellLandingBeat(beat) && Boolean(beat.protoTab))
  );
}

/**
 * Shell-owned CJM step-back sync — routes by beat script channel, never by project id
 * or screen-specific beat ids. Projects implement `syncState` on script runners and
 * optional `syncDwellRetreat` / `checkRetreatViewportGoal`.
 */
export async function syncBeatRetreatState(
  playback: ProjectPlayback,
  beat: JourneyBeat,
  runtime: JourneyRuntime,
  options?: RetreatSyncOptions
): Promise<void> {
  const channel = beatRetreatScriptChannel(beat);
  const syncOptions = retreatScriptOptions(options?.instant);
  const scriptId =
    beat.homeScript ??
    beat.availScript ??
    beat.bookScript ??
    beat.tabScript ??
    beatDirectorScriptLabel(beat) ??
    beat.id;

  notePlaybackRetreatSync({
    beatId: beat.id,
    scriptId,
    scriptKind: channel ?? resolvePlaybackScriptKind(scriptId),
  });

  playbackDiagLog("retreat-sync", `${channel ?? "dwell"}:${String(scriptId)}`, {
    beatId: beat.id,
  });
  playbackScrollMonitor.noteRetreatSync();

  const finishRetreatCamera = () => {
    const target = resolveRetreatScrollTarget(beat);
    if (!target) {
      playbackDiagScroll({
        beatId: beat.id,
        detail: "retreat scrollIntoView — no target",
        intoViewRequested: true,
        intoViewDone: false,
        retreat: true,
      });
      return;
    }
    snapDemoTargetIntoView(target, { retreat: true });
  };

  if (channel === "home" && beat.homeScript) {
    await playback.runHomeScript(beat.homeScript, syncOptions);
    finishRetreatCamera();
    dispatchRetreatSync({
      beatId: beat.id,
      channel,
      scriptId: beat.homeScript,
    });
    return;
  }

  if (channel === "avail" && beat.availScript) {
    syncAvailBeatRetreat(beat, runtime);
    await playback.runAvailScript(beat.availScript, syncOptions);
    syncAvailBeatRetreat(beat, runtime);
    finishRetreatCamera();
    dispatchRetreatSync({
      beatId: beat.id,
      channel,
      scriptId: beat.availScript,
    });
    return;
  }

  if (channel === "book" && beat.bookScript) {
    await playback.runBookScript(beat.bookScript, syncOptions);
    finishRetreatCamera();
    dispatchRetreatSync({
      beatId: beat.id,
      channel,
      scriptId: beat.bookScript,
    });
    return;
  }

  if (channel === "tab" && beat.tabScript) {
    await playback.runTabScript(beat.tabScript, runtime, syncOptions);
    finishRetreatCamera();
    dispatchRetreatSync({
      beatId: beat.id,
      channel,
      scriptId: beat.tabScript,
    });
    return;
  }

  if (isDwellLandingBeat(beat) && playback.syncDwellRetreat) {
    await playback.syncDwellRetreat(beat, options);
    finishRetreatCamera();
    dispatchRetreatSync({
      beatId: beat.id,
      channel: "dwell",
      scriptId: beatDirectorScriptLabel(beat),
    });
  } else {
    finishRetreatCamera();
  }
}

export function evaluateBeatRetreatViewportGoal(
  playback: ProjectPlayback,
  beat: JourneyBeat
): RetreatViewportGoal | null {
  return playback.checkRetreatViewportGoal?.(beat) ?? null;
}

export function evaluateBeatRetreatSelectionGoal(
  playback: ProjectPlayback,
  beat: JourneyBeat
): RetreatSelectionGoal | null {
  return playback.checkRetreatSelectionGoal?.(beat) ?? null;
}

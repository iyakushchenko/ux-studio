import type { JourneyBeat } from "@/app/orchestra/types";
import type { RuntimeErrorHint } from "@/app/shell/classifyRuntimeError";
import type { PlaybackStudioSnapshot } from "@/app/shell/playbackStudioSnapshot";
import type { CursorAnomaly } from "@/app/shell/protoPlaybackCursorAnomalies";
import type { ViewportAnomaly } from "@/app/shell/protoPlaybackViewportAnomalies";

export type PlaybackScriptKind =
  | "home"
  | "avail"
  | "book"
  | "tab"
  | "scenario"
  | "beat-enter";

export type PlaybackDiagnosticPhase =
  | "script-failed"
  | "script-timeout"
  | "scenario-stall"
  | "playback-stall"
  | "state-mismatch"
  | "scroll-anomaly"
  | "cursor-anomaly"
  | "viewport-anomaly"
  | "transport-no-op";

export type PlaybackDiagnosticContext = {
  phase: PlaybackDiagnosticPhase;
  journeyId?: string;
  beatId?: string;
  beatLabel?: string;
  scriptKind?: PlaybackScriptKind;
  scriptId?: string;
  expected?: string;
  actual?: string;
  failureStep?: string;
  message: string;
  detail?: string;
  snapshot?: PlaybackStudioSnapshot;
};

export class PlaybackDiagnosticError extends Error {
  readonly context: PlaybackDiagnosticContext;

  constructor(context: PlaybackDiagnosticContext) {
    super(context.message);
    this.name = "PlaybackDiagnosticError";
    this.context = context;
  }
}

export const PLAYBACK_SCRIPT_TIMEOUT_MS = 45_000;
export const PLAYBACK_STALL_TIMEOUT_MS = 22_000;
export const PLAYBACK_SCENARIO_PRELUDE_TIMEOUT_MS = 60_000;

export function describeBeatScript(beat: JourneyBeat | undefined): {
  kind: PlaybackScriptKind;
  id: string;
} | null {
  if (!beat) return null;
  if (beat.homeScript) return { kind: "home", id: beat.homeScript };
  if (beat.availScript) return { kind: "avail", id: beat.availScript };
  if (beat.bookScript) return { kind: "book", id: beat.bookScript };
  if (beat.tabScript) return { kind: "tab", id: beat.tabScript };
  if (beat.scenarioId) return { kind: "scenario", id: beat.scenarioId };
  if (beat.onEnter) return { kind: "beat-enter", id: beat.onEnter };
  return null;
}

export function scriptFailureDiagnostic(
  beat: JourneyBeat,
  options?: {
    journeyId?: string;
    reason?: string;
    failureStep?: string;
    detail?: string;
  }
): PlaybackDiagnosticError {
  const script = describeBeatScript(beat);
  const scriptRef = script ? `${script.kind}/${script.id}` : beat.id;
  const step =
    options?.failureStep ??
    options?.reason ??
    "script returned false (target missing or wrong overlay step)";
  return new PlaybackDiagnosticError({
    phase: "script-failed",
    journeyId: options?.journeyId,
    beatId: beat.id,
    beatLabel: beat.label,
    scriptKind: script?.kind,
    scriptId: script?.id,
    failureStep: step,
    expected: script ? `${scriptRef} completes` : `${beat.label} completes`,
    actual: step,
    message: `${scriptRef} failed on ${beat.label}`,
    detail: options?.detail,
  });
}

export function playbackStallDiagnostic(options: {
  journeyId?: string;
  beatId?: string;
  beatLabel?: string;
  scriptKind?: PlaybackScriptKind;
  scriptId?: string;
  lastProgress?: string;
  detail?: string;
}): PlaybackDiagnosticError {
  return new PlaybackDiagnosticError({
    phase: "playback-stall",
    journeyId: options.journeyId,
    beatId: options.beatId,
    beatLabel: options.beatLabel,
    scriptKind: options.scriptKind,
    scriptId: options.scriptId,
    expected: "Transport advances (beat, frame, or touchpoint changes)",
    actual: options.lastProgress
      ? `No progress for ${PLAYBACK_STALL_TIMEOUT_MS / 1000}s (last: ${options.lastProgress})`
      : `No progress for ${PLAYBACK_STALL_TIMEOUT_MS / 1000}s`,
    message: `No progress for ${PLAYBACK_STALL_TIMEOUT_MS / 1000}s on ${options.beatLabel ?? options.beatId ?? "current beat"}`,
    detail: options.detail,
  });
}

export function scenarioStallDiagnostic(options: {
  beatLabel?: string;
  scenarioId?: string;
  frame?: number;
  detail?: string;
}): PlaybackDiagnosticError {
  return new PlaybackDiagnosticError({
    phase: "scenario-stall",
    beatLabel: options.beatLabel,
    scriptKind: "scenario",
    scriptId: options.scenarioId,
    expected: "Scenario frame / prelude / finale completes",
    actual: options.frame != null ? `Stalled around frame ${options.frame}` : "Scenario prelude or finale hung",
    message: `Scenario stalled${options.scenarioId ? ` (${options.scenarioId})` : ""}`,
    detail: options.detail,
  });
}

export function playbackCursorAnomalyDiagnostic(options: {
  journeyId?: string;
  beatId?: string;
  beatLabel?: string;
  anomaly: CursorAnomaly;
  touchpoint?: string;
  visibleProgress?: string;
}): PlaybackDiagnosticError {
  const { anomaly } = options;
  const expected =
    anomaly.kind === "director-step-skipped"
      ? "Director script runs when stepping forward from a dwell landing beat"
      : anomaly.kind === "director-step-no-effect"
        ? "Manual director step scrolls viewport or applies DOM outcome"
        : anomaly.kind === "selection-without-director"
          ? "Book date/time selected only via demo cursor on director steps"
          : "Demo cursor removed when transport is idle or beat changes";
  return new PlaybackDiagnosticError({
    phase: "cursor-anomaly",
    journeyId: options.journeyId,
    beatId: options.beatId,
    beatLabel: options.beatLabel,
    failureStep: anomaly.kind,
    expected,
    actual: anomaly.message,
    message: anomaly.message,
    detail: [
      anomaly.detail,
      options.touchpoint ? `touchpoint=${options.touchpoint}` : "",
      options.visibleProgress ? `frames=${options.visibleProgress}` : "",
    ]
      .filter(Boolean)
      .join(" "),
  });
}

export function playbackScrollStutterDiagnostic(options: {
  journeyId?: string;
  beatId?: string;
  beatLabel?: string;
  anomaly: ScrollAnomaly;
  touchpoint?: string;
  visibleProgress?: string;
}): PlaybackDiagnosticError {
  const { anomaly } = options;
  return new PlaybackDiagnosticError({
    phase: "scroll-anomaly",
    journeyId: options.journeyId,
    beatId: options.beatId,
    beatLabel: options.beatLabel,
    failureStep: anomaly.kind,
    expected: "Smooth single eased scroll per camera move",
    actual: anomaly.message,
    message: anomaly.message,
    detail: [
      anomaly.detail,
      options.touchpoint ? `touchpoint=${options.touchpoint}` : "",
      options.visibleProgress ? `frames=${options.visibleProgress}` : "",
    ]
      .filter(Boolean)
      .join(" "),
  });
}

export const TRANSPORT_STEP_NO_OP_MS = 1200;

export function playbackTransportNoOpDiagnostic(options: {
  journeyId?: string;
  beatId?: string;
  beatLabel?: string;
  scriptKind?: PlaybackScriptKind;
  scriptId?: string;
  touchpoint?: string;
  visibleProgress?: string;
  detail?: string;
}): PlaybackDiagnosticError {
  const scriptRef =
    options.scriptId && options.scriptKind
      ? `${options.scriptKind}/${options.scriptId}`
      : options.beatLabel ?? options.beatId ?? "current beat";
  return new PlaybackDiagnosticError({
    phase: "transport-no-op",
    journeyId: options.journeyId,
    beatId: options.beatId,
    beatLabel: options.beatLabel,
    scriptKind: options.scriptKind,
    scriptId: options.scriptId,
    failureStep: "transport-step-no-op",
    expected: "Manual step forward advances beat or runs director script",
    actual: "Step forward completed with no journey progress",
    message: `Step forward had no effect on ${scriptRef}`,
    detail: [
      options.detail,
      options.touchpoint ? `touchpoint=${options.touchpoint}` : "",
      options.visibleProgress ? `frames=${options.visibleProgress}` : "",
    ]
      .filter(Boolean)
      .join(" "),
  });
}

export function playbackTransportContractDiagnostic(options: {
  journeyId?: string;
  beatId?: string;
  beatLabel?: string;
  failureStep: string;
  message: string;
  detail?: string;
  touchpoint?: string;
  visibleProgress?: string;
}): PlaybackDiagnosticError {
  return new PlaybackDiagnosticError({
    phase: "state-mismatch",
    journeyId: options.journeyId,
    beatId: options.beatId,
    beatLabel: options.beatLabel,
    failureStep: options.failureStep,
    expected: "Studio transport counter and on-air state follow journey playback",
    actual: options.message,
    message: options.message,
    detail: [
      options.detail,
      options.touchpoint ? `touchpoint=${options.touchpoint}` : "",
      options.visibleProgress ? `frames=${options.visibleProgress}` : "",
    ]
      .filter(Boolean)
      .join(" "),
  });
}

export function playbackViewportStallDiagnostic(options: {
  journeyId?: string;
  beatId?: string;
  beatLabel?: string;
  anomaly: ViewportAnomaly;
  touchpoint?: string;
  visibleProgress?: string;
}): PlaybackDiagnosticError {
  const { anomaly } = options;
  return new PlaybackDiagnosticError({
    phase: "viewport-anomaly",
    journeyId: options.journeyId,
    beatId: options.beatId,
    beatLabel: options.beatLabel,
    failureStep: anomaly.kind,
    expected: "Viewport scroll follows touchpoint advance on the same screen",
    actual: anomaly.message,
    message: anomaly.message,
    detail: [
      anomaly.detail,
      options.touchpoint ? `touchpoint=${options.touchpoint}` : "",
      options.visibleProgress ? `frames=${options.visibleProgress}` : "",
    ]
      .filter(Boolean)
      .join(" "),
  });
}

export function formatPlaybackDiagnostic(error: PlaybackDiagnosticError): RuntimeErrorHint {
  const ctx = error.context;
  const scriptRef =
    ctx.scriptKind && ctx.scriptId ? `${ctx.scriptKind}/${ctx.scriptId}` : undefined;
  const beatRef = ctx.beatLabel ?? ctx.beatId ?? "current beat";

  switch (ctx.phase) {
    case "script-failed":
      return {
        id: "playback-script-failed",
        title: "Script failed",
        summary: ctx.actual
          ? `${scriptRef ?? beatRef}: ${ctx.actual}`
          : ctx.message,
        likelyCauses: [],
        tryThese: [],
      };
    case "script-timeout":
      return {
        id: "playback-script-timeout",
        title: "Script timed out",
        summary: `${scriptRef ?? beatRef} exceeded ${PLAYBACK_SCRIPT_TIMEOUT_MS / 1000}s`,
        likelyCauses: [],
        tryThese: [],
      };
    case "scenario-stall":
      return {
        id: "playback-scenario-stall",
        title: "Scenario stalled",
        summary: ctx.actual ? `${ctx.message} — ${ctx.actual}` : ctx.message,
        likelyCauses: [],
        tryThese: [],
      };
    case "playback-stall":
      return {
        id: "playback-stall",
        title: "Playback stalled",
        summary: ctx.actual ? `${ctx.message}. ${ctx.actual}` : ctx.message,
        likelyCauses: [],
        tryThese: [],
      };
    case "state-mismatch":
      return {
        id: "playback-state-mismatch",
        title: "State mismatch",
        summary:
          ctx.expected && ctx.actual
            ? `Expected ${ctx.expected}. Got ${ctx.actual}.`
            : ctx.message,
        likelyCauses: [],
        tryThese: [],
      };
    case "scroll-anomaly":
      return {
        id: "playback-scroll-anomaly",
        title: "Scroll / camera jank",
        summary: ctx.actual ?? ctx.message,
        likelyCauses: [],
        tryThese: [],
      };
    case "cursor-anomaly":
      return {
        id: "playback-cursor-anomaly",
        title:
          ctx.failureStep === "selection-without-director"
            ? "Booking selection without cursor"
            : ctx.failureStep === "director-step-no-effect"
              ? "Director step had no effect"
              : "Stale demo cursor",
        summary: ctx.actual ?? ctx.message,
        likelyCauses: [],
        tryThese: [],
      };
    case "viewport-anomaly":
      return {
        id: "playback-viewport-anomaly",
        title:
          ctx.failureStep === "transport-retreat-mismatch"
            ? "Step back did not match journey beat"
            : "Viewport did not follow touchpoint",
        summary: ctx.actual ?? ctx.message,
        likelyCauses: [],
        tryThese: [],
      };
    case "transport-no-op":
      return {
        id: "playback-transport-no-op",
        title: "Step forward had no effect",
        summary: ctx.actual ?? ctx.message,
        likelyCauses: [],
        tryThese: [],
      };
    default:
      return {
        id: "playback-unknown",
        title: "Playback error",
        summary: ctx.message,
        likelyCauses: [],
        tryThese: [],
      };
  }
}

export function formatPlaybackDiagnosticDetails(
  error: PlaybackDiagnosticError
): string {
  const ctx = error.context;
  const lines = [
    `${error.name}: ${ctx.message}`,
    ctx.phase ? `phase: ${ctx.phase}` : "",
    ctx.journeyId ? `journey: ${ctx.journeyId}` : "",
    ctx.beatId ? `beat: ${ctx.beatId} (${ctx.beatLabel ?? ""})` : "",
    ctx.scriptKind && ctx.scriptId ? `script: ${ctx.scriptKind}/${ctx.scriptId}` : "",
    ctx.failureStep ? `failureStep: ${ctx.failureStep}` : "",
    ctx.expected ? `expected: ${ctx.expected}` : "",
    ctx.actual ? `actual: ${ctx.actual}` : "",
    ctx.detail ? `detail: ${ctx.detail}` : "",
  ].filter(Boolean);
  return lines.join("\n");
}

export async function withPlaybackScriptTimeout<T>(
  label: string,
  run: () => Promise<T>
): Promise<T> {
  let timer: number | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = window.setTimeout(() => {
      reject(
        new PlaybackDiagnosticError({
          phase: "script-timeout",
          message: `Script timed out after ${PLAYBACK_SCRIPT_TIMEOUT_MS / 1000}s`,
          scriptId: label,
          expected: `${label} resolves within ${PLAYBACK_SCRIPT_TIMEOUT_MS / 1000}s`,
          actual: "Promise still pending — likely waiting for missing DOM",
        })
      );
    }, PLAYBACK_SCRIPT_TIMEOUT_MS);
  });

  try {
    return await Promise.race([run(), timeout]);
  } finally {
    if (timer != null) window.clearTimeout(timer);
  }
}

import type {
  JourneyBeat,
  JourneyBeatActionId,
  JourneyBeatKind,
  JourneyDefinition,
  OrchestraModeId,
  AvailabilityScriptId,
  BookScriptId,
  HomeScriptId,
  TabScriptId,
} from "@/app/orchestra/types";
import {
  serializeJourneyFile,
  summarizeJourney,
  type JourneyFile,
} from "@/app/journey/journeyFile";
import { applyImportedJourneyFile } from "@/app/journey/journeyRuntimeStore";
import {
  compileRecordingToBeatTimeline,
} from "@/app/recording/recordingReplay";
import type {
  CompiledBeatSegment,
  CompiledRecordingTimeline,
  RecordedEvent,
  RecordingSession,
} from "@/app/recording/recordingTypes";
import { resolvePlaybackScriptKind } from "@/app/shell/playbackScriptRegistry";
import type { PersonaId, ProjectId } from "@/projects/types";

const BEAT_ACTIONS = new Set<JourneyBeatActionId>([
  "open-availability-start",
  "open-availability-date-chat",
  "close-availability",
  "apply-demo-location",
]);

const KNOWN_SCENARIO_BY_BEAT: Record<string, string> = {
  "agentic-chat": "site-pilot-chat",
};

export type CompileRecordingJourneyOptions = {
  /** Target CJM slot — defaults to session journey/orchestra mode or agentic-cjm. */
  journeyId?: OrchestraModeId;
  label?: string;
};

export type CompiledRecordingJourney = {
  journey: JourneyDefinition;
  timeline: CompiledRecordingTimeline;
  warnings: string[];
  /** Honest gaps — not mapped into JourneyBeat fields (still playable via REC ↺). */
  gaps: string[];
};

export type SaveRecordingAsJourneyResult = {
  journey: JourneyDefinition;
  file: JourneyFile;
  summary: ReturnType<typeof summarizeJourney>;
  warnings: string[];
  gaps: string[];
  json: string;
};

function isOrchestraModeId(value: string | null | undefined): value is OrchestraModeId {
  return value === "agentic-cjm" || value === "traditional-cjm";
}

function resolveJourneyId(
  session: RecordingSession,
  options?: CompileRecordingJourneyOptions
): OrchestraModeId {
  if (options?.journeyId && isOrchestraModeId(options.journeyId)) {
    return options.journeyId;
  }
  if (isOrchestraModeId(session.journeyId)) return session.journeyId;
  if (isOrchestraModeId(session.orchestraMode)) return session.orchestraMode;
  return "agentic-cjm";
}

function slugBeatId(raw: string): string {
  const cleaned = raw
    .replace(/^beat:/, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
  return cleaned || "recorded-beat";
}

function uniqueBeatId(base: string, used: Set<string>): string {
  let id = base;
  let n = 2;
  while (used.has(id)) {
    id = `${base}-${n}`;
    n += 1;
  }
  used.add(id);
  return id;
}

function isBeatAction(id: string): id is JourneyBeatActionId {
  return BEAT_ACTIONS.has(id as JourneyBeatActionId);
}

function readProtoTab(events: readonly RecordedEvent[]): number | undefined {
  for (let i = events.length - 1; i >= 0; i -= 1) {
    const snap = events[i]?.snapshot;
    if (snap?.protoTab != null && Number.isFinite(snap.protoTab)) {
      return snap.protoTab;
    }
    if (
      snap?.currentTabIndex != null &&
      Number.isFinite(snap.currentTabIndex)
    ) {
      return snap.currentTabIndex + 1;
    }
  }
  return undefined;
}

function readDwellMs(events: readonly RecordedEvent[]): number | undefined {
  let max: number | undefined;
  for (const event of events) {
    if (event.kind !== "dwell") continue;
    const ms = event.durationMs;
    if (ms == null || !Number.isFinite(ms) || ms <= 0) continue;
    max = max == null ? ms : Math.max(max, ms);
  }
  return max;
}

function applyScriptToBeat(
  beat: JourneyBeat,
  scriptId: string,
  scriptKind?: string
): boolean {
  const kind =
    scriptKind === "home" ||
    scriptKind === "avail" ||
    scriptKind === "book" ||
    scriptKind === "tab"
      ? scriptKind
      : resolvePlaybackScriptKind(scriptId);
  if (!kind) return false;

  switch (kind) {
    case "home":
      beat.homeScript = scriptId as HomeScriptId;
      return true;
    case "avail":
      beat.availScript = scriptId as AvailabilityScriptId;
      return true;
    case "book":
      beat.bookScript = scriptId as BookScriptId;
      return true;
    case "tab":
      beat.tabScript = scriptId as TabScriptId;
      return true;
    default:
      return false;
  }
}

function inferKind(beat: JourneyBeat): JourneyBeatKind {
  if (beat.availScript && beat.protoTab == null) return "overlay";
  if (beat.scenarioId) return "screen-frames";
  return "tab-landing";
}

function compileSegmentToBeat(
  segment: CompiledBeatSegment,
  usedIds: Set<string>,
  gaps: string[]
): JourneyBeat {
  const baseId = uniqueBeatId(
    slugBeatId(segment.beatId ?? segment.touchpointKey),
    usedIds
  );
  const beat: JourneyBeat = {
    id: baseId,
    label: segment.label?.trim() || baseId,
    kind: "tab-landing",
  };

  let scriptApplied = false;
  let onEnterApplied = false;

  for (const event of segment.events) {
    if (event.kind === "director-script" && !scriptApplied) {
      scriptApplied = applyScriptToBeat(
        beat,
        event.scriptId,
        event.scriptKind
      );
      if (!scriptApplied) {
        gaps.push(`director-script:${event.scriptId}`);
      }
    }

    if (event.kind === "wire-intent") {
      if (event.intentId === "retreat-sync" && !scriptApplied) {
        const scriptId =
          typeof event.payload?.scriptId === "string"
            ? event.payload.scriptId
            : undefined;
        const scriptKind =
          typeof event.payload?.scriptKind === "string"
            ? event.payload.scriptKind
            : undefined;
        if (scriptId) {
          scriptApplied = applyScriptToBeat(beat, scriptId, scriptKind);
          if (!scriptApplied) {
            gaps.push(`retreat-sync:${scriptId}`);
          }
        }
      } else if (!onEnterApplied && isBeatAction(event.intentId)) {
        beat.onEnter = event.intentId;
        onEnterApplied = true;
      } else if (!isBeatAction(event.intentId) && event.intentId !== "retreat-sync") {
        gaps.push(`wire-intent:${event.intentId}`);
      }
    }

    if (event.kind === "beat-enter" && !onEnterApplied) {
      if (isBeatAction(event.actionId)) {
        beat.onEnter = event.actionId;
        onEnterApplied = true;
      } else {
        gaps.push(`beat-enter:${event.actionId}`);
      }
    }

    if (event.kind === "scroll") {
      gaps.push("scroll");
    }

    if (event.kind === "typed-text") {
      gaps.push("typed-text");
    }
  }

  const protoTab = readProtoTab(segment.events);
  if (protoTab != null) beat.protoTab = protoTab;

  const dwellMs = readDwellMs(segment.events);
  if (dwellMs != null) beat.dwellMs = dwellMs;

  const scenario =
    KNOWN_SCENARIO_BY_BEAT[baseId] ??
    (segment.beatId ? KNOWN_SCENARIO_BY_BEAT[segment.beatId] : undefined);
  if (scenario) beat.scenarioId = scenario;

  beat.kind = inferKind(beat);
  return beat;
}

/**
 * Fallback when the session has no touchpoint markers — synthesize beats from
 * director-script / screen / wire-intent markers so REC → journey still works.
 */
function compileFallbackBeats(
  events: readonly RecordedEvent[],
  usedIds: Set<string>,
  gaps: string[],
  warnings: string[]
): JourneyBeat[] {
  warnings.push("no-touchpoint-markers");
  const beats: JourneyBeat[] = [];
  let pendingScreen: { screenId: string; atMs: number; events: RecordedEvent[] } | null =
    null;

  const flushPending = () => {
    if (!pendingScreen) return;
    const segment: CompiledBeatSegment = {
      touchpointKey: `screen:${pendingScreen.screenId}`,
      beatId: pendingScreen.screenId,
      label: pendingScreen.screenId,
      startedAtMs: pendingScreen.atMs,
      events: pendingScreen.events,
    };
    beats.push(compileSegmentToBeat(segment, usedIds, gaps));
    pendingScreen = null;
  };

  for (const event of events) {
    if (event.kind === "screen") {
      flushPending();
      pendingScreen = {
        screenId: event.screenId,
        atMs: event.atMs,
        events: [event],
      };
      continue;
    }

    if (
      event.kind === "director-script" ||
      event.kind === "wire-intent" ||
      event.kind === "beat-enter" ||
      event.kind === "dwell"
    ) {
      if (pendingScreen) {
        pendingScreen.events.push(event);
      } else {
        const segment: CompiledBeatSegment = {
          touchpointKey: `event:${event.kind}:${event.atMs}`,
          beatId:
            event.kind === "director-script"
              ? event.scriptId
              : event.kind === "wire-intent"
                ? String(event.intentId)
                : event.kind === "beat-enter"
                  ? event.actionId
                  : `dwell-${event.atMs}`,
          label:
            event.kind === "director-script"
              ? event.scriptId
              : event.kind === "wire-intent"
                ? String(event.intentId)
                : event.kind,
          startedAtMs: event.atMs,
          events: [event],
        };
        beats.push(compileSegmentToBeat(segment, usedIds, gaps));
      }
      continue;
    }

    if (event.kind === "scroll") {
      gaps.push("scroll");
    }

    if (event.kind === "typed-text") {
      gaps.push("typed-text");
    }
  }

  flushPending();
  return beats;
}

/**
 * Compile a recording session into a JourneyDefinition the playback engine can play.
 * Touchpoint segments → beats; director-script / known wire-intent / dwell / protoTab map in.
 */
export function compileRecordingToJourney(
  session: RecordingSession,
  options?: CompileRecordingJourneyOptions
): CompiledRecordingJourney {
  const timeline = compileRecordingToBeatTimeline(session);
  const warnings: string[] = [];
  const gaps: string[] = [];
  const usedIds = new Set<string>();

  let beats =
    timeline.segments.length > 0
      ? timeline.segments.map((segment) =>
          compileSegmentToBeat(segment, usedIds, gaps)
        )
      : compileFallbackBeats(session.events, usedIds, gaps, warnings);

  if (beats.length === 0) {
    warnings.push("empty-journey");
    beats = [
      {
        id: uniqueBeatId("recorded-empty", usedIds),
        label: "Recorded (empty)",
        kind: "tab-landing",
        protoTab: 1,
      },
    ];
  }

  const journeyId = resolveJourneyId(session, options);
  const defaultLabel =
    journeyId === "traditional-cjm" ? "Traditional CJM" : "Agentic CJM";
  const journey: JourneyDefinition = {
    id: journeyId,
    label: options?.label?.trim() || `${defaultLabel} (recorded)`,
    beats,
  };

  const uniqueGaps = [...new Set(gaps)];
  return { journey, timeline, warnings, gaps: uniqueGaps };
}

/** Compile + merge into the runtime journey catalog (ephemeral until reload/clear). */
export function saveRecordingAsJourney(
  session: RecordingSession,
  options?: CompileRecordingJourneyOptions & {
    projectId?: ProjectId | string;
    personaId?: PersonaId | string;
  }
): SaveRecordingAsJourneyResult {
  const compiled = compileRecordingToJourney(session, options);
  const file: JourneyFile = {
    version: 1,
    exportedAt: new Date().toISOString(),
    projectId: (options?.projectId ?? session.projectId) as ProjectId | undefined,
    personaId: (options?.personaId ?? session.personaId) as PersonaId | undefined,
    journey: compiled.journey,
  };
  applyImportedJourneyFile(file);
  return {
    journey: compiled.journey,
    file,
    summary: summarizeJourney(compiled.journey),
    warnings: compiled.warnings,
    gaps: compiled.gaps,
    json: serializeJourneyFile({
      journey: compiled.journey,
      projectId: file.projectId,
      personaId: file.personaId,
    }),
  };
}

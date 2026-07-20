import type {
  JourneyBeat,
  JourneyBeatActionId,
  JourneyBeatKind,
  JourneyBeatRecordedClick,
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
import { persistRecordedJourneyFile } from "@/app/journey/recordedJourneyPersist";
import { isBuiltInOrchestraModeId } from "@/app/orchestra/orchestraModes";
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
import {
  healRecordedJourneyNav,
  screenIdToProtoTab,
} from "@/app/recording/recordedJourneyNavHeal";
import type { PersonaId, ProjectId } from "@/projects/types";

/** Match STEPS coalescing — screen after click is navigation, not a new beat. */
const SCREEN_AFTER_CLICK_MS = 1000;

const BEAT_ACTIONS = new Set<JourneyBeatActionId>([
  "open-availability-start",
  "open-availability-date-chat",
  "close-availability",
  "apply-demo-location",
]);

const KNOWN_SCENARIO_BY_BEAT: Record<string, string> = {
  "agentic-chat": "site-pilot-chat",
  chat: "site-pilot-chat",
};

const AVAIL_ACTION_RE = /^avail-|^chat-avail-/;

export type CompileRecordingJourneyOptions = {
  /**
   * Target journey id. When `addAsNew` (default for Add as CJM), a free
   * `rec-trad-|rec-agentic-…` id is minted unless `journeyId` is set.
   */
  journeyId?: OrchestraModeId;
  label?: string;
  /**
   * When true (default), always create a **new** CJM id — do not overwrite
   * agentic-cjm / traditional-cjm slots.
   */
  addAsNew?: boolean;
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

function resolvePathFlavor(
  session: RecordingSession
): "trad" | "agentic" {
  const mode = session.orchestraMode ?? session.journeyId ?? "";
  if (
    mode === "traditional-cjm" ||
    mode === "traditional" ||
    String(mode).includes("trad")
  ) {
    return "trad";
  }
  return "agentic";
}

function mintRecordedJourneyId(session: RecordingSession): OrchestraModeId {
  const flavor = resolvePathFlavor(session);
  const stamp = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 6);
  return `rec-${flavor}-${stamp}-${rand}`;
}

function resolveJourneyId(
  session: RecordingSession,
  options?: CompileRecordingJourneyOptions
): OrchestraModeId {
  const addAsNew = options?.addAsNew !== false;
  if (options?.journeyId) {
    if (addAsNew && isBuiltInOrchestraModeId(options.journeyId)) {
      return mintRecordedJourneyId(session);
    }
    return options.journeyId;
  }
  if (addAsNew) {
    return mintRecordedJourneyId(session);
  }
  if (isBuiltInOrchestraModeId(session.journeyId)) return session.journeyId;
  if (isBuiltInOrchestraModeId(session.orchestraMode)) {
    return session.orchestraMode;
  }
  return mintRecordedJourneyId(session);
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

/** Usable for CJM replay — never lone `#root` / empty. */
export function isUsablePlaybackSelectorChain(
  chain: string[] | undefined
): chain is string[] {
  if (!chain?.length) return false;
  const cleaned = chain.filter((s) => s && s !== "#root");
  return cleaned.length > 0;
}

function readScreenId(events: readonly RecordedEvent[]): string | undefined {
  for (let i = events.length - 1; i >= 0; i -= 1) {
    const event = events[i];
    if (event?.kind === "screen" && event.screenId) return event.screenId;
    const snapScreen = event?.snapshot?.screenId;
    if (typeof snapScreen === "string" && snapScreen.trim()) return snapScreen;
  }
  return undefined;
}

/**
 * Prefer live nav (`currentTabIndex`) + screenId over snapshot `protoTab`.
 * During REC, `protoTab` was often the *journey beat* tab (stale) while the
 * user browsed other screens — that compiled every beat as protoTab 1.
 */
function readProtoTab(
  events: readonly RecordedEvent[],
  projectId?: string
): number | undefined {
  const fromScreen = screenIdToProtoTab(projectId, readScreenId(events));
  if (fromScreen != null) return fromScreen;

  for (let i = events.length - 1; i >= 0; i -= 1) {
    const snap = events[i]?.snapshot;
    if (
      snap?.currentTabIndex != null &&
      Number.isFinite(snap.currentTabIndex)
    ) {
      return snap.currentTabIndex + 1;
    }
  }
  for (let i = events.length - 1; i >= 0; i -= 1) {
    const snap = events[i]?.snapshot;
    if (snap?.protoTab != null && Number.isFinite(snap.protoTab)) {
      return snap.protoTab;
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
  if (beat.recordedClick) {
    for (const sel of beat.recordedClick.selectorChain) {
      const m = sel.match(/data-studio-action="([^"]+)"/);
      if (m?.[1] && AVAIL_ACTION_RE.test(m[1])) return "overlay";
    }
  }
  if (beat.availScript && beat.protoTab == null) return "overlay";
  if (beat.scenarioId) return "screen-frames";
  return "tab-landing";
}

function recordedClickFromDemoEvent(
  event: Extract<RecordedEvent, { kind: "demo-click" }>,
  pendingScroll: Extract<RecordedEvent, { kind: "scroll" }> | null
): JourneyBeatRecordedClick | null {
  if (!isUsablePlaybackSelectorChain(event.selectorChain)) return null;
  const click: JourneyBeatRecordedClick = {
    selectorChain: event.selectorChain.filter((s) => s && s !== "#root"),
    element: event.element,
  };
  if (
    pendingScroll &&
    isUsablePlaybackSelectorChain(pendingScroll.selectorChain)
  ) {
    click.cameraSelectorChain = pendingScroll.selectorChain.filter(
      (s) => s && s !== "#root"
    );
    if (pendingScroll.anchorSelector) {
      click.cameraAnchorSelector = pendingScroll.anchorSelector;
    }
  }
  return click;
}

function compileSegmentToBeat(
  segment: CompiledBeatSegment,
  usedIds: Set<string>,
  gaps: string[],
  projectId?: string
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
  let recordedClickApplied = false;
  let pendingScroll: Extract<RecordedEvent, { kind: "scroll" }> | null = null;

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
      if (isUsablePlaybackSelectorChain(event.selectorChain)) {
        pendingScroll = event;
      } else {
        gaps.push("scroll");
      }
    }

    if (event.kind === "demo-click" && !recordedClickApplied && !scriptApplied) {
      const click = recordedClickFromDemoEvent(event, pendingScroll);
      if (click) {
        beat.recordedClick = click;
        recordedClickApplied = true;
        pendingScroll = null;
        if (event.element?.trim()) {
          beat.label = event.element.trim().slice(0, 64);
        }
      } else {
        gaps.push("demo-click:unusable-selector");
      }
    }

    if (event.kind === "typed-text") {
      gaps.push("typed-text");
    }
  }

  const protoTab =
    readProtoTab(segment.events, projectId) ??
    screenIdToProtoTab(projectId, baseId) ??
    screenIdToProtoTab(projectId, segment.beatId);
  if (protoTab != null) beat.protoTab = protoTab;

  const dwellMs = readDwellMs(segment.events);
  if (dwellMs != null) beat.dwellMs = dwellMs;

  const scenarioKey = baseId.replace(/-\d+$/, "");
  const scenario =
    KNOWN_SCENARIO_BY_BEAT[baseId] ??
    KNOWN_SCENARIO_BY_BEAT[scenarioKey] ??
    (segment.beatId ? KNOWN_SCENARIO_BY_BEAT[segment.beatId] : undefined);
  // Only the first chat landing gets screen-frames — chat-2/chat-3 stay tab hops.
  if (scenario && (baseId === "chat" || baseId === "agentic-chat")) {
    beat.scenarioId = scenario;
  }

  beat.kind = inferKind(beat);
  return beat;
}

/**
 * Compile v2 fallback — human REC without touchpoint markers.
 * Screen + director/wire stay one beat (legacy). Usable demo-clicks become
 * `recordedClick` beats. Coalesces click→screen; skips same-screen URL churn.
 */
function compileFallbackBeats(
  events: readonly RecordedEvent[],
  usedIds: Set<string>,
  gaps: string[],
  warnings: string[],
  projectId?: string
): JourneyBeat[] {
  warnings.push("no-touchpoint-markers");
  const beats: JourneyBeat[] = [];
  let pendingScreen: {
    screenId: string;
    atMs: number;
    events: RecordedEvent[];
  } | null = null;
  let currentScreenId: string | undefined;
  let currentProtoTab: number | undefined;
  let lastClickAtMs: number | undefined;
  let pendingScroll: Extract<RecordedEvent, { kind: "scroll" }> | null = null;
  const landedScreens = new Set<string>();

  const flushPending = () => {
    if (!pendingScreen) return;
    const segment: CompiledBeatSegment = {
      touchpointKey: `screen:${pendingScreen.screenId}`,
      beatId: pendingScreen.screenId,
      label: pendingScreen.screenId,
      startedAtMs: pendingScreen.atMs,
      events: pendingScreen.events,
    };
    beats.push(compileSegmentToBeat(segment, usedIds, gaps, projectId));
    landedScreens.add(pendingScreen.screenId);
    pendingScreen = null;
  };

  const contextProtoTab = (): number | undefined =>
    currentProtoTab ??
    screenIdToProtoTab(projectId, currentScreenId);

  for (const event of events) {
    if (event.kind === "scroll") {
      if (isUsablePlaybackSelectorChain(event.selectorChain)) {
        pendingScroll = event;
      } else {
        gaps.push("scroll");
      }
      continue;
    }

    if (event.kind === "demo-click") {
      const click = recordedClickFromDemoEvent(event, pendingScroll);
      pendingScroll = null;
      if (!click) {
        gaps.push("demo-click:unusable-selector");
        continue;
      }
      flushPending();
      const fromSnap =
        event.snapshot?.currentTabIndex != null
          ? event.snapshot.currentTabIndex + 1
          : event.snapshot?.protoTab;
      if (fromSnap != null) currentProtoTab = fromSnap;
      const snapScreen =
        typeof event.snapshot?.screenId === "string"
          ? event.snapshot.screenId
          : undefined;
      if (snapScreen) currentScreenId = snapScreen;

      // Optional hollow landing only when we never landed this screen yet
      // and the click beat needs a known protoTab from a prior screen event.
      if (
        currentScreenId &&
        !landedScreens.has(currentScreenId) &&
        contextProtoTab() != null
      ) {
        const landing: CompiledBeatSegment = {
          touchpointKey: `screen:${currentScreenId}`,
          beatId: currentScreenId,
          label: currentScreenId,
          startedAtMs: event.atMs,
          events: [
            {
              kind: "screen",
              screenId: currentScreenId,
              atMs: event.atMs,
              snapshot:
                currentProtoTab != null
                  ? { protoTab: currentProtoTab, screenId: currentScreenId }
                  : { screenId: currentScreenId },
            },
          ],
        };
        beats.push(compileSegmentToBeat(landing, usedIds, gaps, projectId));
        landedScreens.add(currentScreenId);
      }

      const actionMatch = click.selectorChain
        .join(" ")
        .match(/data-studio-action="([^"]+)"/);
      const base =
        actionMatch?.[1] ??
        slugBeatId(event.element ?? "recorded-click");
      const beatId = uniqueBeatId(slugBeatId(base), usedIds);
      const beat: JourneyBeat = {
        id: beatId,
        label: (event.element ?? beatId).trim().slice(0, 64) || beatId,
        kind: "tab-landing",
        recordedClick: click,
        protoTab: contextProtoTab(),
      };
      beat.kind = inferKind(beat);
      beats.push(beat);
      if (typeof event.atMs === "number") lastClickAtMs = event.atMs;
      continue;
    }

    if (event.kind === "screen") {
      const screenId = event.screenId;
      const at = event.atMs;
      const proto =
        screenIdToProtoTab(projectId, screenId) ??
        (event.snapshot?.currentTabIndex != null
          ? event.snapshot.currentTabIndex + 1
          : event.snapshot?.protoTab);

      if (
        lastClickAtMs != null &&
        typeof at === "number" &&
        at >= lastClickAtMs &&
        at - lastClickAtMs <= SCREEN_AFTER_CLICK_MS
      ) {
        currentScreenId = screenId;
        if (proto != null) currentProtoTab = proto;
        // Stay on same screen (modal URL) — keep landed; new screen clears pending only.
        if (pendingScreen && pendingScreen.screenId !== screenId) {
          flushPending();
        }
        continue;
      }

      if (pendingScreen?.screenId === screenId) {
        pendingScreen.events.push(event);
        continue;
      }

      flushPending();
      currentScreenId = screenId;
      if (proto != null) currentProtoTab = proto;
      lastClickAtMs = undefined;
      pendingScreen = {
        screenId,
        atMs: typeof at === "number" ? at : 0,
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
        beats.push(compileSegmentToBeat(segment, usedIds, gaps, projectId));
      }
      continue;
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
 * Compile v2: usable demo-clicks → `recordedClick` beats (playable via demo cursor).
 */
export function compileRecordingToJourney(
  session: RecordingSession,
  options?: CompileRecordingJourneyOptions
): CompiledRecordingJourney {
  const timeline = compileRecordingToBeatTimeline(session);
  const warnings: string[] = [];
  const gaps: string[] = [];
  const usedIds = new Set<string>();
  const projectId = session.projectId;

  const hasUsableDemoClicks = session.events.some(
    (e) =>
      e.kind === "demo-click" && isUsablePlaybackSelectorChain(e.selectorChain)
  );

  // Prefer click-aware compile when usable demo-clicks exist (human REC path).
  // Pure director/touchpoint sessions without clicks keep the segment mapper.
  let beats =
    timeline.segments.length > 0 && !hasUsableDemoClicks
      ? timeline.segments.map((segment) =>
          compileSegmentToBeat(segment, usedIds, gaps, projectId)
        )
      : compileFallbackBeats(
          session.events,
          usedIds,
          gaps,
          warnings,
          projectId
        );

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
  const flavor = resolvePathFlavor(session);
  const defaultLabel = isBuiltInOrchestraModeId(journeyId)
    ? journeyId === "traditional-cjm"
      ? "Traditional CJM (recorded)"
      : "Agentic CJM (recorded)"
    : flavor === "trad"
      ? `Recorded Traditional ${new Date().toLocaleString()}`
      : `Recorded Agentic ${new Date().toLocaleString()}`;
  const journey: JourneyDefinition = healRecordedJourneyNav(
    {
      id: journeyId,
      label: options?.label?.trim() || defaultLabel,
      beats,
    },
    projectId
  );

  const uniqueGaps = [...new Set(gaps)];
  return { journey, timeline, warnings, gaps: uniqueGaps };
}

/**
 * Compile + add as a **new** CJM under project/persona (runtime catalog +
 * localStorage). Persists the **full recording session** beside the journey so
 * the event log is never discarded. REC UI collects a title (`label`) separately
 * from recording JSON download. Does **not** overwrite the built-in
 * agentic/traditional slots unless `addAsNew: false`.
 */
export function saveRecordingAsJourney(
  session: RecordingSession,
  options?: CompileRecordingJourneyOptions & {
    projectId?: ProjectId | string;
    personaId?: PersonaId | string;
  }
): SaveRecordingAsJourneyResult {
  const compiled = compileRecordingToJourney(session, {
    ...options,
    addAsNew: options?.addAsNew !== false,
  });
  const file: JourneyFile = {
    version: 1,
    exportedAt: new Date().toISOString(),
    projectId: (options?.projectId ?? session.projectId) as ProjectId | undefined,
    personaId: (options?.personaId ?? session.personaId) as PersonaId | undefined,
    journey: compiled.journey,
    recording: session,
  };
  applyImportedJourneyFile(file);
  persistRecordedJourneyFile(file);
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
      recording: session,
    }),
  };
}

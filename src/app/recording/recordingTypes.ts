import type {
  JourneyBeatActionId,
  OrchestraModeId,
} from "@/app/orchestra/types";
import type { PlaybackStudioSnapshot } from "@/app/shell/playbackStudioSnapshot";
import type { ManualTransportAction } from "@/app/shell/playbackInteractionContext";

/** Studio state captured at event time — aligned with MCP + diagnostic snapshots. */
export type RecordingSnapshot = PlaybackStudioSnapshot & {
  journeyMode?: boolean;
  scrollLock?: boolean;
  orchestraMode?: OrchestraModeId | null;
  counter?: string | null;
};

export type RecordedTransportEvent = {
  kind: "transport";
  action: ManualTransportAction;
  atMs: number;
  snapshot?: RecordingSnapshot;
};

export type RecordedStudioEvent = {
  kind: "studio";
  field: "journey-mode" | "orchestra-mode" | "project" | "persona";
  value: string | boolean;
  atMs: number;
  snapshot?: RecordingSnapshot;
};

export type RecordedDemoClickEvent = {
  kind: "demo-click";
  /** Human-readable descriptor from describePlaybackElement. */
  element: string;
  /** Nearest data-studio-* / data-name chain for replay targeting. */
  selectorChain?: string[];
  beatId?: string;
  touchpointKey?: string;
  atMs: number;
  snapshot?: RecordingSnapshot;
};

export type RecordedWireIntentEvent = {
  kind: "wire-intent";
  intentId: JourneyBeatActionId | string;
  payload?: Record<string, unknown>;
  atMs: number;
  snapshot?: RecordingSnapshot;
};

export type RecordedScrollEvent = {
  kind: "scroll";
  /**
   * Primary — nearest meaningful target in the scroll viewport.
   * Replay uses engine scroll-to-target (eased), not pixel snap.
   */
  selectorChain?: string[];
  /** Leaf / human-readable selector (diagnostic + simple querySelector fallback). */
  anchorSelector?: string;
  /**
   * Legacy only — new captures omit this. Replay **refuses** scrollTop-only
   * (target-only forward). Prefer selectorChain / anchorSelector.
   */
  scrollTop?: number;
  atMs: number;
  snapshot?: RecordingSnapshot;
};

/**
 * Scroll host settled ≥ ~2s with no meaningful movement (jiggles ignored).
 * Compile → first-class `kind: "camera"` dwell / pause wait (optional target).
 */
export type RecordedScrollStopEvent = {
  kind: "scroll-stop";
  /** Settled pause ms (at least SCROLL_STOP_DWELL_MS). → camera.dwellMs */
  durationMs: number;
  /** Scroll host target at settle (optional next target when known). */
  selectorChain?: string[];
  anchorSelector?: string;
  atMs: number;
  snapshot?: RecordingSnapshot;
};

/** Settled text entry on input/textarea (debounced) for REC ↺ replay. */
export type RecordedTypedTextEvent = {
  kind: "typed-text";
  value: string;
  /** Nearest data-studio-* / data-name chain for replay targeting. */
  selectorChain?: string[];
  /** Human-readable descriptor (action / name / tag). */
  element?: string;
  inputType?: string;
  atMs: number;
  snapshot?: RecordingSnapshot;
};

export type RecordedTouchpointEvent = {
  kind: "touchpoint";
  touchpointKey: string;
  beatId?: string;
  label?: string;
  counter?: string | null;
  atMs: number;
  snapshot?: RecordingSnapshot;
};

export type RecordedDwellEvent = {
  kind: "dwell";
  durationMs?: number;
  atMs: number;
  snapshot?: RecordingSnapshot;
};

export type RecordedDirectorEvent = {
  kind: "director-script";
  scriptId: string;
  scriptKind?: string;
  beatId?: string;
  manual?: boolean;
  atMs: number;
  snapshot?: RecordingSnapshot;
};

export type RecordedBeatEnterEvent = {
  kind: "beat-enter";
  actionId: string;
  beatId?: string;
  atMs: number;
  snapshot?: RecordingSnapshot;
};

/** Address-bar / tab screen transition — ordered for replay deep-link restore. */
export type RecordedScreenEvent = {
  kind: "screen";
  screenId: string;
  projectId?: string;
  studioUrl?: string;
  atMs: number;
  snapshot?: RecordingSnapshot;
};

export type RecordedEvent =
  | RecordedTransportEvent
  | RecordedStudioEvent
  | RecordedDemoClickEvent
  | RecordedWireIntentEvent
  | RecordedScrollEvent
  | RecordedScrollStopEvent
  | RecordedTypedTextEvent
  | RecordedTouchpointEvent
  | RecordedDwellEvent
  | RecordedDirectorEvent
  | RecordedBeatEnterEvent
  | RecordedScreenEvent;

export type RecordingJourneyCatalogEntry = {
  id: string;
  label: string;
  beatCount: number;
  beatIds: string[];
};

export type RecordingSessionMetadata = {
  userAgent?: string;
  recordedFrom?: "mcp" | "dev" | "ui";
  notes?: string;
  /**
   * Screen id at ● Start (seeded). Compile + Add as CJM assert first beat
   * equals this — never a later camera/CTA hop.
   */
  startScreenId?: string;
  /** Full studio search at ● Start (optional evidence). */
  startStudioUrl?: string;
};

export type RecordingSession = {
  id: string;
  version: 1;
  startedAt: string;
  stoppedAt?: string;
  projectId?: string;
  personaId?: string;
  journeyId?: string;
  orchestraMode?: OrchestraModeId | null;
  /** Persona journey catalog at record start — for compile/replay context. */
  journeyCatalog?: RecordingJourneyCatalogEntry[];
  paused?: boolean;
  events: RecordedEvent[];
  metadata?: RecordingSessionMetadata;
};

export type CompiledBeatSegment = {
  touchpointKey: string;
  beatId?: string;
  label?: string;
  counter?: string | null;
  startedAtMs: number;
  events: RecordedEvent[];
};

export type CompiledRecordingTimeline = {
  sessionId: string;
  segments: CompiledBeatSegment[];
  /** Events before the first touchpoint marker. */
  preamble: RecordedEvent[];
};

export type RecordingScreenApplyInput = {
  screenId: string;
  projectId?: string;
  studioUrl?: string;
};

export type RecordingDemoClickApplyInput = {
  element: string;
  selectorChain?: string[];
  beatId?: string;
  touchpointKey?: string;
};

export type RecordingWireIntentApplyInput = {
  intentId: JourneyBeatActionId | string;
  payload?: Record<string, unknown>;
};

export type RecordingDirectorScriptApplyInput = {
  scriptId: string;
  scriptKind?: string;
  beatId?: string;
  manual?: boolean;
};

export type RecordingBeatEnterApplyInput = {
  actionId: string;
  beatId?: string;
};

export type RecordingScrollApplyInput = {
  selectorChain?: string[];
  anchorSelector?: string;
  /** Fallback only when no resolvable target. */
  scrollTop?: number;
};

export type RecordingTypedTextApplyInput = {
  value: string;
  selectorChain?: string[];
  element?: string;
  inputType?: string;
};

export type RecordingReplayOptions = {
  triggerTransport?: (action: ManualTransportAction) => void | Promise<void>;
  /**
   * Restore nav from `kind: "screen"` via shared `applyStudioScreen`
   * (same helper as refresh deep-link / popstate).
   */
  applyScreen?: (
    event: RecordingScreenApplyInput
  ) => boolean | void | Promise<boolean | void>;
  /**
   * v2 — re-fire demo-clicks / human REC clicks
   * (resolve selectorChain → simulateDemoPointerClick).
   * When omitted, demo-click events count as unsupported.
   */
  applyDemoClick?: (
    event: RecordingDemoClickApplyInput
  ) => boolean | void | Promise<boolean | void>;
  /**
   * v2 — dispatch wire intents (project `runBeatAction` for known beat actions;
   * `retreat-sync` → script runner with syncState when scriptId resolves).
   * When omitted, wire-intent events count as unsupported.
   */
  applyWireIntent?: (
    event: RecordingWireIntentApplyInput
  ) => boolean | void | Promise<boolean | void>;
  /**
   * v2 — re-run director scripts via project `run*Script` channels.
   * When omitted, director-script events count as unsupported.
   */
  applyDirectorScript?: (
    event: RecordingDirectorScriptApplyInput
  ) => boolean | void | Promise<boolean | void>;
  /**
   * v3 — re-fire beat onEnter actions (`runBeatAction` / sync-* book script).
   * When omitted, beat-enter events count as unsupported.
   */
  applyBeatEnter?: (
    event: RecordingBeatEnterApplyInput
  ) => boolean | void | Promise<boolean | void>;
  /**
   * v3 — engine scroll-to-target (selectorChain / anchor). scrollTop-only → refuse.
   * When omitted, scroll events count as unsupported.
   */
  applyScroll?: (
    event: RecordingScrollApplyInput
  ) => boolean | void | Promise<boolean | void>;
  /**
   * v3 — restore typed text into a resolved input/textarea.
   * When omitted, typed-text events count as unsupported.
   */
  applyTypedText?: (
    event: RecordingTypedTextApplyInput
  ) => boolean | void | Promise<boolean | void>;
  /**
   * Hold after each major replayed step (ms). Default 4000 (≥4s floor).
   * Capture `atMs` gaps longer than this are honored. `0` disables holds (unit tests).
   * Scroll uses a short settle after engine eased scroll — not this full floor.
   */
  stepDelayMs?: number;
  shouldAbort?: () => boolean;
};

export type RecordingReplayResult = {
  replayed: number;
  skipped: number;
  unsupported: number;
  errors: string[];
};

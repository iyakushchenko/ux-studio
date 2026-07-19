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
  scrollTop?: number;
  anchorSelector?: string;
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

export type RecordingReplayOptions = {
  triggerTransport?: (action: ManualTransportAction) => void | Promise<void>;
  /**
   * Restore nav from `kind: "screen"` via shared `applyStudioScreen`
   * (same helper as refresh deep-link / popstate).
   */
  applyScreen?: (
    event: RecordingScreenApplyInput
  ) => boolean | void | Promise<boolean | void>;
  /** Delay between transport / screen events (ms). Default 400. */
  stepDelayMs?: number;
  /** v2 — replay demo clicks via simulateDemoPointerClick. */
  replayDemoClicks?: boolean;
  /** v2 — replay wire intents via runBeatAction. */
  replayWireIntents?: boolean;
  shouldAbort?: () => boolean;
};

export type RecordingReplayResult = {
  replayed: number;
  skipped: number;
  unsupported: number;
  errors: string[];
};

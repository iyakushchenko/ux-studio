import type {
  RecordedEvent,
  RecordingJourneyCatalogEntry,
  RecordingSession,
  RecordingSessionMetadata,
  RecordingSnapshot,
} from "@/app/recording/recordingTypes";

const SESSION_VERSION = 1 as const;
const DEDUPE_WINDOW_MS = 80;

let activeSession: RecordingSession | null = null;
let lastSession: RecordingSession | null = null;
let paused = false;
const listeners = new Set<() => void>();

function notifyRecordingListeners(): void {
  for (const listener of listeners) {
    listener();
  }
}

/** Subscribe to session start/stop/pause/stage changes (Studio UI + tests). */
export function subscribeRecordingSession(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getLastRecordingSession(): RecordingSession | null {
  return lastSession;
}

/** Stage a stopped or imported session for export / replay. */
export function stageRecordingSession(session: RecordingSession): void {
  lastSession = session;
  notifyRecordingListeners();
}

function newSessionId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `rec-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function eventDedupeKey(event: RecordedEvent): string {
  switch (event.kind) {
    case "transport":
      return `transport:${event.action}`;
    case "studio":
      return `studio:${event.field}:${String(event.value)}`;
    case "demo-click":
      return `demo-click:${event.element}`;
    case "wire-intent":
      return `wire-intent:${event.intentId}:${JSON.stringify(event.payload ?? {})}`;
    case "scroll":
      return `scroll:${event.anchorSelector ?? ""}:${(event.selectorChain ?? []).join(">")}:${event.scrollTop ?? ""}`;
    case "typed-text":
      return `typed-text:${(event.selectorChain ?? []).join(">")}:${event.value}`;
    case "touchpoint":
      return `touchpoint:${event.touchpointKey}`;
    case "dwell":
      return `dwell:${event.durationMs ?? 0}`;
    case "director-script":
      return `director:${event.scriptId}:${event.beatId ?? ""}:${event.manual ? "m" : "a"}`;
    case "beat-enter":
      return `beat-enter:${event.actionId}:${event.beatId ?? ""}`;
    case "screen":
      return `screen:${event.projectId ?? ""}:${event.screenId}:${event.studioUrl ?? ""}`;
    default:
      return "unknown";
  }
}

function isDuplicate(
  session: RecordingSession,
  event: RecordedEvent
): boolean {
  const last = session.events[session.events.length - 1];
  if (!last) return false;
  if (event.atMs - last.atMs > DEDUPE_WINDOW_MS) return false;
  return eventDedupeKey(last) === eventDedupeKey(event);
}

export function isRecordingActive(): boolean {
  return activeSession != null && !paused;
}

export function isRecordingPaused(): boolean {
  return activeSession != null && paused;
}

export function getActiveRecordingSession(): RecordingSession | null {
  return activeSession;
}

export type StartRecordingOptions = {
  projectId?: string;
  personaId?: string;
  journeyId?: string;
  orchestraMode?: RecordingSession["orchestraMode"];
  journeyCatalog?: RecordingJourneyCatalogEntry[];
  metadata?: RecordingSessionMetadata;
};

export function startRecording(options: StartRecordingOptions = {}): RecordingSession {
  activeSession = {
    id: newSessionId(),
    version: SESSION_VERSION,
    startedAt: new Date().toISOString(),
    projectId: options.projectId,
    personaId: options.personaId,
    journeyId: options.journeyId,
    orchestraMode: options.orchestraMode ?? null,
    journeyCatalog: options.journeyCatalog,
    events: [],
    metadata: {
      userAgent:
        typeof navigator !== "undefined" ? navigator.userAgent : undefined,
      recordedFrom: options.metadata?.recordedFrom ?? "dev",
      ...options.metadata,
    },
  };
  paused = false;
  notifyRecordingListeners();
  return activeSession;
}

export function pauseRecording(): boolean {
  if (!activeSession) return false;
  paused = true;
  activeSession.paused = true;
  notifyRecordingListeners();
  return true;
}

export function resumeRecording(): boolean {
  if (!activeSession) return false;
  paused = false;
  activeSession.paused = false;
  notifyRecordingListeners();
  return true;
}

export function stopRecording(): RecordingSession | null {
  if (!activeSession) return null;
  activeSession.stoppedAt = new Date().toISOString();
  activeSession.paused = false;
  const finished = activeSession;
  activeSession = null;
  paused = false;
  lastSession = finished;
  notifyRecordingListeners();
  return finished;
}

export function appendRecordingEvent(
  event: RecordedEvent,
  options?: { force?: boolean }
): RecordingSession | null {
  if (!activeSession || paused) return null;
  if (!options?.force && isDuplicate(activeSession, event)) {
    return activeSession;
  }
  activeSession.events.push(event);
  // STEPS counter + REC UI subscribe via useSyncExternalStore — must notify.
  notifyRecordingListeners();
  return activeSession;
}

export function appendRecordingEventWithSnapshot(
  event: Omit<RecordedEvent, "snapshot" | "atMs"> & {
    atMs?: number;
    snapshot?: RecordingSnapshot;
  },
  getSnapshot?: () => RecordingSnapshot | undefined
): RecordingSession | null {
  const full: RecordedEvent = {
    ...event,
    atMs: event.atMs ?? performance.now(),
    snapshot: event.snapshot ?? getSnapshot?.(),
  } as RecordedEvent;
  return appendRecordingEvent(full);
}

export function serializeRecordingSession(
  session: RecordingSession
): string {
  return JSON.stringify(session, null, 2);
}

export function deserializeRecordingSession(raw: string): RecordingSession {
  const parsed = JSON.parse(raw) as RecordingSession;
  if (parsed.version !== SESSION_VERSION) {
    throw new Error(`Unsupported recording version: ${parsed.version}`);
  }
  if (!parsed.id || !Array.isArray(parsed.events)) {
    throw new Error("Invalid recording session payload");
  }
  return parsed;
}

/** Test-only — clears active session state. */
export function resetRecordingSessionForTests(): void {
  activeSession = null;
  lastSession = null;
  paused = false;
  listeners.clear();
}

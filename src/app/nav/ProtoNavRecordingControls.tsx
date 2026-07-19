import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { flashControlRoomButton } from "@/app/nav/protoControlRoomTap";
import { ProtoStudioPlaybackRecSwitch } from "@/app/nav/ProtoStudioPlaybackRecSwitch";
import {
  getActiveRecordingSession,
  getLastRecordingSession,
  isRecordingActive,
  isRecordingPaused,
  pauseRecording,
  resumeRecording,
  serializeRecordingSession,
  stageRecordingSession,
  startRecording,
  stopRecording,
  subscribeRecordingSession,
  type StartRecordingOptions,
  deserializeRecordingSession,
} from "@/app/recording/protoRecordingSession";
import type { ProtoRecordingSession } from "@/app/recording/protoRecordingTypes";
import { logControlPanel } from "@/app/shell/protoControlPanelLog";

export type ProtoNavRecordingControlsProps = {
  getStartOptions: () => StartRecordingOptions;
  onReplay: (session: ProtoRecordingSession) => void | Promise<void>;
};

type RecordingUiSnapshot = {
  hasLive: boolean;
  isRecording: boolean;
  isPaused: boolean;
  eventCount: number;
  canExport: boolean;
  canReplay: boolean;
};

let cachedRecordingUiSnapshot: RecordingUiSnapshot = {
  hasLive: false,
  isRecording: false,
  isPaused: false,
  eventCount: 0,
  canExport: false,
  canReplay: false,
};

function readRecordingUiSnapshot(): RecordingUiSnapshot {
  const live = getActiveRecordingSession();
  const last = getLastRecordingSession();
  const exportTarget = live ?? last;
  const next: RecordingUiSnapshot = {
    hasLive: live != null,
    isRecording: isRecordingActive(),
    isPaused: isRecordingPaused(),
    eventCount: live?.events.length ?? last?.events.length ?? 0,
    canExport: exportTarget != null,
    canReplay: last != null && live == null,
  };
  const prev = cachedRecordingUiSnapshot;
  if (
    prev.hasLive === next.hasLive &&
    prev.isRecording === next.isRecording &&
    prev.isPaused === next.isPaused &&
    prev.eventCount === next.eventCount &&
    prev.canExport === next.canExport &&
    prev.canReplay === next.canReplay
  ) {
    return prev;
  }
  cachedRecordingUiSnapshot = next;
  return next;
}

function useRecordingUiSnapshot(): RecordingUiSnapshot {
  return useSyncExternalStore(
    subscribeRecordingSession,
    readRecordingUiSnapshot,
    readRecordingUiSnapshot
  );
}

/** Live / last-session recorded-event count — Rec mode only (never labeled STEPS). */
export function formatRecordingEventCounter(eventCount: number): string {
  return `REC: ${eventCount}`;
}

/**
 * Session event counter for the Playback|Rec mode-control slot.
 * Parent must mount only when Rec mode is on — never replace the REC mode label,
 * and never mount beside journey STEPS in playback.
 */
export function ProtoNavRecordingEventCounter() {
  const ui = useRecordingUiSnapshot();
  const label = formatRecordingEventCounter(ui.eventCount);
  const stateClass = ui.isRecording
    ? " proto-nav-scenario__counter--recording-live"
    : ui.isPaused
      ? " proto-nav-scenario__counter--recording-paused"
      : "";
  return (
    <span
      className={`proto-nav-scenario__counter proto-nav-scenario__counter--recording${stateClass}`}
      aria-live="polite"
      aria-label={`Recorded events: ${ui.eventCount}`}
      title={
        ui.isRecording
          ? `Recording · ${ui.eventCount} events`
          : ui.isPaused
            ? `Paused · ${ui.eventCount} events`
            : ui.canReplay || ui.canExport
              ? `Last session · ${ui.eventCount} events`
              : "No recorded events yet"
      }
    >
      {label}
    </span>
  );
}

function RecDotIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" aria-hidden>
      <circle cx="5" cy="5" r="3.5" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" aria-hidden>
      <rect x="1" y="0.5" width="2.25" height="9" rx="0.35" />
      <rect x="6.75" y="0.5" width="2.25" height="9" rx="0.35" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" aria-hidden>
      <path d="M2 1.25v7.5L8.5 5 2 1.25z" />
    </svg>
  );
}

function StopIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" aria-hidden>
      <rect x="1.5" y="1.5" width="7" height="7" rx="0.35" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" aria-hidden>
      <path d="M5 1.25v5.25" stroke="currentColor" strokeWidth="1.4" fill="none" />
      <path d="M2.5 4.75 5 7.5l2.5-2.75" stroke="currentColor" strokeWidth="1.4" fill="none" />
      <path d="M1.5 8.5h7" stroke="currentColor" strokeWidth="1.4" fill="none" />
    </svg>
  );
}

function ImportIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" aria-hidden>
      <path d="M5 8.75V3.5" stroke="currentColor" strokeWidth="1.4" fill="none" />
      <path d="M2.5 5.25 5 2.5l2.5 2.75" stroke="currentColor" strokeWidth="1.4" fill="none" />
      <path d="M1.5 1.5h7" stroke="currentColor" strokeWidth="1.4" fill="none" />
    </svg>
  );
}

function ReplayIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" aria-hidden>
      <path
        d="M2.25 5A2.75 2.75 0 1 0 5 2.25"
        stroke="currentColor"
        strokeWidth="1.4"
        fill="none"
      />
      <path d="M1.5 1.5v2.75h2.75" stroke="currentColor" strokeWidth="1.4" fill="none" />
    </svg>
  );
}

function downloadRecordingJson(session: ProtoRecordingSession): void {
  const json = serializeRecordingSession(session);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  const stamp = session.stoppedAt ?? session.startedAt ?? "session";
  const safeStamp = stamp.replace(/[:.]/g, "-");
  anchor.href = url;
  anchor.download = `recording-${safeStamp}.recording.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

/**
 * Standalone deck when orchestra scenario controls are absent.
 * Same exclusive Playback|Rec gate: left = empty playback slot, right = REC only.
 */
export function ProtoNavRecordingModeSlot({
  getStartOptions,
  onReplay,
}: ProtoNavRecordingControlsProps) {
  const [recMode, setRecMode] = useState(false);

  return (
    <div className="proto-nav-scenario__deck">
      <span className="proto-nav-scenario__mode-control">
        <span className="proto-nav-scenario__mode-label" aria-hidden>
          REC
        </span>
        <ProtoStudioPlaybackRecSwitch
          checked={recMode}
          onChange={(enabled) => {
            logControlPanel("studio:playback-rec-mode", {
              enabled,
              previous: recMode,
              source: "standalone-slot",
            });
            // Leaving Rec → Playback: pause a live capture; do not stop/destroy the session.
            if (!enabled && isRecordingActive()) {
              pauseRecording();
            }
            setRecMode(enabled);
          }}
        />
        {recMode ? <ProtoNavRecordingEventCounter /> : null}
      </span>
      {recMode ? (
        <ProtoNavRecordingControls
          getStartOptions={getStartOptions}
          onReplay={onReplay}
        />
      ) : null}
    </div>
  );
}

/**
 * Recording transport buttons for the shared cassette deck slot.
 * Parent (ProtoNavScenarioControls) mounts this XOR the playback transport.
 * Uses the same `proto-nav-scenario__btn` chrome as cassette controls.
 */
export function ProtoNavRecordingControls({
  getStartOptions,
  onReplay,
}: ProtoNavRecordingControlsProps) {
  const ui = useRecordingUiSnapshot();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [replaying, setReplaying] = useState(false);
  const [statusNote, setStatusNote] = useState<string | null>(null);

  useEffect(() => {
    if (!statusNote) return;
    const timer = window.setTimeout(() => setStatusNote(null), 2400);
    return () => window.clearTimeout(timer);
  }, [statusNote]);

  const flashTap = (button: HTMLButtonElement) => {
    flashControlRoomButton(button, "proto-nav-scenario__btn--tap");
  };

  const handleStart = (event: React.MouseEvent<HTMLButtonElement>) => {
    logControlPanel("recording:start", { hasLive: ui.hasLive });
    flashTap(event.currentTarget);
    if (ui.hasLive) return;
    const defaults = getStartOptions();
    startRecording({
      ...defaults,
      metadata: {
        ...defaults.metadata,
        recordedFrom: "ui",
      },
    });
  };

  const handlePauseResume = (event: React.MouseEvent<HTMLButtonElement>) => {
    flashTap(event.currentTarget);
    if (ui.isPaused) {
      logControlPanel("recording:resume", { eventCount: ui.eventCount });
      resumeRecording();
      return;
    }
    logControlPanel("recording:pause", { eventCount: ui.eventCount });
    pauseRecording();
    setStatusNote("PAUSE");
  };

  const handleStop = (event: React.MouseEvent<HTMLButtonElement>) => {
    logControlPanel("recording:stop", { eventCount: ui.eventCount });
    flashTap(event.currentTarget);
    const finished = stopRecording();
    setStatusNote(finished ? `STOP · ${finished.events.length}` : null);
  };

  const handleDownload = (event: React.MouseEvent<HTMLButtonElement>) => {
    const target = getActiveRecordingSession() ?? getLastRecordingSession();
    logControlPanel("recording:download", {
      blocked: !target,
      eventCount: target?.events.length ?? 0,
    });
    flashTap(event.currentTarget);
    if (!target) return;
    downloadRecordingJson(target);
    setStatusNote("EXPORT");
  };

  const handleImportClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    logControlPanel("recording:import", { hasLive: ui.hasLive });
    flashTap(event.currentTarget);
    fileInputRef.current?.click();
  };

  const handleImportFile = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const text = await file.text();
      const imported = deserializeRecordingSession(text);
      stageRecordingSession(imported);
      setStatusNote(`IMP · ${imported.events.length}`);
    } catch (error) {
      console.warn("[ProtoRecording] import failed", error);
      setStatusNote("IMP FAIL");
    }
  };

  const handleReplay = async (event: React.MouseEvent<HTMLButtonElement>) => {
    const target = getLastRecordingSession();
    logControlPanel("recording:replay", {
      blocked: !target || ui.hasLive || replaying,
      eventCount: target?.events.length ?? 0,
    });
    flashTap(event.currentTarget);
    if (!target || ui.hasLive || replaying) return;
    setReplaying(true);
    setStatusNote("REPLAY");
    try {
      await onReplay(target);
    } catch (error) {
      console.warn("[ProtoRecording] replay failed", error);
      setStatusNote("REPLAY FAIL");
    } finally {
      setReplaying(false);
    }
  };

  const panelClass = [
    "proto-nav-recording-panel",
    ui.isRecording ? "proto-nav-recording-panel--live" : "",
    ui.isPaused ? "proto-nav-recording-panel--paused" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <span className={panelClass} role="group" aria-label="Journey recording">
      {statusNote ? (
        <span className="proto-nav-recording__label" aria-live="polite">
          {statusNote}
        </span>
      ) : null}
      <button
        type="button"
        className="proto-nav-step-btn proto-nav-scenario__btn"
        aria-label="Start recording"
        title="Start recording"
        disabled={ui.hasLive || replaying}
        onClick={handleStart}
      >
        <RecDotIcon />
      </button>
      <button
        type="button"
        className="proto-nav-step-btn proto-nav-scenario__btn"
        aria-label={ui.isPaused ? "Resume recording" : "Pause recording"}
        title={ui.isPaused ? "Resume recording" : "Pause recording"}
        disabled={!ui.hasLive || replaying}
        onClick={handlePauseResume}
      >
        {ui.isPaused ? <PlayIcon /> : <PauseIcon />}
      </button>
      <button
        type="button"
        className="proto-nav-step-btn proto-nav-scenario__btn"
        aria-label="Stop recording"
        title="Stop recording"
        disabled={!ui.hasLive || replaying}
        onClick={handleStop}
      >
        <StopIcon />
      </button>
      <button
        type="button"
        className="proto-nav-step-btn proto-nav-scenario__btn"
        aria-label="Download recording JSON"
        title="Download .recording.json"
        disabled={!ui.canExport || replaying}
        onClick={handleDownload}
      >
        <DownloadIcon />
      </button>
      <button
        type="button"
        className="proto-nav-step-btn proto-nav-scenario__btn"
        aria-label="Import recording JSON"
        title="Import .recording.json"
        disabled={ui.hasLive || replaying}
        onClick={handleImportClick}
      >
        <ImportIcon />
      </button>
      <button
        type="button"
        className="proto-nav-step-btn proto-nav-scenario__btn"
        aria-label="Replay last recording"
        title="Replay last / imported session"
        disabled={!ui.canReplay || replaying}
        onClick={handleReplay}
      >
        <ReplayIcon />
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,.recording.json,application/json"
        className="proto-nav-recording__file"
        onChange={handleImportFile}
      />
    </span>
  );
}

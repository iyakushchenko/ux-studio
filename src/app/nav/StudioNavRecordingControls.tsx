import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "@/uxds/motion";
import { flashControlRoomButton } from "@/app/nav/controlRoomTap";
import { StudioPlaybackRecSwitch } from "@/app/nav/StudioPlaybackRecSwitch";
import { studioPanelTransition } from "@/app/nav/studioMotion";
import { saveRecordingAsJourney } from "@/app/recording/recordingCompile";
import {
  clearStagedRecordingSession,
  countRecordingSteps,
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
} from "@/app/recording/recordingSession";
import type { RecordingSession } from "@/app/recording/recordingTypes";
import { logControlPanel } from "@/app/shell/controlPanelLog";

export type StudioNavRecordingControlsProps = {
  getStartOptions: () => StartRecordingOptions;
  onReplay: (session: RecordingSession) => void | Promise<void>;
  /** Compile last/live session → new CJM option (project+persona) + download JSON. */
  onSaveAsJourney?: (
    session: RecordingSession,
    saved?: { journeyId: string; label: string }
  ) => void;
  /** When true (AIR / play live), REC mode switch is locked — same gate as cassette transport. */
  recModeLocked?: boolean;
  /**
   * CREATE NEW CJM path (idle selection or live REC forced).
   * Gates Start / Pause / Stop / Purge / Import / + / Replay — hidden for saved CJMs.
   * Saved CJMs: Download exports the selected journey JSON (via onExportSavedJourney).
   */
  createNewCjmSelected?: boolean;
  /** Export selected saved CJM as journey file JSON (saved-picker Download). */
  onExportSavedJourney?: () => { json: string; filename: string } | null;
};

type RecordingUiSnapshot = {
  hasLive: boolean;
  isRecording: boolean;
  isPaused: boolean;
  /** Journey STEPS — excludes scroll (replay targets, not counted steps). */
  eventCount: number;
  canExport: boolean;
  canReplay: boolean;
  /** Stopped / imported session can be discarded with X. */
  canPurge: boolean;
};

let cachedRecordingUiSnapshot: RecordingUiSnapshot = {
  hasLive: false,
  isRecording: false,
  isPaused: false,
  eventCount: 0,
  canExport: false,
  canReplay: false,
  canPurge: false,
};

export { countRecordingSteps } from "@/app/recording/recordingSession";

function readRecordingUiSnapshot(): RecordingUiSnapshot {
  const live = getActiveRecordingSession();
  const last = getLastRecordingSession();
  const exportTarget = live ?? last;
  const next: RecordingUiSnapshot = {
    hasLive: live != null,
    isRecording: isRecordingActive(),
    isPaused: isRecordingPaused(),
    eventCount: countRecordingSteps(exportTarget?.events),
    canExport: exportTarget != null,
    canReplay: last != null && live == null,
    canPurge: last != null && live == null,
  };
  const prev = cachedRecordingUiSnapshot;
  if (
    prev.hasLive === next.hasLive &&
    prev.isRecording === next.isRecording &&
    prev.isPaused === next.isPaused &&
    prev.eventCount === next.eventCount &&
    prev.canExport === next.canExport &&
    prev.canReplay === next.canReplay &&
    prev.canPurge === next.canPurge
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

/** Live / last-session recorded-event count — Rec mode only (`STEPS: N`; mode label stays REC). */
export function formatRecordingEventCounter(eventCount: number): string {
  return `STEPS: ${eventCount}`;
}

/**
 * Session event counter for the Playback|Rec mode-control slot.
 * Parent must mount only when Rec mode is on — never replace the REC mode label,
 * and never mount beside journey STEPS in playback.
 */
export function StudioNavRecordingEventCounter() {
  const ui = useRecordingUiSnapshot();
  const label = formatRecordingEventCounter(ui.eventCount);
  const stateClass = ui.isRecording
    ? " studio-nav-scenario__counter--recording-live"
    : ui.isPaused
      ? " studio-nav-scenario__counter--recording-paused"
      : "";
  return (
    <span
      className={`studio-nav-scenario__counter studio-nav-scenario__counter--recording${stateClass}`}
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

function PurgeXIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" aria-hidden>
      <path
        d="M2.25 2.25l5.5 5.5M7.75 2.25l-5.5 5.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
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

function AddCjmPlusIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" aria-hidden>
      <path d="M4.25 1.5h1.5v7h-1.5z" />
      <path d="M1.5 4.25h7v1.5h-7z" />
    </svg>
  );
}

function downloadTextJson(filename: string, json: string): void {
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function downloadRecordingJson(session: RecordingSession): void {
  const json = serializeRecordingSession(session);
  const stamp = session.stoppedAt ?? session.startedAt ?? "session";
  const safeStamp = stamp.replace(/[:.]/g, "-");
  downloadTextJson(`recording-${safeStamp}.recording.json`, json);
}

/**
 * Standalone deck when orchestra scenario controls are absent.
 * Same exclusive Playback|Rec gate: left = empty playback slot, right = REC only.
 * Lock mirrors StudioNavScenarioControls — REC disabled while AIR/play live
 * (standalone slot has no CJM; orchestra path also locks REC when CJM is on).
 */
export function StudioNavRecordingModeSlot({
  getStartOptions,
  onReplay,
  onSaveAsJourney,
  recModeLocked = false,
  createNewCjmSelected = false,
  onExportSavedJourney,
}: StudioNavRecordingControlsProps) {
  const [recMode, setRecMode] = useState(false);

  useEffect(() => {
    if (!recModeLocked || !recMode) return;
    logControlPanel("studio:playback-rec-mode", {
      enabled: false,
      previous: true,
      forced: true,
      reason: "air-active",
      source: "standalone-slot",
    });
    if (isRecordingActive()) {
      pauseRecording();
    }
    setRecMode(false);
  }, [recModeLocked, recMode]);

  return (
    <div className="studio-nav-scenario__deck">
      <span
        className="studio-nav-scenario__mode-control"
        aria-disabled={recModeLocked || undefined}
      >
        <span className="studio-nav-scenario__mode-label" aria-hidden>
          REC
        </span>
        <StudioPlaybackRecSwitch
          checked={recMode}
          disabled={recModeLocked}
          onChange={(enabled) => {
            if (recModeLocked && enabled) {
              logControlPanel("studio:playback-rec-mode", {
                enabled,
                previous: recMode,
                blocked: true,
                blockReason: "air-active",
                source: "standalone-slot",
              });
              return;
            }
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
        <AnimatePresence initial={false} mode="popLayout">
          {recMode && !recModeLocked && createNewCjmSelected ? (
            <motion.span
              key="rec-event-counter"
              className="studio-nav-scenario__panel-motion-inline"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={studioPanelTransition}
            >
              <StudioNavRecordingEventCounter />
            </motion.span>
          ) : null}
        </AnimatePresence>
      </span>
      <div className="studio-nav-scenario__panel-swap" aria-live="polite">
        <AnimatePresence initial={false} mode="wait">
          {recMode && !recModeLocked ? (
            <motion.div
              key="rec-panel"
              className="studio-nav-scenario__panel-swap-item"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={studioPanelTransition}
            >
              <StudioNavRecordingControls
                getStartOptions={getStartOptions}
                onReplay={onReplay}
                onSaveAsJourney={onSaveAsJourney}
                createNewCjmSelected={createNewCjmSelected}
                onExportSavedJourney={onExportSavedJourney}
              />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}

/**
 * Recording transport buttons for the shared cassette deck slot.
 * Parent (StudioNavScenarioControls) mounts this XOR the playback transport.
 * Uses the same `studio-nav-scenario__btn` chrome as cassette controls.
 */
export function StudioNavRecordingControls({
  getStartOptions,
  onReplay,
  onSaveAsJourney,
  createNewCjmSelected = false,
  onExportSavedJourney,
}: StudioNavRecordingControlsProps) {
  const ui = useRecordingUiSnapshot();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addCjmRootRef = useRef<HTMLSpanElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const [replaying, setReplaying] = useState(false);
  const [statusNote, setStatusNote] = useState<string | null>(null);
  const [addCjmOpen, setAddCjmOpen] = useState(false);
  const [cjmTitle, setCjmTitle] = useState("");
  /** Start / Pause / Stop / Purge / + — CREATE NEW path only (live REC also forces CREATE NEW). */
  const showNewRecordingDeck = createNewCjmSelected || ui.hasLive;
  const downloadDisabled = createNewCjmSelected
    ? ui.hasLive || !ui.canExport || replaying
    : replaying || !onExportSavedJourney;

  useEffect(() => {
    if (!statusNote) return;
    const timer = window.setTimeout(() => setStatusNote(null), 2400);
    return () => window.clearTimeout(timer);
  }, [statusNote]);

  useEffect(() => {
    if (ui.hasLive && addCjmOpen) setAddCjmOpen(false);
  }, [ui.hasLive, addCjmOpen]);

  useEffect(() => {
    if (!addCjmOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      const root = addCjmRootRef.current;
      if (!root || root.contains(event.target as Node)) return;
      setAddCjmOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setAddCjmOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("keydown", onKeyDown);
    const focusTimer = window.setTimeout(() => titleInputRef.current?.focus(), 0);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("keydown", onKeyDown);
      window.clearTimeout(focusTimer);
    };
  }, [addCjmOpen]);

  const flashTap = (button: HTMLButtonElement) => {
    flashControlRoomButton(button, "studio-nav-scenario__btn--tap");
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

  const handlePurge = (event: React.MouseEvent<HTMLButtonElement>) => {
    logControlPanel("recording:purge", {
      blocked: !ui.canPurge || replaying,
      eventCount: ui.eventCount,
    });
    flashTap(event.currentTarget);
    if (!ui.canPurge || replaying) return;
    const cleared = clearStagedRecordingSession();
    setAddCjmOpen(false);
    setStatusNote(cleared ? "PURGE" : null);
  };

  const handleDownload = (event: React.MouseEvent<HTMLButtonElement>) => {
    flashTap(event.currentTarget);
    // Saved CJM: export selected journey JSON (not the staged recording session).
    if (!createNewCjmSelected) {
      const exported = onExportSavedJourney?.() ?? null;
      logControlPanel("recording:download", {
        kind: "saved-journey",
        blocked: !exported,
      });
      if (!exported) {
        setStatusNote("EXPORT FAIL");
        return;
      }
      downloadTextJson(exported.filename, exported.json);
      setStatusNote("EXPORT");
      return;
    }
    // CREATE NEW: Download locked while live (Stop first) — same idea as +.
    const target = ui.hasLive ? null : getLastRecordingSession();
    logControlPanel("recording:download", {
      kind: "recording-session",
      blocked: !target || ui.hasLive,
      eventCount: target?.events.length ?? 0,
    });
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
      console.warn("[StudioRecording] replay failed", error);
      setStatusNote("REPLAY FAIL");
    } finally {
      setReplaying(false);
    }
  };

  const openAddCjmTitle = (event: React.MouseEvent<HTMLButtonElement>) => {
    const session = getActiveRecordingSession() ?? getLastRecordingSession();
    logControlPanel("recording:add-as-cjm-open", {
      blocked: !session || replaying,
      eventCount: session?.events.length ?? 0,
    });
    flashTap(event.currentTarget);
    if (!session || replaying) return;
    const stamp = new Date().toISOString().slice(0, 16).replace("T", " ");
    setCjmTitle(`Recorded ${stamp}`);
    setAddCjmOpen(true);
  };

  const confirmAddCjm = () => {
    let session = getActiveRecordingSession() ?? getLastRecordingSession();
    const title = cjmTitle.trim();
    logControlPanel("recording:add-as-cjm", {
      blocked: !session || replaying || !title,
      eventCount: session?.events.length ?? 0,
      label: title || null,
    });
    if (!session || replaying || !title) return;
    try {
      if (isRecordingActive()) {
        session = stopRecording() ?? session;
      }
      const defaults = getStartOptions();
      const saved = saveRecordingAsJourney(session, {
        projectId: session.projectId ?? defaults.projectId,
        personaId: session.personaId ?? defaults.personaId,
        addAsNew: true,
        label: title,
      });
      setAddCjmOpen(false);
      onSaveAsJourney?.(session, {
        journeyId: saved.journey.id,
        label: saved.journey.label,
      });
      setStatusNote(`CJM · ${saved.journey.label}`);
    } catch (error) {
      console.warn("[StudioRecording] add-as-cjm failed", error);
      setStatusNote("CJM FAIL");
    }
  };

  const panelClass = [
    "studio-nav-recording-panel",
    ui.isRecording ? "studio-nav-recording-panel--live" : "",
    ui.isPaused ? "studio-nav-recording-panel--paused" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <span className={panelClass} role="group" aria-label="Journey recording">
      {statusNote ? (
        <span className="studio-nav-recording__label" aria-live="polite">
          {statusNote}
        </span>
      ) : null}
      {showNewRecordingDeck ? (
        <>
          <button
            type="button"
            className="studio-nav-step-btn studio-nav-scenario__btn"
            aria-label="Start recording"
            title="Start recording"
            disabled={ui.hasLive || replaying}
            onClick={handleStart}
            data-studio-recording-start=""
          >
            <RecDotIcon />
          </button>
          <button
            type="button"
            className="studio-nav-step-btn studio-nav-scenario__btn"
            aria-label={ui.isPaused ? "Resume recording" : "Pause recording"}
            title={ui.isPaused ? "Resume recording" : "Pause recording"}
            disabled={!ui.hasLive || replaying}
            onClick={handlePauseResume}
            data-studio-recording-pause=""
          >
            {ui.isPaused ? <PlayIcon /> : <PauseIcon />}
          </button>
          <button
            type="button"
            className="studio-nav-step-btn studio-nav-scenario__btn"
            aria-label="Stop recording"
            title="Stop recording"
            disabled={!ui.hasLive || replaying}
            onClick={handleStop}
            data-studio-recording-stop=""
          >
            <StopIcon />
          </button>
          <button
            type="button"
            className="studio-nav-step-btn studio-nav-scenario__btn"
            aria-label="Discard recording"
            title="Discard stopped recording (clears STEPS)"
            disabled={!ui.canPurge || replaying}
            onClick={handlePurge}
            data-studio-recording-purge=""
          >
            <PurgeXIcon />
          </button>
        </>
      ) : null}
      <button
        type="button"
        className="studio-nav-step-btn studio-nav-scenario__btn"
        aria-label={
          createNewCjmSelected
            ? "Download recording JSON"
            : "Download journey JSON"
        }
        title={
          createNewCjmSelected
            ? ui.hasLive
              ? "Stop recording before downloading"
              : "Download .recording.json"
            : "Download selected CJM as .journey.json"
        }
        disabled={downloadDisabled}
        onClick={handleDownload}
        data-studio-recording-download=""
      >
        <DownloadIcon />
      </button>
      {createNewCjmSelected && !ui.hasLive ? (
        <button
          type="button"
          className="studio-nav-step-btn studio-nav-scenario__btn"
          aria-label="Import recording JSON"
          title="Import .recording.json into a new CJM path"
          disabled={replaying}
          onClick={handleImportClick}
          data-studio-recording-import=""
        >
          <ImportIcon />
        </button>
      ) : null}
      {createNewCjmSelected ? (
        <button
          type="button"
          className="studio-nav-step-btn studio-nav-scenario__btn"
          aria-label="Replay last recording"
          title="Replay last / imported session"
          disabled={!ui.canReplay || replaying}
          onClick={handleReplay}
          data-studio-recording-replay=""
        >
          <ReplayIcon />
        </button>
      ) : null}
      {showNewRecordingDeck ? (
        <span
          ref={addCjmRootRef}
          className="studio-nav-recording-add-cjm"
          data-studio-recording-add-cjm=""
        >
          <button
            type="button"
            className="studio-nav-step-btn studio-nav-scenario__btn"
            aria-label="Add to project as CJM"
            title={
              ui.hasLive
                ? "Stop recording before adding as CJM"
                : "Add recording as a new CJM (title, then confirm)"
            }
            aria-expanded={addCjmOpen}
            aria-haspopup="dialog"
            disabled={ui.hasLive || !ui.canExport || replaying}
            onClick={openAddCjmTitle}
          >
            <AddCjmPlusIcon />
          </button>
          {addCjmOpen ? (
            <div
              className="studio-nav-recording-add-cjm__panel"
              role="dialog"
              aria-label="New CJM title"
            >
              <label className="studio-nav-recording-add-cjm__field">
                <span className="studio-nav-recording-add-cjm__field-label">
                  CJM title
                </span>
                <input
                  ref={titleInputRef}
                  className="studio-nav-recording-add-cjm__input"
                  type="text"
                  value={cjmTitle}
                  maxLength={80}
                  placeholder="Journey title"
                  onChange={(event) => setCjmTitle(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      confirmAddCjm();
                    }
                  }}
                />
              </label>
              <div className="studio-nav-recording-add-cjm__actions">
                <button
                  type="button"
                  className="studio-nav-recording-add-cjm__action"
                  onClick={() => setAddCjmOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="studio-nav-recording-add-cjm__action studio-nav-recording-add-cjm__action--confirm"
                  disabled={!cjmTitle.trim()}
                  onClick={confirmAddCjm}
                >
                  Add
                </button>
              </div>
            </div>
          ) : null}
        </span>
      ) : null}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,.recording.json,application/json"
        className="studio-nav-recording__file"
        onChange={handleImportFile}
      />
    </span>
  );
}

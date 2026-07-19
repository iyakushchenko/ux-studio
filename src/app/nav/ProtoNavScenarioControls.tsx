import type { ReactNode } from "react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ProtoStudioJourneySwitch } from "@/app/nav/ProtoStudioJourneySwitch";
import { ProtoStudioPlaybackRecSwitch } from "@/app/nav/ProtoStudioPlaybackRecSwitch";
import {
  CONTROL_ROOM_TAP_MS,
  flashControlRoomButton,
} from "@/app/nav/protoControlRoomTap";
import { ProtoNavRecordingEventCounter } from "@/app/nav/ProtoNavRecordingControls";
import {
  STUDIO_LABEL_SHRINK_DELAY_S,
  studioPanelTransition,
} from "@/app/nav/protoStudioMotion";
import {
  isRecordingActive,
  pauseRecording,
} from "@/app/recording/protoRecordingSession";
import {
  logControlPanel,
  type ControlPanelAction,
} from "@/app/shell/protoControlPanelLog";
import {
  isJourneyModeSwitchDisabled,
  isRecModeLocked,
  resolveRecModeLockReason,
} from "@/app/nav/studioModeXor";
export type ProtoNavScenarioControlsProps = {
  studioMenus: ReactNode;
  segmentLabel?: string;
  visibleCount: number;
  totalFrames: number;
  /** False until CJM is on; when off shows `STEPS: N` with the current playlist total. */
  stepProgressActive?: boolean;
  /** FL-style switch — journey mode locks screen nav; counter/label always live when on. */
  journeyMode?: boolean;
  onJourneyModeChange?: (enabled: boolean) => void;
  journeyModeSwitchDisabled?: boolean;
  /** Playback diagnostic is open — red studio diode beside popup. */
  playbackErrorActive?: boolean;
  isPlaying: boolean;
  /** Green studio diode + touchpoint blink — on-air for auto-play and step-script interactions. */
  isOnAir?: boolean;
  /** CJM reached the last playlist frame — blue end diode until transport moves. */
  journeyAtEnd?: boolean;
  /** Increments when auto-playback reaches the final touchpoint. */
  playbackEndToken?: number;
  canStepBack: boolean;
  canStepForward: boolean;
  canJumpToStart: boolean;
  canPlay: boolean;
  canJumpToEnd: boolean;
  onJumpToStart: () => void;
  onStepBack: () => void;
  onPlay: () => void;
  onStepForward: () => void;
  onJumpToEnd: () => void;
  qaBeatId?: string | null;
  qaBeatLabel?: string | null;
  /** Optional recording deck (same session APIs as MCP helpers). */
  recordingControls?: ReactNode;
};

function CassettePauseIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" aria-hidden>
      <rect x="1" y="0.5" width="2.25" height="9" rx="0.35" />
      <rect x="6.75" y="0.5" width="2.25" height="9" rx="0.35" />
    </svg>
  );
}

/** ■ stop — shown disabled at journey end. */
function CassetteStopIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" aria-hidden>
      <rect x="1.5" y="1.5" width="7" height="7" rx="0.35" />
    </svg>
  );
}

/** |◄◄ */
function CassetteJumpToStartIcon() {
  return (
    <svg width="14" height="10" viewBox="0 0 14 10" fill="currentColor" aria-hidden>
      <rect x="0.5" y="0.5" width="1.25" height="9" rx="0.25" />
      <path d="M8.25 1.25 3.75 5l4.5 3.75V1.25z" />
      <path d="M13 1.25 8.5 5 13 8.75V1.25z" />
    </svg>
  );
}

/** |◄ */
function CassetteStepBackIcon() {
  return (
    <svg width="12" height="10" viewBox="0 0 12 10" fill="currentColor" aria-hidden>
      <rect x="0.5" y="0.5" width="1.25" height="9" rx="0.25" />
      <path d="M10 1.25 4.5 5 10 8.75V1.25z" />
    </svg>
  );
}

/** ► play */
function CassettePlayIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" aria-hidden>
      <path d="M2 1.25v7.5L8.5 5 2 1.25z" />
    </svg>
  );
}

/** ►| */
function CassetteStepForwardIcon() {
  return (
    <svg width="12" height="10" viewBox="0 0 12 10" fill="currentColor" aria-hidden>
      <path d="M2 1.25v7.5L8.5 5 2 1.25z" />
      <rect x="10.25" y="0.5" width="1.25" height="9" rx="0.25" />
    </svg>
  );
}

/** ►►| */
function CassetteJumpToEndIcon() {
  return (
    <svg width="14" height="10" viewBox="0 0 14 10" fill="currentColor" aria-hidden>
      <path d="M2.25 1.25 6.75 5l-4.5 3.75V1.25z" />
      <path d="M7.25 1.25 11.75 5l-4.5 3.75V1.25z" />
      <rect x="12.25" y="0.5" width="1.25" height="9" rx="0.25" />
    </svg>
  );
}

function formatStepCounter(
  visibleCount: number,
  totalFrames: number,
  stepProgressActive: boolean
): string {
  if (totalFrames <= 0) return "STEPS: —";
  if (!stepProgressActive) return `STEPS: ${totalFrames}`;
  return `STEPS: ${visibleCount} / ${totalFrames}`;
}

/** Width-animates touchpoint label via Motion so studio menus slide instead of jumping. */
function ProtoNavSegmentLabel({
  label,
  blinkToken,
}: {
  label: string;
  blinkToken: number;
}) {
  const innerRef = useRef<HTMLSpanElement>(null);
  const prevWidthRef = useRef<number | null>(null);
  const [width, setWidth] = useState<number | "auto">("auto");
  const [shrink, setShrink] = useState(false);

  useLayoutEffect(() => {
    const el = innerRef.current;
    if (!el) return;
    const next = Math.ceil(el.scrollWidth);
    const prev = prevWidthRef.current;
    setShrink(prev !== null && next < prev);
    prevWidthRef.current = next;
    setWidth(next);
  }, [label]);

  return (
    <motion.span
      className="proto-nav-scenario__label-slot"
      initial={false}
      animate={{ width }}
      transition={{
        ...studioPanelTransition,
        delay: shrink ? STUDIO_LABEL_SHRINK_DELAY_S : 0,
      }}
    >
      <span
        key={blinkToken}
        ref={innerRef}
        className={`proto-nav-scenario__label${
          blinkToken > 0 ? " proto-nav-scenario__label--touchpoint-blink" : ""
        }`}
      >
        {label}
      </span>
    </motion.span>
  );
}

/** Nav “control room” — 90s cassette-deck scenario playback. */
export function ProtoNavScenarioControls({
  studioMenus,
  segmentLabel,
  visibleCount,
  totalFrames,
  stepProgressActive = false,
  journeyMode = false,
  onJourneyModeChange,
  journeyModeSwitchDisabled = false,
  playbackErrorActive = false,
  isPlaying,
  isOnAir = isPlaying,
  journeyAtEnd = false,
  playbackEndToken = 0,
  canStepBack,
  canStepForward,
  canJumpToStart,
  canPlay,
  canJumpToEnd,
  onJumpToStart,
  onStepBack,
  onPlay,
  onStepForward,
  onJumpToEnd,
  qaBeatId,
  qaBeatLabel,
  recordingControls,
}: ProtoNavScenarioControlsProps) {
  const STEP_DIODE_MS = CONTROL_ROOM_TAP_MS;
  const CLICK_DIODE_MS = CONTROL_ROOM_TAP_MS;
  const [blinkToken, setBlinkToken] = useState(0);
  const [diodeEndPulse, setDiodeEndPulse] = useState(false);
  const [stepBlinkActive, setStepBlinkActive] = useState(false);
  const [clickBlinkActive, setClickBlinkActive] = useState(false);
  const [stepBlinkToken, setStepBlinkToken] = useState(0);
  /** Session-only: left = playback transport, right = recording controls (mutually exclusive). */
  const [recMode, setRecMode] = useState(false);
  const prevPlaybackEndTokenRef = useRef(0);
  const stepBlinkTimerRef = useRef<number | null>(null);
  const clickBlinkTimerRef = useRef<number | null>(null);

  /**
   * REC ⊗ CJM ⊗ AIR:
   * - CJM on → REC disabled (cannot enter Rec)
   * - AIR / play → REC forced off (same as cassette freeze)
   * - REC on → CJM disabled (and forced off when entering Rec)
   */
  const recLockReason = resolveRecModeLockReason({
    isOnAir,
    isPlaying,
    journeyMode,
  });
  const recModeLocked = isRecModeLocked({
    isOnAir,
    isPlaying,
    journeyMode,
  });
  const cjmSwitchDisabled = isJourneyModeSwitchDisabled({
    transportLocked: journeyModeSwitchDisabled,
    recMode,
  });

  const handlePlaybackRecModeChange = (enabled: boolean) => {
    if (recModeLocked && enabled) {
      logControlPanel("studio:playback-rec-mode", {
        enabled,
        previous: recMode,
        blocked: true,
        blockReason: recLockReason ?? "air-active",
      });
      return;
    }
    logControlPanel("studio:playback-rec-mode", {
      enabled,
      previous: recMode,
    });
    // Leaving Rec → Playback: pause a live capture; do not stop/destroy the session.
    if (!enabled && isRecordingActive()) {
      pauseRecording();
    }
    // Entering Rec → force CJM off (XOR both directions).
    if (enabled && journeyMode) {
      onJourneyModeChange?.(false);
    }
    setRecMode(enabled);
  };

  // CJM / AIR / play → force Playback deck (REC switch + recording controls unavailable).
  useEffect(() => {
    if (!recModeLocked || !recMode) return;
    logControlPanel("studio:playback-rec-mode", {
      enabled: false,
      previous: true,
      forced: true,
      reason: recLockReason ?? "air-active",
    });
    if (isRecordingActive()) {
      pauseRecording();
    }
    setRecMode(false);
  }, [recModeLocked, recMode, recLockReason]);

  useEffect(() => {
    return () => {
      if (stepBlinkTimerRef.current != null) {
        window.clearTimeout(stepBlinkTimerRef.current);
      }
      if (clickBlinkTimerRef.current != null) {
        window.clearTimeout(clickBlinkTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!playbackEndToken || playbackEndToken === prevPlaybackEndTokenRef.current) {
      return;
    }
    prevPlaybackEndTokenRef.current = playbackEndToken;
    if (journeyAtEnd) return;
    setDiodeEndPulse(true);
    const timer = window.setTimeout(() => setDiodeEndPulse(false), 3000);
    return () => window.clearTimeout(timer);
  }, [journeyAtEnd, playbackEndToken]);

  useEffect(() => {
    if (journeyAtEnd) {
      setDiodeEndPulse(false);
    }
  }, [journeyAtEnd]);

  useEffect(() => {
    if (!isOnAir) return;

    const handleDemoClick = () => {
      setBlinkToken((token) => token + 1);
      if (clickBlinkTimerRef.current != null) {
        window.clearTimeout(clickBlinkTimerRef.current);
      }
      setClickBlinkActive(true);
      clickBlinkTimerRef.current = window.setTimeout(() => {
        setClickBlinkActive(false);
        clickBlinkTimerRef.current = null;
      }, CLICK_DIODE_MS);
    };

    document.addEventListener("proto-demo-click", handleDemoClick);
    return () => {
      document.removeEventListener("proto-demo-click", handleDemoClick);
      if (clickBlinkTimerRef.current != null) {
        window.clearTimeout(clickBlinkTimerRef.current);
        clickBlinkTimerRef.current = null;
      }
    };
  }, [isOnAir]);

  useEffect(() => {
    if (isOnAir) return;
    setClickBlinkActive(false);
    if (clickBlinkTimerRef.current != null) {
      window.clearTimeout(clickBlinkTimerRef.current);
      clickBlinkTimerRef.current = null;
    }
  }, [isOnAir]);

  const triggerStepDiodeBlink = () => {
    if (isOnAir) return;
    if (stepBlinkTimerRef.current != null) {
      window.clearTimeout(stepBlinkTimerRef.current);
    }
    setStepBlinkToken((token) => token + 1);
    setStepBlinkActive(true);
    stepBlinkTimerRef.current = window.setTimeout(() => {
      setStepBlinkActive(false);
      stepBlinkTimerRef.current = null;
    }, STEP_DIODE_MS);
  };

  const flashTransportTap = (button: HTMLButtonElement) => {
    flashControlRoomButton(button, "proto-nav-scenario__btn--tap");
  };

  const showEndDiode =
    (journeyAtEnd || diodeEndPulse) && !playbackErrorActive && !isOnAir;
  const transportAtEnd = journeyAtEnd && !isOnAir;
  const playbackActive = isOnAir || isPlaying;
  const playShowsStop = transportAtEnd;
  const playShowsPause = !playShowsStop && isOnAir;
  const playDisabled =
    !journeyMode ||
    transportAtEnd ||
    (!playbackActive && !canPlay);

  const logBlockedTransport = (
    action: ControlPanelAction,
    disabled: boolean,
    blockReason: string,
    extra?: Record<string, unknown>
  ) => {
    if (!disabled) return;
    logControlPanel(action, { blocked: true, blockReason, ...extra });
  };

  const jumpToStartDisabled =
    !journeyMode || playbackActive || !canJumpToStart;
  const stepBackDisabled = !journeyMode || playbackActive || !canStepBack;
  const stepForwardDisabled =
    !journeyMode || playbackActive || transportAtEnd || !canStepForward;
  const jumpToEndDisabled =
    !journeyMode || playbackActive || transportAtEnd || !canJumpToEnd;

  const handleJumpToStart = (event: React.MouseEvent<HTMLButtonElement>) => {
    logControlPanel("transport:jump-to-start", {
      canJumpToStart,
      journeyMode,
      playbackActive,
    });
    flashTransportTap(event.currentTarget);
    triggerStepDiodeBlink();
    onJumpToStart();
  };

  const handleStepBack = (event: React.MouseEvent<HTMLButtonElement>) => {
    logControlPanel("transport:step-back", {
      canStepBack,
      journeyMode,
      playbackActive,
    });
    flashTransportTap(event.currentTarget);
    onStepBack();
  };

  const handlePlay = (event: React.MouseEvent<HTMLButtonElement>) => {
    logControlPanel("transport:play", {
      canPlay,
      journeyMode,
      playbackActive,
      playDisabled,
      playShowsPause,
      playShowsStop,
      isPlaying,
      isOnAir,
    });
    flashTransportTap(event.currentTarget);
    onPlay();
  };

  const handleStepForward = (event: React.MouseEvent<HTMLButtonElement>) => {
    logControlPanel("transport:step-forward", {
      canStepForward,
      journeyMode,
      playbackActive,
      transportAtEnd,
    });
    flashTransportTap(event.currentTarget);
    triggerStepDiodeBlink();
    onStepForward();
  };

  const handleJumpToEnd = (event: React.MouseEvent<HTMLButtonElement>) => {
    logControlPanel("transport:jump-to-end", {
      canJumpToEnd,
      journeyMode,
      playbackActive,
      transportAtEnd,
    });
    flashTransportTap(event.currentTarget);
    triggerStepDiodeBlink();
    onJumpToEnd();
  };

  const onAirClass = isOnAir ? " proto-nav-scenario--on-air" : "";
  const journeyModeClass = journeyMode ? " proto-nav-scenario--journey-mode" : "";
  const diodeErrorClass = playbackErrorActive ? " proto-nav-scenario__on-air--error" : "";
  const diodeEndClass = showEndDiode ? " proto-nav-scenario__on-air--end" : "";
  const diodeStepClass =
    stepBlinkActive && !isOnAir && !showEndDiode && !playbackErrorActive
      ? " proto-nav-scenario__on-air--step"
      : "";
  const diodeClickClass =
    clickBlinkActive && isOnAir && !showEndDiode && !playbackErrorActive
      ? " proto-nav-scenario__on-air--click"
      : "";

  return (
    <div
      className={`proto-nav-scenario${onAirClass}${journeyModeClass}`}
      role="group"
    >
      {studioMenus}
      {segmentLabel ? (
        <ProtoNavSegmentLabel
          label={segmentLabel}
          blinkToken={blinkToken}
        />
      ) : null}
      <div className="proto-nav-scenario__deck">
        {recordingControls ? (
          <span
            className="proto-nav-scenario__mode-control"
            aria-disabled={recModeLocked || undefined}
          >
            <span className="proto-nav-scenario__mode-label" aria-hidden>
              REC
            </span>
            <ProtoStudioPlaybackRecSwitch
              checked={recMode}
              onChange={handlePlaybackRecModeChange}
              disabled={recModeLocked}
              lockReason={recLockReason}
            />
            <AnimatePresence initial={false} mode="popLayout">
              {recMode && !recModeLocked ? (
                <motion.span
                  key="rec-event-counter"
                  className="proto-nav-scenario__panel-motion-inline"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={studioPanelTransition}
                >
                  <ProtoNavRecordingEventCounter />
                </motion.span>
              ) : null}
            </AnimatePresence>
          </span>
        ) : null}
        <div className="proto-nav-scenario__panel-swap" aria-live="polite">
          <AnimatePresence initial={false} mode="wait">
            {recordingControls && recMode && !recModeLocked ? (
              <motion.div
                key="rec-panel"
                className="proto-nav-scenario__panel-swap-item"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={studioPanelTransition}
              >
                {recordingControls}
              </motion.div>
            ) : (
              <motion.div
                key="playback-panel"
                className="proto-nav-scenario__panel-swap-item"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={studioPanelTransition}
              >
                {onJourneyModeChange ? (
                  <span className="proto-nav-scenario__cjm-group">
                    <span className="proto-nav-scenario__mode-label" aria-hidden>
                      CJM
                    </span>
                    <ProtoStudioJourneySwitch
                      checked={journeyMode}
                      onChange={(enabled) => {
                        logControlPanel("studio:journey-mode", {
                          enabled,
                          previous: journeyMode,
                          switchDisabled: cjmSwitchDisabled,
                        });
                        if (cjmSwitchDisabled) return;
                        onJourneyModeChange(enabled);
                      }}
                      disabled={cjmSwitchDisabled}
                      disabledTitle={
                        recMode
                          ? "CJM unavailable while REC is on"
                          : journeyModeSwitchDisabled
                            ? "CJM unavailable while AIR / playback is live"
                            : undefined
                      }
                    />
                  </span>
                ) : null}
                <span className="proto-nav-scenario__counter" aria-live="polite">
                  {formatStepCounter(
                    visibleCount,
                    totalFrames,
                    stepProgressActive
                  )}
                </span>
                <div className="proto-nav-scenario__deck-led" aria-hidden>
                  <span
                    key={
                      showEndDiode
                        ? "diode-end"
                        : stepBlinkActive
                          ? `step-${stepBlinkToken}`
                          : "diode-idle"
                    }
                    className={`proto-nav-scenario__on-air${diodeErrorClass}${diodeEndClass}${diodeStepClass}${diodeClickClass}`}
                  >
                    <span className="proto-nav-scenario__on-air-dot" />
                    <span className="proto-nav-scenario__on-air-halo" />
                  </span>
                </div>
                <button
                  type="button"
                  className="proto-nav-step-btn proto-nav-scenario__btn"
                  aria-label="Jump to start"
                  disabled={jumpToStartDisabled}
                  onPointerDown={() =>
                    logBlockedTransport(
                      "transport:jump-to-start",
                      jumpToStartDisabled,
                      !journeyMode
                        ? "journey-mode-off"
                        : playbackActive
                          ? "playback-active"
                          : "canJumpToStart=false"
                    )
                  }
                  onClick={handleJumpToStart}
                >
                  <CassetteJumpToStartIcon />
                </button>
                <button
                  type="button"
                  className="proto-nav-step-btn proto-nav-scenario__btn"
                  aria-label="Step back"
                  disabled={stepBackDisabled}
                  onPointerDown={() =>
                    logBlockedTransport(
                      "transport:step-back",
                      stepBackDisabled,
                      !journeyMode
                        ? "journey-mode-off"
                        : playbackActive
                          ? "playback-active"
                          : "canStepBack=false"
                    )
                  }
                  onClick={handleStepBack}
                >
                  <CassetteStepBackIcon />
                </button>
                <div className="proto-nav-scenario__play-lamp">
                  <span className="proto-nav-scenario__halogen" aria-hidden>
                    <span className="proto-nav-scenario__halogen-source">
                      <span className="proto-nav-scenario__halogen-bulb" />
                    </span>
                    <span className="proto-nav-scenario__halogen-beam" />
                  </span>
                  <button
                    type="button"
                    className="proto-nav-step-btn proto-nav-scenario__btn proto-nav-scenario__btn--play"
                    aria-label="Play journey"
                    aria-pressed={isOnAir}
                    disabled={playDisabled}
                    onPointerDown={() =>
                      logBlockedTransport(
                        "transport:play",
                        playDisabled,
                        !journeyMode
                          ? "journey-mode-off"
                          : transportAtEnd
                            ? "journey-at-end"
                            : "canPlay=false"
                      )
                    }
                    onClick={handlePlay}
                  >
                    {playShowsPause ? (
                      <CassettePauseIcon />
                    ) : playShowsStop ? (
                      <CassetteStopIcon />
                    ) : (
                      <CassettePlayIcon />
                    )}
                  </button>
                </div>
                <button
                  type="button"
                  className="proto-nav-step-btn proto-nav-scenario__btn"
                  aria-label="Step forward"
                  disabled={stepForwardDisabled}
                  onPointerDown={() =>
                    logBlockedTransport(
                      "transport:step-forward",
                      stepForwardDisabled,
                      !journeyMode
                        ? "journey-mode-off"
                        : playbackActive
                          ? "playback-active"
                          : transportAtEnd
                            ? "journey-at-end"
                            : "canStepForward=false"
                    )
                  }
                  onClick={handleStepForward}
                >
                  <CassetteStepForwardIcon />
                </button>
                <button
                  type="button"
                  className="proto-nav-step-btn proto-nav-scenario__btn"
                  aria-label="Jump to end"
                  disabled={jumpToEndDisabled}
                  onPointerDown={() =>
                    logBlockedTransport(
                      "transport:jump-to-end",
                      jumpToEndDisabled,
                      !journeyMode
                        ? "journey-mode-off"
                        : playbackActive
                          ? "playback-active"
                          : transportAtEnd
                            ? "journey-at-end"
                            : "canJumpToEnd=false"
                    )
                  }
                  onClick={handleJumpToEnd}
                >
                  <CassetteJumpToEndIcon />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { ProtoStudioJourneySwitch } from "@/app/nav/ProtoStudioJourneySwitch";
export type ProtoNavScenarioControlsProps = {
  studioMenus: ReactNode;
  segmentLabel?: string;
  /** Changes whenever the active studio touchpoint changes (beat or popup). */
  touchpointKey?: string;
  visibleCount: number;
  totalFrames: number;
  /** False until CJM is on; when off shows `-- / N` with the current playlist total. */
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
  if (totalFrames <= 0) return "—";
  if (!stepProgressActive) return `-- / ${totalFrames}`;
  return `${visibleCount} / ${totalFrames}`;
}

/** Nav “control room” — 90s cassette-deck scenario playback. */
export function ProtoNavScenarioControls({
  studioMenus,
  segmentLabel,
  touchpointKey,
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
}: ProtoNavScenarioControlsProps) {
  const STEP_DIODE_MS = 300;
  const CLICK_DIODE_MS = 300;
  const [blinkToken, setBlinkToken] = useState(0);
  const [diodeEndPulse, setDiodeEndPulse] = useState(false);
  const [stepBlinkActive, setStepBlinkActive] = useState(false);
  const [clickBlinkActive, setClickBlinkActive] = useState(false);
  const [stepBlinkToken, setStepBlinkToken] = useState(0);
  const prevTouchpointKeyRef = useRef<string | undefined>(undefined);
  const prevPlaybackEndTokenRef = useRef(0);
  const stepBlinkTimerRef = useRef<number | null>(null);
  const clickBlinkTimerRef = useRef<number | null>(null);

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
    if (!touchpointKey || !isOnAir) return;
    if (prevTouchpointKeyRef.current === undefined) {
      prevTouchpointKeyRef.current = touchpointKey;
      return;
    }
    if (touchpointKey === prevTouchpointKeyRef.current) return;
    prevTouchpointKeyRef.current = touchpointKey;
    setBlinkToken((token) => token + 1);
  }, [isOnAir, touchpointKey]);

  useEffect(() => {
    if (!isOnAir) return;

    const handleDemoClick = () => {
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

  const handleJumpToStart = () => {
    triggerStepDiodeBlink();
    onJumpToStart();
  };

  const handleStepBack = () => {
    triggerStepDiodeBlink();
    onStepBack();
  };

  const handleStepForward = () => {
    triggerStepDiodeBlink();
    onStepForward();
  };

  const handleJumpToEnd = () => {
    triggerStepDiodeBlink();
    onJumpToEnd();
  };

  const showEndDiode =
    (journeyAtEnd || diodeEndPulse) && !playbackErrorActive && !isOnAir;
  const transportAtEnd = journeyAtEnd && !isOnAir;
  const playShowsStop = transportAtEnd;
  const playShowsPause = !playShowsStop && isOnAir;
  const playDisabled =
    !journeyMode ||
    transportAtEnd ||
    (!isOnAir && !isPlaying && !canPlay);
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
        <span
          key={blinkToken}
          className={`proto-nav-scenario__label${
            blinkToken > 0 ? " proto-nav-scenario__label--touchpoint-blink" : ""
          }`}
        >
          {segmentLabel}
        </span>
      ) : null}
      <div className="proto-nav-scenario__deck">
        {onJourneyModeChange ? (
          <ProtoStudioJourneySwitch
            checked={journeyMode}
            onChange={onJourneyModeChange}
            disabled={journeyModeSwitchDisabled}
          />
        ) : null}
        <span className="proto-nav-scenario__counter" aria-live="polite">
          {formatStepCounter(visibleCount, totalFrames, stepProgressActive)}
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
          disabled={!journeyMode || !canJumpToStart}
          onClick={handleJumpToStart}
        >
          <CassetteJumpToStartIcon />
        </button>
        <button
          type="button"
          className="proto-nav-step-btn proto-nav-scenario__btn"
          disabled={!journeyMode || !canStepBack}
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
            aria-pressed={isOnAir}
            disabled={playDisabled}
            onClick={onPlay}
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
          disabled={!journeyMode || transportAtEnd || !canStepForward}
          onClick={handleStepForward}
        >
          <CassetteStepForwardIcon />
        </button>
        <button
          type="button"
          className="proto-nav-step-btn proto-nav-scenario__btn"
          disabled={!journeyMode || transportAtEnd || !canJumpToEnd}
          onClick={handleJumpToEnd}
        >
          <CassetteJumpToEndIcon />
        </button>
      </div>
    </div>
  );
}

import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

export type ProtoNavScenarioControlsProps = {
  journeyMenu: ReactNode;
  segmentLabel?: string;
  /** Changes whenever the active studio touchpoint changes (beat or popup). */
  touchpointKey?: string;
  visibleCount: number;
  totalFrames: number;
  isPlaying: boolean;
  /** Green studio diode + touchpoint blink — live transport only, not manual step scripts. */
  isOnAir?: boolean;
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

/** Nav “control room” — 90s cassette-deck scenario playback. */
export function ProtoNavScenarioControls({
  journeyMenu,
  segmentLabel,
  touchpointKey,
  visibleCount,
  totalFrames,
  isPlaying,
  isOnAir = isPlaying,
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
  const [blinkToken, setBlinkToken] = useState(0);
  const [diodeEndActive, setDiodeEndActive] = useState(false);
  const [stepBlinkActive, setStepBlinkActive] = useState(false);
  const [stepBlinkToken, setStepBlinkToken] = useState(0);
  const prevTouchpointKeyRef = useRef<string | undefined>(undefined);
  const prevPlaybackEndTokenRef = useRef(0);
  const stepBlinkTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (stepBlinkTimerRef.current != null) {
        window.clearTimeout(stepBlinkTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!playbackEndToken || playbackEndToken === prevPlaybackEndTokenRef.current) {
      return;
    }
    prevPlaybackEndTokenRef.current = playbackEndToken;
    setDiodeEndActive(true);
    const timer = window.setTimeout(() => setDiodeEndActive(false), 3000);
    return () => window.clearTimeout(timer);
  }, [playbackEndToken]);

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

  const onAirClass = isOnAir ? " proto-nav-scenario--on-air" : "";
  const diodeEndClass = diodeEndActive && !isOnAir ? " proto-nav-scenario__on-air--end" : "";
  const diodeStepClass =
    stepBlinkActive && !isOnAir && !diodeEndActive
      ? " proto-nav-scenario__on-air--step"
      : "";

  return (
    <div
      className={`proto-nav-scenario${onAirClass}`}
      role="group"
    >
      {journeyMenu}
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
      <span
        key={
          diodeEndActive
            ? "diode-end"
            : stepBlinkActive
              ? `step-${stepBlinkToken}`
              : "diode-idle"
        }
        className={`proto-nav-scenario__on-air${diodeEndClass}${diodeStepClass}`}
        aria-hidden
      >
        <span className="proto-nav-scenario__on-air-dot" />
        <span className="proto-nav-scenario__on-air-halo" aria-hidden />
      </span>
      <span className="proto-nav-scenario__counter" aria-live="polite">
        {totalFrames > 0 ? `${visibleCount}/${totalFrames}` : "—"}
      </span>
      <div className="proto-nav-scenario__deck">
        <button
          type="button"
          className="proto-nav-step-btn proto-nav-scenario__btn"
          disabled={!canJumpToStart}
          onClick={handleJumpToStart}
        >
          <CassetteJumpToStartIcon />
        </button>
        <button
          type="button"
          className="proto-nav-step-btn proto-nav-scenario__btn"
          disabled={!canStepBack}
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
            aria-pressed={isPlaying}
            disabled={!isPlaying && !canPlay}
            onClick={onPlay}
          >
            {isPlaying ? <CassettePauseIcon /> : <CassettePlayIcon />}
          </button>
        </div>
        <button
          type="button"
          className="proto-nav-step-btn proto-nav-scenario__btn"
          disabled={!canStepForward}
          onClick={handleStepForward}
        >
          <CassetteStepForwardIcon />
        </button>
        <button
          type="button"
          className="proto-nav-step-btn proto-nav-scenario__btn"
          disabled={!canJumpToEnd}
          onClick={handleJumpToEnd}
        >
          <CassetteJumpToEndIcon />
        </button>
      </div>
    </div>
  );
}

export type ProtoNavScenarioControlsProps = {
  label: string;
  visibleCount: number;
  totalFrames: number;
  isPlaying: boolean;
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
  label,
  visibleCount,
  totalFrames,
  isPlaying,
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
  return (
    <div
      className={`proto-nav-scenario${isPlaying ? " proto-nav-scenario--on-air" : ""}`}
      role="group"
    >
      <span className="proto-nav-scenario__label">{isPlaying ? "Live" : label}</span>
      <span className="proto-nav-scenario__on-air" aria-hidden>
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
          onClick={onJumpToStart}
        >
          <CassetteJumpToStartIcon />
        </button>
        <button
          type="button"
          className="proto-nav-step-btn proto-nav-scenario__btn"
          disabled={!canStepBack}
          onClick={onStepBack}
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
          onClick={onStepForward}
        >
          <CassetteStepForwardIcon />
        </button>
        <button
          type="button"
          className="proto-nav-step-btn proto-nav-scenario__btn"
          disabled={!canJumpToEnd}
          onClick={onJumpToEnd}
        >
          <CassetteJumpToEndIcon />
        </button>
      </div>
    </div>
  );
}

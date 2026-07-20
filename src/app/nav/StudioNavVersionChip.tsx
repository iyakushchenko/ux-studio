import { getStudioRelease } from "@/app/shell/studioRelease";
import { openAgentTestingLogger } from "@/app/shell/agent-testing/agentTestingOverlay";

/**
 * Sticky right chip on the page-tabs row — version + channel.
 * Amber BUG icon (Summarizer Cleaner glyph) opens MANUAL TEST logger.
 * Disabled while an agent-locked mid-flight session owns the overlay.
 */
export function StudioNavVersionChip() {
  const release = getStudioRelease();

  return (
    <div
      className="studio-nav-version"
      data-studio-version={release.version}
      data-studio-channel={release.channel}
      title={`UX Studio ${release.label} (${release.channel})`}
      aria-label={`UX Studio ${release.label}, ${release.channel} channel`}
    >
      <button
        type="button"
        className="studio-nav-version__qa"
        title="Open MANUAL TEST logger (PLAYBACK_DIAG gate)"
        aria-label="Open MANUAL TEST logger"
        data-studio-qa-logger="true"
        onClick={() => {
          if (document.documentElement.dataset.studioQaLock === "agent") {
            return;
          }
          if (typeof window.__studioOpenQaLogger === "function") {
            window.__studioOpenQaLogger();
          } else {
            openAgentTestingLogger();
          }
        }}
      >
        {/* Summarizer `icon-cleaner` bug glyph */}
        <svg
          className="studio-nav-version__bug-icon"
          viewBox="0 0 24 24"
          width="14"
          height="14"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          focusable="false"
        >
          <g transform="rotate(45 12 12)">
            <rect width="8" height="14" x="8" y="6" rx="4" />
            <path d="m19 19-3-3" />
            <path d="m5 19 3-3" />
            <path d="m19 13-3-3" />
            <path d="m5 13 3-3" />
            <path d="m19 7-3 3" />
            <path d="m5 7 3 3" />
          </g>
        </svg>
      </button>
      <span className="studio-nav-version__semver">{release.label}</span>
      <span
        className={`studio-nav-version__channel studio-nav-version__channel--${release.channel}`}
      >
        {release.channel}
      </span>
    </div>
  );
}

import { getStudioRelease } from "@/app/shell/studioRelease";
import { toggleAgentTestingLogger } from "@/app/shell/agent-testing/agentTestingOverlay";
import type { CjmOptionMetadata } from "@/app/recording/recordingMetadata";
import { StudioNavCompatibilityDialog } from "@/app/nav/StudioNavCompatibilityDialog";

/**
 * MCP-server glyph (stroke-rounded) — persistent header connection indicator.
 * Green (`data-connected="true"`) while an in-app AGENT latch session is
 * live; muted silver otherwise. Never hidden — see agentTestingMcpChrome.ts.
 */
function McpGlyphIcon() {
  return (
    <svg
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
      <path d="M3.49994 11.7501L11.6717 3.57855C12.7762 2.47398 14.5672 2.47398 15.6717 3.57855C16.7762 4.68312 16.7762 6.47398 15.6717 7.57855M15.6717 7.57855L9.49994 13.7501M15.6717 7.57855C16.7762 6.47398 18.5672 6.47398 19.6717 7.57855C20.7762 8.68312 20.7762 10.474 19.6717 11.5785L12.7072 18.543C12.3167 18.9335 12.3167 19.5667 12.7072 19.9572L13.9999 21.2499" />
      <path d="M17.4999 9.74921L11.3282 15.921C10.2237 17.0255 8.43272 17.0255 7.32822 15.921C6.22373 14.8164 6.22373 13.0255 7.32822 11.921L13.4999 5.74939" />
    </svg>
  );
}

/**
 * Sticky right chip on the page-tabs row — version + channel.
 * Amber BUG icon toggles MANUAL TEST logger (open / close+stop capture).
 * Persistent MCP glyph mirrors the in-app AGENT latch (not Cursor
 * Chrome-DevTools MCP — tooltip says so on the chip): green while a
 * session is live, muted silver otherwise.
 */
export function StudioNavVersionChip({
  cjmMetadata = {},
  projectId,
  projectLabel,
}: {
  cjmMetadata?: Readonly<Record<string, CjmOptionMetadata>>;
  projectId: string;
  projectLabel: string;
}) {
  const release = getStudioRelease();

  return (
    <div
      className="studio-nav-version"
      data-studio-version={release.version}
      data-studio-channel={release.channel}
      title={`UXML ${release.label} (${release.channel})`}
      aria-label={`UXML ${release.label}, ${release.channel} channel`}
    >
      <span
        className="studio-nav-version__mcp"
        data-connected="false"
        aria-live="polite"
        data-studio-mcp-hint="true"
        title="Agent MCP — idle — in-app testing latch (not Cursor MCP)"
      >
        <McpGlyphIcon />
      </span>
      <StudioNavCompatibilityDialog metadataById={cjmMetadata} projectId={projectId} projectLabel={projectLabel} />
      <button
        type="button"
        className="studio-nav-version__qa"
        title="Toggle MANUAL TEST logger (close stops capture)"
        aria-label="Toggle MANUAL TEST logger"
        data-studio-qa-logger="true"
        onClick={() => {
          // PO always owns the bug chip — reclaim AGENT TESTING → MANUAL TEST.
          if (typeof window.__studioToggleQaLogger === "function") {
            window.__studioToggleQaLogger();
          } else {
            toggleAgentTestingLogger();
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

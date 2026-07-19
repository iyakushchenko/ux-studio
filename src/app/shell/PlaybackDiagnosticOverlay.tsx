import { useCallback } from "react";
import {
  formatPlaybackDiagnostic,
  formatPlaybackDiagnosticDetails,
  type PlaybackDiagnosticError,
} from "@/app/shell/playbackDiagnostic";
import { buildPlaybackDiagnosticReport } from "@/app/shell/diagnosticReport";
import { CopyReportButton } from "@/app/shell/CopyReportButton";

type Props = {
  error: PlaybackDiagnosticError | null;
  onDismiss: () => void;
};

export function PlaybackDiagnosticOverlay({
  error,
  onDismiss,
}: Props) {
  const getReport = useCallback(
    () => (error ? buildPlaybackDiagnosticReport(error) : ""),
    [error]
  );

  if (!error) return null;

  const hint = formatPlaybackDiagnostic(error);
  const details = formatPlaybackDiagnosticDetails(error);
  const isDev = import.meta.env.DEV;

  return (
    <div className="studio-playback-diagnostic" role="alertdialog" aria-modal="false">
      <div className="studio-playback-diagnostic__card">
        <p className="studio-playback-diagnostic__eyebrow">Playback diagnostic</p>
        <h2 className="studio-playback-diagnostic__title">{hint.title}</h2>
        <p className="studio-playback-diagnostic__summary">{hint.summary}</p>

        {(isDev || details) && (
          <details className="studio-playback-diagnostic__details" open={isDev}>
            <summary className="studio-playback-diagnostic__details-summary">
              Technical details
            </summary>
            <pre className="studio-playback-diagnostic__pre">{details}</pre>
          </details>
        )}

        <div className="studio-playback-diagnostic__actions">
          <CopyReportButton
            getReport={getReport}
            className="studio-playback-diagnostic__btn studio-playback-diagnostic__btn--primary"
            copiedClassName="studio-playback-diagnostic__btn--copied"
          />
          <button
            type="button"
            className="studio-playback-diagnostic__btn"
            onClick={onDismiss}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

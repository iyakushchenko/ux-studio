import { useCallback } from "react";
import {
  formatPlaybackDiagnostic,
  formatPlaybackDiagnosticDetails,
  type PlaybackDiagnosticError,
} from "@/app/shell/protoPlaybackDiagnostic";
import { buildPlaybackDiagnosticReport } from "@/app/shell/protoDiagnosticReport";
import { ProtoCopyReportButton } from "@/app/shell/ProtoCopyReportButton";

type Props = {
  error: PlaybackDiagnosticError | null;
  onDismiss: () => void;
};

export function ProtoPlaybackDiagnosticOverlay({
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
    <div className="proto-playback-diagnostic" role="alertdialog" aria-modal="false">
      <div className="proto-playback-diagnostic__card">
        <p className="proto-playback-diagnostic__eyebrow">Playback diagnostic</p>
        <h2 className="proto-playback-diagnostic__title">{hint.title}</h2>
        <p className="proto-playback-diagnostic__summary">{hint.summary}</p>

        {(isDev || details) && (
          <details className="proto-playback-diagnostic__details" open={isDev}>
            <summary className="proto-playback-diagnostic__details-summary">
              Technical details
            </summary>
            <pre className="proto-playback-diagnostic__pre">{details}</pre>
          </details>
        )}

        <div className="proto-playback-diagnostic__actions">
          <ProtoCopyReportButton
            getReport={getReport}
            className="proto-playback-diagnostic__btn proto-playback-diagnostic__btn--primary"
            copiedClassName="proto-playback-diagnostic__btn--copied"
          />
          <button
            type="button"
            className="proto-playback-diagnostic__btn"
            onClick={onDismiss}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

import {
  classifyRuntimeError,
  formatRuntimeErrorDetails,
  type RuntimeErrorHint,
} from "@/app/shell/classifyRuntimeError";
import { buildRuntimeDiagnosticReport } from "@/app/shell/diagnosticReport";
import { CopyReportButton } from "@/app/shell/CopyReportButton";

export function StudioFatalErrorScreen({
  error,
  componentStack,
  hint,
}: {
  error: unknown;
  componentStack?: string | null;
  hint?: RuntimeErrorHint;
}) {
  const resolved = hint ?? classifyRuntimeError(error);
  const details = formatRuntimeErrorDetails(error);
  const isDev = import.meta.env.DEV;

  const getReport = () =>
    buildRuntimeDiagnosticReport({
      error,
      hint: resolved,
      componentStack,
    });

  return (
    <div className="studio-fatal-error" role="alert">
      <div className="studio-fatal-error__card">
        <p className="studio-fatal-error__eyebrow">Studio prototype</p>
        <h1 className="studio-fatal-error__title">{resolved.title}</h1>
        <p className="studio-fatal-error__summary">{resolved.summary}</p>

        <section className="studio-fatal-error__section">
          <h2 className="studio-fatal-error__heading">Likely causes</h2>
          <ul className="studio-fatal-error__list">
            {resolved.likelyCauses.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="studio-fatal-error__section">
          <h2 className="studio-fatal-error__heading">Try this</h2>
          <ul className="studio-fatal-error__list">
            {resolved.tryThese.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        {(isDev || details) && (
          <details className="studio-fatal-error__details" open={isDev}>
            <summary className="studio-fatal-error__details-summary">
              Technical details
            </summary>
            <pre className="studio-fatal-error__pre">{details}</pre>
            {componentStack ? (
              <pre className="studio-fatal-error__pre studio-fatal-error__pre--stack">
                {componentStack.trim()}
              </pre>
            ) : null}
          </details>
        )}

        <div className="studio-fatal-error__actions">
          <CopyReportButton
            getReport={getReport}
            className="studio-fatal-error__btn studio-fatal-error__btn--secondary"
            copiedClassName="studio-fatal-error__btn--copied"
          />
          <button
            type="button"
            className="studio-fatal-error__btn studio-fatal-error__btn--primary"
            onClick={() => window.location.reload()}
          >
            Reload page
          </button>
        </div>
      </div>
    </div>
  );
}

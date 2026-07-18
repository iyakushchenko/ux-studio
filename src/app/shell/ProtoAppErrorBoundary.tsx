import { Component, type ErrorInfo, type ReactNode, useCallback } from "react";
import {
  classifyRuntimeError,
  formatRuntimeErrorDetails,
  type RuntimeErrorHint,
} from "@/app/shell/classifyRuntimeError";
import { buildRuntimeDiagnosticReport } from "@/app/shell/protoDiagnosticReport";
import { ProtoCopyReportButton } from "@/app/shell/ProtoCopyReportButton";

type Props = {
  children: ReactNode;
};

type State = {
  error: Error | null;
  componentStack: string | null;
};

export function ProtoFatalErrorScreen({
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

  const getReport = useCallback(
    () =>
      buildRuntimeDiagnosticReport({
        error,
        hint: resolved,
        componentStack,
      }),
    [error, resolved, componentStack]
  );

  return (
    <div className="proto-fatal-error" role="alert">
      <div className="proto-fatal-error__card">
        <p className="proto-fatal-error__eyebrow">Studio prototype</p>
        <h1 className="proto-fatal-error__title">{resolved.title}</h1>
        <p className="proto-fatal-error__summary">{resolved.summary}</p>

        <section className="proto-fatal-error__section">
          <h2 className="proto-fatal-error__heading">Likely causes</h2>
          <ul className="proto-fatal-error__list">
            {resolved.likelyCauses.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="proto-fatal-error__section">
          <h2 className="proto-fatal-error__heading">Try this</h2>
          <ul className="proto-fatal-error__list">
            {resolved.tryThese.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        {(isDev || details) && (
          <details className="proto-fatal-error__details" open={isDev}>
            <summary className="proto-fatal-error__details-summary">
              Technical details
            </summary>
            <pre className="proto-fatal-error__pre">{details}</pre>
            {componentStack ? (
              <pre className="proto-fatal-error__pre proto-fatal-error__pre--stack">
                {componentStack.trim()}
              </pre>
            ) : null}
          </details>
        )}

        <div className="proto-fatal-error__actions">
          <ProtoCopyReportButton
            getReport={getReport}
            className="proto-fatal-error__btn proto-fatal-error__btn--secondary"
            copiedClassName="proto-fatal-error__btn--copied"
          />
          <button
            type="button"
            className="proto-fatal-error__btn proto-fatal-error__btn--primary"
            onClick={() => window.location.reload()}
          >
            Reload page
          </button>
        </div>
      </div>
    </div>
  );
}

/** Catches render errors in the React tree and shows a readable studio fallback. */
export class ProtoAppErrorBoundary extends Component<Props, State> {
  state: State = { error: null, componentStack: null };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(_error: Error, info: ErrorInfo): void {
    this.setState({ componentStack: info.componentStack });
  }

  render(): ReactNode {
    if (this.state.error) {
      return (
        <ProtoFatalErrorScreen
          error={this.state.error}
          componentStack={this.state.componentStack}
        />
      );
    }
    return this.props.children;
  }
}

/** Bootstrap path when App (or its imports) fail before React mounts. */
export function renderBootstrapError(root: HTMLElement, error: unknown): void {
  import("react-dom/client")
    .then(({ createRoot }) => {
      createRoot(root).render(
        <ProtoFatalErrorScreen error={error} hint={classifyRuntimeError(error)} />
      );
    })
    .catch(() => {
      const hint = classifyRuntimeError(error);
      root.innerHTML = [
        `<div style="font-family:system-ui,sans-serif;padding:24px;max-width:640px;margin:0 auto">`,
        `<h1 style="color:#012169;margin:0 0 8px">${hint.title}</h1>`,
        `<p>${hint.summary}</p>`,
        `<pre style="white-space:pre-wrap;background:#f5f5f5;padding:12px;border-radius:8px;font-size:12px">`,
        formatRuntimeErrorDetails(error).replace(/</g, "&lt;"),
        `</pre></div>`,
      ].join("");
    });
}

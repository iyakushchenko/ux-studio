import { useCallback, useEffect, useRef, useState } from "react";
import { copyDiagnosticReport } from "@/app/shell/diagnosticReport";
import { logControlPanel } from "@/app/shell/controlPanelLog";

type Props = {
  getReport: () => string;
  className?: string;
  copiedClassName?: string;
};

export function CopyReportButton({
  getReport,
  className = "studio-diagnostic-copy",
  copiedClassName = "studio-diagnostic-copy--copied",
}: Props) {
  const [copied, setCopied] = useState(false);
  const resetTimerRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (resetTimerRef.current != null) {
        window.clearTimeout(resetTimerRef.current);
      }
    },
    []
  );

  const onCopy = useCallback(async () => {
    logControlPanel("diagnostic:copy-report");
    const ok = await copyDiagnosticReport(getReport());
    if (!ok) return;
    setCopied(true);
    if (resetTimerRef.current != null) {
      window.clearTimeout(resetTimerRef.current);
    }
    resetTimerRef.current = window.setTimeout(() => setCopied(false), 2000);
  }, [getReport]);

  return (
    <button
      type="button"
      className={copied ? `${className} ${copiedClassName}` : className}
      onClick={() => void onCopy()}
    >
      {copied ? "Copied" : "Copy report"}
    </button>
  );
}

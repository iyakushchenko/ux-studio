import { describe, expect, it } from "vitest";
import {
  formatPlaybackDiagnostic,
  formatPlaybackDiagnosticDetails,
  playbackCursorAnomalyDiagnostic,
  PlaybackDiagnosticError,
  scriptFailureDiagnostic,
} from "@/app/shell/protoPlaybackDiagnostic";

describe("protoPlaybackDiagnostic", () => {
  it("formats script failure with beat and script context", () => {
    const error = scriptFailureDiagnostic(
      {
        id: "avail-continue",
        label: "Choose date",
        kind: "overlay",
        availScript: "continue-from-date",
      },
      {
        journeyId: "agentic-cjm",
        failureStep: "waitForDateStep: .proto-avail-calendars not visible",
      }
    );

    const hint = formatPlaybackDiagnostic(error);
    expect(hint.id).toBe("playback-script-failed");
    expect(hint.title).toBe("Script failed");
    expect(hint.summary).toContain("continue-from-date");
    expect(hint.summary).toContain("proto-avail-calendars");
  });

  it("wraps timeout errors as PlaybackDiagnosticError", () => {
    const error = new PlaybackDiagnosticError({
      phase: "script-timeout",
      message: "timed out",
      scriptId: "select-location",
    });
    expect(error.name).toBe("PlaybackDiagnosticError");
    expect(formatPlaybackDiagnostic(error).id).toBe("playback-script-timeout");
  });

  it("formats cursor anomaly diagnostics", () => {
    const error = new PlaybackDiagnosticError({
      phase: "cursor-anomaly",
      message: "Demo cursor still visible (1) after step-forward",
      failureStep: "cursor-stale",
      actual: "Demo cursor still visible (1) after step-forward",
      detail: "cursorCount=1 transport=step-forward beat=book-location",
    });
    const hint = formatPlaybackDiagnostic(error);
    expect(hint.id).toBe("playback-cursor-anomaly");
    expect(hint.title).toBe("Stale demo cursor");
    expect(hint.summary).toContain("step-forward");
  });

  it("formats director-step-no-effect with matching expected copy", () => {
    const error = playbackCursorAnomalyDiagnostic({
      journeyId: "traditional-cjm",
      beatId: "book-step2-time",
      visibleProgress: "8/12",
      anomaly: {
        kind: "director-step-no-effect",
        message: "Manual director step completed without effect (select-book-time)",
        detail: "script=select-book-time beat=book-step2-time scrollDelta=0px",
      },
    });
    expect(error.context.expected).toContain("Manual director step");
    expect(formatPlaybackDiagnostic(error).title).toBe(
      "Director step had no effect"
    );
  });
});

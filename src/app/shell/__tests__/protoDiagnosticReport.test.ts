import { describe, expect, it } from "vitest";
import { classifyRuntimeError } from "@/app/shell/classifyRuntimeError";
import {
  buildPlaybackDiagnosticReport,
  buildRuntimeDiagnosticReport,
} from "@/app/shell/protoDiagnosticReport";
import { PlaybackDiagnosticError } from "@/app/shell/protoPlaybackDiagnostic";

describe("protoDiagnosticReport", () => {
  it("builds runtime report without user-facing sections", () => {
    const error = new ReferenceError("isPlaying is not defined");
    const hint = classifyRuntimeError(error);
    const report = buildRuntimeDiagnosticReport({
      error,
      hint,
      componentStack: "\n    at App",
    });

    expect(report).toContain("# Studio prototype diagnostic report");
    expect(report).toContain("hintId: missing-reference");
    expect(report).toContain("errorMessage: isPlaying is not defined");
    expect(report).toContain("## stack");
    expect(report).toContain("## componentStack");
    expect(report).not.toContain("Likely causes");
  });

  it("builds agent-grade playback report with source and snapshot", () => {
    const error = new PlaybackDiagnosticError({
      phase: "script-failed",
      message: "tab/plp-open-pdp failed on Vaccination listing",
      journeyId: "traditional-cjm",
      beatId: "traditional-plp",
      beatLabel: "Vaccination listing",
      scriptKind: "tab",
      scriptId: "plp-open-pdp",
      failureStep:
        'findButtonByText: "Book now" on PLP tile not found',
      expected: "tab/plp-open-pdp completes",
      actual: 'findButtonByText: "Book now" on PLP tile not found',
      snapshot: {
        projectId: "boots-pharmacy",
        personaId: "sarah-jenkins",
        beatIndex: 0,
        beatCount: 6,
        protoTab: 3,
        currentTabIndex: 2,
        childIndex: 9,
        touchpointLabel: "Vaccination listing",
      },
    });
    const report = buildPlaybackDiagnosticReport(error);

    expect(report).toContain("failureStep:");
    expect(report).toContain("source: src/projects/boots-pharmacy/playback/traditional.ts");
    expect(report).toContain("## studio");
    expect(report).toContain("projectId: boots-pharmacy");
    expect(report).toContain("childIndex: 9");
    expect(report).not.toContain("## raw");
    expect(report).not.toContain("userAgent");
  });

  it("includes journey position context for director anomalies", () => {
    const error = new PlaybackDiagnosticError({
      phase: "cursor-anomaly",
      message: "Manual director step completed without effect (pdp-book-now)",
      journeyId: "traditional-cjm",
      beatId: "traditional-pdp",
      beatLabel: "Vaccination details",
      failureStep: "director-step-no-effect",
      expected: "Manual director step scrolls viewport or applies DOM outcome",
      actual: "Manual director step completed without effect (pdp-book-now)",
      detail:
        "script=pdp-book-now beat=traditional-pdp scrollDelta=0px touchpoint=Vaccination details frames=2/12",
      snapshot: {
        projectId: "boots-pharmacy",
        personaId: "sarah-jenkins",
        journeyId: "traditional-cjm",
        beatIndex: 1,
        beatCount: 11,
        beatId: "traditional-pdp",
        beatLabel: "Vaccination details",
        touchpointKey: "traditional-pdp",
        touchpointLabel: "Vaccination details",
        scenarioProgress: "2/12",
      },
    });
    const report = buildPlaybackDiagnosticReport(error);

    expect(report).toContain("journeyPlaylistStep: 2/12");
    expect(report).toContain("atTouchpoint: Vaccination details");
    expect(report).toContain("atBeat: 2/11 traditional-pdp (Vaccination details)");
    expect(report).toContain("directorScript: pdp-book-now");
    expect(report).toContain("directorBeat: traditional-pdp");
  });
});

import { describe, expect, it } from "vitest";
import {
  shouldAdvanceCompletedDirectorStep,
  shouldSuppressTransportNoOpForBeat,
  shouldSuppressTransportNoOpForCompletedDirector,
} from "@/app/orchestra/manualDirectorStep";

describe("manualDirectorStep", () => {
  it("advances manual step forward when the director script already ran on this beat", () => {
    expect(
      shouldAdvanceCompletedDirectorStep({
        manualStep: true,
        advanceAfter: true,
        lastAutoRunId: "5:avail-book",
        beatRunId: "5:avail-book",
      })
    ).toBe(true);
  });

  it("re-runs the director script on first manual step forward", () => {
    expect(
      shouldAdvanceCompletedDirectorStep({
        manualStep: true,
        advanceAfter: true,
        lastAutoRunId: null,
        beatRunId: "5:avail-book",
      })
    ).toBe(false);
  });

  it("suppresses transport no-op when director already completed on the same beat", () => {
    expect(
      shouldSuppressTransportNoOpForCompletedDirector({
        lastAutoRunId: "5:avail-book",
        beatRunId: "5:avail-book",
      })
    ).toBe(true);
  });

  it("suppresses transport no-op for any completed director script on the beat", () => {
    expect(
      shouldSuppressTransportNoOpForBeat({
        beatRunId: "0:agentic-home",
        lastAutoRunIds: [null, "0:agentic-home", null, null],
      })
    ).toBe(true);
    expect(
      shouldSuppressTransportNoOpForBeat({
        beatRunId: "0:agentic-home",
        lastAutoRunIds: [null, null, null, null],
      })
    ).toBe(false);
  });
});

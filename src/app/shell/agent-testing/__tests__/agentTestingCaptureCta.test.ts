import { describe, expect, it } from "vitest";
import { resolveCaptureToggleLabel } from "@/app/shell/agent-testing/agentTestingActivity";

describe("resolveCaptureToggleLabel (logDirty / CAPTURE vs Resume)", () => {
  it("fresh / reset → CAPTURE", () => {
    expect(
      resolveCaptureToggleLabel({
        capturePaused: true,
        sessionHadProgress: false,
      })
    ).toBe("CAPTURE");
  });

  it("paused after progress → Resume (not CAPTURE)", () => {
    expect(
      resolveCaptureToggleLabel({
        capturePaused: true,
        sessionHadProgress: true,
      })
    ).toBe("Resume");
  });

  it("running → Pause", () => {
    expect(
      resolveCaptureToggleLabel({
        capturePaused: false,
        sessionHadProgress: false,
      })
    ).toBe("Pause");
    expect(
      resolveCaptureToggleLabel({
        capturePaused: false,
        sessionHadProgress: true,
      })
    ).toBe("Pause");
  });
});

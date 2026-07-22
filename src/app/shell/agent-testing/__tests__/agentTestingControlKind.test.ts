/**
 * @vitest-environment happy-dom
 */
import { describe, expect, it } from "vitest";
import {
  deriveAgentControlKind,
  formatAgentControlKindSuffix,
  isCjmCassetteOn,
  readLiveJourneyIsPlaying,
  readLiveJourneyOnAir,
} from "@/app/shell/agent-testing/agentTestingControlKind";

describe("agentTestingControlKind", () => {
  it("null when not agent session", () => {
    expect(
      deriveAgentControlKind({ sessionKind: "manual", cjmOn: true })
    ).toBeNull();
    expect(
      deriveAgentControlKind({ sessionKind: "observe", cjmOn: false })
    ).toBeNull();
  });

  it("manual when agent + CJM off", () => {
    expect(
      deriveAgentControlKind({
        sessionKind: "agent",
        cjmOn: false,
        isPlaying: true,
      })
    ).toBe("manual");
  });

  it("playback when agent + CJM on + isPlaying; stepped when Play off", () => {
    expect(
      deriveAgentControlKind({
        sessionKind: "agent",
        cjmOn: true,
        isPlaying: true,
      })
    ).toBe("playback");
    expect(
      deriveAgentControlKind({
        sessionKind: "agent",
        cjmOn: true,
        isPlaying: false,
      })
    ).toBe("stepped");
    expect(
      deriveAgentControlKind({ sessionKind: "agent", cjmOn: true })
    ).toBe("stepped");
  });

  it("suffix + cjm cassette helper", () => {
    expect(formatAgentControlKindSuffix("playback")).toBe(" · PLAYBACK");
    expect(formatAgentControlKindSuffix("stepped")).toBe(
      " · STEPPED PLAYBACK"
    );
    expect(formatAgentControlKindSuffix("manual")).toBe(" · MANUAL");
    expect(formatAgentControlKindSuffix(null)).toBe("");
    expect(isCjmCassetteOn("on")).toBe(true);
    expect(isCjmCassetteOn("agentic-cjm")).toBe(true);
    expect(isCjmCassetteOn("off")).toBe(false);
    expect(isCjmCassetteOn("hub")).toBe(false);
  });

  it("reads the stable Play transport selector after its label changes to Pause", () => {
    document.body.innerHTML = `
      <button data-studio-action="transport-play" aria-label="Pause journey" aria-pressed="true"></button>
    `;
    expect(readLiveJourneyIsPlaying()).toBe(true);
    document.body.innerHTML = `
      <button data-studio-action="transport-play" aria-label="Play journey" aria-pressed="false"></button>
    `;
    expect(readLiveJourneyIsPlaying()).toBe(false);
  });

  it("reads director on-air from studio-nav-scenario--on-air", () => {
    document.body.innerHTML = `<div class="studio-nav-scenario"></div>`;
    expect(readLiveJourneyOnAir()).toBe(false);
    document.body.innerHTML = `<div class="studio-nav-scenario studio-nav-scenario--on-air"></div>`;
    expect(readLiveJourneyOnAir()).toBe(true);
  });
});

/**
 * @vitest-environment happy-dom
 *
 * ALWAYS CLEAR is code law — no skip flag on requireFreshQaSession.
 */
import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import {
  forceClearAgentTestingOverlay,
  isAgentTestingOverlayActive,
  isAgentTestingOverlaySettling,
  IDLE_MS,
  startAgentTestingOverlay,
} from "@/app/shell/agent-testing";
import {
  ensureQaSessionForRecCapture,
  isFreshQaSessionLive,
  requireFreshQaSession,
} from "@/app/shell/requireFreshQaSession";
import {
  clearStagedRecordingSession,
  startRecording,
  stopRecording,
} from "@/app/recording/recordingSession";

function mountRecOn(): void {
  document.body.innerHTML = `
    <button role="switch" aria-label="REC on" aria-checked="true"></button>
  `;
}

describe("requireFreshQaSession (ALWAYS CLEAR code law)", () => {
  beforeEach(() => {
    forceClearAgentTestingOverlay();
    stopRecording();
    clearStagedRecordingSession();
    document.body.innerHTML = "";
  });

  afterEach(() => {
    forceClearAgentTestingOverlay();
    stopRecording();
    clearStagedRecordingSession();
    document.body.innerHTML = "";
    vi.useRealTimers();
  });

  it("forceClears dirty session then starts fresh — no skip option", () => {
    startAgentTestingOverlay("DIRTY — prior prove");
    expect(isAgentTestingOverlayActive()).toBe(true);

    const result = requireFreshQaSession("AGENT TESTING — REC capture");
    expect(result.ok).toBe(true);
    expect(result.title).toBe("AGENT TESTING — REC capture");
    expect(isFreshQaSessionLive()).toBe(true);
    // Signature has no options / skip flag — only title.
    expect(requireFreshQaSession.length).toBeLessThanOrEqual(1);
  });

  it("ensureQaSessionForRecCapture is no-op when overlay already live", () => {
    requireFreshQaSession("live");
    expect(ensureQaSessionForRecCapture()).toBeNull();
  });

  it("startRecording auto-arms QA when overlay missing (bypass guard)", () => {
    mountRecOn();
    forceClearAgentTestingOverlay();
    expect(isFreshQaSessionLive()).toBe(false);

    startRecording({ projectId: "boots-pharmacy" });
    expect(isFreshQaSessionLive()).toBe(true);
  });

  it("idle does not sitrep while REC live", () => {
    vi.useFakeTimers();
    mountRecOn();
    requireFreshQaSession("AGENT TESTING — REC capture");
    expect(isAgentTestingOverlayActive()).toBe(true);
    startRecording({ projectId: "boots-pharmacy" });
    vi.advanceTimersByTime(IDLE_MS + 2000);
    expect(isAgentTestingOverlayActive()).toBe(true);
    expect(isAgentTestingOverlaySettling()).toBe(false);
    stopRecording();
  });
});

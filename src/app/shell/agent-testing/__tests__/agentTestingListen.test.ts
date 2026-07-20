import { describe, expect, it } from "vitest";
import {
  buildQaPriorityHints,
  clearQaMessageDraft,
  readQaMessageDraft,
  shouldBlockQaPlay,
  writeQaMessageDraft,
  QA_MESSAGE_DRAFT_KEY,
} from "@/app/shell/agent-testing/agentTestingListen";

describe("agentTestingListen", () => {
  it("blocks Play when paused or diagnostic open", () => {
    expect(
      shouldBlockQaPlay({
        overlayActive: true,
        capturePaused: true,
        diagnosticOpen: false,
      })
    ).toBe(true);
    expect(
      shouldBlockQaPlay({
        overlayActive: true,
        capturePaused: false,
        diagnosticOpen: true,
      })
    ).toBe(true);
    expect(
      shouldBlockQaPlay({
        overlayActive: true,
        capturePaused: false,
        diagnosticOpen: false,
      })
    ).toBe(false);
    expect(
      shouldBlockQaPlay({
        overlayActive: false,
        capturePaused: true,
        diagnosticOpen: true,
      })
    ).toBe(false);
    expect(
      shouldBlockQaPlay({
        overlayActive: true,
        capturePaused: false,
        diagnosticOpen: false,
        progressFrozen: true,
      })
    ).toBe(true);
  });

  it("builds cause-before-symptom priorityHints", () => {
    const hints = buildQaPriorityHints({
      poSignalCode: "USER_MESSAGE_RECEIVED",
      capturePaused: true,
      diagnosticOpen: true,
      diagnosticMessage: "scroll jank",
    });
    expect(hints[0]).toMatch(/CAUSE: consume latch USER_MESSAGE_RECEIVED/);
    expect(hints.some((h) => h.includes("playback diagnostic"))).toBe(true);
    expect(hints.length).toBeLessThanOrEqual(6);
  });

  it("persists message draft in sessionStorage", () => {
    clearQaMessageDraft();
    writeQaMessageDraft("hello draft");
    expect(readQaMessageDraft()).toBe("hello draft");
    expect(sessionStorage.getItem(QA_MESSAGE_DRAFT_KEY)).toBe("hello draft");
    clearQaMessageDraft();
    expect(readQaMessageDraft()).toBe("");
  });
});

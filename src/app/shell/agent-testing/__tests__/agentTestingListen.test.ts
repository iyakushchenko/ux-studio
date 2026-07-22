/**
 * @vitest-environment happy-dom
 */
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

  it("prove-mode clears orphan freeze so SF is not silent-blocked", async () => {
    const {
      beginQaProveMode,
      endQaProveMode,
    } = await import("@/app/shell/agent-testing/agentTestingPresence");
    const {
      setQaProgressFreeze,
      clearQaProgressFreeze,
      isQaProgressFrozen,
    } = await import("@/app/shell/agent-testing/agentTestingProgressFreeze");
    const { beginFailHandoff, clearFailHandoff, resetFailHandoffForTests } =
      await import("@/app/shell/agent-testing/agentTestingFailHandoff");
    const { refusePlayIfQaBlocks } = await import(
      "@/app/shell/agent-testing/agentTestingListen"
    );

    resetFailHandoffForTests();
    clearQaProgressFreeze();
    (window as Window & {
      __studioIsQaProgressFrozen?: () => boolean;
      __studioAgentTestingOverlay?: {
        autoResumeCaptureForPlay?: () => boolean;
        shouldBlockPlay?: () => boolean;
        isDiagnosticBlocking?: () => boolean;
        clearPlaybackBlocksForReset?: (source?: string) => void;
      };
      __studioNoteBlockedQaPlay?: () => void;
      __protoStudioState?: () => { diagnosticOpen?: boolean };
    }).__studioIsQaProgressFrozen = isQaProgressFrozen;
    (
      window as Window & {
        __studioAgentTestingOverlay?: {
          autoResumeCaptureForPlay?: () => boolean;
          shouldBlockPlay?: () => boolean;
          isDiagnosticBlocking?: () => boolean;
          clearPlaybackBlocksForReset?: (source?: string) => void;
        };
        __protoStudioState?: () => { diagnosticOpen?: boolean };
      }
    ).__studioAgentTestingOverlay = {
      autoResumeCaptureForPlay: () => true,
      shouldBlockPlay: () => false,
      // Sticky overlay flag with no Studio diagnostic — prove must clear.
      isDiagnosticBlocking: () => true,
      clearPlaybackBlocksForReset: () => {
        clearQaProgressFreeze();
        clearFailHandoff();
      },
    };
    (
      window as Window & {
        __protoStudioState?: () => { diagnosticOpen?: boolean };
      }
    ).__protoStudioState = () => ({ diagnosticOpen: false });

    beginFailHandoff({
      reason: "bubble-chop",
      pause: () => undefined,
      log: () => undefined,
    });
    setQaProgressFreeze("fail-handoff:bubble-chop");
    expect(isQaProgressFrozen()).toBe(true);

    beginQaProveMode("unit-orphan-freeze");
    try {
      expect(refusePlayIfQaBlocks()).toBe(false);
      expect(isQaProgressFrozen()).toBe(false);
    } finally {
      endQaProveMode();
      clearFailHandoff();
      clearQaProgressFreeze();
      resetFailHandoffForTests();
    }
  });
});

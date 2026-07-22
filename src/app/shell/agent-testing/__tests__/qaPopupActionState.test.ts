import { describe, expect, it } from "vitest";
import {
  canActivateRunTestFromPopup,
  isUserAgenticQaMode,
  resolveQaPopupActionState,
  resolveQaPopupActionsChrome,
} from "@/app/shell/agent-testing/qaPopupActionState";

describe("qaPopupActionState — user agentic QA mode", () => {
  it("maps manual + observe to user agentic QA mode", () => {
    expect(isUserAgenticQaMode("manual")).toBe(true);
    expect(isUserAgenticQaMode("observe")).toBe(true);
    expect(isUserAgenticQaMode("agent")).toBe(false);
  });

  it("agentic-user even when a suite id is leftover in memory", () => {
    const state = resolveQaPopupActionState({
      active: true,
      settling: false,
      sessionKind: "manual",
      selectedSuiteId: "tool-health",
      suitePhase: "idle",
      capturePaused: true,
      sessionHadProgress: false,
    });
    expect(state).toBe("agentic-user");
    const chrome = resolveQaPopupActionsChrome({
      active: true,
      settling: false,
      sessionKind: "manual",
      selectedSuiteId: "tool-health",
      suitePhase: "idle",
      capturePaused: true,
      sessionHadProgress: false,
    });
    expect(chrome.runTestUnavailable).toBe(true);
    expect(chrome.suitePickerVisible).toBe(false);
    expect(chrome.primary.kind).toBe("capture");
    expect(chrome.primary.label).toBe("CAPTURE");
    expect(chrome.primary.hidden).toBe(false);
    expect(canActivateRunTestFromPopup(chrome.state)).toBe(false);
  });

  it("observe agentic-user never exposes Run Test", () => {
    const chrome = resolveQaPopupActionsChrome({
      active: true,
      settling: false,
      sessionKind: "observe",
      selectedSuiteId: "all-cjms",
      suitePhase: "idle",
      capturePaused: false,
      sessionHadProgress: true,
    });
    expect(chrome.state).toBe("agentic-user");
    expect(chrome.primary.kind).toBe("capture");
    expect(chrome.primary.label).toBe("Pause");
    expect(chrome.runTestUnavailable).toBe(true);
    expect(chrome.suitePickerVisible).toBe(false);
  });
});

describe("qaPopupActionState — suite / control-room", () => {
  it("suite-armed when agent + suite selected → Run Test available", () => {
    const chrome = resolveQaPopupActionsChrome({
      active: true,
      settling: false,
      sessionKind: "agent",
      selectedSuiteId: "tool-health",
      suitePhase: "idle",
      capturePaused: false,
      sessionHadProgress: true,
      suiteDescription: "Non-destructive live logger and runner sanity",
    });
    expect(chrome.state).toBe("suite-armed");
    expect(chrome.primary.kind).toBe("run-test");
    expect(chrome.primary.label).toBe("Run Test");
    expect(chrome.primary.hidden).toBe(false);
    expect(chrome.primary.disabled).toBe(false);
    expect(chrome.primary.ariaDisabled).toBe(false);
    expect(chrome.runTestUnavailable).toBe(false);
    expect(chrome.suitePickerVisible).toBe(true);
    expect(canActivateRunTestFromPopup(chrome.state)).toBe(true);
  });

  it("prove when agent without suite → capture CTA, no Run Test", () => {
    const chrome = resolveQaPopupActionsChrome({
      active: true,
      settling: false,
      sessionKind: "agent",
      selectedSuiteId: "",
      suitePhase: "idle",
      capturePaused: true,
      sessionHadProgress: false,
    });
    expect(chrome.state).toBe("prove");
    expect(chrome.primary.kind).toBe("capture");
    expect(chrome.primary.label).toBe("CAPTURE");
    expect(chrome.runTestUnavailable).toBe(true);
    expect(chrome.suitePickerVisible).toBe(true);
    expect(canActivateRunTestFromPopup(chrome.state)).toBe(false);
  });

  it("suite-running disables CTA (Running…) and blocks activate", () => {
    const chrome = resolveQaPopupActionsChrome({
      active: true,
      settling: false,
      sessionKind: "agent",
      selectedSuiteId: "tool-health",
      suitePhase: "running",
      capturePaused: false,
      sessionHadProgress: true,
    });
    expect(chrome.state).toBe("suite-running");
    expect(chrome.primary.kind).toBe("running");
    expect(chrome.primary.label).toBe("Running…");
    expect(chrome.primary.disabled).toBe(true);
    expect(chrome.primary.ariaDisabled).toBe(true);
    expect(chrome.runTestUnavailable).toBe(true);
    expect(canActivateRunTestFromPopup(chrome.state)).toBe(false);
  });

  it("idle hides primary CTA", () => {
    const chrome = resolveQaPopupActionsChrome({
      active: false,
      settling: false,
      sessionKind: "manual",
      selectedSuiteId: "tool-health",
      suitePhase: "idle",
      capturePaused: true,
      sessionHadProgress: false,
    });
    expect(chrome.state).toBe("idle");
    expect(chrome.primary.kind).toBe("hidden");
    expect(chrome.primary.hidden).toBe(true);
    expect(chrome.runTestUnavailable).toBe(true);
  });
});

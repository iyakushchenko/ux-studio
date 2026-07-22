import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearPoSignal,
  installPoSignalWindowApis,
  latchPoSignal,
  uninstallPoSignalWindowApis,
} from "@/app/shell/agent-testing/agentTestingPoSignal";
import { pollSmokePoSignal } from "@/app/shell/smokePoSignalPoll";

describe("smokePoSignalPoll", () => {
  beforeEach(() => {
    uninstallPoSignalWindowApis();
    clearPoSignal();
    installPoSignalWindowApis();
  });

  afterEach(() => {
    uninstallPoSignalWindowApis();
    clearPoSignal();
  });

  it("misses when no latch", () => {
    expect(pollSmokePoSignal()).toEqual({ hit: false });
  });

  it("aborts on alarm and exposes diagSnapshot", () => {
    const pausePlay = vi.fn();
    latchPoSignal({ type: "alarm", code: "ALARM_SEQUENCE_MISMATCH" });
    const result = pollSmokePoSignal({
      context: "play:agentic-cjm:test",
      pausePlay,
    });
    expect(result.hit).toBe(true);
    if (!result.hit) return;
    expect(result.abort).toBe(true);
    expect(result.reason).toBe("po-alarm:ALARM_SEQUENCE_MISMATCH");
    expect(result.signal.type).toBe("alarm");
    expect(result.signal.diagSnapshot).toBeDefined();
    expect(pausePlay).toHaveBeenCalledTimes(1);
    expect(pollSmokePoSignal().hit).toBe(false);
  });

  it("notices alarm when requested", () => {
    latchPoSignal({ type: "alarm", code: "ALARM_SEQUENCE_MISMATCH" });
    const result = pollSmokePoSignal({ continueOnAlarm: true, context: "step" });
    expect(result.hit).toBe(true);
    if (!result.hit) return;
    expect(result.abort).toBe(false);
    expect(result.reason).toBe("po-alarm:ALARM_SEQUENCE_MISMATCH");
  });

  it("aborts on cursor (PO stop→fix→reprove)", () => {
    latchPoSignal({ type: "cursor", code: "CURSOR_HIDDEN_DURING_TYPEIN" });
    const result = pollSmokePoSignal({ context: "step-fwd" });
    expect(result.hit).toBe(true);
    if (!result.hit) return;
    expect(result.abort).toBe(true);
    expect(result.reason).toBe("po-cursor:CURSOR_HIDDEN_DURING_TYPEIN");
    expect(result.signal.diagSnapshot).toBeDefined();
  });

  it("aborts on scroll by default", () => {
    latchPoSignal({ type: "scroll", code: "SCROLL_ISSUE_REPORTED" });
    const result = pollSmokePoSignal({ context: "play" });
    expect(result.hit).toBe(true);
    if (!result.hit) return;
    expect(result.abort).toBe(true);
    expect(result.reason).toBe("po-scroll:SCROLL_ISSUE_REPORTED");
  });

  it("notices cursor/scroll when requested", () => {
    latchPoSignal({ type: "cursor", code: "CURSOR_WEIRD_FLAG" });
    const result = pollSmokePoSignal({
      continueOnCursorScroll: true,
      context: "step-fwd",
    });
    expect(result.hit).toBe(true);
    if (!result.hit) return;
    expect(result.abort).toBe(false);
  });
});

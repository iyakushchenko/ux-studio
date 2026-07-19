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
    // consume cleared latch
    expect(pollSmokePoSignal().hit).toBe(false);
  });

  it("soft-fails alarm when requested", () => {
    latchPoSignal({ type: "alarm", code: "ALARM_SEQUENCE_MISMATCH" });
    const result = pollSmokePoSignal({ softFailAlarm: true, context: "step" });
    expect(result.hit).toBe(true);
    if (!result.hit) return;
    expect(result.abort).toBe(false);
    expect(result.reason).toBe("po-alarm:ALARM_SEQUENCE_MISMATCH");
  });

  it("soft-logs cursor without abort", () => {
    latchPoSignal({ type: "cursor", code: "CURSOR_WEIRD_FLAG" });
    const result = pollSmokePoSignal({ context: "step-fwd" });
    expect(result.hit).toBe(true);
    if (!result.hit) return;
    expect(result.abort).toBe(false);
    expect(result.signal.type).toBe("cursor");
  });
});

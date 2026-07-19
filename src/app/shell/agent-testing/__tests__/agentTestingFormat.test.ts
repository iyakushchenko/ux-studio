import { describe, expect, it } from "vitest";
import {
  buildLogEntryFromPlain,
  coalesceLogEntry,
  formatElapsed,
  formatHelperStepLabel,
  humanizeHelperSuffix,
  inferOutcomeFromText,
} from "@/app/shell/agent-testing/agentTestingFormat";

describe("agentTestingFormat", () => {
  it("humanizes transport helpers", () => {
    expect(humanizeHelperSuffix("TriggerTransport")).toBe("transport");
    expect(
      formatHelperStepLabel("TriggerTransport", {
        beatId: "traditional-plp",
        touchpointKey: "plp:book",
        beatIndex: 0,
        beatCount: 4,
        currentTabIndex: 0,
        childIndex: null,
        hubOpen: false,
        projectId: "boots-pharmacy",
        personaId: "default",
      })
    ).toBe("transport · traditional-plp · plp:book");
  });

  it("infers outcome colors from text", () => {
    expect(inferOutcomeFromText("PASS  overlay-arm")).toBe("ok");
    expect(inferOutcomeFromText("FAIL  click")).toBe("fail");
    expect(inferOutcomeFromText("soft-fail unexpected dwell")).toBe("soft-fail");
    expect(inferOutcomeFromText("cursor issue detected")).toBe("soft-fail");
    expect(inferOutcomeFromText("scroll issue detected · SCROLL_ISSUE_REPORTED")).toBe(
      "soft-fail"
    );
  });

  it("coalesces identical helper spam", () => {
    const a = buildLogEntryFromPlain("helper: __studioTriggerTransport");
    const b = buildLogEntryFromPlain("helper: __studioTriggerTransport");
    const merged = coalesceLogEntry(a, b);
    expect(merged?.count).toBe(2);
    expect(merged?.label).toBe("transport");
  });

  it("formats elapsed mm:ss", () => {
    expect(formatElapsed(0)).toBe("0:00");
    expect(formatElapsed(65_000)).toBe("1:05");
  });
});

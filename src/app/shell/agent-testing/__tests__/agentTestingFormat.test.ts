import { describe, expect, it } from "vitest";
import {
  buildLogEntryFromPlain,
  coalesceLogEntry,
  formatElapsed,
  formatHelperStepLabel,
  formatLogRowText,
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
    expect(inferOutcomeFromText("RESULT · PASS — all checks ok")).toBe("pass");
    expect(inferOutcomeFromText("FAIL  click")).toBe("fail");
    expect(inferOutcomeFromText("soft-fail unexpected dwell")).toBe("soft-fail");
    expect(inferOutcomeFromText("cursor issue detected")).toBe("soft-fail");
    expect(
      inferOutcomeFromText("scroll issue detected · SCROLL_ISSUE_REPORTED")
    ).toBe("soft-fail");
  });

  it("coalesces identical helper spam", () => {
    const a = buildLogEntryFromPlain("helper: __studioTriggerTransport");
    const b = buildLogEntryFromPlain("helper: __studioTriggerTransport");
    const merged = coalesceLogEntry(a, b);
    expect(merged?.count).toBe(2);
    expect(merged?.label).toBe("transport");
  });

  it("coalesces identical system pause spam", () => {
    const a = buildLogEntryFromPlain("Capture paused");
    a.kind = "system";
    const b = { ...a, atMs: a.atMs + 5, timeLabel: "12:00:02" };
    const merged = coalesceLogEntry(a, b);
    expect(merged?.count).toBe(2);
  });

  it("coalesces vite-hmr system spam into ×N", () => {
    const a = {
      atMs: 1,
      timeLabel: "07:26:04",
      label: "vite-hmr · capture/play paused (hot invalidate)",
      outcome: "soft-fail" as const,
      kind: "system" as const,
      count: 1,
    };
    const b = { ...a, atMs: 2, timeLabel: "07:26:05" };
    const merged = coalesceLogEntry(a, b);
    expect(merged?.count).toBe(2);
    expect(formatLogRowText(merged!)).toMatch(/×2/);
  });
});

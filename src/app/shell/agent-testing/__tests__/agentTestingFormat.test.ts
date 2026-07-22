import { describe, expect, it } from "vitest";
import {
  buildLogEntryFromPlain,
  coalesceLogEntry,
  formatElapsed,
  formatHelperStepLabel,
  formatLogRowText,
  humanizeHelperSuffix,
  humanizeQaLogLabel,
  isRoutineTechnicalLogEntry,
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
    expect(inferOutcomeFromText("notice unexpected dwell")).toBe("notice");
    expect(inferOutcomeFromText("cursor issue detected")).toBe("notice");
    expect(
      inferOutcomeFromText("scroll issue detected · SCROLL_ISSUE_REPORTED")
    ).toBe("notice");
    expect(inferOutcomeFromText("no errors")).toBe("ok");
    expect(inferOutcomeFromText("errors: []")).toBe("ok");
    expect(inferOutcomeFromText("unexpected fatal error")).toBe("fail");
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
      outcome: "notice" as const,
      kind: "system" as const,
      count: 1,
    };
    const b = { ...a, atMs: 2, timeLabel: "07:26:05" };
    const merged = coalesceLogEntry(a, b);
    expect(merged?.count).toBe(2);
    expect(formatLogRowText(merged!)).toMatch(/×2/);
  });

  it("presents journey events in plain language without changing raw labels", () => {
    expect(humanizeQaLogLabel("Screen → checkout-review")).toBe("Opened · Checkout Review");
    expect(humanizeQaLogLabel("Modal open · delivery-options · screen=cart · url")).toBe("Opened dialog · Delivery Options");
    expect(humanizeQaLogLabel("Click: June 24")).toBe("Selected · June 24");
    expect(humanizeQaLogLabel("Click: Continue")).toBe("Activated · Continue");
    expect(humanizeQaLogLabel("Click: Confirm order")).toBe("Activated · Confirm order");
    expect(
      humanizeQaLogLabel(
        "prove PASS · agentic-cjm · peak 22/22 · play-end at end"
      )
    ).toBe("PASS · Completed 22/22 · stayed at journey end");
    expect(
      humanizeQaLogLabel(
        "prove PASS · agentic-cjm · peak 22/22 · play-end at start"
      )
    ).toBe("PASS · Completed 22/22 · stayed at journey end");
  });

  it("tags prove verdicts as system so leave-pause cannot drop Save Log lines", () => {
    const pass = buildLogEntryFromPlain(
      "prove PASS · rec-agentic-x · peak 14/14 · play-end at end"
    );
    const fail = buildLogEntryFromPlain("prove FAIL · rec-agentic-x · peak-not-14");
    expect(pass.kind).toBe("system");
    expect(fail.kind).toBe("system");
    expect(buildLogEntryFromPlain("Camera: target").kind).toBe("info");
  });

  it("marks inferred gaps as elapsed time and suppresses routine choreography", () => {
    const entry = buildLogEntryFromPlain("Camera: target");
    entry.durationMs = 5100;
    entry.durationKind = "since-previous";
    expect(formatLogRowText(entry)).not.toContain("5.1s");
    expect(isRoutineTechnicalLogEntry(entry)).toBe(true);
    entry.outcome = "fail";
    expect(isRoutineTechnicalLogEntry(entry)).toBe(false);
  });
});

/**
 * @vitest-environment happy-dom
 */
import { describe, expect, it } from "vitest";
import { clampStepDurationMs, coalesceLogEntry } from "@/app/shell/agent-testing/agentTestingFormat";
import {
  buildClickDetail,
  describeClickSelector,
} from "@/app/shell/agent-testing/agentTestingCaptureWatch";

describe("clampStepDurationMs", () => {
  it("caps absurd Date.now − performance.now deltas", () => {
    const absurd = Date.now() - 100; // ~1.7e12
    expect(clampStepDurationMs(absurd)).toBe(10 * 60 * 1000);
    expect(clampStepDurationMs(-5)).toBe(0);
    expect(clampStepDurationMs(250)).toBe(250);
  });
});

describe("coalesceLogEntry", () => {
  it("does not coalesce click rows", () => {
    const a = {
      atMs: 1,
      timeLabel: "12:00:00",
      label: "Click: Book now",
      outcome: "ok" as const,
      kind: "click" as const,
    };
    const b = { ...a, atMs: 2, timeLabel: "12:00:01" };
    expect(coalesceLogEntry(a, b)).toBeNull();
  });
});

describe("click forensics", () => {
  it("includes data-studio-action selector", () => {
    document.body.innerHTML =
      '<button data-studio-action="book-now">Book now</button>';
    const btn = document.querySelector("button")!;
    expect(describeClickSelector(btn)).toContain("data-studio-action");
    const detail = buildClickDetail(btn);
    expect(detail?.label).toMatch(/^Click:/);
    expect(detail?.selector).toContain("book-now");
    expect(detail?.surface).toBe("product");
  });

  it("logs Control room surface for nav panel clicks", () => {
    document.body.innerHTML =
      '<div class="studio-nav-panel"><button data-studio-action="play">Play</button></div>';
    const btn = document.querySelector("button")!;
    const detail = buildClickDetail(btn);
    expect(detail?.surface).toBe("control-room");
    expect(detail?.label).toMatch(/^Control room:/);
  });
});

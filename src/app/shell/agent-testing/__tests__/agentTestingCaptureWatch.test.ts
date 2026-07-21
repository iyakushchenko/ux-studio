/**
 * @vitest-environment happy-dom
 */
import { describe, expect, it, vi } from "vitest";
import { clampStepDurationMs, coalesceLogEntry } from "@/app/shell/agent-testing/agentTestingFormat";
import {
  bindAgentTestingCaptureWatch,
  buildClickDetail,
  describeClickSelector,
  resolveClickElement,
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

  it("resolves CJM mode label to the mode switch (stable key)", () => {
    document.body.innerHTML = `
      <div class="studio-nav-panel">
        <span class="studio-nav-scenario__cjm-group">
          <span class="studio-nav-scenario__mode-label">CJM</span>
          <button type="button" class="studio-mode-switch studio-journey-switch" aria-label="Toggle CJM"></button>
        </span>
      </div>`;
    const label = document.querySelector(".studio-nav-scenario__mode-label")!;
    const sw = document.querySelector(".studio-mode-switch")!;
    expect(resolveClickElement(label)).toBe(sw);
    const fromLabel = buildClickDetail(label);
    const fromSwitch = buildClickDetail(sw);
    expect(fromLabel?.selector).toBe(fromSwitch?.selector);
    expect(fromLabel?.label).toBe("Control room: CJM");
  });

  it("emits one line for pointerdown+click on the same control", () => {
    vi.useFakeTimers();
    document.body.innerHTML = `
      <div class="studio-nav-panel">
        <span class="studio-nav-scenario__cjm-group">
          <span class="studio-nav-scenario__mode-label">CJM</span>
          <button type="button" class="studio-mode-switch studio-journey-switch"></button>
        </span>
      </div>`;
    const clicks: string[] = [];
    const unbind = bindAgentTestingCaptureWatch({
      isCapturing: () => true,
      onClick: (d) => clicks.push(d.label),
      onScreen: () => undefined,
    });
    const label = document.querySelector(".studio-nav-scenario__mode-label")!;
    const sw = document.querySelector(".studio-mode-switch")!;
    label.dispatchEvent(new Event("pointerdown", { bubbles: true }));
    sw.dispatchEvent(new Event("click", { bubbles: true }));
    vi.advanceTimersByTime(400);
    expect(clicks).toEqual(["Control room: CJM"]);
    unbind();
    vi.useRealTimers();
  });

  it("skips bare tag click labels", () => {
    document.body.innerHTML = '<a href="#x"></a>';
    const a = document.querySelector("a")!;
    expect(buildClickDetail(a)).toBeNull();
  });

  it("ignores empty-space control-room clicks", () => {
    document.body.innerHTML = `
      <div class="studio-nav-panel">
        <div class="studio-nav-status-bar"><p class="studio-nav-status-bar__title">PLP</p></div>
      </div>`;
    const bar = document.querySelector(".studio-nav-status-bar")!;
    expect(buildClickDetail(bar)).toBeNull();
  });

  it("does not emit while capture is paused", () => {
    vi.useFakeTimers();
    document.body.innerHTML =
      '<div class="studio-nav-panel"><button data-studio-action="play">Play</button></div>';
    const clicks: string[] = [];
    let capturing = false;
    const unbind = bindAgentTestingCaptureWatch({
      isCapturing: () => capturing,
      onClick: (d) => clicks.push(d.label),
      onScreen: () => undefined,
    });
    const btn = document.querySelector("button")!;
    btn.dispatchEvent(new Event("pointerdown", { bubbles: true }));
    btn.dispatchEvent(new Event("click", { bubbles: true }));
    vi.advanceTimersByTime(400);
    expect(clicks).toEqual([]);
    capturing = true;
    btn.dispatchEvent(new Event("click", { bubbles: true }));
    expect(clicks).toEqual(["Control room: Play"]);
    unbind();
    vi.useRealTimers();
  });
});

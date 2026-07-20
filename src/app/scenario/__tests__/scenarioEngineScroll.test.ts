/** @vitest-environment happy-dom */
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  bumpScenarioScrollGeneration,
  runScenarioScrollAfterFrames,
  scenarioScrollTiming,
} from "@/app/scenario/scenarioEngine";

describe("scenarioScrollTiming", () => {
  it("defers scroll on step-back (after-exit)", () => {
    expect(scenarioScrollTiming(11, 10)).toBe("after-exit");
    expect(scenarioScrollTiming(3, 1)).toBe("after-exit");
  });

  it("defers scroll after frame enter on step-forward (after-enter)", () => {
    expect(scenarioScrollTiming(10, 11)).toBe("after-enter");
    expect(scenarioScrollTiming(1, 2)).toBe("after-enter");
  });

  it("keeps immediate timing when count unchanged", () => {
    expect(scenarioScrollTiming(5, 5)).toBe("immediate");
  });
});

describe("chat column forward settle", () => {
  afterEach(() => {
    document.body.innerHTML = "";
    bumpScenarioScrollGeneration();
    vi.useRealTimers();
  });

  it("does not scroll tall chat bubbles to start (avoids pin fight)", () => {
    vi.useFakeTimers();
    document.body.innerHTML = `
      <div class="chat__column" style="height:200px;overflow:auto">
        <div data-frame="q0" style="height:80px"></div>
        <div data-frame="r0" style="height:600px"></div>
      </div>
    `;
    const col = document.querySelector<HTMLElement>(".chat__column")!;
    const frames = [...col.querySelectorAll<HTMLElement>("[data-frame]")];
    Object.defineProperty(col, "clientHeight", { value: 200, configurable: true });
    Object.defineProperty(col, "scrollHeight", { value: 680, configurable: true });
    Object.defineProperty(frames[1]!, "offsetHeight", {
      value: 600,
      configurable: true,
    });
    col.scrollTop = 0;

    runScenarioScrollAfterFrames(frames, 2, "end", col, false, "immediate", 1);

    // Bottom pin (480) — not start-align (~0) that fights chat pin.
    expect(col.scrollTop).toBe(480);
  });
});

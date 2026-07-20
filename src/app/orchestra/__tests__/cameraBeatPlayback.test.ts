/**
 * @vitest-environment happy-dom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearCameraBeatUndo,
  peekCameraBeatUndo,
  playCameraBeat,
  reverseCameraBeat,
} from "@/app/orchestra/cameraBeatPlayback";

describe("cameraBeatPlayback", () => {
  let host: HTMLElement;
  let target: HTMLElement;

  beforeEach(() => {
    clearCameraBeatUndo();
    document.body.innerHTML = "";
    host = document.createElement("div");
    host.className = "studio-scroll--prototype";
    Object.defineProperty(host, "clientHeight", { value: 400, configurable: true });
    Object.defineProperty(host, "scrollHeight", { value: 2000, configurable: true });
    host.scrollTop = 0;
    target = document.createElement("button");
    target.setAttribute("data-studio-open-appointment", "true");
    target.textContent = "Open Appointments";
    Object.defineProperty(target, "getBoundingClientRect", {
      value: () => ({
        top: 900,
        bottom: 940,
        left: 0,
        right: 100,
        width: 100,
        height: 40,
        x: 0,
        y: 900,
        toJSON: () => ({}),
      }),
    });
    host.appendChild(target);
    document.body.appendChild(host);
  });

  afterEach(() => {
    clearCameraBeatUndo();
    vi.restoreAllMocks();
  });

  it("dwell then scrolls; reverse restores fromTop", async () => {
    const result = await playCameraBeat(
      {
        dwellMs: 0,
        selectorChain: ['[data-studio-open-appointment="true"]'],
      },
      { beatId: "book-step3-camera", instant: true }
    );
    expect(result.ok).toBe(true);
    const undo = peekCameraBeatUndo();
    expect(undo?.fromTop).toBe(0);
    expect(undo?.scrollEl).toBeTruthy();

    host.scrollTop = 500;
    const reversed = await reverseCameraBeat({
      instant: true,
      beatId: "book-step3-camera",
    });
    expect(reversed).toBe(true);
    expect(host.scrollTop).toBe(0);
  });

  it("dwell-only without target is ok", async () => {
    const result = await playCameraBeat({ dwellMs: 0 }, { instant: true });
    expect(result.ok).toBe(true);
  });

  it("missing target with selector fails", async () => {
    const result = await playCameraBeat(
      {
        dwellMs: 0,
        selectorChain: ['[data-studio-missing="x"]'],
      },
      { instant: true }
    );
    expect(result.ok).toBe(false);
    expect(result.step).toBe("camera-beat:target-missing");
  });
});

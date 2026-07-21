/** @vitest-environment happy-dom */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  beginCursorGraphicThrashWatch,
  noteCursorGraphicModeChange,
  resetCursorGraphicThrashWindow,
} from "@/app/scenario/demoCursorEngine";
import { getPlaybackDiagBundle, playbackDiagClear } from "@/app/shell/playbackDiag";

describe("cursor graphic thrash detector", () => {
  beforeEach(() => {
    resetCursorGraphicThrashWindow();
    playbackDiagClear();
  });

  afterEach(() => {
    resetCursorGraphicThrashWindow();
  });

  it("emits GRAPHIC-THRASH FAIL on arrow↔hand A→B→A within armed travel", () => {
    beginCursorGraphicThrashWatch();
    noteCursorGraphicModeChange("arrow");
    noteCursorGraphicModeChange("pointer");
    noteCursorGraphicModeChange("arrow");
    const thrash = getPlaybackDiagBundle().events.filter((e) =>
      /GRAPHIC-THRASH|graphic-thrash/i.test(String(e.detail ?? ""))
    );
    expect(thrash.length).toBeGreaterThan(0);
  });

  it("ignores thrash when watch is disarmed (between travels)", () => {
    noteCursorGraphicModeChange("arrow");
    noteCursorGraphicModeChange("pointer");
    noteCursorGraphicModeChange("arrow");
    const thrash = getPlaybackDiagBundle().events.filter((e) =>
      /GRAPHIC-THRASH|graphic-thrash/i.test(String(e.detail ?? ""))
    );
    expect(thrash.length).toBe(0);
  });

  it("does not thrash on steady hand latch (arrow→hand only)", () => {
    beginCursorGraphicThrashWatch();
    noteCursorGraphicModeChange("arrow");
    noteCursorGraphicModeChange("pointer");
    noteCursorGraphicModeChange("pointer");
    const thrash = getPlaybackDiagBundle().events.filter((e) =>
      /GRAPHIC-THRASH|graphic-thrash/i.test(String(e.detail ?? ""))
    );
    expect(thrash.length).toBe(0);
  });
});

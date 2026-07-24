import { afterEach, describe, expect, it } from "vitest";
import {
  getPlaybackTimingMode,
  playbackMs,
  playbackPacingMs,
  setPlaybackTimingMode,
} from "@/app/shell/playbackTiming";

describe("playbackTiming", () => {
  afterEach(() => setPlaybackTimingMode("normal"));

  it("keeps demo timing unchanged by default", () => {
    expect(playbackMs(1000)).toBe(1000);
    expect(playbackPacingMs(1000)).toBe(1000);
  });

  it("compresses presentation waits but preserves a real-paint floor", () => {
    setPlaybackTimingMode("fast");
    expect(getPlaybackTimingMode()).toBe("fast");
    expect(playbackMs(1000)).toBe(280);
    expect(playbackMs(50)).toBe(48);
    expect(playbackMs(1000, 32)).toBe(280);
  });

  // PP-50: a 12ms floor (~1 real paint frame) reproducibly raced real
  // browser scroll/layout and caused a functional click-miss, not just
  // cosmetic drift. The floor is now enforced universally — no call site,
  // current or future/other-project, can configure it back below safe.
  it("never lets a call site undercut the universal safe floor", () => {
    setPlaybackTimingMode("fast");
    expect(playbackMs(10, 1)).toBe(48);
    expect(playbackMs(10, 0)).toBe(48);
  });

  // PO, 2026-07-24: playbackMs()'s real-DOM-settle floor made fast-mode
  // typing indistinguishable from normal speed (~26ms/char, swallowed by
  // the 48ms floor). playbackPacingMs() is for pure presentational rhythm
  // with no real-DOM-settle risk — same ratio, a much smaller floor.
  it("compresses typing-rhythm pacing without the real-paint floor", () => {
    setPlaybackTimingMode("fast");
    expect(playbackPacingMs(26)).toBe(7);
    expect(playbackPacingMs(1000)).toBe(280);
    expect(playbackPacingMs(1)).toBe(4);
  });
});

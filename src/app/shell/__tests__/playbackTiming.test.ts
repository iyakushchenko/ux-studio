import { afterEach, describe, expect, it } from "vitest";
import {
  getPlaybackTimingMode,
  playbackMs,
  setPlaybackTimingMode,
} from "@/app/shell/playbackTiming";

describe("playbackTiming", () => {
  afterEach(() => setPlaybackTimingMode("normal"));

  it("keeps demo timing unchanged by default", () => {
    expect(playbackMs(1000)).toBe(1000);
  });

  it("compresses presentation waits but preserves an event-loop floor", () => {
    setPlaybackTimingMode("fast");
    expect(getPlaybackTimingMode()).toBe("fast");
    expect(playbackMs(1000)).toBe(60);
    expect(playbackMs(50)).toBe(12);
    expect(playbackMs(1000, 32)).toBe(60);
  });
});

import { describe, expect, it } from "vitest";
import {
  isPlaybackAbortFailure,
  scriptAborted,
} from "@/projects/playbackScriptResult";

describe("playbackScriptResult", () => {
  it("treats playback abort steps as non-reportable", () => {
    expect(isPlaybackAbortFailure(scriptAborted().step)).toBe(true);
    expect(isPlaybackAbortFailure("playback aborted")).toBe(true);
    expect(isPlaybackAbortFailure("book script aborted")).toBe(true);
    expect(
      isPlaybackAbortFailure("runReserveAppointment: Reserve button not found")
    ).toBe(false);
  });
});

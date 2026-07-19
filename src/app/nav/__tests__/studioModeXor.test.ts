import { describe, expect, it } from "vitest";
import {
  isJourneyModeSwitchDisabled,
  isRecModeLocked,
  resolveRecModeLockReason,
} from "@/app/nav/studioModeXor";

describe("studioModeXor", () => {
  it("locks REC when CJM (journey mode) is on", () => {
    expect(
      isRecModeLocked({
        isOnAir: false,
        isPlaying: false,
        journeyMode: true,
      })
    ).toBe(true);
    expect(
      resolveRecModeLockReason({
        isOnAir: false,
        isPlaying: false,
        journeyMode: true,
      })
    ).toBe("journey-mode");
  });

  it("locks REC when AIR / play is live", () => {
    expect(
      isRecModeLocked({
        isOnAir: true,
        isPlaying: false,
        journeyMode: false,
      })
    ).toBe(true);
    expect(
      resolveRecModeLockReason({
        isOnAir: false,
        isPlaying: true,
        journeyMode: false,
      })
    ).toBe("air-active");
  });

  it("prefers air-active over journey-mode for lock reason", () => {
    expect(
      resolveRecModeLockReason({
        isOnAir: true,
        isPlaying: false,
        journeyMode: true,
      })
    ).toBe("air-active");
  });

  it("leaves REC unlocked when idle (CJM off, not AIR)", () => {
    expect(
      isRecModeLocked({
        isOnAir: false,
        isPlaying: false,
        journeyMode: false,
      })
    ).toBe(false);
    expect(
      resolveRecModeLockReason({
        isOnAir: false,
        isPlaying: false,
        journeyMode: false,
      })
    ).toBeNull();
  });

  it("disables CJM while REC mode is on (XOR both directions)", () => {
    expect(
      isJourneyModeSwitchDisabled({
        transportLocked: false,
        recMode: true,
      })
    ).toBe(true);
    expect(
      isJourneyModeSwitchDisabled({
        transportLocked: true,
        recMode: false,
      })
    ).toBe(true);
    expect(
      isJourneyModeSwitchDisabled({
        transportLocked: false,
        recMode: false,
      })
    ).toBe(false);
  });
});

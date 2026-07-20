import { describe, expect, it, beforeEach, afterEach } from "vitest";
import {
  labelForPlaybackDiagEvent,
  mirrorPlaybackDiagClearToQa,
  outcomeForPlaybackDiagEvent,
  shouldMirrorPlaybackDiagToQa,
} from "@/app/shell/playbackDiagQaBridge";
import type { PlaybackDiagEvent } from "@/app/shell/playbackDiag";
import {
  closeQaDiagGate,
  getQaDiagRing,
  openQaDiagGate,
  replaceQaDiagRing,
} from "@/app/shell/qaDiagGate";

function ev(partial: Partial<PlaybackDiagEvent> & { kind: PlaybackDiagEvent["kind"] }): PlaybackDiagEvent {
  return { t: 1, ...partial };
}

describe("playbackDiagQaBridge", () => {
  beforeEach(() => {
    openQaDiagGate({ logger: true, reason: "test" });
    replaceQaDiagRing([]);
  });
  afterEach(() => {
    closeQaDiagGate({ reason: "test" });
    replaceQaDiagRing([]);
  });

  it("mirrors click FAIL and clear; skips healthy step-forward", () => {
    expect(
      shouldMirrorPlaybackDiagToQa(
        ev({ kind: "click", clickOk: false, detail: "click FAIL" })
      )
    ).toBe(true);
    expect(
      shouldMirrorPlaybackDiagToQa(
        ev({ kind: "step-forward", detail: "Studio nav — Step forward" })
      )
    ).toBe(false);
    expect(
      outcomeForPlaybackDiagEvent(
        ev({ kind: "click", clickOk: false, detail: "click FAIL" })
      )
    ).toBe("fail");
    expect(labelForPlaybackDiagEvent(ev({ kind: "click", clickOk: false }))).toMatch(
      /playback-diag · click FAIL/
    );
  });

  it("flags unexpected scroll-reversal as soft-fail", () => {
    const scroll = ev({
      kind: "scroll",
      detail: "camera",
      scroll: { beforeTop: 400, afterTop: 200, retreat: false },
    });
    expect(shouldMirrorPlaybackDiagToQa(scroll)).toBe(true);
    expect(outcomeForPlaybackDiagEvent(scroll)).toBe("soft-fail");
    expect(labelForPlaybackDiagEvent(scroll)).toMatch(/scroll-reversal/);
  });

  it("ignores small upward camera nudge", () => {
    const nudge = ev({
      kind: "scroll",
      detail: "camera",
      scroll: { beforeTop: 400, afterTop: 380, retreat: false },
    });
    expect(shouldMirrorPlaybackDiagToQa(nudge)).toBe(false);
  });

  it("clear appends playback-diag ring row", () => {
    mirrorPlaybackDiagClearToQa();
    const ring = getQaDiagRing();
    expect(ring.some((e) => e.kind === "playback-diag" && /clear/i.test(e.label || ""))).toBe(
      true
    );
  });
});

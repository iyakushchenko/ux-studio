/**
 * @vitest-environment happy-dom
 */
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

  it("mirrors type-in start/end; never type-in-progress", () => {
    expect(
      shouldMirrorPlaybackDiagToQa(ev({ kind: "type-in-start", detail: "start" }))
    ).toBe(true);
    expect(
      shouldMirrorPlaybackDiagToQa(ev({ kind: "type-in-end", typeOk: true }))
    ).toBe(true);
    expect(
      shouldMirrorPlaybackDiagToQa(
        ev({ kind: "type-in-progress", chars: 12, targetChars: 40 })
      )
    ).toBe(false);
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
      /Click missed/
    );
  });

  it("flags unexpected scroll-reversal as soft-fail with human label", () => {
    const scroll = ev({
      kind: "scroll",
      detail: "competing snap during play",
      scroll: { beforeTop: 400, afterTop: 200, retreat: false },
    });
    expect(shouldMirrorPlaybackDiagToQa(scroll)).toBe(true);
    expect(outcomeForPlaybackDiagEvent(scroll)).toBe("soft-fail");
    expect(labelForPlaybackDiagEvent(scroll)).toMatch(/wrong way/i);
  });

  it("does not soft-fail intentional scrollCameraToOrigin (jump-to-start / page land)", () => {
    const jumpStart = ev({
      kind: "scroll",
      detail: "scrollCameraToOrigin — host top (named SSoT; jump-to-start)",
      scroll: { beforeTop: 400, afterTop: 0, retreat: false },
    });
    expect(shouldMirrorPlaybackDiagToQa(jumpStart)).toBe(false);
    expect(outcomeForPlaybackDiagEvent(jumpStart)).toBe("ok");

    const pageLand = ev({
      kind: "scroll",
      detail: "scrollCameraToOrigin — host top (named SSoT; resetPrototypeScroll)",
      scroll: { beforeTop: 922, afterTop: 0, retreat: false },
    });
    expect(shouldMirrorPlaybackDiagToQa(pageLand)).toBe(false);
  });

  it("does not paint jump-to-start park-rest as fail / attention", () => {
    const park = ev({
      kind: "cursor",
      detail: "cursor-engine:park-rest — jump-to-start",
    });
    expect(shouldMirrorPlaybackDiagToQa(park)).toBe(false);
    expect(outcomeForPlaybackDiagEvent(park)).toBe("ok");
    expect(labelForPlaybackDiagEvent(park)).toBe("Cursor parked (play-end)");
  });

  it("does not soft-fail target-driven scrollIntoView (large upward camera is OK)", () => {
    const scroll = ev({
      kind: "scroll",
      detail: "scrollIntoView done (eased)",
      scroll: {
        beforeTop: 1475,
        afterTop: 0,
        retreat: false,
        intoViewRequested: true,
        intoViewDone: true,
      },
    });
    expect(shouldMirrorPlaybackDiagToQa(scroll)).toBe(false);
  });

  it("mirrors bubble CHOP/JUMP; suppresses TRACE frames", () => {
    expect(
      shouldMirrorPlaybackDiagToQa(
        ev({
          kind: "chat-bubble-motion",
          detail: "CHOP",
          bubble: { chop: true, jump: false, phase: "frame" },
        })
      )
    ).toBe(true);
    expect(
      labelForPlaybackDiagEvent(
        ev({
          kind: "chat-bubble-motion",
          detail: "CHOP",
          bubble: { chop: true },
        })
      )
    ).toMatch(/cut short/i);
    expect(
      shouldMirrorPlaybackDiagToQa(
        ev({
          kind: "chat-bubble-motion",
          detail: "trace",
          bubble: { phase: "trace", chop: false, jump: false },
        })
      )
    ).toBe(false);
  });

  it("humanizes cursor remove / type-in-park (even when not mirrored)", () => {
    expect(
      labelForPlaybackDiagEvent(ev({ kind: "cursor", detail: "remove" }))
    ).toBe("Cursor cleared");
    expect(
      labelForPlaybackDiagEvent(
        ev({ kind: "cursor", detail: "PARKED — type-in-park (park)" })
      )
    ).toBe("Cursor held for typing");
    expect(
      shouldMirrorPlaybackDiagToQa(ev({ kind: "cursor", detail: "remove" }))
    ).toBe(false);
  });

  it("mirrors abrupt park + lean cursor-engine milestones", () => {
    const abrupt = ev({
      kind: "cursor",
      detail: "ABRUPT-PARK FAIL — cursor-engine:abrupt-park — legacy",
    });
    expect(shouldMirrorPlaybackDiagToQa(abrupt)).toBe(true);
    expect(labelForPlaybackDiagEvent(abrupt)).toMatch(/ABRUPT PARK/i);
    expect(outcomeForPlaybackDiagEvent(abrupt)).toBe("fail");

    expect(
      shouldMirrorPlaybackDiagToQa(
        ev({ kind: "cursor", detail: "cursor-engine:park-force — resize" })
      )
    ).toBe(false);
    expect(
      shouldMirrorPlaybackDiagToQa(
        ev({ kind: "cursor", detail: "cursor-engine:park-rest — journey-park" })
      )
    ).toBe(false);
    expect(
      labelForPlaybackDiagEvent(
        ev({ kind: "cursor", detail: "cursor-engine:park-rest — after-click" })
      )
    ).toBe("Cursor eased to rest");
    expect(
      shouldMirrorPlaybackDiagToQa(
        ev({ kind: "cursor", detail: "cursor-engine:park-rest — after-click" })
      )
    ).toBe(true);
  });

  it("ignores small upward camera nudge", () => {
    const nudge = ev({
      kind: "scroll",
      detail: "camera",
      scroll: { beforeTop: 400, afterTop: 380, retreat: false },
    });
    expect(shouldMirrorPlaybackDiagToQa(nudge)).toBe(false);
  });

  it("journey-reset / play-end / typing started stay neutral ok", () => {
    expect(
      outcomeForPlaybackDiagEvent(ev({ kind: "journey-reset", detail: "reset" }))
    ).toBe("ok");
    expect(
      outcomeForPlaybackDiagEvent(ev({ kind: "play-end", detail: "end" }))
    ).toBe("ok");
    expect(
      outcomeForPlaybackDiagEvent(ev({ kind: "type-in-start", detail: "start" }))
    ).toBe("ok");
    expect(labelForPlaybackDiagEvent(ev({ kind: "journey-reset" }))).toBe(
      "Journey reset to start"
    );
  });

  it("labels camera-beat:target-unusable as human skip row", () => {
    const unusable = ev({
      kind: "info",
      detail: "camera-beat:target-unusable — dwell only ([data-name=\"module.plp.filters\"])",
    });
    expect(shouldMirrorPlaybackDiagToQa(unusable)).toBe(true);
    expect(outcomeForPlaybackDiagEvent(unusable)).toBe("soft-fail");
    expect(labelForPlaybackDiagEvent(unusable)).toBe(
      "Camera target missing — wait only"
    );
  });

  it("clear logs via overlay (no double-ring)", () => {
    const steps: string[] = [];
    (
      window as Window & {
        __studioAgentTestingOverlay?: {
          logStep?: (input: { label?: string }) => void;
        };
      }
    ).__studioAgentTestingOverlay = {
      logStep: (input) => {
        if (input.label) steps.push(input.label);
      },
    };
    mirrorPlaybackDiagClearToQa();
    expect(steps.some((l) => /cleared/i.test(l))).toBe(true);
    // Must not also append a twin ring row (pushLogEntry owns ring when live).
  });

  it("suppresses routine Camera: wait dwell from chat (dump-only)", () => {
    expect(
      shouldMirrorPlaybackDiagToQa(
        ev({ kind: "scroll", detail: "chat-camera:wait — kind:camera dwell" })
      )
    ).toBe(false);
    expect(
      shouldMirrorPlaybackDiagToQa(
        ev({ kind: "scroll", detail: "chat-camera:thinking" })
      )
    ).toBe(true);
    expect(
      labelForPlaybackDiagEvent(
        ev({ kind: "scroll", detail: "chat-camera:wait — kind:camera dwell" })
      )
    ).toBe("Camera: wait");
    expect(
      labelForPlaybackDiagEvent(
        ev({ kind: "scroll", detail: "chat-camera:host-end — settle" })
      )
    ).toBe("Chat host-end");
    expect(
      labelForPlaybackDiagEvent(
        ev({ kind: "scroll", detail: "chat-camera:pin-bottom" })
      )
    ).toBe("Chat pin bottom");
  });

  it("mirrors REC scroll-stop + clicks + camera moves; compile always", () => {
    expect(
      shouldMirrorPlaybackDiagToQa(
        ev({
          kind: "rec-capture",
          detail: "scroll-stop 2100ms → [data-name=\"module.pdp\"]",
          beatKind: "scroll-stop",
        })
      )
    ).toBe(true);
    expect(
      shouldMirrorPlaybackDiagToQa(
        ev({
          kind: "rec-capture",
          detail: "demo-click no-selector",
          beatKind: "demo-click",
          clickOk: false,
        })
      )
    ).toBe(true);
    expect(
      shouldMirrorPlaybackDiagToQa(
        ev({
          kind: "rec-capture",
          detail: "scroll → [data-name=\"module.pdp\"]",
          beatKind: "scroll",
        })
      )
    ).toBe(true);
    expect(
      shouldMirrorPlaybackDiagToQa(
        ev({
          kind: "rec-capture",
          detail: "demo-click Quick View",
          beatKind: "demo-click",
        })
      )
    ).toBe(true);
    expect(
      labelForPlaybackDiagEvent(
        ev({
          kind: "rec-capture",
          detail: "scroll-stop 2100ms → [data-name=\"module.pdp\"]",
          beatKind: "scroll-stop",
        })
      )
    ).toBe("Camera wait after scroll (2100ms)");
    expect(
      shouldMirrorPlaybackDiagToQa(
        ev({ kind: "rec-compile", detail: "beats:4;clicks:2" })
      )
    ).toBe(true);
  });
});

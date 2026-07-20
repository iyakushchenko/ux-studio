import { describe, expect, it, beforeEach } from "vitest";
import {
  clearChatScenarioReveal,
  getChatScenarioRevealState,
  isChatReplyHeldForPlaybackThinking,
  publishChatScenarioReveal,
  resolveChatFrameRevealed,
  resolveChatPullUpAnimateIds,
  resolveChatRevealedFrameCount,
} from "../chatScenarioRevealBridge";

// logChatReveal / dumpChatThreadDomOrder are console helpers — covered live on :5173.

describe("chatScenarioRevealBridge", () => {
  beforeEach(() => {
    clearChatScenarioReveal();
  });

  it("publishes engine visibleCount for React paint gating", () => {
    publishChatScenarioReveal({ active: true, visibleCount: 1 });
    expect(getChatScenarioRevealState()).toEqual({
      active: true,
      visibleCount: 1,
    });
    publishChatScenarioReveal({ active: true, visibleCount: 3 });
    expect(getChatScenarioRevealState().visibleCount).toBe(3);
  });

  it("resolveChatRevealedFrameCount never blanks and clamps to content", () => {
    expect(resolveChatRevealedFrameCount(0, 8, 1)).toBe(1);
    expect(resolveChatRevealedFrameCount(1, 8, 1)).toBe(1);
    expect(resolveChatRevealedFrameCount(2, 8, 1)).toBe(2);
    expect(resolveChatRevealedFrameCount(9, 8, 1)).toBe(8);
    expect(resolveChatRevealedFrameCount(4, 0, 1)).toBe(0);
  });

  it("cold bridge (inactive count 0) stays at min — no full-thread flash", () => {
    clearChatScenarioReveal();
    expect(getChatScenarioRevealState()).toEqual({
      active: false,
      visibleCount: 0,
    });
    // ChatScreen maps inactive+0 → engine count 1 (q0 only).
    expect(resolveChatRevealedFrameCount(1, 8, 1)).toBe(1);
    // Explicit idle full-thread publish still paints all.
    publishChatScenarioReveal({ active: false, visibleCount: 8 });
    expect(resolveChatRevealedFrameCount(8, 8, 1)).toBe(8);
  });

  it("holds agent reply paint while playback thinking is anchored", () => {
    const thinking = { mode: "playback", anchorFrameId: "r0" };
    expect(isChatReplyHeldForPlaybackThinking("r0", thinking)).toBe(true);
    expect(isChatReplyHeldForPlaybackThinking("q0", thinking)).toBe(false);
    // Even if engine count already includes r0, reply stays hidden until think ends.
    expect(resolveChatFrameRevealed(1, 2, "r0", thinking)).toBe(false);
    expect(
      resolveChatFrameRevealed(1, 2, "r0", {
        mode: "none",
        anchorFrameId: null,
      })
    ).toBe(true);
  });

  it("null-anchor playback thinking still holds first agent reply r0", () => {
    const thinking = { mode: "playback", anchorFrameId: null };
    expect(isChatReplyHeldForPlaybackThinking("r0", thinking)).toBe(true);
    expect(isChatReplyHeldForPlaybackThinking("r1", thinking)).toBe(false);
    expect(resolveChatFrameRevealed(1, 2, "r0", thinking)).toBe(false);
  });

  it("pull-up animates single progressive reveal and thinking→reply release", () => {
    const ids = ["q0", "r0", "q1", "r1"] as const;
    const none = { mode: "none", anchorFrameId: null };

    // First user bubble alone.
    expect(
      [...resolveChatPullUpAnimateIds(ids, 1, none, new Set(), true)]
    ).toEqual(["q0"]);

    // Batch (browse / deactivate path inactive) — no animate.
    expect(
      resolveChatPullUpAnimateIds(ids, 4, none, new Set(), false).size
    ).toBe(0);

    // Batch many new ids — no thrash.
    expect(
      resolveChatPullUpAnimateIds(ids, 4, none, new Set(["q0"]), true).size
    ).toBe(0);

    // Thinking holds r0 while count already 2 — no new paint yet.
    const thinking = { mode: "playback", anchorFrameId: "r0" };
    expect(
      resolveChatPullUpAnimateIds(
        ids,
        2,
        thinking,
        new Set(["q0"]),
        true
      ).size
    ).toBe(0);

    // Think ends → r0 newly revealed with count delta 0 — still animates.
    expect([
      ...resolveChatPullUpAnimateIds(ids, 2, none, new Set(["q0"]), true),
    ]).toEqual(["r0"]);
  });
});

import { describe, expect, it } from "vitest";
import { SITE_PILOT_CHAT_CTA_BEFORE_USER_FRAME } from "../sitePilotChat";
import { SITE_PILOT_CHAT_PLAYBACK_THINK_MS } from "@/projects/boots-pharmacy/dom/sitePilotChatScenario";
import { CHAT_THREAD_FRAMES } from "@/projects/boots-pharmacy/screens/chat/chatThreadContent";

/**
 * Legacy / pre-React agentic chat sequence ratchet (tip a2c86ba / 5fdde78^).
 * useScenarioPlayback beforeReveal frameIndex = 1-based next visibleCount.
 */
describe("sitePilotChat Legacy sequence", () => {
  it("playlist is q/r alternating (8 content frames)", () => {
    expect(CHAT_THREAD_FRAMES.map((f) => f.id)).toEqual([
      "q0",
      "r0",
      "q1",
      "r1",
      "q2",
      "r2",
      "q3",
      "r3",
    ]);
  });

  it("CTA clicks use Legacy 1-based keys 5 and 7 (not 0-based 4/6)", () => {
    expect(Object.keys(SITE_PILOT_CHAT_CTA_BEFORE_USER_FRAME).map(Number)).toEqual([
      5, 7,
    ]);
    expect(
      SITE_PILOT_CHAT_CTA_BEFORE_USER_FRAME[5]?.test(
        "Check availability slot for me"
      )
    ).toBe(true);
    expect(
      SITE_PILOT_CHAT_CTA_BEFORE_USER_FRAME[7]?.test(
        "Find available slots for today"
      )
    ).toBe(true);
    // Wrong “React fix” keys must stay absent.
    expect(SITE_PILOT_CHAT_CTA_BEFORE_USER_FRAME[4]).toBeUndefined();
    expect(SITE_PILOT_CHAT_CTA_BEFORE_USER_FRAME[6]).toBeUndefined();
  });

  it("playback think hold matches Legacy ~1400ms", () => {
    expect(SITE_PILOT_CHAT_PLAYBACK_THINK_MS).toBe(1400);
  });
});

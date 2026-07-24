import { describe, expect, it } from "vitest";

import { PROJECT_SCREENS } from "@/projects/boots-pharmacy/screens/screens";
import {
  CHAT_CHILD_INDEX,
  CHAT_MIC_ACTION,
  CHAT_QUERY_ACTION,
  CHAT_REACT_MOUNT_ENABLED,
  CHAT_REACT_SCREEN_ID,
  CHAT_SCREEN_SELECTOR,
  CHAT_SEND_ACTION,
} from "../chatContract";
import { CHAT_THREAD_FRAMES, CHAT_CHIP_LABELS } from "../chatThreadContent";

describe("chatContract", () => {
  it("matches Studio screen registry child index for Chat", () => {
    const screen = PROJECT_SCREENS.find((s) =>
      /agentic\. site pilot\. chat/i.test(s.label)
    );
    expect(screen?.childIndex).toBe(CHAT_CHILD_INDEX);
    expect(screen?.screenId).toBe(CHAT_REACT_SCREEN_ID);
    expect(CHAT_SCREEN_SELECTOR).toContain(`nth-child(${CHAT_CHILD_INDEX})`);
    expect(CHAT_REACT_SCREEN_ID).toBe("chat");
  });

  it("keeps React Chat mount ON after Legacy smoke unblock + P1–P10 gate", () => {
    expect(CHAT_REACT_MOUNT_ENABLED).toBe(true);
  });

  it("locks chat composer recording action ids", () => {
    expect(CHAT_QUERY_ACTION).toBe("agentic-chat-query");
    expect(CHAT_MIC_ACTION).toBe("agentic-chat-mic");
    expect(CHAT_SEND_ACTION).toBe("agentic-chat-send");
  });

  it("ports Legacy scenario frame count (query/reply ×4)", () => {
    expect(CHAT_THREAD_FRAMES).toHaveLength(8);
    expect(CHAT_THREAD_FRAMES.filter((f) => f.kind === "query")).toHaveLength(4);
    expect(CHAT_THREAD_FRAMES.filter((f) => f.kind === "reply")).toHaveLength(4);
    expect(CHAT_CHIP_LABELS).toHaveLength(3);
  });
});

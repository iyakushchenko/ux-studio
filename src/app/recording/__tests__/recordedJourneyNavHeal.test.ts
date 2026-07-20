import { describe, expect, it } from "vitest";
import {
  healRecordedJourneyNav,
  normalizeRecordedScreenKey,
  screenIdToProtoTab,
} from "@/app/recording/recordedJourneyNavHeal";
import type { JourneyDefinition } from "@/app/orchestra/types";

describe("recordedJourneyNavHeal", () => {
  it("normalizes revisit suffixes without breaking book-step-N", () => {
    expect(normalizeRecordedScreenKey("chat-2")).toBe("chat");
    expect(normalizeRecordedScreenKey("chat-3")).toBe("chat");
    expect(normalizeRecordedScreenKey("book-step-2")).toBe("book-step-2");
    expect(normalizeRecordedScreenKey("plp")).toBe("plp");
  });

  it("maps boots screen ids to proto tabs", () => {
    expect(screenIdToProtoTab("boots-pharmacy", "site-pilot")).toBe(1);
    expect(screenIdToProtoTab("boots-pharmacy", "chat")).toBe(2);
    expect(screenIdToProtoTab("boots-pharmacy", "plp")).toBe(3);
    expect(screenIdToProtoTab("boots-pharmacy", "book-step-2")).toBe(6);
  });

  it("heals all-protoTab-1 recorded journeys from screen-named beat ids", () => {
    const broken: JourneyDefinition = {
      id: "rec-agentic-test",
      label: "Broken",
      beats: [
        { id: "site-pilot", label: "site-pilot", kind: "tab-landing", protoTab: 1 },
        { id: "chat", label: "chat", kind: "tab-landing", protoTab: 1 },
        { id: "book-step-2", label: "book-step-2", kind: "tab-landing", protoTab: 1 },
        { id: "plp", label: "plp", kind: "tab-landing", protoTab: 1 },
      ],
    };

    const healed = healRecordedJourneyNav(broken, "boots-pharmacy");
    expect(healed.beats.map((b) => b.protoTab)).toEqual([1, 2, 6, 3]);
  });
});

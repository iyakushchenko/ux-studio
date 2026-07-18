import { describe, expect, it } from "vitest";
import {
  firstPlayableBeatIndex,
  getJourneyForMode,
  lastPlayableBeatIndex,
  resolveJourneyStartBeat,
  stepBeatIndex,
} from "@/app/orchestra/journeyUtils";
import type { JourneyBeat, ProtoJourneyDefinition } from "@/app/orchestra/types";
import {
  AGENTIC_CJM_JOURNEY,
  shouldSkipTraditionalLoginBeat,
  TRADITIONAL_LOGIN_BEAT_ID,
} from "@/projects/boots-pharmacy/personas/sarah-jenkins/journeys";

const beats: JourneyBeat[] = [
  { id: "a", label: "A", kind: "tab-landing", protoTab: 1 },
  { id: "skip-me", label: "Skip", kind: "tab-landing", protoTab: 2 },
  { id: "c", label: "C", kind: "tab-landing", protoTab: 3 },
];

const shouldSkip = (beat: JourneyBeat | undefined) => beat?.id === "skip-me";

describe("stepBeatIndex", () => {
  it("advances past skipped beats forward", () => {
    expect(stepBeatIndex(0, beats, shouldSkip, 1)).toBe(2);
  });

  it("steps back past skipped beats", () => {
    expect(stepBeatIndex(2, beats, shouldSkip, -1)).toBe(0);
  });

  it("returns out-of-range index when no playable beat remains", () => {
    const onlySkipped: JourneyBeat[] = [
      { id: "skip-me", label: "Skip", kind: "tab-landing" },
    ];
    expect(stepBeatIndex(0, onlySkipped, shouldSkip, 1)).toBe(1);
  });
});

describe("firstPlayableBeatIndex / lastPlayableBeatIndex", () => {
  it("finds first and last non-skipped beats", () => {
    expect(firstPlayableBeatIndex(beats, shouldSkip)).toBe(0);
    expect(lastPlayableBeatIndex(beats, shouldSkip)).toBe(2);
  });
});

describe("getJourneyForMode", () => {
  const journeys: ProtoJourneyDefinition[] = [
    { id: "agentic-cjm", label: "Agentic", beats: [] },
    { id: "traditional-cjm", label: "Traditional", beats: [] },
  ];

  it("resolves journey by mode id", () => {
    expect(getJourneyForMode(journeys, "agentic-cjm")?.label).toBe("Agentic");
    expect(getJourneyForMode(journeys, "traditional-cjm")?.label).toBe("Traditional");
  });
});

describe("resolveJourneyStartBeat", () => {
  it("returns first playable beat for Traditional when logged in", () => {
    const shouldSkip = (beat: JourneyBeat | undefined) =>
      shouldSkipTraditionalLoginBeat(beat, true);
    const { beatIndex, beat } = resolveJourneyStartBeat(
      AGENTIC_CJM_JOURNEY,
      shouldSkip
    );
    expect(beatIndex).toBe(0);
    expect(beat?.id).toBe("agentic-home");

    const traditional = resolveJourneyStartBeat(
      {
        id: "traditional-cjm",
        label: "Traditional CJM",
        beats: [
          { id: "traditional-plp", label: "PLP", kind: "tab-landing", protoTab: 3 },
          {
            id: TRADITIONAL_LOGIN_BEAT_ID,
            label: "Log in",
            kind: "tab-landing",
            protoTab: 4,
          },
        ],
      },
      shouldSkip
    );
    expect(traditional.beatIndex).toBe(0);
    expect(traditional.beat?.id).toBe("traditional-plp");
  });
});

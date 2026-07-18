import { describe, expect, it } from "vitest";
import {
  resolveInitialScenarioVisibleCount,
  scenarioTotalFor,
} from "@/app/nav/useProtoScenarioPlayback";

describe("scenario playback counts", () => {
  it("adds one virtual finale frame when onFinale is configured", () => {
    expect(scenarioTotalFor(8, true)).toBe(9);
    expect(scenarioTotalFor(8, false)).toBe(8);
  });

  it("starts chat scenarios at min visible frames, not full disclosure", () => {
    expect(resolveInitialScenarioVisibleCount(8, true, 1)).toBe(1);
    expect(resolveInitialScenarioVisibleCount(0, true, 1)).toBe(0);
  });
});

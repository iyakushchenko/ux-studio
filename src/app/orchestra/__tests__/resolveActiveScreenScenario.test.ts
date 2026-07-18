import { describe, expect, it } from "vitest";
import { resolveActiveScreenScenario } from "@/app/orchestra/resolveActiveScreenScenario";
import { AGENTIC_CJM_JOURNEY } from "@/projects/boots-pharmacy/personas/sarah-jenkins/journeys";
import { BOOTS_PHARMACY_SCENARIO_SCREENS } from "@/projects/boots-pharmacy/screens/scenarios";
import { protoTabToIndex } from "@/projects/boots-pharmacy/screens/protoScreens";

describe("resolveActiveScreenScenario", () => {
  const chatBeatIndex = AGENTIC_CJM_JOURNEY.beats.findIndex((b) => b.id === "agentic-chat");

  it("returns undefined when hub is open", () => {
    expect(
      resolveActiveScreenScenario({
        hubOpen: true,
        modeId: "agentic-cjm",
        beatIndex: chatBeatIndex,
        currentTabIndex: protoTabToIndex(2),
        journeys: [AGENTIC_CJM_JOURNEY],
        scenarioScreens: BOOTS_PHARMACY_SCENARIO_SCREENS,
        protoTabToIndex,
      })
    ).toBeUndefined();
  });

  it("activates site-pilot-chat when on chat beat and matching tab", () => {
    const scenario = resolveActiveScreenScenario({
      hubOpen: false,
      modeId: "agentic-cjm",
      beatIndex: chatBeatIndex,
      currentTabIndex: protoTabToIndex(2),
      journeys: [AGENTIC_CJM_JOURNEY],
      scenarioScreens: BOOTS_PHARMACY_SCENARIO_SCREENS,
      protoTabToIndex,
    });
    expect(scenario?.id).toBe("site-pilot-chat");
  });

  it("returns undefined when beat tab does not match current screen", () => {
    expect(
      resolveActiveScreenScenario({
        hubOpen: false,
        modeId: "agentic-cjm",
        beatIndex: chatBeatIndex,
        currentTabIndex: protoTabToIndex(1),
        journeys: [AGENTIC_CJM_JOURNEY],
        scenarioScreens: BOOTS_PHARMACY_SCENARIO_SCREENS,
        protoTabToIndex,
      })
    ).toBeUndefined();
  });

  it("activates chat scenario in browse mode from screen childIndex alone", () => {
    const scenario = resolveActiveScreenScenario({
      hubOpen: false,
      modeId: "agentic-cjm",
      beatIndex: 0,
      currentTabIndex: protoTabToIndex(2),
      currentChildIndex: 10,
      browseMode: true,
      journeys: [AGENTIC_CJM_JOURNEY],
      scenarioScreens: BOOTS_PHARMACY_SCENARIO_SCREENS,
      protoTabToIndex,
    });
    expect(scenario?.id).toBe("site-pilot-chat");
  });
});

/** Boots Pharmacy — screen registry. */
export {
  HUB_LABEL,
  INDEX_APPOINTMENT_DETAILS,
  INDEX_APPOINTMENT_HISTORY,
  INDEX_BOOK_STEP1,
  INDEX_BOOK_STEP2,
  INDEX_BOOK_STEP3,
  INDEX_HOME,
  INDEX_PDP,
  INDEX_PLP,
  PROJECT_SCREENS,
  studioNavIndex,
  studioTabToIndex,
  type ProjectScreen,
} from "@/projects/boots-pharmacy/screens/screens";

/** Frame-step scenarios for screen-frames beats. */
export {
  BOOTS_PHARMACY_SCENARIO_SCREENS as SCENARIO_SCREENS,
  BOOTS_PHARMACY_SCENARIO_SCREENS,
} from "@/projects/boots-pharmacy/screens/scenarios";
export {
  getProtoScenarioById,
  getProtoScenarioForChildIndex,
  type ScenarioScreenConfig,
} from "@/app/scenario/scenarioEngine";

/** Tab 0 onboarding wiki content. */
export { default as HubViewport } from "@/projects/boots-pharmacy/hub/HubViewport";

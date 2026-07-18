/** Boots Pharmacy — screen registry. */
export {
  PROTO_HUB_LABEL,
  PROTO_INDEX_APPOINTMENT_DETAILS,
  PROTO_INDEX_APPOINTMENT_HISTORY,
  PROTO_INDEX_PLP,
  PROTO_SCREENS,
  protoNavIndex,
  protoTabToIndex,
  type ProtoScreen,
} from "@/projects/boots-pharmacy/screens/protoScreens";

/** Frame-step scenarios for screen-frames beats. */
export {
  BOOTS_PHARMACY_SCENARIO_SCREENS as PROTO_SCENARIO_SCREENS,
  BOOTS_PHARMACY_SCENARIO_SCREENS,
} from "@/projects/boots-pharmacy/screens/scenarios";
export {
  getProtoScenarioById,
  getProtoScenarioForChildIndex,
  type ProtoScenarioScreenConfig,
} from "@/app/proto/protoScenarioEngine";

/** Tab 0 onboarding wiki content. */
export { default as ProtoHubViewport } from "@/projects/boots-pharmacy/hub/ProtoHubViewport";

/** Figma export entry — project DOM shell. */
export { default as ProjectFrame } from "@/projects/boots-pharmacy/frame/index";

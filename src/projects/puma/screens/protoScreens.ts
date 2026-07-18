export const PROTO_HUB_LABEL = "Hub";

export const PROTO_SCREENS = [
  { label: "Coming soon", childIndex: 1 },
] as const;

export type ProtoScreen = (typeof PROTO_SCREENS)[number];

export function protoNavIndex(hubOpen: boolean, current: number): number {
  return hubOpen ? 0 : current + 1;
}

export function protoTabToIndex(tab: number): number {
  return Math.max(0, Math.min(PROTO_SCREENS.length - 1, tab - 1));
}

export function protoScreenAtTab(tab: number): ProtoScreen | undefined {
  return PROTO_SCREENS[protoTabToIndex(tab)];
}

export const PROTO_INDEX_PLP = 0;
export const PROTO_INDEX_APPOINTMENT_HISTORY = 0;
export const PROTO_INDEX_APPOINTMENT_DETAILS = 0;

export const PROTO_SCENARIO_SCREENS: never[] = [];

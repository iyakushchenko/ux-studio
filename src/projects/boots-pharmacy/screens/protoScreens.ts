/**
 * Prototype screen nav index (tabs 1…N).
 * Hub wiki is slot 0 and is not listed here.
 */
export const PROTO_SCREENS = [
  { label: "Agentic. Site Pilot. Home", childIndex: 11 },
  { label: "Agentic. Site Pilot. Chat", childIndex: 10 },
  { label: "PLP. Vaccinations", childIndex: 9 },
  { label: "PDP. Vaccine Details Page", childIndex: 8 },
  { label: "Book - Step 1 - Location", childIndex: 7 },
  { label: "Book - Step 2 - Date and Time", childIndex: 4 },
  { label: "Book - Step 3 - Confirmation", childIndex: 3 },
  { label: "Appointment History", childIndex: 2 },
  { label: "Appointment Details", childIndex: 1 },
] as const;

export type ProtoScreen = (typeof PROTO_SCREENS)[number];

export const PROTO_HUB_LABEL = "Onboarding";

/** Nav counter: hub = 0, first tab = 1, … */
export function protoNavIndex(hubOpen: boolean, current: number): number {
  return hubOpen ? 0 : current + 1;
}

/** Display tab number (1…N) → zero based screen index. */
export function protoTabToIndex(tab: number): number {
  return Math.max(0, Math.min(PROTO_SCREENS.length - 1, tab - 1));
}

export function protoScreenAtTab(tab: number): ProtoScreen | undefined {
  return PROTO_SCREENS[protoTabToIndex(tab)];
}

/** Zero-based `current` index for PLP. Vaccinations (child 9). */
export const PROTO_INDEX_PLP = PROTO_SCREENS.findIndex(
  (screen) => screen.childIndex === 9,
);

/** Zero-based `current` index for Appointment History (My Account dummy). */
export const PROTO_INDEX_APPOINTMENT_HISTORY = PROTO_SCREENS.findIndex(
  (screen) => screen.childIndex === 2,
);

/** Zero-based `current` index for Appointment Details (tab 9). */
export const PROTO_INDEX_APPOINTMENT_DETAILS = PROTO_SCREENS.findIndex(
  (screen) => screen.childIndex === 1,
);

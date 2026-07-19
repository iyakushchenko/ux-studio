/**
 * Prototype screen nav index (tabs 1…N).
 * Hub wiki is slot 0 and is not listed here.
 * `screenId` is the address-bar deep-link id (`?screen=book-step-2`).
 */
export const PROJECT_SCREENS = [
  { label: "Agentic. Site Pilot. Home", childIndex: 11, screenId: "site-pilot" },
  { label: "Agentic. Site Pilot. Chat", childIndex: 10, screenId: "chat" },
  { label: "PLP. Vaccinations", childIndex: 9, screenId: "plp" },
  { label: "PDP. Vaccine Details Page", childIndex: 8, screenId: "pdp" },
  { label: "Book - Step 1 - Location", childIndex: 7, screenId: "book-step-1" },
  { label: "Book - Step 2 - Date and Time", childIndex: 4, screenId: "book-step-2" },
  { label: "Book - Step 3 - Confirmation", childIndex: 3, screenId: "book-step-3" },
  { label: "Appointment History", childIndex: 2, screenId: "appointment-history" },
  { label: "Appointment Details", childIndex: 1, screenId: "appointment-details" },
] as const;

export type ProjectScreen = (typeof PROJECT_SCREENS)[number];

export const HUB_LABEL = "Onboarding";

/** Nav counter: hub = 0, first tab = 1, … */
export function studioNavIndex(hubOpen: boolean, current: number): number {
  return hubOpen ? 0 : current + 1;
}

/** Display tab number (1…N) → zero based screen index. */
export function studioTabToIndex(tab: number): number {
  return Math.max(0, Math.min(PROJECT_SCREENS.length - 1, tab - 1));
}

export function studioScreenAtTab(tab: number): ProjectScreen | undefined {
  return PROJECT_SCREENS[studioTabToIndex(tab)];
}

/** Zero-based `current` index for Agentic Site Pilot Home (child 11). */
export const INDEX_HOME = PROJECT_SCREENS.findIndex(
  (screen) => screen.childIndex === 11,
);

/** Zero-based `current` index for PLP. Vaccinations (child 9). */
export const INDEX_PLP = PROJECT_SCREENS.findIndex(
  (screen) => screen.childIndex === 9,
);

/** Zero-based `current` index for PDP. Vaccine Details (child 8). */
export const INDEX_PDP = PROJECT_SCREENS.findIndex(
  (screen) => screen.childIndex === 8,
);

/** Zero-based `current` index for Book Step 1 — Location (child 7). */
export const INDEX_BOOK_STEP1 = PROJECT_SCREENS.findIndex(
  (screen) => screen.childIndex === 7,
);

/** Zero-based `current` index for Book Step 2 — Date and Time (child 4). */
export const INDEX_BOOK_STEP2 = PROJECT_SCREENS.findIndex(
  (screen) => screen.childIndex === 4,
);

/** Zero-based `current` index for Book Step 3 — Confirmation (child 3). */
export const INDEX_BOOK_STEP3 = PROJECT_SCREENS.findIndex(
  (screen) => screen.childIndex === 3,
);

/** Zero-based `current` index for Appointment History (My Account dummy). */
export const INDEX_APPOINTMENT_HISTORY = PROJECT_SCREENS.findIndex(
  (screen) => screen.childIndex === 2,
);

/** Zero-based `current` index for Appointment Details (tab 9). */
export const INDEX_APPOINTMENT_DETAILS = PROJECT_SCREENS.findIndex(
  (screen) => screen.childIndex === 1,
);

import type { JourneyBeat, JourneyDefinition } from "@/app/orchestra/types";

export const TRADITIONAL_LOGIN_BEAT_ID = "traditional-login";

/** Logged-in Sarah skips the login beat in timeline + playback. */
export function shouldSkipTraditionalLoginBeat(
  beat: JourneyBeat | undefined,
  headerLoggedIn: boolean
): boolean {
  return headerLoggedIn && beat?.id === TRADITIONAL_LOGIN_BEAT_ID;
}

/** After confirmation — open appointments list, then first card details. */
const POST_CONFIRMATION_BEATS: JourneyDefinition["beats"] = [
  {
    id: "book-step3-camera",
    label: "Book Step 3 — show page",
    kind: "camera",
    protoTab: 7,
    camera: {
      dwellMs: 1400,
      selectorChain: ['[data-studio-open-appointment="true"]'],
    },
  },
  {
    id: "confirmation",
    label: "Book — confirmed",
    kind: "tab-landing",
    protoTab: 7,
    tabScript: "confirmation-open-appointments",
  },
  {
    id: "appointment-history",
    label: "Appointment history",
    kind: "tab-landing",
    protoTab: 8,
    tabScript: "history-view-details",
  },
  {
    id: "appointment-details",
    label: "Appointment details",
    kind: "tab-landing",
    protoTab: 9,
    dwellMs: 2800,
  },
];

/** Traditional browse → book funnel — one beat per interaction for frame stepping. */
const TRADITIONAL_BOOKING_BEATS: JourneyDefinition["beats"] = [
  {
    id: TRADITIONAL_LOGIN_BEAT_ID,
    label: "Log in or register",
    kind: "tab-landing",
    protoTab: 4,
    tabScript: "login-sign-in",
  },
  {
    id: "choose-location",
    label: "Choose location",
    kind: "tab-landing",
    protoTab: 5,
    tabScript: "book-location-pick",
  },
  {
    id: "book-step2",
    label: "Book - Step 2",
    kind: "tab-landing",
    protoTab: 6,
    // choose-location may leave avail React flag briefly — hard-close on land.
    onEnter: "close-availability",
    dwellMs: 2800,
  },
  {
    id: "book-step2-date",
    label: "Book — date",
    kind: "tab-landing",
    protoTab: 6,
    bookScript: "select-book-date",
  },
  {
    id: "book-step2-time",
    label: "Book — time",
    kind: "tab-landing",
    protoTab: 6,
    bookScript: "select-book-time",
  },
  {
    id: "book-step2-reserve",
    label: "Book — reserve",
    kind: "tab-landing",
    protoTab: 6,
    bookScript: "reserve-appointment",
  },
  ...POST_CONFIRMATION_BEATS,
];

/** After Sarah books from chat-driven Availability Tool (location chosen in overlay). */
const AGENTIC_POST_AVAIL_BEATS: JourneyDefinition["beats"] = [
  {
    id: "book-step2",
    label: "Book - Step 2",
    kind: "tab-landing",
    protoTab: 6,
    onEnter: "apply-demo-location",
    dwellMs: 2800,
  },
  {
    id: "book-step2-date",
    label: "Book — date",
    kind: "tab-landing",
    protoTab: 6,
    bookScript: "select-book-date",
  },
  {
    id: "book-step2-time",
    label: "Book — time",
    kind: "tab-landing",
    protoTab: 6,
    bookScript: "select-book-time",
  },
  {
    id: "book-step2-reserve",
    label: "Book — reserve",
    kind: "tab-landing",
    protoTab: 6,
    bookScript: "reserve-appointment",
  },
  ...POST_CONFIRMATION_BEATS,
];

export const AGENTIC_CJM_JOURNEY: JourneyDefinition = {
  id: "agentic-cjm",
  label: "Agentic CJM",
  beats: [
    {
      id: "agentic-home",
      label: "Agentic home",
      kind: "tab-landing",
      protoTab: 1,
      homeScript: "sarah-query-submit",
    },
    {
      id: "agentic-chat",
      label: "Chat experience",
      kind: "screen-frames",
      protoTab: 2,
      scenarioId: "site-pilot-chat",
    },
    {
      id: "avail-location",
      label: "Choose pharmacy",
      kind: "overlay",
      availScript: "select-location",
    },
    {
      id: "avail-continue",
      label: "Choose date",
      kind: "overlay",
      onEnter: "open-availability-date-chat",
      availScript: "continue-from-date",
    },
    {
      id: "avail-time",
      label: "Choose time",
      kind: "overlay",
      availScript: "select-time-slot",
    },
    {
      id: "avail-book",
      label: "Book",
      kind: "overlay",
      availScript: "book-now",
    },
    ...AGENTIC_POST_AVAIL_BEATS,
  ],
};

export const TRADITIONAL_CJM_JOURNEY: JourneyDefinition = {
  id: "traditional-cjm",
  label: "Traditional CJM",
  beats: [
    {
      id: "traditional-plp",
      label: "Vaccination listing",
      kind: "tab-landing",
      protoTab: 3,
      tabScript: "plp-open-pdp",
    },
    {
      id: "traditional-pdp",
      label: "Vaccination details",
      kind: "tab-landing",
      protoTab: 4,
      tabScript: "pdp-book-now",
    },
    ...TRADITIONAL_BOOKING_BEATS,
  ],
};

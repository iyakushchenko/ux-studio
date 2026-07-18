import type { ProtoBrandPack, ProtoJourneyDefinition, JourneyBeat } from "@/app/orchestra/types";

export const TRADITIONAL_LOGIN_BEAT_ID = "traditional-login";

/** Logged-in Sarah skips the login beat in timeline + playback. */
export function isSkippedTraditionalLoginBeat(
  beat: JourneyBeat | undefined,
  headerLoggedIn: boolean
): boolean {
  return headerLoggedIn && beat?.id === TRADITIONAL_LOGIN_BEAT_ID;
}

export function stepBeatIndex(
  index: number,
  beats: JourneyBeat[],
  headerLoggedIn: boolean,
  direction: 1 | -1
): number {
  let next = index + direction;
  while (
    next >= 0 &&
    next < beats.length &&
    isSkippedTraditionalLoginBeat(beats[next], headerLoggedIn)
  ) {
    next += direction;
  }
  return next;
}

/** After confirmation — open appointments list, then first card details. */
const POST_CONFIRMATION_BEATS: ProtoJourneyDefinition["beats"] = [
  {
    id: "confirmation",
    label: "Confirmation",
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
const TRADITIONAL_BOOKING_BEATS: ProtoJourneyDefinition["beats"] = [
  {
    id: "traditional-login",
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
const AGENTIC_POST_AVAIL_BEATS: ProtoJourneyDefinition["beats"] = [
  {
    id: "book-step2-date",
    label: "Book — date",
    kind: "tab-landing",
    protoTab: 6,
    onEnter: "apply-demo-location",
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

const AGENTIC_CJM_JOURNEY: ProtoJourneyDefinition = {
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
      id: "avail-continue",
      label: "Availability — date",
      kind: "overlay",
      availScript: "continue-from-date",
    },
    {
      id: "avail-time",
      label: "Availability — time",
      kind: "overlay",
      availScript: "select-time-slot",
    },
    {
      id: "avail-book",
      label: "Availability — book",
      kind: "overlay",
      availScript: "book-now",
    },
    ...AGENTIC_POST_AVAIL_BEATS,
  ],
};

const TRADITIONAL_CJM_JOURNEY: ProtoJourneyDefinition = {
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

export const BOOTS_SARAH_PACK: ProtoBrandPack = {
  id: "boots-sarah",
  label: "Boots — Sarah Jenkins",
  journeys: [AGENTIC_CJM_JOURNEY, TRADITIONAL_CJM_JOURNEY],
};

export function getJourneyForMode(
  pack: ProtoBrandPack,
  modeId: ProtoJourneyDefinition["id"]
): ProtoJourneyDefinition | undefined {
  return pack.journeys.find((j) => j.id === modeId);
}

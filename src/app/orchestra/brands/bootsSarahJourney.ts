import type { ProtoBrandPack, ProtoJourneyDefinition } from "@/app/orchestra/types";

/** Shared booking + post-booking beats (onboarding shared funnel). */
const SHARED_FUNNEL_BEATS: ProtoJourneyDefinition["beats"] = [
    {
      id: "choose-recipient",
      label: "Choose recipient",
      kind: "tab-landing",
      protoTab: 5,
      tabScript: "recipient-confirm",
    },
    {
      id: "choose-location",
      label: "Choose location",
      kind: "tab-landing",
      protoTab: 5,
      tabScript: "book-location-avail",
    },
  {
    id: "choose-datetime",
    label: "Choose date and time",
    kind: "tab-landing",
    protoTab: 6,
    bookScript: "reserve-appointment",
  },
  {
    id: "confirmation",
    label: "Confirmation",
    kind: "tab-landing",
    protoTab: 7,
    dwellMs: 2800,
  },
  {
    id: "appointment-history",
    label: "Appointment history",
    kind: "tab-landing",
    protoTab: 8,
    dwellMs: 2800,
  },
  {
    id: "appointment-details",
    label: "Appointment details",
    kind: "tab-landing",
    protoTab: 9,
    dwellMs: 2800,
  },
];

/** After Sarah books from chat-driven Availability Tool (location chosen in overlay). */
const AGENTIC_POST_AVAIL_BEATS: ProtoJourneyDefinition["beats"] = [
  {
    id: "book-datetime",
    label: "Book — date and time",
    kind: "tab-landing",
    protoTab: 6,
    onEnter: "apply-demo-location",
    bookScript: "reserve-appointment",
  },
  {
    id: "confirmation",
    label: "Confirmation",
    kind: "tab-landing",
    protoTab: 7,
    dwellMs: 2800,
  },
  {
    id: "appointment-history",
    label: "Appointment history",
    kind: "tab-landing",
    protoTab: 8,
    dwellMs: 2800,
  },
  {
    id: "appointment-details",
    label: "Appointment details",
    kind: "tab-landing",
    protoTab: 9,
    dwellMs: 2800,
  },
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
    {
      id: "traditional-login",
      label: "Log in or register",
      kind: "tab-landing",
      protoTab: 4,
      tabScript: "login-sign-in",
    },
    ...SHARED_FUNNEL_BEATS,
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

import type { ProtoBrandPack, ProtoJourneyDefinition } from "@/app/orchestra/types";

/** Shared booking + post-booking beats (onboarding shared funnel). */
const SHARED_FUNNEL_BEATS: ProtoJourneyDefinition["beats"] = [
  {
    id: "choose-recipient",
    label: "Choose recipient",
    kind: "tab-landing",
    protoTab: 4,
    dwellMs: 2800,
  },
  {
    id: "choose-location",
    label: "Choose location",
    kind: "tab-landing",
    protoTab: 5,
    dwellMs: 3200,
    onEnter: "open-availability-start",
  },
  {
    id: "choose-datetime",
    label: "Choose date and time",
    kind: "tab-landing",
    protoTab: 6,
    dwellMs: 3200,
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

const CHAT_EXPERIENCE_JOURNEY: ProtoJourneyDefinition = {
  id: "chat-experience",
  label: "Chat experience",
  beats: [
    {
      id: "agentic-chat",
      label: "Agentic chat",
      kind: "screen-frames",
      protoTab: 2,
      scenarioId: "site-pilot-chat",
    },
  ],
};

const AGENTIC_CJM_JOURNEY: ProtoJourneyDefinition = {
  id: "agentic-cjm",
  label: "Agentic CJM",
  beats: [
    {
      id: "agentic-home",
      label: "Agentic home",
      kind: "tab-landing",
      protoTab: 1,
      dwellMs: 2800,
    },
    {
      id: "agentic-chat",
      label: "Agentic chat",
      kind: "screen-frames",
      protoTab: 2,
      scenarioId: "site-pilot-chat",
    },
    {
      id: "route-plp",
      label: "Vaccination listing",
      kind: "tab-landing",
      protoTab: 3,
      dwellMs: 2800,
    },
    {
      id: "route-pdp",
      label: "Vaccination details",
      kind: "tab-landing",
      protoTab: 4,
      dwellMs: 2800,
    },
    ...SHARED_FUNNEL_BEATS,
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
      dwellMs: 2800,
    },
    {
      id: "traditional-pdp",
      label: "Vaccination details",
      kind: "tab-landing",
      protoTab: 4,
      dwellMs: 2800,
    },
    {
      id: "traditional-login",
      label: "Log in or register",
      kind: "tab-landing",
      protoTab: 4,
      dwellMs: 2400,
    },
    ...SHARED_FUNNEL_BEATS,
  ],
};

export const BOOTS_SARAH_PACK: ProtoBrandPack = {
  id: "boots-sarah",
  label: "Boots — Sarah Jenkins",
  journeys: [CHAT_EXPERIENCE_JOURNEY, AGENTIC_CJM_JOURNEY, TRADITIONAL_CJM_JOURNEY],
};

export function getJourneyForMode(
  pack: ProtoBrandPack,
  modeId: ProtoJourneyDefinition["id"]
): ProtoJourneyDefinition | undefined {
  return pack.journeys.find((j) => j.id === modeId);
}

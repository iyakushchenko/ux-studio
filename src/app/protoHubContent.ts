import hubOverview from "@/assets/hub/vaccine-appointment-ui-overview.jpg";
import personaJourneyMap from "@/assets/hub/persona-and-journey-map.jpg";
import personaPath from "@/assets/hub/xe-card-persona-path.jpg";

export type HubFigure = {
  src: string;
  alt: string;
  caption?: string;
};

export type HubStep = {
  title: string;
  detail: string;
  protoTab?: number;
};

export type HubFlowNode = {
  label: string;
  detail?: string;
  protoTab?: number;
};

export type HubExperienceDiagram = {
  title?: string;
  intent: string;
  lanes: {
    id: string;
    title: string;
    subtitle: string;
    variant: "agentic" | "traditional";
    nodes: HubFlowNode[];
  }[];
  shared: {
    title: string;
    subtitle: string;
    nodes: HubFlowNode[];
  };
  notes?: string[];
  referenceFigure?: HubFigure;
};

export type HubScreenGuide = {
  tab: number;
  headline: string;
  detail: string;
};

export type HubSection = {
  id: string;
  title: string;
  paragraphs?: string[];
  highlights?: string[];
  figure?: HubFigure;
  steps?: HubStep[];
  screenLinks?: number[];
  experienceDiagram?: HubExperienceDiagram;
  chatDiagram?: HubChatDiagram;
};

export type HubChatAction = {
  label: string;
  outcome: string;
  protoTab?: number;
  variant: "cta" | "link" | "chip";
};

export type HubChatTurn = {
  turn: number;
  user: string;
  assistantSummary: string;
  assistantDetails?: string[];
  actions?: HubChatAction[];
};

export type HubChatDiagram = {
  title: string;
  intro: string;
  protoTab: number;
  home: {
    query: string;
    suggestedChips: string[];
    sendAction: string;
  };
  turns: HubChatTurn[];
  composer: {
    placeholder: string;
    nextDialogChips: string[];
    chipBehavior: string;
  };
  patterns: { title: string; detail: string }[];
};

export const PROTO_HUB_SCREEN_GUIDE: HubScreenGuide[] = [
  {
    tab: 1,
    headline: "Agentic home",
    detail:
      "Natural language entry point. See how a customer states intent without knowing catalogue structure.",
  },
  {
    tab: 2,
    headline: "Agentic chat",
    detail:
      "Guided conversation with smart next steps into browse, product detail, or book now.",
  },
  {
    tab: 3,
    headline: "Vaccinations listing",
    detail:
      "Traditional browse. Compare services, pricing signals, and book now entry on the PLP.",
  },
  {
    tab: 4,
    headline: "Vaccine details",
    detail:
      "Product detail with recipient choice, dosing options, and the primary book CTA.",
  },
  {
    tab: 5,
    headline: "Book: location",
    detail:
      "Availability Tool with search, near me, list and map, and pharmacy selection.",
  },
  {
    tab: 6,
    headline: "Book: date and time",
    detail:
      "Calendar and slot pick at the chosen store, with summary pills carried forward.",
  },
  {
    tab: 7,
    headline: "Book: confirmation",
    detail:
      "Final review of vaccine, recipient, location, and appointment before completion.",
  },
  {
    tab: 8,
    headline: "Appointment history",
    detail: "Post booking view of upcoming and past vaccination appointments.",
  },
  {
    tab: 9,
    headline: "Appointment details",
    detail:
      "Single appointment record with status, location, and follow up actions.",
  },
];

export const PROTO_HUB = {
  title: "Boots Health Vaccine Appointment Prototype",
  lead: [
    "This interactive prototype shows how Boots Health can guide customers from first intent to a confirmed vaccination appointment, using either an agentic conversation or a familiar browse path.",
    "It is designed for stakeholder review: each numbered tab in the nav opens a live screen. Use this page as your map, then click any tab link below to jump straight into the experience.",
  ],
  tourIntro:
    "Recommended walkthrough: tab 1 home → tab 2 chat (see conversation diagram) → tabs 5 to 7 for booking.",
  sections: [
    {
      id: "persona",
      title: "Who we are designing for",
      paragraphs: [
        "Every screen in this prototype is anchored to a single primary persona so product, clinical, and commercial teams can judge decisions against a real customer need rather than abstract wireframes.",
        "Sarah Jenkins represents a busy, health conscious B2C customer. She expects Boots to make eligibility, pricing, and booking feel straightforward in one coherent journey.",
      ],
      highlights: [
        "Primary job: book the right vaccination with confidence.",
        "Secondary job: schedule a booster dose for a later date.",
        "Success looks like: clear restrictions, visible pricing, and no dead ends between discovery and checkout.",
      ],
      figure: {
        src: personaJourneyMap,
        alt: "Persona and journey map showing profile, customer journey map, user story, and user flow",
        caption:
          "Research artefact: persona profile, journey map across touchpoints, narrative user story, and high level flow into the appointment experience.",
      },
    },
    {
      id: "user-flow",
      title: "Two ways in, one booking funnel",
      paragraphs: [
        "The strategic question this prototype explores is not agentic or traditional in isolation. It is whether Boots can offer a faster, intent led path while keeping the same trusted transactional UI for checkout.",
        "Scroll to the interactive flow diagram directly below (before the persona card image). It shows how both paths converge. Tab badges open the live prototype screen.",
      ],
      highlights: [
        "Agentic path reduces early friction: fewer screens before book now.",
        "Traditional path preserves full comparison on listing and product detail.",
        "Shared funnel from recipient choice onward protects consistency and trust.",
      ],
      figure: {
        src: personaPath,
        alt: "Sarah Jenkins persona card with vaccination booking user flow diagram",
        caption:
          "Persona path card: search intents, jobs to be done, and the eight screen happy path for Sarah Jenkins.",
      },
      experienceDiagram: {
        title: "Interactive flow diagram",
        intent:
          "Find and book the right vaccination with clear pricing, eligibility, and a single coherent journey.",
        lanes: [
          {
            id: "agentic",
            title: "Agentic experience",
            subtitle:
              "Intent first. Conversation guides the customer into the right next action.",
            variant: "agentic",
            nodes: [
              {
                label: "Agentic home",
                detail:
                  "Seeded vaccination query, suggested intents, and send into chat.",
                protoTab: 1,
              },
              {
                label: "Agentic chat",
                detail:
                  "Pharmacy aware replies with chips for catalog, product detail, availability, and book now.",
                protoTab: 2,
              },
              {
                label: "Route to browse or book",
                detail:
                  "Chat routes into PLP (tab 3), PDP (tab 4), or book now into the shared funnel.",
              },
            ],
          },
          {
            id: "traditional",
            title: "Traditional experience",
            subtitle:
              "Browse led. Full comparison before the customer commits to book.",
            variant: "traditional",
            nodes: [
              {
                label: "Vaccination category",
                detail:
                  "Entry from site navigation or search into the vaccinations category.",
              },
              {
                label: "Vaccination listing (PLP)",
                detail: "Compare services and choose a vaccine to book.",
                protoTab: 3,
              },
              {
                label: "Vaccination details (PDP)",
                detail:
                  "Pricing, recipient toggle, dosing options, and book now into the funnel.",
                protoTab: 4,
              },
              {
                label: "Log in or register",
                detail:
                  "Boots Account required before checkout. Quick sign in or create account.",
              },
            ],
          },
        ],
        shared: {
          title: "Shared booking funnel",
          subtitle:
            "One checkout experience for every entry path. Click any tab badge to open that screen.",
          nodes: [
            {
              label: "Choose recipient",
              detail:
                "Myself or someone else. Summary pills on book steps reflect this choice.",
            },
            {
              label: "Choose location",
              detail:
                "Search or near me, pick a pharmacy in the Availability Tool, then continue.",
              protoTab: 5,
            },
            {
              label: "Choose date and time",
              detail: "Calendar and slot selection at the chosen store.",
              protoTab: 6,
            },
            {
              label: "Confirmation",
              detail:
                "Review vaccine, recipient, location, and appointment time before completing.",
              protoTab: 7,
            },
            {
              label: "Appointment history",
              detail: "Past and upcoming visits after booking is complete.",
              protoTab: 8,
            },
            {
              label: "Appointment details",
              detail: "Single record with status, location, and actions.",
              protoTab: 9,
            },
          ],
        },
        notes: [
          "Click a tab badge in the diagram to jump directly to that prototype screen.",
          "Agentic shortens discovery without replacing Boots transactional UI at checkout.",
          "The Guiding UX board below is the design source of truth for this logic.",
        ],
        referenceFigure: {
          src: hubOverview,
          alt: "Guiding UX board showing agentic pilot, browse, book funnel, and appointment history",
          caption:
            "Guiding UX overview board: agentic home and chat on the left, PLP and PDP in the centre, shared book steps and post appointment screens on the right.",
        },
      },
    },
    {
      id: "agentic",
      title: "How the chat experience is designed",
      paragraphs: [
        "This is the core of the prototype. SitePilot does not replace Boots UI. It structures a conversation that always resolves into familiar screens, links, and the Availability Tool.",
        "The diagram below walks through every chat turn on tab 2: what Sarah asks, what SitePilot returns, and exactly what each button or chip does in the clickable prototype.",
      ],
      highlights: [
        "Turn 1 recommends a bundle with inline product links and book now CTAs.",
        "Turns 2 to 4 move from explaining availability to opening the Availability Tool on a real date.",
        "Composer chips pre fill the next question or open a tool step directly.",
      ],
      chatDiagram: {
        title: "SitePilot chat conversation map",
        intro:
          "Four scripted turns demonstrate the design pattern: rich assistant reply, explicit next steps, then transactional handoff without leaving Boots.",
        protoTab: 2,
        home: {
          query:
            "I need a full course of travel vaccinations for a three week trip to Southeast Asia (Indonesia) starting next month, specifically looking to book and buy jabs as a bundle if possible.",
          suggestedChips: [
            "Vaccine services",
            "Skin health services",
            "Other Health services",
          ],
          sendAction: "Send or suggested chip → opens tab 2 (Chat) with query carried in.",
        },
        turns: [
          {
            turn: 1,
            user: "Travel vaccinations for Southeast Asia, book as a bundle.",
            assistantSummary:
              "SitePilot recommends the Southeast Asia Vaccine Bundle (£245) with coverage, eligibility, Yellow Fever note, and a critical booking timeline (book by July 23).",
            assistantDetails: [
              "Inline links: Southeast Asia Vaccine Bundle, Hepatitis A, Typhoid, Tetanus Booster, Yellow Fever Vaccine → open tab 4 (PDP).",
              "Boots Account sign in is surfaced before checkout.",
            ],
            actions: [
              {
                label: "Book Southeast Asia Vaccine Bundle – £245",
                outcome: "Opens tab 4 (PDP) for bundle booking.",
                protoTab: 4,
                variant: "cta",
              },
              {
                label: "Book Yellow Fever Vaccine only – £75",
                outcome: "Opens tab 4 (PDP) for single vaccine.",
                protoTab: 4,
                variant: "cta",
              },
              {
                label: "Go to vaccines catalog",
                outcome: "Opens tab 3 (PLP) to compare all services.",
                protoTab: 3,
                variant: "cta",
              },
            ],
          },
          {
            turn: 2,
            user: "Does the nearby Boots pharmacy have any available slots today?",
            assistantSummary:
              "SitePilot explains the Availability Checker Tool in three steps: open tool, choose pharmacy (location or near me), pick date then time.",
            assistantDetails: [
              "Inline link: Availability Checker Tool → opens Availability Tool at Find Pharmacy.",
            ],
            actions: [
              {
                label: "Open Availability Checker Tool",
                outcome: "Opens Availability Tool at Find Pharmacy step.",
                variant: "cta",
              },
              {
                label: "Check availability slot for me",
                outcome: "Highlights the matching user query bubble in the thread (demo feedback).",
                variant: "cta",
              },
            ],
          },
          {
            turn: 3,
            user: "Check availability slot for me in the nearby Boots pharmacy",
            assistantSummary:
              "SitePilot offers to check slots on Sarah's behalf and presents time window options.",
            actions: [
              {
                label: "Find available slots for today",
                outcome: "Chip in composer pre fills query; dedicated chip opens Availability Tool on today's date.",
                variant: "cta",
              },
              {
                label: "Find available slots this week",
                outcome: "Opens Availability Tool on calendar (June 24).",
                variant: "cta",
              },
              {
                label: "Find available slots this weekend",
                outcome: "Opens Availability Tool on calendar (June 27).",
                variant: "cta",
              },
            ],
          },
          {
            turn: 4,
            user: "Find available slots for today",
            assistantSummary:
              "SitePilot returns 24 slots for June 25 at Covent Garden Long Acre (1.5km), with pharmacy detail and slot window 10:00 to 18:00.",
            assistantDetails: [
              "See on map is shown in the reply (design placeholder).",
            ],
            actions: [
              {
                label: "Choose Time Slot",
                outcome: "Opens Availability Tool at time selection (16:30 preset).",
                variant: "cta",
              },
              {
                label: "Choose Different Date",
                outcome: "Opens Availability Tool on alternate date (June 25 picker).",
                variant: "cta",
              },
              {
                label: "Select Different Pharmacy",
                outcome: "Opens Availability Tool location list for store change.",
                variant: "cta",
              },
            ],
          },
        ],
        composer: {
          placeholder: "Ask Boots SitePilot",
          nextDialogChips: [
            "Is it covered by NHS?",
            "Show available slots for today",
            "Elaborate on previous reply",
          ],
          chipBehavior:
            "Most chips pre fill the composer. Show available slots for today also opens the Availability Tool on today's date when clicked from the composer row.",
        },
        patterns: [
          {
            title: "Structured reply blocks",
            detail:
              "Each assistant turn uses headings (Recommended Bundle, Critical Timeline, Next Steps) so long clinical copy stays scannable.",
          },
          {
            title: "Inline catalogue links",
            detail:
              "Underlined product names route to PDP without breaking the conversation layout.",
          },
          {
            title: "Primary navy CTAs",
            detail:
              "Book and catalog actions use the same navy pill as transactional Boots UI for trust continuity.",
          },
          {
            title: "Tool handoff, not chat trap",
            detail:
              "Availability actions open the real Availability Tool overlay on the correct step rather than simulating slots only in chat.",
          },
        ],
      },
      screenLinks: [1, 2],
    },
    {
      id: "overview",
      title: "Full design board",
      paragraphs: [
        "For teams who want the complete picture in one view, this board mirrors the Figma journey map. Pair it with the interactive tabs above to move from strategy to clickable UI.",
      ],
      figure: {
        src: hubOverview,
        alt: "Vaccine appointment UI guiding UX user flow overview board",
        caption:
          "End to end board: agentic pilot, vaccinations listing, vaccine PDP, book steps, and appointment history.",
      },
    },
    {
      id: "browse",
      title: "Browse and product detail",
      paragraphs: [
        "The traditional path remains essential for customers who want to compare services side by side, read restrictions, and build confidence before they commit.",
        "Listing and detail pages carry book now entry points, recipient choice, and dosing context so the handoff into booking feels continuous rather than a separate product.",
      ],
      highlights: [
        "PLP supports comparison led decision making.",
        "PDP makes eligibility, recipient, and dosing visible before checkout.",
        "Open tabs 3 and 4 to walk this path.",
      ],
      screenLinks: [3, 4],
    },
    {
      id: "book",
      title: "Book appointment",
      paragraphs: [
        "The booking funnel is deliberately shared across both discovery modes. Pharmacy operations, slot logic, and confirmation copy stay consistent regardless of how Sarah arrived.",
        "Three live steps in the prototype. Each step keeps summary context visible so the customer never loses track of vaccine, recipient, or store.",
      ],
      highlights: [
        "Availability Tool replaces a static store list with search, near me, and map.",
        "Progress column supports step back without breaking context.",
        "Recipient and vaccine pickers are editable from summary pills.",
      ],
      steps: [
        {
          title: "Location",
          detail:
            "Summary pills for vaccine and recipient, location search or near me, Availability Tool for store pick, then continue.",
          protoTab: 5,
        },
        {
          title: "Date and time",
          detail:
            "Calendar and slot selection on the chosen pharmacy. The progress column links back to location.",
          protoTab: 6,
        },
        {
          title: "Confirmation",
          detail: "Review selections before completing the booking.",
          protoTab: 7,
        },
      ],
      screenLinks: [5, 6, 7],
    },
    {
      id: "after",
      title: "After booking",
      paragraphs: [
        "The journey does not end at confirmation. Appointment history and detail views show how Boots can support retention, rescheduling, and post visit follow up in the same account experience.",
      ],
      highlights: [
        "History gives a single place to manage upcoming and past visits.",
        "Detail view supports status, location, and next best action.",
        "Open tabs 8 and 9 to review post booking states.",
      ],
      screenLinks: [8, 9],
    },
  ] satisfies HubSection[],
};
